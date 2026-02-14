
-- Feature Flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  percentage integer DEFAULT 100 CHECK (percentage >= 0 AND percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Super admins can manage, authenticated can read
CREATE POLICY "Super admins can manage feature flags"
  ON public.feature_flags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Authenticated can read feature flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (true);

-- Feature Flag Overrides (per-org)
CREATE TABLE public.feature_flag_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.feature_flags(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flag_id, org_id)
);
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage flag overrides"
  ON public.feature_flag_overrides FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()));

CREATE POLICY "Org members can read their overrides"
  ON public.feature_flag_overrides FOR SELECT TO authenticated
  USING (is_org_member(org_id));

-- Legal Documents
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'terms_of_service', 'privacy_policy'
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  content text NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.super_admins(id),
  UNIQUE (type, version)
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published legal docs"
  ON public.legal_documents FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Super admins can manage legal docs"
  ON public.legal_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()));

-- Legal Acceptances
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  UNIQUE (user_id, document_id)
);
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
  ON public.legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own acceptances"
  ON public.legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Onboarding Progress
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE UNIQUE,
  steps_completed text[] NOT NULL DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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

-- Lead Commentary
CREATE TABLE public.lead_commentary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_commentary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lead commentary"
  ON public.lead_commentary FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_commentary.lead_id AND is_org_member(l.org_id)));

CREATE POLICY "Org members can create lead commentary"
  ON public.lead_commentary FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND is_org_member(l.org_id)));

CREATE POLICY "Authors can update their commentary"
  ON public.lead_commentary FOR UPDATE TO authenticated
  USING (author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Authors can delete their commentary"
  ON public.lead_commentary FOR DELETE TO authenticated
  USING (author_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Cancellation Feedback
CREATE TABLE public.cancellation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  details text,
  offered_discount boolean DEFAULT false,
  accepted_discount boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cancellation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own cancellation feedback"
  ON public.cancellation_feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all cancellation feedback"
  ON public.cancellation_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_commentary_updated_at BEFORE UPDATE ON public.lead_commentary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
