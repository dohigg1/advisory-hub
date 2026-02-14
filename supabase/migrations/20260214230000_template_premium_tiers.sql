-- Template management: premium tiers, sort order, featured, admin write access

-- Add new columns to templates
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS min_plan_tier text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Allow super admins to manage templates via service role (Edge Function)
-- The existing RLS only allows SELECT for anyone; INSERT/UPDATE/DELETE
-- are service-role only which is correct for the Edge Function approach.

-- Super admins can also view inactive templates
CREATE POLICY "Super admins can view all templates"
  ON public.templates FOR SELECT
  USING (public.is_super_admin());

-- Index for sorted/filtered queries
CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON public.templates(sort_order);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
