
-- Referral codes table
CREATE TABLE public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referral codes"
  ON public.referral_codes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert referral codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (true);

-- Referral conversions table
CREATE TABLE public.referral_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text NOT NULL,
  status text NOT NULL DEFAULT 'signed_up',
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);

ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversions for their referral codes"
  ON public.referral_conversions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.referral_codes rc
    WHERE rc.id = referral_conversions.referral_code_id AND rc.user_id = auth.uid()
  ));

CREATE POLICY "Service can manage conversions"
  ON public.referral_conversions FOR ALL
  USING (true) WITH CHECK (true);

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
  _org_id uuid;
BEGIN
  -- Only generate if user has an org
  SELECT org_id INTO _org_id FROM public.profiles WHERE auth_user_id = NEW.id;
  IF _org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Generate random 8-char alphanumeric code
  _code := upper(substr(md5(random()::text || NEW.id::text), 1, 8));

  INSERT INTO public.referral_codes (user_id, org_id, code)
  VALUES (NEW.id, _org_id, _code)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Function to generate referral code when profile gets org assigned
CREATE OR REPLACE FUNCTION public.generate_referral_on_org_assign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
BEGIN
  IF NEW.org_id IS NOT NULL AND (OLD.org_id IS NULL OR OLD.org_id != NEW.org_id) THEN
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE user_id = NEW.auth_user_id AND org_id = NEW.org_id) THEN
      _code := upper(substr(md5(random()::text || NEW.auth_user_id::text), 1, 8));
      INSERT INTO public.referral_codes (user_id, org_id, code)
      VALUES (NEW.auth_user_id, NEW.org_id, _code)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_referral_on_org_assign
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_on_org_assign();
