import type { LandingPageSection, LandingPageSettings } from "@/types/landing-page";
import type { Tables } from "@/integrations/supabase/types";
import { PreviewHero } from "./preview-sections/PreviewHero";
import { PreviewValueProp } from "./preview-sections/PreviewValueProp";
import { PreviewSocialProof } from "./preview-sections/PreviewSocialProof";
import { PreviewHowItWorks } from "./preview-sections/PreviewHowItWorks";
import { PreviewAbout } from "./preview-sections/PreviewAbout";
import { PreviewFaq } from "./preview-sections/PreviewFaq";
import { PreviewCta } from "./preview-sections/PreviewCta";
import { PreviewVideo } from "./preview-sections/PreviewVideo";

interface Props {
  sections: LandingPageSection[];
  settings: LandingPageSettings;
  organisation: Tables<"organisations"> | null;
  assessmentTitle: string;
  slug?: string;
}

export function LandingPagePreview({ sections, settings, organisation, assessmentTitle, slug }: Props) {
  const s = settings;

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground text-sm">
        Add sections to see a preview
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: s.background_colour || "#FFFFFF", color: s.body_font_colour || "#334155" }}>
      {/* Nav bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: s.background_colour || "#FFFFFF" }}>
        {organisation?.logo_url ? (
          <img src={organisation.logo_url} alt="" className="h-8 object-contain" />
        ) : (
          <span className="text-sm font-semibold" style={{ color: s.heading_font_colour || "#1B3A5C" }}>
            {organisation?.name || "Your Company"}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{assessmentTitle}</span>
      </div>

      {sections.map((section) => {
        const props = { content: section.content_json, settings: s, slug };
        switch (section.type) {
          case "hero": return <PreviewHero key={section.id} {...props} />;
          case "value_proposition": return <PreviewValueProp key={section.id} {...props} />;
          case "social_proof": return <PreviewSocialProof key={section.id} {...props} />;
          case "how_it_works": return <PreviewHowItWorks key={section.id} {...props} />;
          case "about": return <PreviewAbout key={section.id} {...props} />;
          case "faq": return <PreviewFaq key={section.id} {...props} />;
          case "cta": return <PreviewCta key={section.id} {...props} />;
          case "video": return <PreviewVideo key={section.id} {...props} />;
          default: return null;
        }
      })}

      {/* Footer */}
      <div className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {organisation?.name || ""}. All rights reserved.
      </div>
    </div>
  );
}
