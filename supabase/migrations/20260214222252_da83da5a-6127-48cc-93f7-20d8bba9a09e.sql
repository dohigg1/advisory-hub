
-- Fix onboarding_progress to match hook expectations (per-step rows)
DROP TABLE public.onboarding_progress;

CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  step_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  completed_by uuid REFERENCES auth.users(id),
  UNIQUE (org_id, step_key)
);
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view onboarding progress"
  ON public.onboarding_progress FOR SELECT TO authenticated
  USING (is_org_member(org_id));

CREATE POLICY "Org members can upsert onboarding progress"
  ON public.onboarding_progress FOR INSERT TO authenticated
  WITH CHECK (is_org_member(org_id));

CREATE POLICY "Org members can update onboarding progress"
  ON public.onboarding_progress FOR UPDATE TO authenticated
  USING (is_org_member(org_id));
