
-- Fix overly permissive INSERT policy on organisations
DROP POLICY "Authenticated users can create organisations" ON public.organisations;

CREATE POLICY "Users without org can create an organisation"
  ON public.organisations FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_user_id = auth.uid() AND org_id IS NOT NULL
    )
  );
