import type { LandingPageSettings } from "@/types/landing-page";

interface Props {
  content: Record<string, any>;
  settings: LandingPageSettings;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export function PreviewVideo({ content, settings }: Props) {
  const embedUrl = getEmbedUrl(content.url || "");

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ color: settings.heading_font_colour || "#1B3A5C" }}>
          {content.heading}
        </h2>
        {embedUrl ? (
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              className="h-full w-full rounded"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded border bg-muted flex items-center justify-center text-sm text-muted-foreground">
            Enter a YouTube or Vimeo URL to see the preview
          </div>
        )}
      </div>
    </section>
  );
}
