export interface SampleAnswerOption {
  text: string;
  score: number;
  sort_order: number;
}

export interface SampleQuestion {
  text: string;
  type: "multiple_choice";
  sort_order: number;
  answer_options: SampleAnswerOption[];
}

export interface SampleCategory {
  name: string;
  description: string;
  weight: number;
  questions: SampleQuestion[];
}

export interface SampleScoreTier {
  label: string;
  min_score: number;
  max_score: number;
  colour: string;
  description: string;
}

export interface SampleAssessmentData {
  title: string;
  description: string;
  type: string;
  categories: SampleCategory[];
  scoreTiers: SampleScoreTier[];
}

export function getSampleAssessmentData(): SampleAssessmentData {
  return {
    title: "Business Health Check",
    description:
      "A comprehensive assessment to evaluate the overall health and readiness of your business across strategy, operations, and people. Use the results to identify strengths and areas for improvement.",
    type: "scored",
    categories: [
      {
        name: "Strategic Alignment",
        description:
          "Evaluate how well the business vision, goals, and strategic initiatives are defined and communicated across the organisation.",
        weight: 34,
        questions: [
          {
            text: "How clearly defined is your organisation's long-term vision and strategic direction?",
            type: "multiple_choice",
            sort_order: 1,
            answer_options: [
              { text: "No formal vision or strategy exists", score: 1, sort_order: 1 },
              { text: "A vision exists but is not widely communicated", score: 2, sort_order: 2 },
              { text: "The vision is documented and shared with leadership", score: 3, sort_order: 3 },
              { text: "The vision is clearly articulated and understood at every level", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How effectively are strategic goals translated into actionable plans with measurable outcomes?",
            type: "multiple_choice",
            sort_order: 2,
            answer_options: [
              { text: "Goals are vague and rarely linked to specific actions", score: 1, sort_order: 1 },
              { text: "Some goals have action plans but tracking is inconsistent", score: 2, sort_order: 2 },
              { text: "Most goals have clear plans and are reviewed quarterly", score: 3, sort_order: 3 },
              { text: "All goals are cascaded into OKRs with real-time tracking", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How well does your organisation monitor and adapt to changes in the competitive landscape?",
            type: "multiple_choice",
            sort_order: 3,
            answer_options: [
              { text: "We rarely analyse competitors or market trends", score: 1, sort_order: 1 },
              { text: "Occasional reviews happen but are not systematic", score: 2, sort_order: 2 },
              { text: "Regular competitive analysis informs strategic decisions", score: 3, sort_order: 3 },
              { text: "We proactively anticipate market shifts and pivot quickly", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "To what extent are key stakeholders aligned on strategic priorities?",
            type: "multiple_choice",
            sort_order: 4,
            answer_options: [
              { text: "Leadership disagrees on priorities and direction", score: 1, sort_order: 1 },
              { text: "Partial alignment exists but silos cause conflicts", score: 2, sort_order: 2 },
              { text: "The leadership team is mostly aligned with occasional gaps", score: 3, sort_order: 3 },
              { text: "Full alignment across leadership with a unified execution roadmap", score: 4, sort_order: 4 },
            ],
          },
        ],
      },
      {
        name: "Operational Efficiency",
        description:
          "Assess the effectiveness of internal processes, technology adoption, and resource management that drive day-to-day performance.",
        weight: 33,
        questions: [
          {
            text: "How standardised and documented are your core business processes?",
            type: "multiple_choice",
            sort_order: 1,
            answer_options: [
              { text: "Processes are ad hoc and largely undocumented", score: 1, sort_order: 1 },
              { text: "Some key processes are documented but not consistently followed", score: 2, sort_order: 2 },
              { text: "Most processes are documented with assigned process owners", score: 3, sort_order: 3 },
              { text: "All processes are documented, optimised, and continuously improved", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How effectively does your organisation leverage technology to automate routine tasks?",
            type: "multiple_choice",
            sort_order: 2,
            answer_options: [
              { text: "Most tasks are manual with little use of technology", score: 1, sort_order: 1 },
              { text: "Some automation exists but is limited to specific departments", score: 2, sort_order: 2 },
              { text: "Automation is widespread with a defined technology roadmap", score: 3, sort_order: 3 },
              { text: "Fully integrated automation across all key workflows with continuous optimisation", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How well does your organisation manage project delivery timelines and budgets?",
            type: "multiple_choice",
            sort_order: 3,
            answer_options: [
              { text: "Projects frequently overrun on time and budget", score: 1, sort_order: 1 },
              { text: "Some projects are delivered on time but budget tracking is weak", score: 2, sort_order: 2 },
              { text: "Most projects meet deadlines with reasonable budget adherence", score: 3, sort_order: 3 },
              { text: "Consistent on-time, on-budget delivery with lessons-learned reviews", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How effectively does your organisation use data and metrics to drive operational decisions?",
            type: "multiple_choice",
            sort_order: 4,
            answer_options: [
              { text: "Decisions are largely intuition-based with little data", score: 1, sort_order: 1 },
              { text: "Some metrics are tracked but not used consistently in decisions", score: 2, sort_order: 2 },
              { text: "Key KPIs are defined and reviewed regularly by leadership", score: 3, sort_order: 3 },
              { text: "Data-driven culture with real-time dashboards informing all levels", score: 4, sort_order: 4 },
            ],
          },
        ],
      },
      {
        name: "Team & Culture",
        description:
          "Measure the strength of organisational culture, employee engagement, leadership development, and talent management practices.",
        weight: 33,
        questions: [
          {
            text: "How would you rate employee engagement and morale across the organisation?",
            type: "multiple_choice",
            sort_order: 1,
            answer_options: [
              { text: "Low morale with high turnover and frequent disengagement", score: 1, sort_order: 1 },
              { text: "Mixed engagement with pockets of dissatisfaction", score: 2, sort_order: 2 },
              { text: "Generally positive engagement with regular pulse surveys", score: 3, sort_order: 3 },
              { text: "High engagement with strong eNPS scores and low attrition", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How effectively does your organisation invest in professional development and upskilling?",
            type: "multiple_choice",
            sort_order: 2,
            answer_options: [
              { text: "No formal development programmes or learning budgets", score: 1, sort_order: 1 },
              { text: "Ad hoc training is available but not systematically planned", score: 2, sort_order: 2 },
              { text: "Structured development plans exist for most roles", score: 3, sort_order: 3 },
              { text: "Comprehensive learning culture with personalised development pathways", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How well does leadership model and reinforce the desired organisational culture?",
            type: "multiple_choice",
            sort_order: 3,
            answer_options: [
              { text: "Leadership behaviour often contradicts stated values", score: 1, sort_order: 1 },
              { text: "Some leaders model values but it is inconsistent", score: 2, sort_order: 2 },
              { text: "Most leaders actively reinforce values through their actions", score: 3, sort_order: 3 },
              { text: "Leadership consistently exemplifies values and holds others accountable", score: 4, sort_order: 4 },
            ],
          },
          {
            text: "How effective are your processes for attracting, hiring, and retaining top talent?",
            type: "multiple_choice",
            sort_order: 4,
            answer_options: [
              { text: "Talent acquisition is reactive with no employer brand strategy", score: 1, sort_order: 1 },
              { text: "Basic recruitment processes exist but retention is a challenge", score: 2, sort_order: 2 },
              { text: "Proactive recruitment with a defined employer value proposition", score: 3, sort_order: 3 },
              { text: "Best-in-class talent strategy with strong employer brand and succession planning", score: 4, sort_order: 4 },
            ],
          },
        ],
      },
    ],
    scoreTiers: [
      {
        label: "Needs Attention",
        min_score: 0,
        max_score: 40,
        colour: "#ef4444",
        description:
          "Your business has significant gaps in key areas. Prioritise addressing foundational issues in strategy, operations, or culture to build a stronger base for growth.",
      },
      {
        label: "Developing",
        min_score: 41,
        max_score: 70,
        colour: "#f59e0b",
        description:
          "Your business shows progress but has room for improvement. Focus on strengthening processes, alignment, and team engagement to unlock the next level of performance.",
      },
      {
        label: "Leading",
        min_score: 71,
        max_score: 100,
        colour: "#22c55e",
        description:
          "Your business demonstrates strong fundamentals across strategy, operations, and culture. Continue refining your approach and explore advanced practices to maintain your competitive edge.",
      },
    ],
  };
}
