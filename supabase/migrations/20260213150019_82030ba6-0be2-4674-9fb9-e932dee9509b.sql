
-- Create private storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Org members can read their reports
CREATE POLICY "Org members can read reports" ON storage.objects FOR SELECT
USING (bucket_id = 'reports' AND EXISTS (
  SELECT 1 FROM leads l
  WHERE l.org_id = (SELECT get_user_org_id())
  AND (storage.foldername(name))[1] = l.org_id::text
));

-- Service/anon can upload reports (used during generation)
CREATE POLICY "Anyone can upload reports" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports');
