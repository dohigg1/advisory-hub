-- Create a SECURITY DEFINER function to handle org creation + profile linking
CREATE OR REPLACE FUNCTION public.create_organisation_for_user(
  _name text,
  _primary_colour text DEFAULT '#1B3A5C'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _user_id uuid := auth.uid();
BEGIN
  -- Verify user has no org
  IF EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = _user_id AND org_id IS NOT NULL) THEN
    RAISE EXCEPTION 'User already belongs to an organisation';
  END IF;

  -- Create org
  INSERT INTO public.organisations (name, primary_colour)
  VALUES (_name, _primary_colour)
  RETURNING id INTO _org_id;

  -- Link profile
  UPDATE public.profiles
  SET org_id = _org_id, role = 'admin'
  WHERE auth_user_id = _user_id;

  RETURN _org_id;
END;
$$;