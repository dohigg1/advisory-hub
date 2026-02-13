import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function NextStepsSection({ section, data }: Props) {
  const c = section.content_json;
  const tierLabel = data.overallTier?.label || "";

  let steps: { title: string; description: string }[] = c.steps || [];

  if (c.is_dynamic && c.tier_content && tierLabel) {
    const tierSteps = c.tier_content[tierLabel]?.steps;
    if (tierSteps && tierSteps.length > 0) steps = tierSteps;
  }

  if (steps.length === 0 && !c.heading) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm border p-8">
      {c.heading && <h2 className="text-xl font-semibold text-slate-900 mb-6">{c.heading}</h2>}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: data.brandColour }}
            >
              {i + 1}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
              {step.description && <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
