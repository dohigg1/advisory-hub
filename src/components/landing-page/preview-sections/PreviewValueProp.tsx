import type { LandingPageSettings } from "@/types/landing-page";
import { BarChart3, Target, Lightbulb, Star } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  "bar-chart-3": BarChart3,
  target: Target,
  lightbulb: Lightbulb,
  star: Star,
};

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewValueProp({ content, settings }: Props) {
  const cards = content.cards || [];
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card: any, i: number) => {
            const Icon = ICON_MAP[card.icon] || Star;
            return (
              <div key={i} className="text-center p-6 rounded border bg-white">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: (settings.button_colour || "#1B3A5C") + "15" }}
                >
                  <Icon className="h-6 w-6" style={{ color: settings.button_colour || "#1B3A5C" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
                  {card.title}
                </h3>
                <p className="text-sm opacity-80">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
