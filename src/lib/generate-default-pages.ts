import type { Assessment } from "@/types/assessment";
import type { LandingPageSection, SectionType } from "@/types/landing-page";
import type { ResultsPageSection, ResultsSectionType } from "@/types/results-page";

/**
 * Generate a set of default landing page sections based on the assessment.
 */
export function generateDefaultLandingSections(assessment: Assessment): LandingPageSection[] {
  const title = assessment.title;
  const desc = assessment.description || "Find out where you stand and get actionable insights to improve.";

  const sections: { type: SectionType; content: Record<string, any> }[] = [
    {
      type: "hero",
      content: {
        heading: title,
        subheading: "Take our comprehensive assessment",
        description: desc,
        cta_text: "Start Assessment",
        bg_colour: "#1B3A5C",
      },
    },
    {
      type: "value_proposition",
      content: {
        heading: "What You'll Learn",
        cards: [
          { icon: "bar-chart-3", title: "Benchmarking", description: "See how you compare to industry standards" },
          { icon: "target", title: "Key Gaps", description: "Identify your most critical improvement areas" },
          { icon: "lightbulb", title: "Actionable Insights", description: "Get specific recommendations to improve" },
        ],
      },
    },
    {
      type: "how_it_works",
      content: {
        heading: "How It Works",
        steps: [
          { title: "Answer Questions", description: "Complete a short series of targeted questions about your current state." },
          { title: "Get Your Score", description: "Receive an instant, detailed scorecard across key categories." },
          { title: "Review Insights", description: "Explore personalised recommendations and next steps." },
        ],
      },
    },
    {
      type: "faq",
      content: {
        heading: "Frequently Asked Questions",
        items: [
          { question: "How long does the assessment take?", answer: "Most respondents complete it in 5–10 minutes." },
          { question: "Is my data kept confidential?", answer: "Yes, all responses are stored securely and only shared with the assessment creator." },
          { question: "Will I receive a report?", answer: "Yes, you'll receive a detailed scorecard immediately upon completion." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        heading: "Ready to Get Started?",
        subheading: `Take the ${title} now and discover your score.`,
        cta_text: "Start Assessment",
      },
    },
  ];

  return sections.map((s, i) => ({
    id: crypto.randomUUID(),
    type: s.type,
    content_json: s.content,
    sort_order: i,
    is_visible: true,
  }));
}

/**
 * Generate a set of default results page sections based on the assessment.
 */
export function generateDefaultResultsSections(assessment: Assessment): ResultsPageSection[] {
  const title = assessment.title;

  const sections: { type: ResultsSectionType; content: Record<string, any> }[] = [
    {
      type: "overall_score",
      content: {
        heading: `Your ${title} Score`,
        show_tier_description: true,
      },
    },
    {
      type: "category_breakdown",
      content: {
        heading: "Score Breakdown by Category",
      },
    },
    {
      type: "radar_chart",
      content: {
        heading: "Your Profile",
        fill_opacity: 0.3,
      },
    },
    {
      type: "dynamic_text",
      content: {
        heading: "What This Means",
        is_dynamic: true,
        tier_content: {},
      },
    },
    {
      type: "next_steps",
      content: {
        heading: "Recommended Next Steps",
        is_dynamic: true,
        tier_content: {},
        steps: [
          { title: "Review your detailed results", description: "Take time to understand your strengths and areas for improvement." },
          { title: "Schedule a consultation", description: "Discuss your results with an expert who can guide your next steps." },
          { title: "Create an action plan", description: "Turn insights into concrete actions with deadlines and ownership." },
        ],
      },
    },
    {
      type: "cta",
      content: {
        heading: "What's Next?",
        description: "Based on your results, we recommend taking the following action.",
        button_text: "Book a Consultation",
        button_url: "",
        is_dynamic: true,
        tier_content: {},
      },
    },
  ];

  return sections.map((s, i) => ({
    id: crypto.randomUUID(),
    type: s.type,
    content_json: s.content,
    sort_order: i,
    is_visible: true,
  }));
}
