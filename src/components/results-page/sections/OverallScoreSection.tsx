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
    <section className="bg-white rounded-xl shadow-sm border p-8 text-center">
      {c.heading && <h2 className="text-xl font-semibold text-slate-900 mb-6">{c.heading}</h2>}

      <div className="relative mx-auto" style={{ width: 200, height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={chartData}
            barSize={16}
          >
            <RadialBar background dataKey="value" cornerRadius={8} maxBarSize={16} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: tierColour }}>{overallPercentage}%</span>
          {overallTier && (
            <span className="text-sm font-medium mt-1" style={{ color: tierColour }}>{overallTier.label}</span>
          )}
        </div>
      </div>

      {c.show_tier_description && overallTier?.description && (
        <p className="mt-4 text-slate-600 text-sm max-w-md mx-auto">{overallTier.description}</p>
      )}
    </section>
  );
}
