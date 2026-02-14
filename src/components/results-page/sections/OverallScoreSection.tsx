import { useEffect, useState, useRef } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

export function OverallScoreSection({ section, data }: Props) {
  const { overallPercentage, overallTier, brandColour } = data;
  const c = section.content_json;
  const tierColour = overallTier?.colour || brandColour;
  const { value: animatedScore, ref: scoreRef } = useAnimatedCounter(overallPercentage);

  const chartData = [
    { name: "score", value: animatedScore, fill: tierColour },
  ];

  return (
    <section ref={scoreRef} className="relative overflow-hidden rounded-sm border border-border bg-card shadow-sm">
      {/* Subtle accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: tierColour }} />

      <div className="p-6 sm:p-8 pt-8 sm:pt-10 text-center">
        {c.heading && (
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-6 sm:mb-8">{c.heading}</h2>
        )}

        <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="72%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              data={chartData}
              barSize={18}
            >
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={10}
                maxBarSize={18}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight mono" style={{ color: tierColour }}>
              {animatedScore}
              <span className="text-xl sm:text-2xl font-medium">%</span>
            </span>
            {overallTier && (
              <span
                className="mt-2 inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-sm"
                style={{ backgroundColor: tierColour + "14", color: tierColour }}
              >
                {overallTier.label}
              </span>
            )}
          </div>
        </div>

        {c.show_tier_description && overallTier?.description && (
          <p className="mt-5 sm:mt-6 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            {overallTier.description}
          </p>
        )}

        {data.benchmarks?.percentileRank != null && (
          <p className="mt-4 text-sm text-muted-foreground">
            You scored higher than <strong className="text-foreground">{data.benchmarks.percentileRank}%</strong> of respondents
          </p>
        )}

        {data.benchmarks?.overall && (
          <p className="mt-1 text-xs text-muted-foreground">
            Industry average: {data.benchmarks.overall.avg_score}% · Based on {data.benchmarks.overall.sample_size} responses
          </p>
        )}
      </div>
    </section>
  );
}
