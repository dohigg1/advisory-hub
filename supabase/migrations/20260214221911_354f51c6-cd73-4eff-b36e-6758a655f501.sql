
-- Create super_admins table
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id)
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check their own super admin status
CREATE POLICY "Users can check own super admin status"
  ON public.super_admins FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Seed the first super admin
INSERT INTO public.super_admins (auth_user_id)
VALUES ('e659b764-0c15-415e-8c14-d923f24cd9b1');
