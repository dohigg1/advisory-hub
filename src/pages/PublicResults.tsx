import { useEffect, useState, useMemo } from "react";
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
import { Linkedin, Twitter, Mail, Download } from "lucide-react";

type ScoreTier = Tables<"score_tiers">;
type Category = Tables<"categories">;

export interface CategoryScore {
  category: Category;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
  tier: ScoreTier | null;
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

    // Get assessment, responses, categories, tiers, options, org, results_page in parallel
    const [assessmentRes, responsesRes, categoriesRes, tiersRes, orgRes, resultsPageRes, questionsRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", lead.assessment_id).single(),
      supabase.from("responses").select("*").eq("lead_id", leadId),
      supabase.from("categories").select("*").eq("assessment_id", lead.assessment_id).order("sort_order"),
      supabase.from("score_tiers").select("*").eq("assessment_id", lead.assessment_id).order("sort_order"),
      supabase.from("organisations").select("*").eq("id", lead.org_id).single(),
      supabase.from("results_pages").select("*").eq("assessment_id", lead.assessment_id).maybeSingle(),
      supabase.from("questions").select("*").eq("assessment_id", lead.assessment_id),
    ]);

    if (!assessmentRes.data) { setNotFound(true); setLoading(false); return; }

    const assessment = assessmentRes.data;
    const responses = responsesRes.data || [];
    const categories = categoriesRes.data || [];
    const scoreTiers = tiersRes.data || [];
    const questions = questionsRes.data || [];

    // Build question-to-category map
    const questionCategoryMap = new Map(questions.map(q => [q.id, q.category_id]));

    // Get all answer options for points calculation
    const questionIds = questions.map(q => q.id);
    const { data: allOptions } = await supabase
      .from("answer_options")
      .select("*")
      .order("sort_order");

    const options = (allOptions || []).filter(o => questionIds.includes(o.question_id));

    // Calculate max possible points per question
    const maxPointsByQuestion = new Map<string, number>();
    for (const q of questions) {
      const qOptions = options.filter(o => o.question_id === q.id);
      const maxPts = qOptions.length > 0 ? Math.max(...qOptions.map(o => o.points)) : 0;
      maxPointsByQuestion.set(q.id, maxPts);
    }

    // Calculate category scores
    const categoryScores: CategoryScore[] = categories.map(cat => {
      const catQuestions = questions.filter(q => q.category_id === cat.id);
      const catQuestionIds = new Set(catQuestions.map(q => q.id));
      const catResponses = responses.filter(r => catQuestionIds.has(r.question_id));

      const totalPoints = catResponses.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
      const maxPoints = catQuestions.reduce((sum, q) => sum + (maxPointsByQuestion.get(q.id) || 0), 0);
      const percentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

      // Find matching tier
      const tier = scoreTiers.find(t => percentage >= t.min_pct && percentage <= t.max_pct) || null;

      return { category: cat, totalPoints, maxPoints, percentage, tier };
    });

    // Overall score
    const totalPoints = categoryScores.reduce((sum, cs) => sum + cs.totalPoints, 0);
    const totalMaxPoints = categoryScores.reduce((sum, cs) => sum + cs.maxPoints, 0);
    const overallPercentage = totalMaxPoints > 0 ? Math.round((totalPoints / totalMaxPoints) * 100) : 0;
    const overallTier = scoreTiers.find(t => overallPercentage >= t.min_pct && overallPercentage <= t.max_pct) || null;

    const sections: ResultsPageSection[] = resultsPageRes.data
      ? ((resultsPageRes.data.sections_json as any) || [])
      : getDefaultSections();

    const brandColour = orgRes.data?.primary_colour || "#1B3A5C";

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
    <div className="min-h-screen bg-slate-50">
      <AssessmentHeader organisation={data.organisation} brandColour={data.brandColour} />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Page title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Assessment Results</h1>
          <p className="text-slate-500 text-sm">
            {data.assessment.title} • Completed {data.lead.completed_at ? new Date(data.lead.completed_at).toLocaleDateString() : ""}
          </p>
        </div>

        {visibleSections.length > 0 ? (
          visibleSections.map(section => {
            const key = section.id;
            switch (section.type) {
              case "overall_score":
                return <OverallScoreSection key={key} section={section} data={data} />;
              case "category_breakdown":
                return <CategoryBreakdownSection key={key} section={section} data={data} />;
              case "radar_chart":
                return <RadarChartSection key={key} section={section} data={data} />;
              case "category_detail":
                return <CategoryDetailSection key={key} section={section} data={data} />;
              case "dynamic_text":
                return <DynamicTextSection key={key} section={section} data={data} />;
              case "cta":
                return <CtaSection key={key} section={section} data={data} />;
              case "next_steps":
                return <NextStepsSection key={key} section={section} data={data} />;
              case "consultant_info":
                return <ConsultantInfoSection key={key} section={section} data={data} />;
              default:
                return null;
            }
          })
        ) : (
          // Default layout when no sections configured
          <>
            <OverallScoreSection section={createDefault("overall_score")} data={data} />
            <CategoryBreakdownSection section={createDefault("category_breakdown")} data={data} />
            <RadarChartSection section={createDefault("radar_chart")} data={data} />
          </>
        )}

        {/* Share & download */}
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
