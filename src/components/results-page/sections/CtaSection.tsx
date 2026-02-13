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
    <section
      className="relative overflow-hidden rounded-sm border text-center"
      style={{
        borderColor: data.brandColour + "30",
        background: `linear-gradient(135deg, ${data.brandColour}08 0%, ${data.brandColour}14 100%)`,
      }}
    >
      <div className="p-10">
        {heading && <h2 className="text-xl font-bold text-foreground tracking-tight mb-3">{heading}</h2>}
        {description && <p className="text-muted-foreground text-sm mb-8 max-w-lg mx-auto leading-relaxed">{description}</p>}
        {buttonText && (
          <a
            href={buttonUrl || "#"}
            target={buttonUrl ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-sm text-white text-sm font-semibold tracking-wide transition-all hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: data.brandColour }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
}
