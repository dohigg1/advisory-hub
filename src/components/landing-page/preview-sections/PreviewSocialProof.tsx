import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewSocialProof({ content, settings }: Props) {
  const testimonials = content.testimonials || [];
  return (
    <section className="px-6 py-16" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t: any, i: number) => (
            <div key={i} className="rounded border bg-white p-6">
              <p className="text-sm italic mb-4 leading-relaxed">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
                  {t.author}
                </p>
                {t.company && <p className="text-xs text-muted-foreground">{t.company}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
