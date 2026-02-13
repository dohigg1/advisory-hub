import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function DynamicTextSection({ section, data }: Props) {
  const c = section.content_json;
  const tierLabel = data.overallTier?.label || "";

  let content = "";
  if (c.is_dynamic && c.tier_content && tierLabel) {
    content = c.tier_content[tierLabel]?.content || "";
  } else {
    content = c.static_content || "";
  }

  if (!content && !c.heading) return null;

  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="p-8">
        {c.heading && <h2 className="text-lg font-semibold text-foreground tracking-tight mb-4">{c.heading}</h2>}
        {content && <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>}
      </div>
    </section>
  );
}
