
-- Assessment iterations tracking table
CREATE TABLE public.assessment_iterations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_email text NOT NULL,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  iteration_number integer NOT NULL DEFAULT 1,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score_id uuid REFERENCES public.scores(id) ON DELETE SET NULL,
  overall_percentage numeric,
  category_scores_json jsonb DEFAULT '{}'::jsonb,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one iteration number per email+assessment
ALTER TABLE public.assessment_iterations 
  ADD CONSTRAINT assessment_iterations_unique_iteration 
  UNIQUE (lead_email, assessment_id, iteration_number);

-- Index for fast lookups
CREATE INDEX idx_assessment_iterations_email_assessment 
  ON public.assessment_iterations (lead_email, assessment_id, iteration_number);

CREATE INDEX idx_assessment_iterations_lead_id 
  ON public.assessment_iterations (lead_id);

-- Enable RLS
ALTER TABLE public.assessment_iterations ENABLE ROW LEVEL SECURITY;

-- Public can view their own iterations (for results page)
CREATE POLICY "Public can view iterations by email"
  ON public.assessment_iterations FOR SELECT
  USING (true);

-- Service can insert/update iterations
CREATE POLICY "Service can insert iterations"
  ON public.assessment_iterations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update iterations"
  ON public.assessment_iterations FOR UPDATE
  USING (true);

-- Org members can view iterations for their assessments
CREATE POLICY "Org members can view iterations"
  ON public.assessment_iterations FOR SELECT
  USING (is_org_member(assessment_org_id(assessment_id)));

-- Org admins can delete iterations
CREATE POLICY "Admins can delete iterations"
  ON public.assessment_iterations FOR DELETE
  USING (is_org_member(assessment_org_id(assessment_id)));
