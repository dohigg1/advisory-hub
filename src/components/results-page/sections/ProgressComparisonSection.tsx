import { useMemo } from "react";
import type { ResultsPageSection } from "@/types/results-page";
import type { ResultsData, CategoryScore } from "@/pages/PublicResults";
import type { AssessmentIteration, IterationHistory } from "@/types/iteration";
import { ArrowUp, ArrowDown, Minus, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function ProgressComparisonSection({ section, data }: Props) {
  const content = section.content_json;
  const history = data.iterationHistory;
  const brandColour = data.brandColour;

  if (!history || !history.isRetake || history.iterations.length < 2) {
    return null; // Only show for iteration 2+
  }

  const current = history.currentIteration;
  const previous = history.previousIteration;
  if (!current || !previous) return null;

  const overallDelta = (current.overall_percentage ?? 0) - (previous.overall_percentage ?? 0);

  // Category comparison data
  const categoryComparison = data.categories.map(cat => {
    const currCat = current.category_scores_json?.[cat.id];
    const prevCat = previous.category_scores_json?.[cat.id];
    const currPct = currCat?.percentage ?? 0;
    const prevPct = prevCat?.percentage ?? 0;
    return {
      name: cat.name,
      colour: cat.colour || brandColour,
      previous: prevPct,
      current: currPct,
      delta: currPct - prevPct,
    };
  });

  // Trend line data for all iterations
  const trendData = history.iterations.map(it => ({
    name: `#${it.iteration_number}`,
    score: it.overall_percentage ?? 0,
    date: new Date(it.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  }));

  // Radar data
  const radarData = data.categories.map(cat => ({
    category: cat.name.length > 12 ? cat.name.slice(0, 12) + "…" : cat.name,
    Previous: previous.category_scores_json?.[cat.id]?.percentage ?? 0,
    Current: current.category_scores_json?.[cat.id]?.percentage ?? 0,
  }));

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border/40">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4" style={{ color: brandColour }} />
          <h3 className="text-base font-bold tracking-tight">{content.heading || "Your Progress"}</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Iteration {current.iteration_number} — Comparing to your previous attempt
        </p>
      </div>

      {/* Overall delta hero */}
      <div className="px-6 py-5 flex items-center gap-6 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: brandColour }}
          >
            {current.overall_percentage ?? 0}%
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Overall Score</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {overallDelta > 0 && <ArrowUp className="h-3.5 w-3.5 text-success" />}
              {overallDelta < 0 && <ArrowDown className="h-3.5 w-3.5 text-destructive" />}
              {overallDelta === 0 && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className={`text-sm font-semibold ${overallDelta > 0 ? "text-success" : overallDelta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {overallDelta > 0 ? "+" : ""}{overallDelta} points
              </span>
              <span className="text-xs text-muted-foreground">
                (from {previous.overall_percentage ?? 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Radar comparison */}
        {content.show_radar !== false && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Side-by-Side Profile</h4>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="Previous" dataKey="Previous" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.15} strokeDasharray="4 4" />
                  <Radar name="Current" dataKey="Current" stroke={brandColour} fill={brandColour} fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Category comparison table */}
        {content.show_category_table !== false && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Category-by-Category</h4>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5">Category</th>
                    <th className="text-right px-4 py-2.5">Previous</th>
                    <th className="text-right px-4 py-2.5">Current</th>
                    <th className="text-right px-4 py-2.5">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryComparison.map((cat, i) => (
                    <tr key={cat.name} className={i % 2 === 0 ? "" : "bg-muted/10"}>
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.colour }} />
                          {cat.name}
                        </div>
                      </td>
                      <td className="text-right px-4 py-2.5 text-muted-foreground font-mono text-xs">{cat.previous}%</td>
                      <td className="text-right px-4 py-2.5 font-semibold font-mono text-xs">{cat.current}%</td>
                      <td className="text-right px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 font-semibold text-xs ${cat.delta > 0 ? "text-success" : cat.delta < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {cat.delta > 0 && <ArrowUp className="h-3 w-3" />}
                          {cat.delta < 0 && <ArrowDown className="h-3 w-3" />}
                          {cat.delta === 0 && <Minus className="h-3 w-3" />}
                          {cat.delta > 0 ? "+" : ""}{cat.delta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trend line */}
        {content.show_trend_line !== false && history.iterations.length >= 2 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Score Over Time</h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={brandColour}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: brandColour, stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
