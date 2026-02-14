-- Super Admin Plan Management & Permission Overrides
-- Adds plan_permission_overrides, admin_audit_log tables,
-- and admin override columns to organisations.

-- ============================================================
-- 1. Add admin override columns to organisations
-- ============================================================

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS admin_plan_tier text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS admin_override_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_override_by uuid REFERENCES auth.users(id);

-- ============================================================
-- 2. plan_permission_overrides table
-- ============================================================

CREATE TABLE public.plan_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  permission_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT plan_permission_overrides_org_key UNIQUE (org_id, permission_key)
);

ALTER TABLE public.plan_permission_overrides ENABLE ROW LEVEL SECURITY;

-- Org members can read overrides (needed by usePlanLimits on client side)
CREATE POLICY "Org members can view permission overrides"
  ON public.plan_permission_overrides FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Super admins can manage overrides
CREATE POLICY "Super admins can manage permission overrides"
  ON public.plan_permission_overrides FOR ALL
  USING (public.is_super_admin());

CREATE INDEX idx_plan_permission_overrides_org_id
  ON public.plan_permission_overrides(org_id);

-- ============================================================
-- 3. admin_audit_log table
-- ============================================================

CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_org_id uuid REFERENCES public.organisations(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Super admins can read audit log
CREATE POLICY "Super admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_super_admin());

-- Super admins can insert into audit log
CREATE POLICY "Super admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_super_admin());

CREATE INDEX idx_admin_audit_log_target_org_id
  ON public.admin_audit_log(target_org_id);

CREATE INDEX idx_admin_audit_log_created_at
  ON public.admin_audit_log(created_at DESC);
