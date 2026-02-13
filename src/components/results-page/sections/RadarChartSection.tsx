import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
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
      <section className="bg-white rounded-xl shadow-sm border p-8 text-center">
        {c.heading && <h2 className="text-xl font-semibold text-slate-900 mb-4">{c.heading}</h2>}
        <p className="text-slate-500 text-sm">At least 3 categories are needed for the radar chart.</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow-sm border p-8">
      {c.heading && <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">{c.heading}</h2>}

      <div className="mx-auto" style={{ maxWidth: 500, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: "#475569" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            {hasBenchmarks && (
              <Radar
                name="Industry Avg"
                dataKey="benchmark"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}
            <Radar
              name="Your Score"
              dataKey="score"
              stroke={data.brandColour}
              fill={data.brandColour}
              fillOpacity={c.fill_opacity ?? 0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {hasBenchmarks && (
        <div className="flex justify-center gap-6 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded" style={{ backgroundColor: data.brandColour }} /> Your Score
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 rounded border-dashed border-t-2 border-slate-400" /> Industry Avg
          </span>
        </div>
      )}
    </section>
  );
}
