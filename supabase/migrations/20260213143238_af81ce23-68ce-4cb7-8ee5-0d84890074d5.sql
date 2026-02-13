-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  slug text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT landing_pages_slug_unique UNIQUE (slug)
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view landing pages in their org"
ON public.landing_pages FOR SELECT TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can create landing pages in their org"
ON public.landing_pages FOR INSERT TO authenticated
WITH CHECK (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can update landing pages in their org"
ON public.landing_pages FOR UPDATE TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can delete landing pages in their org"
ON public.landing_pages FOR DELETE TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

-- Public can view published landing pages (for the public route)
CREATE POLICY "Public can view published landing pages"
ON public.landing_pages FOR SELECT TO anon
USING (is_published = true);

-- Auto-update updated_at
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();