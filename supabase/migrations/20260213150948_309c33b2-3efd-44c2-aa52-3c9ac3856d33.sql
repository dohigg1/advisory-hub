
-- Add abandon_email_sent to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS abandon_email_sent boolean NOT NULL DEFAULT false;

-- Create webhook_logs table
CREATE TABLE public.webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  status_code integer,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_body text,
  attempt integer NOT NULL DEFAULT 1,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view webhook logs"
ON public.webhook_logs FOR SELECT
USING (is_org_member(assessment_org_id(assessment_id)));

CREATE POLICY "Service can insert webhook logs"
ON public.webhook_logs FOR INSERT
WITH CHECK (true);
