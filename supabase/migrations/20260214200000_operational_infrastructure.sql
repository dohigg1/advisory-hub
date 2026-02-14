-- ============================================================================
-- Operational Infrastructure for Elevation Briefing Workstreams
-- Tables: super_admins, feature_flags, feature_flag_overrides,
--         legal_documents, legal_acceptances, impersonation_log,
--         onboarding_progress, lead_commentary, cancellation_feedback
-- Also: adds columns to profiles, assessments, organisations
-- ============================================================================

-- ============================================================================
-- 0. Helper function: is_super_admin()
--    Returns true if the current auth user is listed in super_admins.
--    Defined as SECURITY DEFINER so it can read the super_admins table
--    regardless of RLS policies on the caller's behalf.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE auth_user_id = auth.uid()
  )
$$;

-- ============================================================================
-- 1. Super Admins - Controls access to the admin portal
-- ============================================================================
CREATE TABLE public.super_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT super_admins_auth_user_id_key UNIQUE (auth_user_id)
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view super_admins"
  ON public.super_admins FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- ============================================================================
-- 2. Feature Flags - Platform-wide feature toggles
-- ============================================================================
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  global_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0
    CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read feature flags
CREATE POLICY "Authenticated users can view feature_flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Super admins can insert feature flags
CREATE POLICY "Super admins can insert feature_flags"
  ON public.feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Super admins can update feature flags
CREATE POLICY "Super admins can update feature_flags"
  ON public.feature_flags FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can delete feature flags
CREATE POLICY "Super admins can delete feature_flags"
  ON public.feature_flags FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. Feature Flag Overrides - Per-org overrides for flags
-- ============================================================================
CREATE TABLE public.feature_flag_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feature_flag_overrides_flag_org_key UNIQUE (flag_id, org_id)
);

ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- Org members can view their own org's overrides
CREATE POLICY "Org members can view their feature_flag_overrides"
  ON public.feature_flag_overrides FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id));

-- Super admins can view all overrides
CREATE POLICY "Super admins can view all feature_flag_overrides"
  ON public.feature_flag_overrides FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can insert feature flag overrides
CREATE POLICY "Super admins can insert feature_flag_overrides"
  ON public.feature_flag_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Super admins can update feature flag overrides
CREATE POLICY "Super admins can update feature_flag_overrides"
  ON public.feature_flag_overrides FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can delete feature flag overrides
CREATE POLICY "Super admins can delete feature_flag_overrides"
  ON public.feature_flag_overrides FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE INDEX idx_feature_flag_overrides_flag_id ON public.feature_flag_overrides(flag_id);
CREATE INDEX idx_feature_flag_overrides_org_id ON public.feature_flag_overrides(org_id);

-- ============================================================================
-- 4. Legal Documents - Versioned storage for all legal content
-- ============================================================================
CREATE TABLE public.legal_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  content_md text NOT NULL,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT legal_documents_type_version_key UNIQUE (type, version)
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Public can read current legal documents (no auth required)
CREATE POLICY "Public can view current legal_documents"
  ON public.legal_documents FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

-- Super admins can view all legal documents (including non-current)
CREATE POLICY "Super admins can view all legal_documents"
  ON public.legal_documents FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can insert legal documents
CREATE POLICY "Super admins can insert legal_documents"
  ON public.legal_documents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Super admins can update legal documents
CREATE POLICY "Super admins can update legal_documents"
  ON public.legal_documents FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can delete legal documents
CREATE POLICY "Super admins can delete legal_documents"
  ON public.legal_documents FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

CREATE INDEX idx_legal_documents_type ON public.legal_documents(type);
CREATE INDEX idx_legal_documents_is_current ON public.legal_documents(is_current) WHERE is_current = true;

-- ============================================================================
-- 5. Legal Acceptances - Immutable record of user acceptance
-- ============================================================================
CREATE TABLE public.legal_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptances
CREATE POLICY "Users can view their own legal_acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can view all acceptances
CREATE POLICY "Super admins can view all legal_acceptances"
  ON public.legal_acceptances FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Users can insert their own acceptances
CREATE POLICY "Users can insert their own legal_acceptances"
  ON public.legal_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_legal_acceptances_user_id ON public.legal_acceptances(user_id);
CREATE INDEX idx_legal_acceptances_document_id ON public.legal_acceptances(document_id);

-- ============================================================================
-- 6. Impersonation Log - Audit trail for impersonation sessions
-- ============================================================================
CREATE TABLE public.impersonation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  target_user_id uuid NOT NULL REFERENCES auth.users(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  reason text
);

ALTER TABLE public.impersonation_log ENABLE ROW LEVEL SECURITY;

-- Super admins can view impersonation logs
CREATE POLICY "Super admins can view impersonation_log"
  ON public.impersonation_log FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Super admins can insert impersonation logs
CREATE POLICY "Super admins can insert impersonation_log"
  ON public.impersonation_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Super admins can update impersonation logs (to set ended_at)
CREATE POLICY "Super admins can update impersonation_log"
  ON public.impersonation_log FOR UPDATE
  TO authenticated
  USING (public.is_super_admin());

CREATE INDEX idx_impersonation_log_admin_id ON public.impersonation_log(admin_id);
CREATE INDEX idx_impersonation_log_target_user_id ON public.impersonation_log(target_user_id);
CREATE INDEX idx_impersonation_log_started_at ON public.impersonation_log(started_at DESC);

-- ============================================================================
-- 7. Onboarding Progress - Tracks onboarding checklist per org
-- ============================================================================
CREATE TABLE public.onboarding_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES auth.users(id),
  CONSTRAINT onboarding_progress_org_step_key UNIQUE (org_id, step_key)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Org members can view their own org's onboarding progress
CREATE POLICY "Org members can view onboarding_progress"
  ON public.onboarding_progress FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id));

-- Org members can insert onboarding progress for their org
CREATE POLICY "Org members can insert onboarding_progress"
  ON public.onboarding_progress FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

-- Org members can update their own org's onboarding progress
CREATE POLICY "Org members can update onboarding_progress"
  ON public.onboarding_progress FOR UPDATE
  TO authenticated
  USING (public.is_org_member(org_id));

CREATE INDEX idx_onboarding_progress_org_id ON public.onboarding_progress(org_id);

-- ============================================================================
-- 8. Lead Commentary - Consultant commentary per lead for PDF reports
-- ============================================================================
CREATE TABLE public.lead_commentary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  content_md text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_commentary_lead_id_key UNIQUE (lead_id)
);

ALTER TABLE public.lead_commentary ENABLE ROW LEVEL SECURITY;

-- Org members can view commentary for leads in their org
CREATE POLICY "Org members can view lead_commentary"
  ON public.lead_commentary FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_commentary.lead_id
        AND public.is_org_member(l.org_id)
    )
  );

-- Org members can insert commentary for leads in their org
CREATE POLICY "Org members can insert lead_commentary"
  ON public.lead_commentary FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_commentary.lead_id
        AND l.org_id = public.get_user_org_id()
    )
  );

-- Org members can update commentary for leads in their org
CREATE POLICY "Org members can update lead_commentary"
  ON public.lead_commentary FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_commentary.lead_id
        AND public.is_org_member(l.org_id)
    )
  );

-- Org members can delete commentary for leads in their org
CREATE POLICY "Org members can delete lead_commentary"
  ON public.lead_commentary FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_commentary.lead_id
        AND public.is_org_member(l.org_id)
    )
  );

CREATE INDEX idx_lead_commentary_lead_id ON public.lead_commentary(lead_id);
CREATE INDEX idx_lead_commentary_author_id ON public.lead_commentary(author_id);

CREATE TRIGGER update_lead_commentary_updated_at
  BEFORE UPDATE ON public.lead_commentary
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 9. Cancellation Feedback - Stores cancellation reasons
-- ============================================================================
CREATE TABLE public.cancellation_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  reason_detail text,
  offered_discount boolean NOT NULL DEFAULT false,
  accepted_discount boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Super admins can view all cancellation feedback
CREATE POLICY "Super admins can view all cancellation_feedback"
  ON public.cancellation_feedback FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Users can insert their own cancellation feedback
CREATE POLICY "Users can insert their own cancellation_feedback"
  ON public.cancellation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_cancellation_feedback_org_id ON public.cancellation_feedback(org_id);
CREATE INDEX idx_cancellation_feedback_user_id ON public.cancellation_feedback(user_id);

-- ============================================================================
-- 10. Add columns to existing tables
-- ============================================================================

-- profiles: super admin flag and guided setup tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_completed_guided_setup boolean NOT NULL DEFAULT false;

-- assessments: mark sample/template assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

-- organisations: grace period after subscription cancellation
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS grace_period_ends_at timestamp with time zone;

-- ============================================================================
-- 11. Performance indexes on existing tables
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_leads_assessment_id ON public.leads(assessment_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON public.leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_responses_lead_id ON public.responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_scores_lead_id_lookup ON public.scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created_at ON public.audit_log(org_id, created_at);
