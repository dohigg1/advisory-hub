export type ResultsSectionType =
  | "overall_score"
  | "category_breakdown"
  | "radar_chart"
  | "category_detail"
  | "dynamic_text"
  | "cta"
  | "next_steps"
  | "consultant_info"
  | "progress_comparison"
  | "ai_narrative";

export interface ResultsPageSection {
  id: string;
  type: ResultsSectionType;
  content_json: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
}

export const RESULTS_SECTION_LABELS: Record<ResultsSectionType, string> = {
  overall_score: "Overall Score",
  category_breakdown: "Category Breakdown",
  radar_chart: "Radar Chart",
  category_detail: "Category Detail",
  dynamic_text: "Dynamic Text Block",
  cta: "CTA Section",
  next_steps: "Next Steps",
  consultant_info: "Consultant Info",
  progress_comparison: "Progress Comparison",
  ai_narrative: "AI Narrative Summary",
};

export const RESULTS_SECTION_DESCRIPTIONS: Record<ResultsSectionType, string> = {
  overall_score: "Donut chart with total score, tier label, and description",
  category_breakdown: "Horizontal bar chart of all category scores",
  radar_chart: "Spider chart showing category score profile",
  category_detail: "Individual category score with description",
  dynamic_text: "Rich text that changes based on score tier",
  cta: "Call to action, optionally dynamic by tier",
  next_steps: "Recommended actions list, optionally dynamic by tier",
  consultant_info: "Consultant/firm contact card",
  progress_comparison: "Before/after comparison for retakes (iteration 2+)",
  ai_narrative: "AI-generated personalised assessment summary with strengths, improvements, and recommendations",
};

export function createDefaultResultsSection(type: ResultsSectionType, sortOrder: number): ResultsPageSection {
  const id = crypto.randomUUID();
  const defaults: Record<ResultsSectionType, Record<string, any>> = {
    overall_score: {
      heading: "Your Overall Score",
      show_tier_description: true,
    },
    category_breakdown: {
      heading: "Score Breakdown by Category",
    },
    radar_chart: {
      heading: "Your Profile",
      fill_opacity: 0.3,
    },
    category_detail: {
      category_id: null,
      show_score_chart: true,
      content: "Review your performance in this area and consider the recommendations below.",
    },
    dynamic_text: {
      heading: "What This Means",
      is_dynamic: true,
      tier_content: {},
    },
    cta: {
      heading: "What's Next?",
      description: "Based on your results, we recommend taking the following action.",
      button_text: "Book a Consultation",
      button_url: "",
      is_dynamic: true,
      tier_content: {},
    },
    next_steps: {
      heading: "Recommended Next Steps",
      is_dynamic: true,
      tier_content: {},
      steps: [
        { title: "Review your detailed results", description: "Take time to understand your strengths and areas for improvement." },
        { title: "Schedule a consultation", description: "Discuss your results with an expert who can guide your next steps." },
        { title: "Create an action plan", description: "Turn insights into concrete actions with deadlines and ownership." },
      ],
    },
    consultant_info: {
      name: "",
      title: "",
      photo_url: "",
      email: "",
      phone: "",
      linkedin_url: "",
      bio: "",
    },
    progress_comparison: {
      heading: "Your Progress",
      show_radar: true,
      show_category_table: true,
      show_trend_line: true,
    },
    ai_narrative: {
      heading: "Your Personalised Assessment Summary",
      tone: "professional",
      custom_context: "",
      show_recommendations: true,
      show_benchmark_context: true,
    },
  };

  return { id, type, content_json: defaults[type], sort_order: sortOrder, is_visible: true };
}
