import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function CategoryDetailSection({ section, data }: Props) {
  const c = section.content_json;
  const cs = data.categoryScores.find(cs => cs.category.id === c.category_id);

  if (!cs) {
    return (
      <section className="rounded-sm border border-border bg-card shadow-sm p-8">
        <p className="text-muted-foreground text-sm">Category not found. Please configure this section.</p>
      </section>
    );
  }

  const tierColour = cs.tier?.colour || data.brandColour;
  const chartData = [{ name: "score", value: cs.percentage, fill: tierColour }];
  const benchmark = data.benchmarks?.categories?.[cs.category.id];

  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="p-8">
        <div className="flex items-start gap-8">
          {c.show_score_chart && (
            <div className="flex-shrink-0 relative" style={{ width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={chartData} barSize={10}>
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold" style={{ color: tierColour }}>{cs.percentage}%</span>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground tracking-tight mb-1" style={{ color: cs.category.colour || undefined }}>
              {cs.category.name}
            </h3>
            {cs.tier && (
              <span
                className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm mb-3"
                style={{ backgroundColor: tierColour + "14", color: tierColour }}
              >
                {cs.tier.label}
              </span>
            )}
            {c.content && <p className="text-muted-foreground text-sm leading-relaxed">{c.content}</p>}

            {benchmark && (
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <span>Industry avg: <strong className="text-foreground">{benchmark.avg_score}%</strong></span>
                <span className="text-border">|</span>
                <span>Your score: <strong className="text-foreground">{cs.percentage}%</strong></span>
                {cs.percentage > benchmark.avg_score && (
                  <span className="text-success font-semibold">+{cs.percentage - benchmark.avg_score}% above</span>
                )}
                {cs.percentage < benchmark.avg_score && (
                  <span className="text-warning font-semibold">{benchmark.avg_score - cs.percentage}% below</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
