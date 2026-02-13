import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function OverallScoreSection({ section, data }: Props) {
  const { overallPercentage, overallTier, brandColour } = data;
  const c = section.content_json;
  const tierColour = overallTier?.colour || brandColour;

  const chartData = [
    { name: "score", value: overallPercentage, fill: tierColour },
  ];

  return (
    <section className="relative overflow-hidden rounded-sm border border-border bg-card shadow-sm">
      {/* Subtle accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: tierColour }} />

      <div className="p-8 pt-10 text-center">
        {c.heading && (
          <h2 className="text-lg font-semibold text-foreground tracking-tight mb-8">{c.heading}</h2>
        )}

        <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
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
            <span className="text-5xl font-bold tracking-tight" style={{ color: tierColour }}>
              {overallPercentage}
              <span className="text-2xl font-medium">%</span>
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
          <p className="mt-6 text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
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
