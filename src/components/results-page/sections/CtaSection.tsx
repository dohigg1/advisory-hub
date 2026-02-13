import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function CtaSection({ section, data }: Props) {
  const c = section.content_json;
  const tierLabel = data.overallTier?.label || "";

  let heading = c.heading || "";
  let description = c.description || "";
  let buttonText = c.button_text || "";
  let buttonUrl = c.button_url || "";

  if (c.is_dynamic && c.tier_content && tierLabel) {
    const tc = c.tier_content[tierLabel] || {};
    heading = tc.heading || heading;
    description = tc.description || description;
    buttonText = tc.button_text || buttonText;
    buttonUrl = tc.button_url || buttonUrl;
  }

  if (!heading && !buttonText) return null;

  return (
    <section className="rounded-xl p-8 text-center" style={{ backgroundColor: data.brandColour + "0A" }}>
      {heading && <h2 className="text-xl font-semibold text-slate-900 mb-3">{heading}</h2>}
      {description && <p className="text-slate-600 text-sm mb-6 max-w-lg mx-auto">{description}</p>}
      {buttonText && (
        <a
          href={buttonUrl || "#"}
          target={buttonUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 rounded-md text-white text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: data.brandColour }}
        >
          {buttonText}
        </a>
      )}
    </section>
  );
}
