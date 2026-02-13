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
      <section className="bg-white rounded-xl shadow-sm border p-8">
        <p className="text-slate-500 text-sm">Category not found. Please configure this section.</p>
      </section>
    );
  }

  const tierColour = cs.tier?.colour || data.brandColour;
  const chartData = [{ name: "score", value: cs.percentage, fill: tierColour }];

  return (
    <section className="bg-white rounded-xl shadow-sm border p-8">
      <div className="flex items-start gap-8">
        {c.show_score_chart && (
          <div className="flex-shrink-0 relative" style={{ width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270} data={chartData} barSize={10}>
                <RadialBar background dataKey="value" cornerRadius={6} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold" style={{ color: tierColour }}>{cs.percentage}%</span>
            </div>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1" style={{ color: cs.category.colour || undefined }}>
            {cs.category.name}
          </h3>
          {cs.tier && (
            <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3" style={{ backgroundColor: tierColour + "20", color: tierColour }}>
              {cs.tier.label}
            </span>
          )}
          {c.content && <p className="text-slate-600 text-sm leading-relaxed">{c.content}</p>}
        </div>
      </div>
    </section>
  );
}
