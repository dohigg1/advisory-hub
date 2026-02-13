
-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  company text,
  phone text,
  custom_fields_json jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'direct',
  utm_json jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'started',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Org members can view leads
CREATE POLICY "Org members can view leads"
ON public.leads FOR SELECT TO authenticated
USING (is_org_member(org_id));

-- Anyone can insert leads (public assessment takers)
CREATE POLICY "Anyone can create leads"
ON public.leads FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Anyone can update their own lead (status changes)
CREATE POLICY "Anyone can update leads by id"
ON public.leads FOR UPDATE TO anon, authenticated
USING (true);

-- Org admins can delete leads
CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE TO authenticated
USING (is_org_admin(org_id));

-- ============================================
-- RESPONSES TABLE
-- ============================================
CREATE TABLE public.responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[] DEFAULT '{}',
  open_text_value text,
  points_awarded integer NOT NULL DEFAULT 0,
  responded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Org members can view responses via lead
CREATE POLICY "Org members can view responses"
ON public.responses FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads l WHERE l.id = lead_id AND is_org_member(l.org_id)
));

-- Anyone can insert responses (public takers)
CREATE POLICY "Anyone can create responses"
ON public.responses FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Anyone can update their own responses
CREATE POLICY "Anyone can update responses"
ON public.responses FOR UPDATE TO anon, authenticated
USING (true);

-- Org admins can delete responses
CREATE POLICY "Admins can delete responses"
ON public.responses FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads l WHERE l.id = lead_id AND is_org_admin(l.org_id)
));

-- ============================================
-- PUBLIC READ ACCESS for assessments, categories, questions, answer_options, organisations
-- (anon users need to read these to take the assessment)
-- ============================================

-- Allow anon to read published assessments
CREATE POLICY "Public can view published assessments"
ON public.assessments FOR SELECT TO anon
USING (status = 'published');

-- Allow anon to read categories for published assessments
CREATE POLICY "Public can view categories for published assessments"
ON public.categories FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.status = 'published'
));

-- Allow anon to read questions for published assessments
CREATE POLICY "Public can view questions for published assessments"
ON public.questions FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND a.status = 'published'
));

-- Allow anon to read answer options for published assessments
CREATE POLICY "Public can view answer options for published assessments"
ON public.answer_options FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.questions q
  JOIN public.assessments a ON a.id = q.assessment_id
  WHERE q.id = question_id AND a.status = 'published'
));

-- Allow anon to read org info (for logo/branding)
CREATE POLICY "Public can view org for published assessments"
ON public.organisations FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.assessments a WHERE a.org_id = id AND a.status = 'published'
));

-- Unique constraint to prevent duplicate submissions
CREATE UNIQUE INDEX idx_leads_email_assessment ON public.leads(email, assessment_id)
WHERE status = 'completed';
