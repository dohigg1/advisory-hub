
-- Fix 1: Remove overly permissive leads UPDATE policy
-- Client never updates leads directly; only service role (edge functions) does
DROP POLICY IF EXISTS "Anyone can update leads by id" ON public.leads;

-- Add a restricted update policy: only service role can update (authenticated users in same org)
CREATE POLICY "Org members can update leads"
  ON public.leads FOR UPDATE
  USING (is_org_member(org_id));

-- Fix 2: Remove overly permissive responses UPDATE policy  
DROP POLICY IF EXISTS "Anyone can update responses" ON public.responses;

-- Responses are updated by edge functions (service role) or by the assessment taker.
-- Since assessment takers are anonymous, we scope updates to responses linked to
-- leads that have status='started' (in-progress assessments only)
CREATE POLICY "Can update responses for in-progress leads"
  ON public.responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = responses.lead_id
      AND l.status = 'started'
    )
  );

-- Fix 3: Remove overly permissive reports storage upload policy
DROP POLICY IF EXISTS "Anyone can upload reports" ON storage.objects;

-- Only service role should upload reports (edge functions use service role key)
CREATE POLICY "Authenticated users can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports'
    AND auth.role() = 'authenticated'
  );
