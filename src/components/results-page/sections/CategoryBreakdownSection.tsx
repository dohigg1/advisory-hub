import { motion } from "framer-motion";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function CategoryBreakdownSection({ section, data }: Props) {
  const c = section.content_json;
  const benchmarks = data.benchmarks?.categories || {};

  // Sort by score ascending (weakest first) for natural reading flow
  const chartData = [...data.categoryScores]
    .sort((a, b) => a.percentage - b.percentage)
    .map(cs => ({
      name: cs.category.name,
      score: cs.percentage,
      fill: cs.tier?.colour || data.brandColour,
      benchmark: benchmarks[cs.category.id]?.avg_score ?? null,
    }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="p-6 md:p-8">
        {c.heading && (
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-8">{c.heading}</h2>
        )}

        <div className="space-y-5">
          {chartData.map((entry, i) => (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-medium text-foreground truncate max-w-[200px]" title={entry.name}>
                  {entry.name.length > 20 ? entry.name.slice(0, 20) + "..." : entry.name}
                </span>
                <span className="text-sm font-bold tabular-nums mono" style={{ color: entry.fill }}>
                  {entry.score}%
                </span>
              </div>
              <div className="relative h-3 rounded-md overflow-hidden bg-muted">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{ backgroundColor: entry.fill }}
                  initial={{ width: 0 }}
                  animate={{ width: `${entry.score}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: "easeOut" }}
                />
                {entry.benchmark !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                    style={{ left: `${entry.benchmark}%` }}
                    title={`Industry avg: ${entry.benchmark}%`}
                  />
                )}
              </div>
            </motion.div>
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
                <span className="w-px h-4 bg-foreground/30" />
                Industry Average
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
