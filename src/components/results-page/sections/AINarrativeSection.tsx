import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

// Mock narrative data for display until AI generation is wired up
const MOCK_NARRATIVE = {
  executive_summary:
    "Based on your assessment results, your organisation demonstrates a solid foundation across several key areas, with particularly strong performance in strategic planning and client engagement. There are meaningful opportunities to strengthen operational efficiency and technology adoption, which would elevate your overall positioning and competitive advantage.",
  strengths: [
    {
      title: "Strategic Planning",
      detail:
        "Your approach to long-term planning is well-structured, with clear goals and measurable milestones that align with industry best practices.",
    },
    {
      title: "Client Engagement",
      detail:
        "Strong client communication processes and feedback loops indicate a mature, client-centric operating model.",
    },
    {
      title: "Team Development",
      detail:
        "Investment in professional development and knowledge sharing demonstrates a commitment to building lasting organisational capability.",
    },
  ],
  improvements: [
    {
      title: "Operational Efficiency",
      detail:
        "Streamlining internal workflows and reducing manual handoffs could significantly improve throughput and reduce error rates.",
    },
    {
      title: "Technology Adoption",
      detail:
        "Accelerating the adoption of automation tools and integrated platforms would enhance data consistency and reporting speed.",
    },
  ],
  recommendations: [
    {
      title: "Implement workflow automation for recurring processes",
      priority: "High" as const,
    },
    {
      title: "Establish a quarterly technology review cadence",
      priority: "High" as const,
    },
    {
      title: "Develop cross-functional training programmes",
      priority: "Medium" as const,
    },
    {
      title: "Create a client feedback dashboard for real-time insights",
      priority: "Medium" as const,
    },
    {
      title: "Explore AI-assisted reporting to reduce manual effort",
      priority: "Low" as const,
    },
  ],
};

type Priority = "High" | "Medium" | "Low";

const PRIORITY_COLOURS: Record<Priority, { bg: string; text: string }> = {
  High: { bg: "bg-red-100", text: "text-red-700" },
  Medium: { bg: "bg-amber-100", text: "text-amber-700" },
  Low: { bg: "bg-blue-100", text: "text-blue-700" },
};

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-muted ${className ?? ""}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <ShimmerBlock className="h-4 w-3/4" />
      <ShimmerBlock className="h-4 w-full" />
      <ShimmerBlock className="h-4 w-5/6" />
      <div className="pt-2 space-y-4">
        <ShimmerBlock className="h-20 w-full" />
        <ShimmerBlock className="h-20 w-full" />
      </div>
      <div className="pt-2 space-y-4">
        <ShimmerBlock className="h-20 w-full" />
        <ShimmerBlock className="h-20 w-full" />
      </div>
      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ShimmerBlock className="h-14 w-full" />
        <ShimmerBlock className="h-14 w-full" />
        <ShimmerBlock className="h-14 w-full" />
      </div>
    </div>
  );
}

export function AINarrativeSection({ section, data }: Props) {
  const c = section.content_json;
  const brandColour = data.brandColour || "#6366f1";

  // In the future this will come from an API call; for now use mock data
  const narrative = MOCK_NARRATIVE;
  const isLoading = false;

  return (
    <section
      className="rounded-sm border border-border bg-card shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: brandColour }}
    >
      <div className="p-8">
        {/* Heading */}
        {c.heading && (
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-6">
            {c.heading}
          </h2>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-8">
            {/* Executive Summary */}
            {narrative.executive_summary && (
              <p className="text-muted-foreground leading-relaxed">
                {narrative.executive_summary}
              </p>
            )}

            {/* Strengths */}
            {narrative.strengths.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                  Key Strengths
                </h3>
                <div className="space-y-3">
                  {narrative.strengths.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-sm border border-border bg-background p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: "#16a34a" }}
                    >
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {narrative.improvements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {narrative.improvements.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-sm border border-border bg-background p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: "#d97706" }}
                    >
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {c.show_recommendations !== false &&
              narrative.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                    Recommendations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {narrative.recommendations.map((rec, i) => {
                      const colours = PRIORITY_COLOURS[rec.priority];
                      return (
                        <div
                          key={i}
                          className="rounded-sm border border-border bg-background p-4 flex items-start justify-between gap-3"
                        >
                          <span className="text-sm text-foreground leading-snug">
                            {rec.title}
                          </span>
                          <span
                            className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${colours.bg} ${colours.text}`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Powered by AI badge */}
        <div className="flex justify-end mt-6">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 1 4 4v1a1 1 0 0 0 1 1h1a4 4 0 0 1 0 8h-1a1 1 0 0 0-1 1v1a4 4 0 0 1-8 0v-1a1 1 0 0 0-1-1H6a4 4 0 0 1 0-8h1a1 1 0 0 0 1-1V6a4 4 0 0 1 4-4z" />
            </svg>
            Powered by AI
          </span>
        </div>
      </div>
    </section>
  );
}
