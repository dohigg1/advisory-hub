import { useMemo } from "react";
import type { ResultsPageSection } from "@/types/results-page";
import type { ResultsData, CategoryScore } from "@/pages/PublicResults";
import type { ScoreTier, Category } from "@/types/assessment";
import type { Tables } from "@/integrations/supabase/types";
import { OverallScoreSection } from "./sections/OverallScoreSection";
import { CategoryBreakdownSection } from "./sections/CategoryBreakdownSection";
import { RadarChartSection } from "./sections/RadarChartSection";
import { CategoryDetailSection } from "./sections/CategoryDetailSection";
import { DynamicTextSection } from "./sections/DynamicTextSection";
import { CtaSection } from "./sections/CtaSection";
import { NextStepsSection } from "./sections/NextStepsSection";
import { ConsultantInfoSection } from "./sections/ConsultantInfoSection";

interface Props {
  sections: ResultsPageSection[];
  scoreTiers: ScoreTier[];
  categories: Category[];
  assessment: Tables<"assessments">;
  orgColour?: string;
}

function buildMockData(
  sections: ResultsPageSection[],
  scoreTiers: ScoreTier[],
  categories: Category[],
  assessment: Tables<"assessments">,
  orgColour: string
): ResultsData {
  // Generate mock category scores with spread percentages
  const mockPercentages = [85, 72, 60, 90, 45, 78, 55, 68];
  const categoryScores: CategoryScore[] = categories.map((cat, i) => {
    const pct = mockPercentages[i % mockPercentages.length];
    const tier = scoreTiers.find(t => pct >= t.min_pct && pct <= t.max_pct) || null;
    return {
      category: cat,
      totalPoints: Math.round(pct * 0.3),
      maxPoints: 30,
      percentage: pct,
      tier,
    };
  });

  const overallPercentage = categories.length > 0
    ? Math.round(categoryScores.reduce((s, c) => s + c.percentage, 0) / categoryScores.length)
    : 75;

  const overallTier = scoreTiers.find(t => overallPercentage >= t.min_pct && overallPercentage <= t.max_pct) || scoreTiers[0] || null;

  return {
    lead: {
      id: "preview",
      assessment_id: assessment.id,
      org_id: "",
      email: "preview@example.com",
      first_name: "Jane",
      last_name: "Doe",
      company: "Example Corp",
      phone: null,
      status: "completed",
      source: "preview",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      score_id: null,
      ip_address: null,
      utm_json: null,
      custom_fields_json: null,
      abandon_email_sent: false,
    },
    organisation: null,
    assessment,
    scoreTiers,
    categories,
    categoryScores,
    overallPercentage,
    overallTier,
    sections,
    brandColour: orgColour,
    benchmarks: null,
  };
}

export function ResultsPagePreview({ sections, scoreTiers, categories, assessment, orgColour = "#1B3A5C" }: Props) {
  const mockData = useMemo(
    () => buildMockData(sections, scoreTiers, categories, assessment, orgColour),
    [sections, scoreTiers, categories, assessment, orgColour]
  );

  const visibleSections = sections.filter(s => s.is_visible);

  if (visibleSections.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
        <div>
          <p className="text-sm font-medium mb-1">No sections yet</p>
          <p className="text-xs">Add sections from the toolbar to see a live preview with sample data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Assessment Results</h1>
          <p className="text-slate-400 text-xs">Preview — showing sample data</p>
        </div>

        {visibleSections.map(section => {
          const key = section.id;
          switch (section.type) {
            case "overall_score": return <OverallScoreSection key={key} section={section} data={mockData} />;
            case "category_breakdown": return <CategoryBreakdownSection key={key} section={section} data={mockData} />;
            case "radar_chart": return <RadarChartSection key={key} section={section} data={mockData} />;
            case "category_detail": return <CategoryDetailSection key={key} section={section} data={mockData} />;
            case "dynamic_text": return <DynamicTextSection key={key} section={section} data={mockData} />;
            case "cta": return <CtaSection key={key} section={section} data={mockData} />;
            case "next_steps": return <NextStepsSection key={key} section={section} data={mockData} />;
            case "consultant_info": return <ConsultantInfoSection key={key} section={section} data={mockData} />;
            default: return null;
          }
        })}
      </div>
    </div>
  );
}
