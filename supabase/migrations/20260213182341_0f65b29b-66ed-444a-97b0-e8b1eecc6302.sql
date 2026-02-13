
-- Portal settings per organisation
CREATE TABLE public.portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  welcome_message text DEFAULT 'Welcome to your assessment portal',
  portal_description text DEFAULT '',
  show_powered_by boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can manage portal settings"
  ON public.portal_settings FOR ALL
  USING (is_org_member(org_id));

CREATE POLICY "Public can view enabled portal settings"
  ON public.portal_settings FOR SELECT
  USING (enabled = true);

CREATE TRIGGER update_portal_settings_updated_at
  BEFORE UPDATE ON public.portal_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Portal sessions (magic link tokens)
CREATE TABLE public.portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  lead_email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

ALTER TABLE public.portal_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage portal sessions"
  ON public.portal_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Portal access logs
CREATE TABLE public.portal_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  lead_email text NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  action text DEFAULT 'login'
);

ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view portal access logs"
  ON public.portal_access_logs FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Service can insert portal access logs"
  ON public.portal_access_logs FOR INSERT
  WITH CHECK (true);

-- Add portal_visible flag to assessments
ALTER TABLE public.assessments ADD COLUMN portal_visible boolean NOT NULL DEFAULT false;

-- Add slug to organisations for portal URL routing
ALTER TABLE public.organisations ADD COLUMN slug text UNIQUE;
