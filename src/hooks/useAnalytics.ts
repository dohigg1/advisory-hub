import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DateRange = "7d" | "30d" | "90d" | "custom";

function getDateFilter(range: DateRange, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (range) {
    case "7d":
      start = new Date(now.getTime() - 7 * 86400000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 86400000);
      break;
    case "90d":
      start = new Date(now.getTime() - 90 * 86400000);
      break;
    case "custom":
      start = customStart ?? new Date(now.getTime() - 30 * 86400000);
      end = customEnd ?? now;
      break;
  }

  return { start: start!, end };
}

// Org-level dashboard stats
export function useOrgDashboardStats() {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-dashboard-stats", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_dashboard_stats" as any)
        .select("*")
        .eq("org_id", orgId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any) ?? {
        leads_this_month: 0,
        leads_last_month: 0,
        completions_this_month: 0,
        completions_last_month: 0,
      };
    },
  });
}

export function useTopAssessments() {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["top-assessments", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("top_assessments" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("completion_rate", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useRecentLeads(limit = 20) {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["recent-leads", orgId, limit],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, first_name, last_name, email, assessment_id, completed_at, score_id, assessments(title), scores(percentage, tier_id, score_tiers(label))")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Assessment-level analytics
export function useAssessmentAnalytics(assessmentId: string | null) {
  return useQuery({
    queryKey: ["assessment-analytics", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_analytics" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data as any) ?? {
        total_starts: 0,
        total_completions: 0,
        completion_rate: 0,
        avg_score: null,
        avg_time_minutes: null,
      };
    },
  });
}

export function useScoreDistribution(assessmentId: string | null) {
  return useQuery({
    queryKey: ["score-distribution", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_distribution" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("bucket_min", { ascending: true });
      if (error) throw error;
      // Fill all buckets 0-100
      const buckets = Array.from({ length: 10 }, (_, i) => ({
        bucket: `${i * 10}-${i * 10 + 10}%`,
        count: 0,
      }));
      ((data as any[]) ?? []).forEach((d: any) => {
        const idx = Math.min(Math.floor(d.bucket_min / 10), 9);
        buckets[idx].count = Number(d.count);
      });
      return buckets;
    },
  });
}

export function useTierDistribution(assessmentId: string | null) {
  return useQuery({
    queryKey: ["tier-distribution", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_distribution" as any)
        .select("*")
        .eq("assessment_id", assessmentId!);
      if (error) throw error;
      return ((data as any[]) ?? []).map((d: any) => ({
        name: d.tier_label,
        value: Number(d.count),
        fill: d.tier_colour,
      }));
    },
  });
}

export function useCategoryAverages(assessmentId: string | null) {
  return useQuery({
    queryKey: ["category-averages", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_averages" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data as any[]) ?? []).map((d: any) => ({
        name: d.category_name,
        avg: Number(d.avg_percentage),
        fill: d.category_colour,
      }));
    },
  });
}

export function useCompletionsTimeline(assessmentId: string | null) {
  return useQuery({
    queryKey: ["completions-timeline", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("completions_timeline" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("day", { ascending: true });
      if (error) throw error;
      return ((data as any[]) ?? []).map((d: any) => ({
        day: d.day,
        completions: Number(d.completions),
      }));
    },
  });
}

export function useDropoffAnalysis(assessmentId: string | null) {
  return useQuery({
    queryKey: ["dropoff-analysis", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dropoff_analysis" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return ((data as any[]) ?? []).map((d: any) => ({
        question: `Q${d.sort_order + 1}`,
        fullText: d.question_text,
        respondents: Number(d.respondents),
      }));
    },
  });
}

export function useResponsePatterns(assessmentId: string | null) {
  return useQuery({
    queryKey: ["response-patterns", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("response_patterns" as any)
        .select("*")
        .eq("assessment_id", assessmentId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      // Group by question
      const grouped: Record<string, { questionText: string; sortOrder: number; options: { text: string; count: number }[] }> = {};
      ((data as any[]) ?? []).forEach((d: any) => {
        if (!grouped[d.question_id]) {
          grouped[d.question_id] = {
            questionText: d.question_text,
            sortOrder: d.sort_order,
            options: [],
          };
        }
        grouped[d.question_id].options.push({
          text: d.option_text,
          count: Number(d.times_selected),
        });
      });
      return Object.values(grouped).sort((a, b) => a.sortOrder - b.sortOrder);
    },
  });
}

// Benchmark statistics for analytics
export function useBenchmarkStats(assessmentId: string | null) {
  return useQuery({
    queryKey: ["benchmark-stats", assessmentId],
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benchmarks" as any)
        .select("*")
        .eq("assessment_id", assessmentId!);
      if (error) throw error;
      const rows = (data as any[]) ?? [];
      const overall = rows.find((r: any) => !r.category_id);
      const categories = rows.filter((r: any) => r.category_id).map((r: any) => ({
        category_id: r.category_id,
        avg_score: Number(r.avg_score),
        median_score: Number(r.median_score),
        percentile_25: Number(r.percentile_25),
        percentile_75: Number(r.percentile_75),
        sample_size: r.sample_size,
      }));
      return {
        overall: overall ? {
          avg_score: Number(overall.avg_score),
          median_score: Number(overall.median_score),
          percentile_25: Number(overall.percentile_25),
          percentile_75: Number(overall.percentile_75),
          sample_size: overall.sample_size,
        } : null,
        categories,
      };
    },
  });
}

// Org assessments list for filter
export function useOrgAssessments() {
  const { profile } = useAuth();
  const orgId = profile?.org_id;

  return useQuery({
    queryKey: ["org-assessments-list", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, title")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Export helpers
export async function exportLeadsCSV(assessmentId: string) {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("first_name, last_name, email, company, completed_at, source, utm_json, scores(percentage, total_points, total_possible, category_scores_json, score_tiers(label))")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false });

  if (error || !leads) throw error;

  const rows = leads.map((l: any) => {
    const score = l.scores?.[0] ?? l.scores;
    const tier = score?.score_tiers?.label ?? score?.score_tiers?.[0]?.label ?? "";
    const catScores = score?.category_scores_json ?? [];
    const catCols: Record<string, string> = {};
    if (Array.isArray(catScores)) {
      catScores.forEach((cs: any) => {
        catCols[cs.category_name ?? cs.category_id] = cs.possible > 0 ? `${Math.round((cs.points / cs.possible) * 100)}%` : "0%";
      });
    }
    return {
      first_name: l.first_name ?? "",
      last_name: l.last_name ?? "",
      email: l.email,
      company: l.company ?? "",
      score: score?.percentage != null ? `${score.percentage}%` : "",
      tier,
      ...catCols,
      completed_at: l.completed_at ?? "",
      source: l.source ?? "",
      utm_source: (l.utm_json as any)?.utm_source ?? "",
      utm_medium: (l.utm_json as any)?.utm_medium ?? "",
      utm_campaign: (l.utm_json as any)?.utm_campaign ?? "",
    };
  });

  downloadCSV(rows, `leads-${assessmentId}.csv`);
}

export async function exportResponsesCSV(assessmentId: string) {
  // First get question IDs for this assessment
  const { data: questions } = await supabase
    .from("questions")
    .select("id, text")
    .eq("assessment_id", assessmentId);

  if (!questions?.length) return;

  const questionMap = Object.fromEntries(questions.map((q) => [q.id, q.text]));
  const questionIds = questions.map((q) => q.id);

  const { data, error } = await supabase
    .from("responses")
    .select("lead_id, points_awarded, open_text_value, question_id, selected_option_ids")
    .in("question_id", questionIds)
    .order("responded_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map((r: any) => ({
    lead_id: r.lead_id,
    question: questionMap[r.question_id] ?? "",
    answer: r.open_text_value ?? (r.selected_option_ids ?? []).join(", "),
    points: r.points_awarded,
  }));

  downloadCSV(rows, `responses-${assessmentId}.csv`);
}

function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
