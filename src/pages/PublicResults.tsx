import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { ResultsPageSection } from "@/types/results-page";
import { AssessmentHeader } from "@/components/public-assessment/AssessmentHeader";
import { OverallScoreSection } from "@/components/results-page/sections/OverallScoreSection";
import { CategoryBreakdownSection } from "@/components/results-page/sections/CategoryBreakdownSection";
import { RadarChartSection } from "@/components/results-page/sections/RadarChartSection";
import { CategoryDetailSection } from "@/components/results-page/sections/CategoryDetailSection";
import { DynamicTextSection } from "@/components/results-page/sections/DynamicTextSection";
import { CtaSection } from "@/components/results-page/sections/CtaSection";
import { NextStepsSection } from "@/components/results-page/sections/NextStepsSection";
import { ConsultantInfoSection } from "@/components/results-page/sections/ConsultantInfoSection";
import { ShareButtons } from "@/components/results-page/sections/ShareButtons";

type ScoreTier = Tables<"score_tiers">;
type Category = Tables<"categories">;

export interface CategoryScore {
  category: Category;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  tier: ScoreTier | null;
}

export interface BenchmarkData {
  overall: { avg_score: number; median_score: number; percentile_25: number; percentile_75: number; sample_size: number } | null;
  categories: Record<string, { avg_score: number; median_score: number; percentile_25: number; percentile_75: number; sample_size: number }>;
  percentileRank: number | null; // "You scored higher than X%"
}

export interface ResultsData {
  lead: Tables<"leads">;
  organisation: Tables<"organisations"> | null;
  assessment: Tables<"assessments">;
  scoreTiers: ScoreTier[];
  categories: Category[];
  categoryScores: CategoryScore[];
  overallPercentage: number;
  overallTier: ScoreTier | null;
  sections: ResultsPageSection[];
  brandColour: string;
  benchmarks: BenchmarkData | null;
}

export default function PublicResults() {
  const { leadId } = useParams<{ leadId: string }>();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    loadResults(leadId);
  }, [leadId]);

  const loadResults = async (leadId: string) => {
    // Get lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) { setNotFound(true); setLoading(false); return; }

    // Fetch score, assessment, categories, tiers, org, results_page in parallel
    const [scoreRes, assessmentRes, categoriesRes, tiersRes, orgRes, resultsPageRes] = await Promise.all([
      supabase.from("scores").select("*").eq("lead_id", leadId).maybeSingle(),
      supabase.from("assessments").select("*").eq("id", lead.assessment_id).single(),
      supabase.from("categories").select("*").eq("assessment_id", lead.assessment_id).order("sort_order"),
      supabase.from("score_tiers").select("*").eq("assessment_id", lead.assessment_id).order("sort_order"),
      supabase.from("organisations").select("*").eq("id", lead.org_id).single(),
      supabase.from("results_pages").select("*").eq("assessment_id", lead.assessment_id).maybeSingle(),
    ]);

    if (!assessmentRes.data) { setNotFound(true); setLoading(false); return; }

    const assessment = assessmentRes.data;
    const categories = categoriesRes.data || [];
    const scoreTiers = tiersRes.data || [];
    const score = scoreRes.data;
    const catScoresJson = (score?.category_scores_json as Record<string, any>) || {};

    // Build category scores from the pre-calculated scores table
    const categoryScores: CategoryScore[] = categories.map(cat => {
      const cs = catScoresJson[cat.id];
      const percentage = cs?.percentage ?? 0;
      const tier = cs?.tier_id ? scoreTiers.find(t => t.id === cs.tier_id) || null : null;
      return {
        category: cat,
        totalPoints: cs?.points ?? 0,
        maxPoints: cs?.possible ?? 0,
        percentage,
        tier,
      };
    });

    const overallPercentage = score?.percentage != null ? Number(score.percentage) : 0;
    const overallTier = score?.tier_id ? scoreTiers.find(t => t.id === score.tier_id) || null : null;

    const sections: ResultsPageSection[] = resultsPageRes.data
      ? ((resultsPageRes.data.sections_json as any) || [])
      : getDefaultSections();

    const brandColour = orgRes.data?.primary_colour || "#1B3A5C";

    // Fetch benchmarks
    let benchmarks: BenchmarkData | null = null;
    const assessmentSettings = (assessment.settings_json as any) || {};
    const minSample = assessmentSettings.benchmark_min_sample ?? 10;

    if (assessmentSettings.benchmarking_enabled !== false) {
      const { data: benchmarkRows } = await supabase
        .from("benchmarks" as any)
        .select("*")
        .eq("assessment_id", lead.assessment_id);

      if (benchmarkRows && benchmarkRows.length > 0) {
        const overallBm = (benchmarkRows as any[]).find((b: any) => !b.category_id);
        const catBms: Record<string, any> = {};
        (benchmarkRows as any[]).forEach((b: any) => {
          if (b.category_id && b.sample_size >= minSample) {
            catBms[b.category_id] = { avg_score: Number(b.avg_score), median_score: Number(b.median_score), percentile_25: Number(b.percentile_25), percentile_75: Number(b.percentile_75), sample_size: b.sample_size };
          }
        });

        // Calculate percentile rank
        let percentileRank: number | null = null;
        if (overallBm && overallBm.sample_size >= minSample && score?.percentage != null) {
          // Approximate percentile from quartiles
          const pct = Number(score.percentage);
          if (pct <= Number(overallBm.percentile_25)) percentileRank = Math.round((pct / Number(overallBm.percentile_25)) * 25);
          else if (pct <= Number(overallBm.median_score)) percentileRank = Math.round(25 + ((pct - Number(overallBm.percentile_25)) / (Number(overallBm.median_score) - Number(overallBm.percentile_25))) * 25);
          else if (pct <= Number(overallBm.percentile_75)) percentileRank = Math.round(50 + ((pct - Number(overallBm.median_score)) / (Number(overallBm.percentile_75) - Number(overallBm.median_score))) * 25);
          else percentileRank = Math.round(75 + ((pct - Number(overallBm.percentile_75)) / (100 - Number(overallBm.percentile_75))) * 25);
          percentileRank = Math.min(99, Math.max(1, percentileRank));
        }

        benchmarks = {
          overall: overallBm && overallBm.sample_size >= minSample ? { avg_score: Number(overallBm.avg_score), median_score: Number(overallBm.median_score), percentile_25: Number(overallBm.percentile_25), percentile_75: Number(overallBm.percentile_75), sample_size: overallBm.sample_size } : null,
          categories: catBms,
          percentileRank,
        };
      }
    }

    setData({
      lead,
      organisation: orgRes.data,
      assessment,
      scoreTiers,
      categories,
      categoryScores,
      overallPercentage,
      overallTier,
      sections,
      brandColour,
      benchmarks,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Results Not Found</h1>
          <p className="text-muted-foreground">This results page doesn't exist or hasn't been completed yet.</p>
        </div>
      </div>
    );
  }

  const visibleSections = data.sections.filter(s => s.is_visible);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(210 20% 97%) 0%, hsl(210 15% 94%) 100%)" }}>
      <AssessmentHeader organisation={data.organisation} brandColour={data.brandColour} />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your Assessment Results</h1>
          <p className="text-muted-foreground text-sm">
            {data.assessment.title} · Completed {data.lead.completed_at ? new Date(data.lead.completed_at).toLocaleDateString() : ""}
          </p>
        </div>

        {visibleSections.length > 0 ? (
          visibleSections.map(section => {
            const key = section.id;
            switch (section.type) {
              case "overall_score": return <OverallScoreSection key={key} section={section} data={data} />;
              case "category_breakdown": return <CategoryBreakdownSection key={key} section={section} data={data} />;
              case "radar_chart": return <RadarChartSection key={key} section={section} data={data} />;
              case "category_detail": return <CategoryDetailSection key={key} section={section} data={data} />;
              case "dynamic_text": return <DynamicTextSection key={key} section={section} data={data} />;
              case "cta": return <CtaSection key={key} section={section} data={data} />;
              case "next_steps": return <NextStepsSection key={key} section={section} data={data} />;
              case "consultant_info": return <ConsultantInfoSection key={key} section={section} data={data} />;
              default: return null;
            }
          })
        ) : (
          <>
            <OverallScoreSection section={createDefault("overall_score")} data={data} />
            <CategoryBreakdownSection section={createDefault("category_breakdown")} data={data} />
            <RadarChartSection section={createDefault("radar_chart")} data={data} />
          </>
        )}

        <ShareButtons data={data} />
        <footer className="text-center text-xs text-slate-400 pb-8">
          © {new Date().getFullYear()} {data.organisation?.name || ""}. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

function getDefaultSections(): ResultsPageSection[] {
  return [
    { id: "default-overall", type: "overall_score", content_json: { heading: "Your Overall Score", show_tier_description: true }, sort_order: 0, is_visible: true },
    { id: "default-breakdown", type: "category_breakdown", content_json: { heading: "Score Breakdown" }, sort_order: 1, is_visible: true },
    { id: "default-radar", type: "radar_chart", content_json: { heading: "Your Profile" }, sort_order: 2, is_visible: true },
  ];
}

function createDefault(type: string): ResultsPageSection {
  return { id: `default-${type}`, type: type as any, content_json: { heading: "", show_tier_description: true }, sort_order: 0, is_visible: true };
}
