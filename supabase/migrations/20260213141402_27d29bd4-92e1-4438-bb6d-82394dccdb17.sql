
-- Drop all existing restrictive policies on organisations
DROP POLICY IF EXISTS "Users without org can create an organisation" ON public.organisations;
DROP POLICY IF EXISTS "Users can view their own organisation" ON public.organisations;
DROP POLICY IF EXISTS "Admins can update their organisation" ON public.organisations;
DROP POLICY IF EXISTS "Admins can delete their organisation" ON public.organisations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users without org can create an organisation"
ON public.organisations FOR INSERT TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.auth_user_id = auth.uid() AND profiles.org_id IS NOT NULL
  )
);

CREATE POLICY "Users can view their own organisation"
ON public.organisations FOR SELECT TO authenticated
USING (is_org_member(id));

CREATE POLICY "Admins can update their organisation"
ON public.organisations FOR UPDATE TO authenticated
USING (is_org_admin(id));

CREATE POLICY "Admins can delete their organisation"
ON public.organisations FOR DELETE TO authenticated
USING (is_org_admin(id));
