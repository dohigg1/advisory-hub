
-- Brand themes table for org customization
CREATE TABLE public.brand_themes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE UNIQUE,
  primary_colour text DEFAULT '#1B3A5C',
  secondary_colour text DEFAULT '#4A90D9',
  accent_colour text DEFAULT '#6366F1',
  background_colour text DEFAULT '#FFFFFF',
  text_colour text DEFAULT '#1A1A2E',
  font_heading text DEFAULT 'Inter',
  font_body text DEFAULT 'Inter',
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  custom_css text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their brand theme"
  ON public.brand_themes FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "Org admins can manage brand themes"
  ON public.brand_themes FOR ALL
  USING (is_org_admin(org_id))
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "Public can view brand themes for published assessments"
  ON public.brand_themes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM assessments a WHERE a.org_id = brand_themes.org_id AND a.status = 'published'
  ));

CREATE TRIGGER update_brand_themes_updated_at
  BEFORE UPDATE ON public.brand_themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
