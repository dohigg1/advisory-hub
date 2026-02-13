
-- Drop restrictive SELECT policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view landing pages in their org" ON public.landing_pages;
DROP POLICY IF EXISTS "Public can view published landing pages" ON public.landing_pages;

-- Recreate as PERMISSIVE (default) so either can grant access
CREATE POLICY "Users can view landing pages in their org"
ON public.landing_pages FOR SELECT TO authenticated
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Public can view published landing pages"
ON public.landing_pages FOR SELECT TO anon
USING (is_published = true);
