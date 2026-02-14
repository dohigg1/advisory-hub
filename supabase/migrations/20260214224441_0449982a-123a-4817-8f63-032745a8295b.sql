
-- Add admin override columns to organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS admin_plan_tier text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS admin_override_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_override_by uuid REFERENCES auth.users(id);

-- Create plan_permission_overrides table
CREATE TABLE IF NOT EXISTS public.plan_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  permission_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(org_id, permission_key)
);

ALTER TABLE public.plan_permission_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view permission overrides"
  ON public.plan_permission_overrides FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Super admins can manage permission overrides"
  ON public.plan_permission_overrides FOR ALL
  USING (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_plan_permission_overrides_org_id ON public.plan_permission_overrides(org_id);

-- Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  target_org_id uuid REFERENCES public.organisations(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view admin audit log"
  ON public.admin_audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Super admins can insert admin audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Service can manage admin audit log"
  ON public.admin_audit_log FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_target_org ON public.admin_audit_log(target_org_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);

-- Add super admin check function if not exists
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid());
$$;
