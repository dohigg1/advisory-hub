-- Add narrative_json column to scores for caching AI-generated narratives
ALTER TABLE public.scores ADD COLUMN IF NOT EXISTS narrative_json jsonb DEFAULT NULL;