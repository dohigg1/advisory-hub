import type { ResultsData } from "@/pages/PublicResults";
import type { ResultsPageSection } from "@/types/results-page";
import { Mail, Phone, Linkedin } from "lucide-react";

interface Props {
  section: ResultsPageSection;
  data: ResultsData;
}

export function ConsultantInfoSection({ section, data }: Props) {
  const c = section.content_json;

  if (!c.name) return null;

  return (
    <section className="rounded-sm border border-border bg-card shadow-sm">
      <div className="p-8">
        <div className="flex items-start gap-6">
          {c.photo_url && (
            <img src={c.photo_url} alt={c.name} className="w-16 h-16 rounded-sm object-cover flex-shrink-0 border border-border" />
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground tracking-tight">{c.name}</h3>
            {c.title && <p className="text-sm text-muted-foreground mb-2">{c.title}</p>}
            {c.bio && <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{c.bio}</p>}
            <div className="flex items-center gap-5 text-sm">
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-3.5 w-3.5" /> {c.email}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="h-3.5 w-3.5" /> {c.phone}
                </a>
              )}
              {c.linkedin_url && (
                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
