import type { Tables } from "@/integrations/supabase/types";

interface Props {
  organisation: Tables<"organisations"> | null;
  brandColour: string;
}

export function AssessmentHeader({ organisation, brandColour }: Props) {
  return (
    <header className="border-b bg-white px-6 py-4 flex items-center">
      {organisation?.logo_url ? (
        <img src={organisation.logo_url} alt={organisation.name} className="h-8 object-contain" />
      ) : (
        <span className="text-sm font-semibold" style={{ color: brandColour }}>
          {organisation?.name || ""}
        </span>
      )}
    </header>
  );
}
