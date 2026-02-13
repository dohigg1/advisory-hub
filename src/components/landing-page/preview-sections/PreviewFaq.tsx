import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

export function PreviewFaq({ content, settings }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = content.items || [];

  return (
    <section className="px-6 py-16" style={{ backgroundColor: "#F8FAFC" }}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        <div className="space-y-3">
          {items.map((item: any, i: number) => (
            <div key={i} className="rounded border bg-white">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium"
                style={{ color: settings.heading_font_colour || "#1B3A5C" }}
              >
                {item.question}
                <ChevronDown className={`h-4 w-4 transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
              </button>
              {openIdx === i && (
                <div className="px-4 pb-4 text-sm opacity-80 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
