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
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="p-8">
        {c.heading && <h2 className="text-lg font-semibold text-foreground tracking-tight mb-8">{c.heading}</h2>}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5 items-start">
              <div
                className="flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: data.brandColour }}
              >
                {i + 1}
              </div>
              <div className="pt-1">
                <h4 className="text-sm font-semibold text-foreground tracking-tight">{step.title}</h4>
                {step.description && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
