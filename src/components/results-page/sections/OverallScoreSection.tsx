import { useState, useEffect } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";
import { motion } from "framer-motion";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{count}</>;
}

export function OverallScoreSection({ section, data }: Props) {
  const { overallPercentage, overallTier, brandColour } = data;
  const c = section.content_json;
  const tierColour = overallTier?.colour || brandColour;

  const chartData = [
    { name: "score", value: overallPercentage, fill: tierColour },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Subtle accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: tierColour }} />

      <div className="p-8 pt-10 text-center">
        {c.heading && (
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-8">{c.heading}</h2>
        )}

        <div className="relative mx-auto" style={{ width: 240, height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              data={chartData}
              barSize={20}
            >
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={10}
                maxBarSize={20}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-tight mono" style={{ color: tierColour }}>
              <AnimatedCounter target={overallPercentage} />
              <span className="text-2xl font-medium">%</span>
            </span>
            {overallTier && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.3 }}
                className="mt-2 inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-md"
                style={{ backgroundColor: tierColour + "14", color: tierColour }}
              >
                {overallTier.label}
              </motion.span>
            )}
          </div>
        </div>

        {c.show_tier_description && overallTier?.description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed"
          >
            {overallTier.description}
          </motion.p>
        )}

        {data.benchmarks?.percentileRank != null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            Better than <strong className="text-foreground font-semibold">{data.benchmarks.percentileRank}%</strong> of similar firms
          </motion.p>
        )}

        {data.benchmarks?.overall && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-1 text-xs text-muted-foreground"
          >
            Industry average: <span className="mono font-medium">{data.benchmarks.overall.avg_score}%</span> · Based on {data.benchmarks.overall.sample_size} responses
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}
