
-- View: org-level dashboard stats (leads this month/last month, completions)
CREATE OR REPLACE VIEW public.org_dashboard_stats AS
SELECT
  l.org_id,
  COUNT(*) FILTER (WHERE l.created_at >= date_trunc('month', now())) AS leads_this_month,
  COUNT(*) FILTER (WHERE l.created_at >= date_trunc('month', now()) - interval '1 month' AND l.created_at < date_trunc('month', now())) AS leads_last_month,
  COUNT(*) FILTER (WHERE l.completed_at IS NOT NULL AND l.completed_at >= date_trunc('month', now())) AS completions_this_month,
  COUNT(*) FILTER (WHERE l.completed_at IS NOT NULL AND l.completed_at >= date_trunc('month', now()) - interval '1 month' AND l.completed_at < date_trunc('month', now())) AS completions_last_month
FROM leads l
GROUP BY l.org_id;

-- RLS for the view
ALTER VIEW public.org_dashboard_stats SET (security_invoker = on);

-- View: assessment-level analytics summary
CREATE OR REPLACE VIEW public.assessment_analytics AS
SELECT
  l.assessment_id,
  COUNT(*) AS total_starts,
  COUNT(l.completed_at) AS total_completions,
  CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(l.completed_at)::numeric / COUNT(*)::numeric * 100, 1) ELSE 0 END AS completion_rate,
  ROUND(AVG(s.percentage)::numeric, 1) AS avg_score,
  ROUND(AVG(EXTRACT(EPOCH FROM (l.completed_at - l.started_at)) / 60)::numeric, 1) AS avg_time_minutes
FROM leads l
LEFT JOIN scores s ON s.lead_id = l.id
GROUP BY l.assessment_id;

ALTER VIEW public.assessment_analytics SET (security_invoker = on);

-- View: score distribution buckets
CREATE OR REPLACE VIEW public.score_distribution AS
SELECT
  s.assessment_id,
  FLOOR(s.percentage / 10) * 10 AS bucket_min,
  FLOOR(s.percentage / 10) * 10 + 10 AS bucket_max,
  COUNT(*) AS count
FROM scores s
WHERE s.percentage IS NOT NULL
GROUP BY s.assessment_id, FLOOR(s.percentage / 10);

ALTER VIEW public.score_distribution SET (security_invoker = on);

-- View: tier distribution
CREATE OR REPLACE VIEW public.tier_distribution AS
SELECT
  s.assessment_id,
  st.label AS tier_label,
  st.colour AS tier_colour,
  COUNT(*) AS count
FROM scores s
JOIN score_tiers st ON st.id = s.tier_id
GROUP BY s.assessment_id, st.label, st.colour;

ALTER VIEW public.tier_distribution SET (security_invoker = on);

-- View: category score averages
CREATE OR REPLACE VIEW public.category_averages AS
SELECT
  s.assessment_id,
  c.id AS category_id,
  c.name AS category_name,
  c.colour AS category_colour,
  c.sort_order,
  ROUND(AVG(
    CASE
      WHEN (cat_score->>'possible')::int > 0
      THEN (cat_score->>'points')::numeric / (cat_score->>'possible')::numeric * 100
      ELSE 0
    END
  )::numeric, 1) AS avg_percentage
FROM scores s,
  jsonb_array_elements(s.category_scores_json) AS cat_score
JOIN categories c ON c.id = (cat_score->>'category_id')::uuid
GROUP BY s.assessment_id, c.id, c.name, c.colour, c.sort_order;

ALTER VIEW public.category_averages SET (security_invoker = on);

-- View: completions over time (daily)
CREATE OR REPLACE VIEW public.completions_timeline AS
SELECT
  l.assessment_id,
  DATE(l.completed_at) AS day,
  COUNT(*) AS completions
FROM leads l
WHERE l.completed_at IS NOT NULL
GROUP BY l.assessment_id, DATE(l.completed_at);

ALTER VIEW public.completions_timeline SET (security_invoker = on);

-- View: response patterns (answer distribution per question)
CREATE OR REPLACE VIEW public.response_patterns AS
SELECT
  q.assessment_id,
  q.id AS question_id,
  q.text AS question_text,
  q.sort_order,
  ao.id AS option_id,
  ao.text AS option_text,
  ao.sort_order AS option_sort_order,
  COUNT(r.id) AS times_selected
FROM questions q
JOIN answer_options ao ON ao.question_id = q.id
LEFT JOIN responses r ON r.question_id = q.id AND ao.id = ANY(r.selected_option_ids)
GROUP BY q.assessment_id, q.id, q.text, q.sort_order, ao.id, ao.text, ao.sort_order;

ALTER VIEW public.response_patterns SET (security_invoker = on);

-- View: drop-off analysis (how many leads answered each question)
CREATE OR REPLACE VIEW public.dropoff_analysis AS
SELECT
  q.assessment_id,
  q.id AS question_id,
  q.text AS question_text,
  q.sort_order,
  COUNT(DISTINCT r.lead_id) AS respondents
FROM questions q
LEFT JOIN responses r ON r.question_id = q.id
GROUP BY q.assessment_id, q.id, q.text, q.sort_order;

ALTER VIEW public.dropoff_analysis SET (security_invoker = on);

-- View: top assessments by completion rate
CREATE OR REPLACE VIEW public.top_assessments AS
SELECT
  a.id,
  a.title,
  a.org_id,
  COUNT(l.id) AS total_starts,
  COUNT(l.completed_at) AS total_completions,
  CASE WHEN COUNT(l.id) > 0 THEN ROUND(COUNT(l.completed_at)::numeric / COUNT(l.id)::numeric * 100, 1) ELSE 0 END AS completion_rate
FROM assessments a
LEFT JOIN leads l ON l.assessment_id = a.id
GROUP BY a.id, a.title, a.org_id;

ALTER VIEW public.top_assessments SET (security_invoker = on);
