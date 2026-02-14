import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function RadarChartSection({ section, data }: Props) {
  const c = section.content_json;
  const benchmarks = data.benchmarks?.categories || {};
  const hasBenchmarks = Object.keys(benchmarks).length > 0;

  const chartData = data.categoryScores.map(cs => ({
    category: cs.category.name,
    score: cs.percentage,
    benchmark: benchmarks[cs.category.id]?.avg_score ?? null,
    fullMark: 100,
  }));

  if (chartData.length < 3) {
    return (
      <section className="rounded-xl border border-border bg-card shadow-sm p-8 text-center">
        {c.heading && <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">{c.heading}</h2>}
        <p className="text-muted-foreground text-sm">At least 3 categories are needed for the radar chart.</p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="p-6 md:p-8">
        {c.heading && <h2 className="text-lg font-semibold text-foreground tracking-tight mb-6 text-center">{c.heading}</h2>}

        <div className="mx-auto" style={{ maxWidth: 480, height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              {hasBenchmarks && (
                <Radar
                  name="Industry Avg"
                  dataKey="benchmark"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.05}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              )}
              <Radar
                name="Your Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={c.fill_opacity ?? 0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {hasBenchmarks && (
          <div className="flex justify-center gap-8 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-5 h-0.5 rounded-sm bg-primary" />
              Your Score
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-0.5 rounded-sm border-dashed border-t-2 border-muted-foreground" />
              Industry Avg
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}
