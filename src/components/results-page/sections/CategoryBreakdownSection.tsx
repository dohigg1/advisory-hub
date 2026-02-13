import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function CategoryBreakdownSection({ section, data }: Props) {
  const c = section.content_json;
  const benchmarks = data.benchmarks?.categories || {};

  const chartData = data.categoryScores.map(cs => ({
    name: cs.category.name,
    score: cs.percentage,
    fill: cs.tier?.colour || data.brandColour,
    benchmark: benchmarks[cs.category.id]?.avg_score ?? null,
  }));

  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="p-8">
        {c.heading && <h2 className="text-lg font-semibold text-foreground tracking-tight mb-8">{c.heading}</h2>}

        <div className="space-y-5">
          {chartData.map((entry, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{entry.name}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: entry.fill }}>{entry.score}%</span>
              </div>
              <div className="relative h-3 rounded-sm overflow-hidden" style={{ backgroundColor: "hsl(var(--muted))" }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-sm transition-all duration-500"
                  style={{
                    width: `${entry.score}%`,
                    backgroundColor: entry.fill,
                  }}
                />
                {entry.benchmark !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
                    style={{ left: `${entry.benchmark}%` }}
                    title={`Industry avg: ${entry.benchmark}%`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Benchmark legend */}
        {Object.keys(benchmarks).length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-6 h-2 rounded-sm" style={{ backgroundColor: data.brandColour }} />
                Your Score
              </span>
              <span className="flex items-center gap-2">
                <span className="w-px h-4 bg-foreground/40" />
                Industry Average
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
