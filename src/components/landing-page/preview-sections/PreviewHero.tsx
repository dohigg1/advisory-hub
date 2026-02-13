import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewHero({ content, settings }: Props) {
  return (
    <section
      className="px-6 py-20 md:py-28 text-center"
      style={{ backgroundColor: content.bg_colour || "#1B3A5C" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: "#FFFFFF" }}>
          {content.heading}
        </h1>
        {content.subheading && (
          <p className="text-lg md:text-xl mb-4 opacity-90" style={{ color: "#E2E8F0" }}>
            {content.subheading}
          </p>
        )}
        {content.description && (
          <p className="text-base mb-8 opacity-80 max-w-2xl mx-auto" style={{ color: "#CBD5E1" }}>
            {content.description}
          </p>
        )}
        {content.cta_text && (
          <button
            className="px-8 py-3 text-sm font-semibold rounded-sm shadow-lg transition-transform hover:scale-105"
            style={{
              backgroundColor: settings.button_colour || "#FFFFFF",
              color: settings.button_text_colour || "#1B3A5C",
            }}
          >
            {content.cta_text}
          </button>
        )}
      </div>
    </section>
  );
}
