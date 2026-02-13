
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'viewer');

-- Create organisations table
CREATE TABLE public.organisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_colour TEXT DEFAULT '#1B3A5C',
  plan_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (links auth users to organisations)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  org_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(org_id, email)
);

-- Enable RLS on all tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE auth_user_id = auth.uid()
$$;

-- Helper function: check if user is member of an org
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND org_id = _org_id
  )
$$;

-- Helper function: check if user is admin of an org
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND org_id = _org_id AND role = 'admin'
  )
$$;

-- Helper function: get user's role in an org
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO _invitation FROM public.team_invitations
    WHERE email = NEW.email AND accepted_at IS NULL AND expires_at > now()
    LIMIT 1;

  IF _invitation IS NOT NULL THEN
    -- Create profile with invited role and org
    INSERT INTO public.profiles (auth_user_id, email, org_id, role)
    VALUES (NEW.id, NEW.email, _invitation.org_id, _invitation.role);

    -- Mark invitation as accepted
    UPDATE public.team_invitations SET accepted_at = now() WHERE id = _invitation.id;
  ELSE
    -- Create profile without org (will go through onboarding)
    INSERT INTO public.profiles (auth_user_id, email)
    VALUES (NEW.id, NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for organisations
CREATE POLICY "Users can view their own organisation"
  ON public.organisations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Authenticated users can create organisations"
  ON public.organisations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their organisation"
  ON public.organisations FOR UPDATE
  USING (public.is_org_admin(id));

CREATE POLICY "Admins can delete their organisation"
  ON public.organisations FOR DELETE
  USING (public.is_org_admin(id));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their org"
  ON public.profiles FOR SELECT
  USING (
    org_id IS NULL AND auth_user_id = auth.uid()
    OR public.is_org_member(org_id)
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their org"
  ON public.profiles FOR UPDATE
  USING (public.is_org_admin(org_id));

CREATE POLICY "Admins can delete profiles in their org"
  ON public.profiles FOR DELETE
  USING (public.is_org_admin(org_id) AND auth_user_id != auth.uid());

-- RLS Policies for team_invitations
CREATE POLICY "Admins can view invitations for their org"
  ON public.team_invitations FOR SELECT
  USING (public.is_org_admin(org_id));

CREATE POLICY "Admins can create invitations"
  ON public.team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "Admins can delete invitations"
  ON public.team_invitations FOR DELETE
  USING (public.is_org_admin(org_id));

-- Storage bucket for org logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

CREATE POLICY "Anyone can view org logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can upload org logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can update org logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'org-logos');

CREATE POLICY "Authenticated users can delete org logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'org-logos');
