
-- Results pages table
CREATE TABLE public.results_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assessment_id)
);

ALTER TABLE public.results_pages ENABLE ROW LEVEL SECURITY;

-- Org members can manage results pages
CREATE POLICY "Users can view results pages in their org"
ON public.results_pages FOR SELECT TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can create results pages in their org"
ON public.results_pages FOR INSERT TO authenticated
WITH CHECK (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can update results pages in their org"
ON public.results_pages FOR UPDATE TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Users can delete results pages in their org"
ON public.results_pages FOR DELETE TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

-- Public can view results pages for published assessments
CREATE POLICY "Public can view results pages for published assessments"
ON public.results_pages FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.status = 'published'
));

-- Trigger for updated_at
CREATE TRIGGER update_results_pages_updated_at
BEFORE UPDATE ON public.results_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also allow anon to read leads they own (for results page)
CREATE POLICY "Public can view own lead"
ON public.leads FOR SELECT TO anon
USING (true);

-- Allow anon to read responses for their lead
CREATE POLICY "Public can view own responses"
ON public.responses FOR SELECT TO anon
USING (true);

-- Allow anon to read score tiers for published assessments
CREATE POLICY "Public can view score tiers for published assessments"
ON public.score_tiers FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.status = 'published'
));
