
-- Scores table
CREATE TABLE public.scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  total_points integer NOT NULL DEFAULT 0,
  total_possible integer NOT NULL DEFAULT 0,
  percentage numeric(5,2),
  tier_id uuid REFERENCES public.score_tiers(id) ON DELETE SET NULL,
  category_scores_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_scores_lead_id ON public.scores(lead_id);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view own score" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Service can insert scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update scores" ON public.scores FOR UPDATE USING (true);
CREATE POLICY "Org members can view scores" ON public.scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads l WHERE l.id = scores.lead_id AND is_org_member(l.org_id))
);

-- Scoring errors table
CREATE TABLE public.scoring_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  error_message text NOT NULL,
  error_details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins can view scoring errors" ON public.scoring_errors FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads l WHERE l.id = scoring_errors.lead_id AND is_org_admin(l.org_id))
);
CREATE POLICY "Anyone can insert scoring errors" ON public.scoring_errors FOR INSERT WITH CHECK (true);

-- Add score_id to leads
ALTER TABLE public.leads ADD COLUMN score_id uuid REFERENCES public.scores(id) ON DELETE SET NULL;
