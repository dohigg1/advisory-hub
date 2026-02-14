-- ============================================================================
-- Phase 4: Advanced Features (Features 17-25)
-- Tables: ai_generations, referral_codes, referral_conversions, brand_themes,
--         custom_domains, api_keys, marketplace_templates, sso_connections,
--         permissions, custom_roles, data_retention_settings
-- Also: adds narrative_json column to scores
-- ============================================================================

-- ============================================================================
-- 1. AI Generations - Tracks AI content generation
-- ============================================================================
CREATE TABLE public.ai_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  type text NOT NULL,                            -- 'assessment', 'narrative', 'report'
  input_json jsonb,
  output_json jsonb,
  model text,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view ai_generations"
  ON public.ai_generations FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert ai_generations"
  ON public.ai_generations FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update ai_generations"
  ON public.ai_generations FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete ai_generations"
  ON public.ai_generations FOR DELETE
  USING (public.is_org_member(org_id));

CREATE INDEX idx_ai_generations_org_id ON public.ai_generations(org_id);
CREATE INDEX idx_ai_generations_type ON public.ai_generations(type);
CREATE INDEX idx_ai_generations_created_at ON public.ai_generations(org_id, created_at DESC);

-- ============================================================================
-- 2. Referral Codes - User referral tracking
-- ============================================================================
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own referral codes
CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own referral codes"
  ON public.referral_codes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND org_id = public.get_user_org_id());

CREATE POLICY "Users can update their own referral codes"
  ON public.referral_codes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own referral codes"
  ON public.referral_codes FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);

-- ============================================================================
-- 3. Referral Conversions - Referral attribution
-- ============================================================================
CREATE TABLE public.referral_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_org_id uuid REFERENCES public.organisations(id) ON DELETE SET NULL,
  referred_user_email text,
  status text DEFAULT 'signed_up',               -- 'signed_up', 'trial', 'converted', 'churned'
  reward_type text,
  reward_amount numeric,
  stripe_credit_id text,
  converted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- Users can view conversions for their own referral codes
CREATE POLICY "Users can view their own referral conversions"
  ON public.referral_conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.referral_codes rc
      WHERE rc.id = referral_conversions.referral_code_id
        AND rc.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert referral conversions"
  ON public.referral_conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update referral conversions"
  ON public.referral_conversions FOR UPDATE
  USING (true);

CREATE INDEX idx_referral_conversions_code_id ON public.referral_conversions(referral_code_id);
CREATE INDEX idx_referral_conversions_status ON public.referral_conversions(status);

-- ============================================================================
-- 4. Brand Themes - Per-org visual customisation
-- ============================================================================
CREATE TABLE public.brand_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE UNIQUE,
  colours_json jsonb DEFAULT '{}'::jsonb,
  fonts_json jsonb DEFAULT '{}'::jsonb,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  footer_text text,
  privacy_url text,
  terms_url text,
  custom_css text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brand_themes"
  ON public.brand_themes FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert brand_themes"
  ON public.brand_themes FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update brand_themes"
  ON public.brand_themes FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete brand_themes"
  ON public.brand_themes FOR DELETE
  USING (public.is_org_member(org_id));

-- Auto-update updated_at
CREATE TRIGGER update_brand_themes_updated_at
  BEFORE UPDATE ON public.brand_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. Custom Domains - Custom domain configuration
-- ============================================================================
CREATE TABLE public.custom_domains (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  verified boolean DEFAULT false,
  ssl_status text DEFAULT 'pending',
  dns_records_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view custom_domains"
  ON public.custom_domains FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert custom_domains"
  ON public.custom_domains FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update custom_domains"
  ON public.custom_domains FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete custom_domains"
  ON public.custom_domains FOR DELETE
  USING (public.is_org_member(org_id));

CREATE INDEX idx_custom_domains_org_id ON public.custom_domains(org_id);
CREATE INDEX idx_custom_domains_domain ON public.custom_domains(domain);

-- ============================================================================
-- 6. API Keys - Developer API key management
-- ============================================================================
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT '{}',
  rate_limit integer DEFAULT 1000,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can view api_keys"
  ON public.api_keys FOR SELECT
  USING (public.is_org_admin(org_id));

CREATE POLICY "Admins can create api_keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(org_id) AND org_id = public.get_user_org_id());

CREATE POLICY "Admins can update api_keys"
  ON public.api_keys FOR UPDATE
  USING (public.is_org_admin(org_id));

CREATE POLICY "Admins can delete api_keys"
  ON public.api_keys FOR DELETE
  USING (public.is_org_admin(org_id));

CREATE INDEX idx_api_keys_org_id ON public.api_keys(org_id);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);

-- ============================================================================
-- 7. Marketplace Templates - Published community templates
-- ============================================================================
CREATE TABLE public.marketplace_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  price numeric DEFAULT 0,
  downloads integer DEFAULT 0,
  rating numeric DEFAULT 0,
  published_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can browse the marketplace
CREATE POLICY "Authenticated users can view marketplace_templates"
  ON public.marketplace_templates FOR SELECT
  TO authenticated
  USING (true);

-- Only org members can publish their own templates
CREATE POLICY "Org members can insert marketplace_templates"
  ON public.marketplace_templates FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update their marketplace_templates"
  ON public.marketplace_templates FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete their marketplace_templates"
  ON public.marketplace_templates FOR DELETE
  USING (public.is_org_member(org_id));

CREATE INDEX idx_marketplace_templates_category ON public.marketplace_templates(category);
CREATE INDEX idx_marketplace_templates_published_at ON public.marketplace_templates(published_at DESC);
CREATE INDEX idx_marketplace_templates_downloads ON public.marketplace_templates(downloads DESC);

-- ============================================================================
-- 8. SSO Connections - Enterprise SSO configs
-- ============================================================================
CREATE TABLE public.sso_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  provider text NOT NULL,                        -- 'okta', 'azure_ad', 'google_workspace', 'custom_saml'
  metadata_url text,
  entity_id text,
  acs_url text,
  certificate_pem text,
  domain text,
  enforce boolean DEFAULT false,
  enabled boolean DEFAULT false,
  status text DEFAULT 'not_configured',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sso_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sso_connections"
  ON public.sso_connections FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert sso_connections"
  ON public.sso_connections FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update sso_connections"
  ON public.sso_connections FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete sso_connections"
  ON public.sso_connections FOR DELETE
  USING (public.is_org_member(org_id));

CREATE INDEX idx_sso_connections_org_id ON public.sso_connections(org_id);
CREATE INDEX idx_sso_connections_domain ON public.sso_connections(domain);

-- ============================================================================
-- 9. Permissions - RBAC permission definitions
-- ============================================================================
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,                     -- e.g., 'assessments:create', 'leads:view'
  category text NOT NULL,                        -- 'assessments', 'leads', 'analytics', etc.
  description text
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read the permission catalogue
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 10. Custom Roles - User-defined roles
-- ============================================================================
CREATE TABLE public.custom_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  permissions text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view custom_roles"
  ON public.custom_roles FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert custom_roles"
  ON public.custom_roles FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update custom_roles"
  ON public.custom_roles FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete custom_roles"
  ON public.custom_roles FOR DELETE
  USING (public.is_org_member(org_id));

-- Unique role name per org
CREATE UNIQUE INDEX idx_custom_roles_org_name ON public.custom_roles(org_id, name);

-- ============================================================================
-- 11. Data Retention Settings - GDPR data retention
-- ============================================================================
CREATE TABLE public.data_retention_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE UNIQUE,
  retention_months integer DEFAULT 24,
  auto_delete boolean DEFAULT false,
  cookie_consent_required boolean DEFAULT false,
  cookie_consent_text text,
  dpa_signed boolean DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.data_retention_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view data_retention_settings"
  ON public.data_retention_settings FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can insert data_retention_settings"
  ON public.data_retention_settings FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Org members can update data_retention_settings"
  ON public.data_retention_settings FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Org members can delete data_retention_settings"
  ON public.data_retention_settings FOR DELETE
  USING (public.is_org_member(org_id));

-- Auto-update updated_at
CREATE TRIGGER update_data_retention_settings_updated_at
  BEFORE UPDATE ON public.data_retention_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 12. Add narrative_json column to existing scores table
-- ============================================================================
ALTER TABLE public.scores
  ADD COLUMN IF NOT EXISTS narrative_json jsonb;

-- ============================================================================
-- 13. Seed default permissions
-- ============================================================================
INSERT INTO public.permissions (name, category, description) VALUES
  -- Assessments
  ('assessments:create', 'assessments', 'Create new assessments'),
  ('assessments:edit',   'assessments', 'Edit existing assessments'),
  ('assessments:publish','assessments', 'Publish assessments'),
  ('assessments:delete', 'assessments', 'Delete assessments'),
  ('assessments:view',   'assessments', 'View assessments'),
  -- Leads
  ('leads:view',         'leads',       'View leads and responses'),
  ('leads:export',       'leads',       'Export lead data'),
  ('leads:delete',       'leads',       'Delete leads'),
  -- Analytics
  ('analytics:view',     'analytics',   'View analytics dashboards'),
  ('analytics:export',   'analytics',   'Export analytics data'),
  -- Settings
  ('settings:org',       'settings',    'Manage organisation settings'),
  ('settings:billing',   'settings',    'Manage billing and subscription'),
  ('settings:team',      'settings',    'Manage team members and invitations'),
  ('settings:branding',  'settings',    'Manage branding and themes'),
  ('settings:sso',       'settings',    'Manage SSO connections'),
  ('settings:api_keys',  'settings',    'Manage API keys'),
  -- Templates
  ('templates:use',      'templates',   'Use templates from the marketplace'),
  ('templates:publish',  'templates',   'Publish templates to the marketplace');
