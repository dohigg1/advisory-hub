import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList, ReferenceLine } from "recharts";
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
    <section className="bg-white rounded-xl shadow-sm border p-8">
      {c.heading && <h2 className="text-xl font-semibold text-slate-900 mb-6">{c.heading}</h2>}

      <div style={{ height: Math.max(chartData.length * 48, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 13, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList dataKey="score" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 13, fontWeight: 600, fill: "#334155" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Benchmark legend */}
      {Object.keys(benchmarks).length > 0 && (
        <div className="mt-4 space-y-2">
          {chartData.filter(d => d.benchmark !== null).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-500">
              <span>{d.name}</span>
              <span>Your score: <strong className="text-slate-700">{d.score}%</strong> · Industry avg: <strong className="text-slate-700">{d.benchmark}%</strong></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
