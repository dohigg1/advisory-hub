
-- Create a security definer function to check if user has no org
CREATE OR REPLACE FUNCTION public.user_has_no_org()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL
  )
$$;

-- Recreate the INSERT policy using the function
DROP POLICY IF EXISTS "Users without org can create an organisation" ON public.organisations;

CREATE POLICY "Users without org can create an organisation"
ON public.organisations
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_no_org());
