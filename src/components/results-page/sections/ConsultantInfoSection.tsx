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
    <section className="bg-white rounded-xl shadow-sm border p-8">
      <div className="flex items-start gap-6">
        {c.photo_url && (
          <img src={c.photo_url} alt={c.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{c.name}</h3>
          {c.title && <p className="text-sm text-slate-500 mb-2">{c.title}</p>}
          {c.bio && <p className="text-sm text-slate-600 mb-3 leading-relaxed">{c.bio}</p>}
          <div className="flex items-center gap-4 text-sm">
            {c.email && (
              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Mail className="h-3.5 w-3.5" /> {c.email}
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Phone className="h-3.5 w-3.5" /> {c.phone}
              </a>
            )}
            {c.linkedin_url && (
              <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
