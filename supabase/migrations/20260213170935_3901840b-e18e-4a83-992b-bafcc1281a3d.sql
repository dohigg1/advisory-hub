
-- Benchmarks table for aggregate statistics
CREATE TABLE public.benchmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  avg_score decimal NOT NULL DEFAULT 0,
  median_score decimal NOT NULL DEFAULT 0,
  percentile_25 decimal NOT NULL DEFAULT 0,
  percentile_75 decimal NOT NULL DEFAULT 0,
  sample_size integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, category_id)
);

-- Allow NULL category_id to represent overall benchmark
CREATE UNIQUE INDEX benchmarks_assessment_overall_idx ON public.benchmarks (assessment_id) WHERE category_id IS NULL;

-- Enable RLS
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;

-- Public can view benchmarks for published assessments (anonymised aggregate data)
CREATE POLICY "Public can view benchmarks for published assessments"
ON public.benchmarks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM assessments a
  WHERE a.id = benchmarks.assessment_id AND a.status = 'published'
));

-- Org members can view their own benchmarks
CREATE POLICY "Org members can view benchmarks"
ON public.benchmarks FOR SELECT
USING (is_org_member(assessment_org_id(assessment_id)));

-- Service can insert/update benchmarks (via edge function with service role)
CREATE POLICY "Service can insert benchmarks"
ON public.benchmarks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service can update benchmarks"
ON public.benchmarks FOR UPDATE
USING (true);

-- Function to recalculate benchmarks incrementally
CREATE OR REPLACE FUNCTION public.recalculate_benchmarks(_assessment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _cat RECORD;
  _scores decimal[];
  _count integer;
BEGIN
  -- Overall benchmark
  SELECT array_agg(s.percentage ORDER BY s.percentage)
  INTO _scores
  FROM scores s
  WHERE s.assessment_id = _assessment_id AND s.percentage IS NOT NULL;

  _count := COALESCE(array_length(_scores, 1), 0);

  IF _count > 0 THEN
    INSERT INTO benchmarks (assessment_id, category_id, avg_score, median_score, percentile_25, percentile_75, sample_size, updated_at)
    VALUES (
      _assessment_id,
      NULL,
      ROUND((SELECT AVG(v) FROM unnest(_scores) v), 1),
      ROUND(_scores[(_count + 1) / 2], 1),
      ROUND(_scores[GREATEST(1, (_count * 25 / 100))], 1),
      ROUND(_scores[GREATEST(1, (_count * 75 / 100))], 1),
      _count,
      now()
    )
    ON CONFLICT (assessment_id) WHERE category_id IS NULL
    DO UPDATE SET
      avg_score = EXCLUDED.avg_score,
      median_score = EXCLUDED.median_score,
      percentile_25 = EXCLUDED.percentile_25,
      percentile_75 = EXCLUDED.percentile_75,
      sample_size = EXCLUDED.sample_size,
      updated_at = now();
  END IF;

  -- Per-category benchmarks
  FOR _cat IN SELECT id FROM categories WHERE assessment_id = _assessment_id LOOP
    SELECT array_agg(
      CASE WHEN (csj.val->>'possible')::int > 0
           THEN ROUND(((csj.val->>'points')::decimal / (csj.val->>'possible')::decimal) * 100, 1)
           ELSE NULL END
      ORDER BY 1
    )
    INTO _scores
    FROM scores s,
         jsonb_each(s.category_scores_json) csj(key, val)
    WHERE s.assessment_id = _assessment_id
      AND csj.key = _cat.id::text
      AND (csj.val->>'possible')::int > 0;

    -- Remove nulls
    _scores := array_remove(_scores, NULL);
    _count := COALESCE(array_length(_scores, 1), 0);

    IF _count > 0 THEN
      INSERT INTO benchmarks (assessment_id, category_id, avg_score, median_score, percentile_25, percentile_75, sample_size, updated_at)
      VALUES (
        _assessment_id,
        _cat.id,
        ROUND((SELECT AVG(v) FROM unnest(_scores) v), 1),
        ROUND(_scores[(_count + 1) / 2], 1),
        ROUND(_scores[GREATEST(1, (_count * 25 / 100))], 1),
        ROUND(_scores[GREATEST(1, (_count * 75 / 100))], 1),
        _count,
        now()
      )
      ON CONFLICT (assessment_id, category_id)
      DO UPDATE SET
        avg_score = EXCLUDED.avg_score,
        median_score = EXCLUDED.median_score,
        percentile_25 = EXCLUDED.percentile_25,
        percentile_75 = EXCLUDED.percentile_75,
        sample_size = EXCLUDED.sample_size,
        updated_at = now();
    END IF;
  END LOOP;
END;
$$;
