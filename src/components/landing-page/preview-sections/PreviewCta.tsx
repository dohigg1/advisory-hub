import { useNavigate } from "react-router-dom";
import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
  slug?: string;
}

export function PreviewCta({ content, settings, slug }: Props) {
  const navigate = useNavigate();

  const handleCta = () => {
    if (slug) navigate(`/a/${slug}/start`);
  };

  return (
    <section className="px-6 py-20 text-center" style={{ backgroundColor: settings.button_colour || "#1B3A5C" }}>
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#FFFFFF" }}>
          {content.heading}
        </h2>
        {content.subheading && (
          <p className="text-base mb-8 opacity-90" style={{ color: "#E2E8F0" }}>
            {content.subheading}
          </p>
        )}
        {content.cta_text && (
          <button
            onClick={handleCta}
            className="px-8 py-3 text-sm font-semibold rounded-sm shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: "#FFFFFF", color: settings.button_colour || "#1B3A5C" }}
          >
            {content.cta_text}
          </button>
        )}
      </div>
    </section>
  );
}
