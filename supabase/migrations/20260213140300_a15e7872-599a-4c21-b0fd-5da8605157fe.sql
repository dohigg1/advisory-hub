
-- Assessment type enum
CREATE TYPE public.assessment_type AS ENUM ('scorecard', 'diagnostic', 'readiness_check', 'maturity_model');

-- Assessment status enum
CREATE TYPE public.assessment_status AS ENUM ('draft', 'published', 'archived');

-- Question type enum
CREATE TYPE public.question_type AS ENUM ('yes_no', 'multiple_choice', 'sliding_scale', 'rating_scale', 'open_text', 'checkbox_select', 'image_select');

-- Assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type public.assessment_type NOT NULL DEFAULT 'scorecard',
  status public.assessment_status NOT NULL DEFAULT 'draft',
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  colour TEXT DEFAULT '#4A90D9',
  sort_order INTEGER NOT NULL DEFAULT 0,
  include_in_total BOOLEAN NOT NULL DEFAULT true
);

-- Questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  type public.question_type NOT NULL DEFAULT 'multiple_choice',
  text TEXT NOT NULL,
  help_text TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  settings_json JSONB DEFAULT '{}'::jsonb
);

-- Answer options table
CREATE TABLE public.answer_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  points INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Score tiers table
CREATE TABLE public.score_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  min_pct INTEGER NOT NULL DEFAULT 0,
  max_pct INTEGER NOT NULL DEFAULT 100,
  colour TEXT NOT NULL DEFAULT '#4A90D9',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_tiers ENABLE ROW LEVEL SECURITY;

-- RLS for assessments (org-scoped via helper functions)
CREATE POLICY "Users can view assessments in their org"
  ON public.assessments FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Users can create assessments in their org"
  ON public.assessments FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());

CREATE POLICY "Users can update assessments in their org"
  ON public.assessments FOR UPDATE
  USING (public.is_org_member(org_id));

CREATE POLICY "Admins can delete assessments"
  ON public.assessments FOR DELETE
  USING (public.is_org_admin(org_id));

-- Helper: check assessment belongs to user's org
CREATE OR REPLACE FUNCTION public.assessment_org_id(_assessment_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.assessments WHERE id = _assessment_id
$$;

-- RLS for categories
CREATE POLICY "Users can view categories"
  ON public.categories FOR SELECT
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can create categories"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

-- RLS for questions
CREATE POLICY "Users can view questions"
  ON public.questions FOR SELECT
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can create questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can update questions"
  ON public.questions FOR UPDATE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can delete questions"
  ON public.questions FOR DELETE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

-- Helper: get org from question
CREATE OR REPLACE FUNCTION public.question_org_id(_question_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.org_id FROM public.questions q
  JOIN public.assessments a ON a.id = q.assessment_id
  WHERE q.id = _question_id
$$;

-- RLS for answer_options
CREATE POLICY "Users can view answer options"
  ON public.answer_options FOR SELECT
  USING (public.is_org_member(public.question_org_id(question_id)));

CREATE POLICY "Users can create answer options"
  ON public.answer_options FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(public.question_org_id(question_id)));

CREATE POLICY "Users can update answer options"
  ON public.answer_options FOR UPDATE
  USING (public.is_org_member(public.question_org_id(question_id)));

CREATE POLICY "Users can delete answer options"
  ON public.answer_options FOR DELETE
  USING (public.is_org_member(public.question_org_id(question_id)));

-- RLS for score_tiers
CREATE POLICY "Users can view score tiers"
  ON public.score_tiers FOR SELECT
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can create score tiers"
  ON public.score_tiers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can update score tiers"
  ON public.score_tiers FOR UPDATE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

CREATE POLICY "Users can delete score tiers"
  ON public.score_tiers FOR DELETE
  USING (public.is_org_member(public.assessment_org_id(assessment_id)));

-- Trigger to update updated_at on assessments
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
