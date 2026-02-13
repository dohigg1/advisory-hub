
-- Add billing fields to organisations
ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS domain text;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  plan_tier text NOT NULL DEFAULT 'free',
  price_id text,
  interval text DEFAULT 'month',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view subscriptions"
  ON public.subscriptions FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Service can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (true) WITH CHECK (true);

-- Create invoices table  
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL,
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  status text NOT NULL DEFAULT 'paid',
  invoice_url text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invoices"
  ON public.invoices FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Service can manage invoices"
  ON public.invoices FOR ALL
  USING (true) WITH CHECK (true);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view audit logs"
  ON public.audit_log FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Service can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert audit logs for their org"
  ON public.audit_log FOR INSERT
  WITH CHECK (org_id = get_user_org_id());

-- Create index for audit log queries
CREATE INDEX idx_audit_log_org_created ON public.audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- Create plan limits helper function
CREATE OR REPLACE FUNCTION public.get_plan_limits(tier text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE tier
    WHEN 'free' THEN '{"assessments":1,"responses_per_month":10,"team_members":1,"custom_domain":false,"pdf_reports":"none","client_portal":false,"abandon_emails":false,"webhooks":"none","remove_branding":false,"ab_testing":false}'::jsonb
    WHEN 'starter' THEN '{"assessments":5,"responses_per_month":200,"team_members":2,"custom_domain":false,"pdf_reports":"basic","client_portal":false,"abandon_emails":false,"webhooks":"zapier","remove_branding":false,"ab_testing":false}'::jsonb
    WHEN 'professional' THEN '{"assessments":20,"responses_per_month":2000,"team_members":5,"custom_domain":true,"pdf_reports":"full","client_portal":false,"abandon_emails":true,"webhooks":"full","remove_branding":true,"ab_testing":false}'::jsonb
    WHEN 'firm' THEN '{"assessments":-1,"responses_per_month":10000,"team_members":15,"custom_domain":true,"pdf_reports":"full_benchmark","client_portal":true,"abandon_emails":true,"webhooks":"full_api","remove_branding":true,"ab_testing":true}'::jsonb
    ELSE '{"assessments":1,"responses_per_month":10,"team_members":1,"custom_domain":false,"pdf_reports":"none","client_portal":false,"abandon_emails":false,"webhooks":"none","remove_branding":false,"ab_testing":false}'::jsonb
  END;
$$;

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
