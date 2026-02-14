
-- API keys table
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{"read"}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage API keys"
  ON public.api_keys FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Org members can view API keys"
  ON public.api_keys FOR SELECT
  USING (is_org_member(org_id));

-- Data retention settings
CREATE TABLE public.data_retention_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE UNIQUE,
  auto_delete_leads_days integer DEFAULT 0,
  auto_delete_responses_days integer DEFAULT 0,
  anonymize_after_days integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.data_retention_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage retention settings"
  ON public.data_retention_settings FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE TRIGGER update_data_retention_updated_at
  BEFORE UPDATE ON public.data_retention_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
