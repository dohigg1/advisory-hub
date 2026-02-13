import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewAbout({ content, settings }: Props) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        <div className="text-sm leading-relaxed whitespace-pre-line opacity-90">
          {content.content}
        </div>
      </div>
    </section>
  );
}
