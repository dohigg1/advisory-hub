-- ============================================================================
-- Compliance Enhancements (Feature 25)
-- - Add ip_address, user_agent, and checksum columns to audit_log
-- - Create trigger to auto-compute SHA-256 checksum on INSERT
-- - Create index on audit_log(created_at) for retention queries
-- - Create data retention cleanup function
-- - Add pg_cron scheduled job reference for daily retention cleanup
-- ============================================================================

-- ============================================================================
-- 1. Add ip_address and user_agent columns to audit_log
-- ============================================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- ============================================================================
-- 2. Add checksum column for tamper-evidence (SHA-256)
-- ============================================================================
ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS checksum text;

COMMENT ON COLUMN public.audit_log.checksum IS
  'SHA-256 hash of (action || target_id || created_at) for tamper-evidence';

-- ============================================================================
-- 3. Enable pgcrypto extension (for digest function)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 4. Create trigger function to auto-compute checksum on INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.compute_audit_log_checksum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.checksum := encode(
    digest(
      COALESCE(NEW.action, '') ||
      COALESCE(NEW.target_id, '') ||
      COALESCE(NEW.created_at::text, ''),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_log_checksum
  BEFORE INSERT ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_audit_log_checksum();

-- ============================================================================
-- 5. Create index on audit_log(created_at) for retention queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log(created_at);

-- ============================================================================
-- 6. Create data retention cleanup function
--    Deletes records older than the org's retention period where
--    auto_delete is enabled in data_retention_settings.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.run_data_retention_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _setting record;
  _cutoff  timestamptz;
  _leads_deleted      integer := 0;
  _responses_deleted   integer := 0;
  _scores_deleted      integer := 0;
  _iterations_deleted  integer := 0;
  _sessions_deleted    integer := 0;
  _audit_logs_deleted  integer := 0;
  _org_leads_deleted   integer;
  _org_resp_deleted    integer;
  _org_scores_deleted  integer;
  _org_iter_deleted    integer;
  _org_sess_deleted    integer;
  _org_audit_deleted   integer;
  _lead_ids            uuid[];
  _summary             jsonb := '[]'::jsonb;
BEGIN
  -- Iterate over each org that has auto_delete enabled
  FOR _setting IN
    SELECT org_id, retention_months
    FROM public.data_retention_settings
    WHERE auto_delete = true
      AND retention_months > 0
  LOOP
    _cutoff := now() - (_setting.retention_months || ' months')::interval;

    -- Find leads older than the cutoff for this org
    SELECT COALESCE(array_agg(id), '{}')
    INTO _lead_ids
    FROM public.leads
    WHERE org_id = _setting.org_id
      AND started_at < _cutoff;

    _org_resp_deleted := 0;
    _org_scores_deleted := 0;
    _org_leads_deleted := 0;

    IF array_length(_lead_ids, 1) > 0 THEN
      -- Delete responses for those leads
      WITH deleted AS (
        DELETE FROM public.responses
        WHERE lead_id = ANY(_lead_ids)
        RETURNING 1
      )
      SELECT count(*) INTO _org_resp_deleted FROM deleted;

      -- Delete scores for those leads
      WITH deleted AS (
        DELETE FROM public.scores
        WHERE lead_id = ANY(_lead_ids)
        RETURNING 1
      )
      SELECT count(*) INTO _org_scores_deleted FROM deleted;

      -- Delete the leads themselves
      WITH deleted AS (
        DELETE FROM public.leads
        WHERE id = ANY(_lead_ids)
        RETURNING 1
      )
      SELECT count(*) INTO _org_leads_deleted FROM deleted;
    END IF;

    -- Delete old assessment iterations for this org's leads
    WITH deleted AS (
      DELETE FROM public.assessment_iterations
      WHERE completed_at < _cutoff
        AND assessment_id IN (
          SELECT id FROM public.assessments WHERE org_id = _setting.org_id
        )
      RETURNING 1
    )
    SELECT count(*) INTO _org_iter_deleted FROM deleted;

    -- Delete old portal sessions for this org
    WITH deleted AS (
      DELETE FROM public.portal_sessions
      WHERE org_id = _setting.org_id
        AND created_at < _cutoff
      RETURNING 1
    )
    SELECT count(*) INTO _org_sess_deleted FROM deleted;

    -- Delete old audit log entries for this org (keep recent ones)
    WITH deleted AS (
      DELETE FROM public.audit_log
      WHERE org_id = _setting.org_id
        AND created_at < _cutoff
      RETURNING 1
    )
    SELECT count(*) INTO _org_audit_deleted FROM deleted;

    -- Accumulate totals
    _leads_deleted     := _leads_deleted + _org_leads_deleted;
    _responses_deleted := _responses_deleted + _org_resp_deleted;
    _scores_deleted    := _scores_deleted + _org_scores_deleted;
    _iterations_deleted := _iterations_deleted + _org_iter_deleted;
    _sessions_deleted  := _sessions_deleted + _org_sess_deleted;
    _audit_logs_deleted := _audit_logs_deleted + _org_audit_deleted;

    -- Add per-org summary entry
    _summary := _summary || jsonb_build_object(
      'org_id', _setting.org_id,
      'retention_months', _setting.retention_months,
      'cutoff', _cutoff,
      'deleted', jsonb_build_object(
        'leads', _org_leads_deleted,
        'responses', _org_resp_deleted,
        'scores', _org_scores_deleted,
        'assessment_iterations', _org_iter_deleted,
        'portal_sessions', _org_sess_deleted,
        'audit_logs', _org_audit_deleted
      )
    );
  END LOOP;

  -- Return a summary of what was cleaned up
  RETURN jsonb_build_object(
    'executed_at', now(),
    'totals', jsonb_build_object(
      'leads', _leads_deleted,
      'responses', _responses_deleted,
      'scores', _scores_deleted,
      'assessment_iterations', _iterations_deleted,
      'portal_sessions', _sessions_deleted,
      'audit_logs', _audit_logs_deleted
    ),
    'organisations', _summary
  );
END;
$$;

-- ============================================================================
-- 7. Scheduled job for daily retention cleanup (pg_cron)
--    Requires the pg_cron extension to be enabled on the database.
--    Uncomment and run manually or via Supabase dashboard:
--
--    SELECT cron.schedule(
--      'daily-data-retention-cleanup',   -- job name
--      '0 3 * * *',                      -- every day at 03:00 UTC
--      $$SELECT public.run_data_retention_cleanup()$$
--    );
--
--    To remove the scheduled job:
--    SELECT cron.unschedule('daily-data-retention-cleanup');
-- ============================================================================
