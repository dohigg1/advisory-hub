import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewHowItWorks({ content, settings }: Props) {
  const steps = content.steps || [];
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        <div className="space-y-8">
          {steps.map((step: any, i: number) => (
            <div key={i} className="flex gap-6 items-start">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: settings.button_colour || "#1B3A5C", color: settings.button_text_colour || "#FFFFFF" }}
              >
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold mb-1" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
                  {step.title}
                </h3>
                <p className="text-sm opacity-80">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
