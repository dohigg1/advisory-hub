import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Assessment } from "@/types/assessment";
import type { LandingPage, LandingPageSection, LandingPageSettings } from "@/types/landing-page";
import { LandingPageEditor } from "./LandingPageEditor";

interface Props {
  assessment: Assessment;
}

export function LandingPageTab({ assessment }: Props) {
  const { organisation } = useAuth();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreate = useCallback(async () => {
    const { data, error } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("assessment_id", assessment.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load landing page");
      setLoading(false);
      return;
    }

    if (data) {
      setLandingPage({
        ...data,
        sections_json: (data.sections_json as any) ?? [],
        settings_json: (data.settings_json as any) ?? {},
      } as LandingPage);
    } else {
      // Create default landing page
      const slug = assessment.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: created, error: createErr } = await supabase
        .from("landing_pages")
        .insert({
          assessment_id: assessment.id,
          slug: slug || `assessment-${assessment.id.slice(0, 8)}`,
          sections_json: [],
          settings_json: {
            button_colour: organisation?.primary_colour || "#1B3A5C",
            heading_font_colour: "#1B3A5C",
            body_font_colour: "#334155",
            button_text_colour: "#FFFFFF",
            background_colour: "#FFFFFF",
          },
        })
        .select()
        .single();

      if (createErr) {
        toast.error("Failed to create landing page");
      } else if (created) {
        setLandingPage({
          ...created,
          sections_json: (created.sections_json as any) ?? [],
          settings_json: (created.settings_json as any) ?? {},
        } as LandingPage);
      }
    }
    setLoading(false);
  }, [assessment.id, assessment.title, organisation]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  const saveLandingPage = useCallback(
    async (sections: LandingPageSection[], settings: LandingPageSettings, slug: string, isPublished: boolean) => {
      if (!landingPage) return;
      const { error } = await supabase
        .from("landing_pages")
        .update({
          sections_json: sections as any,
          settings_json: settings as any,
          slug,
          is_published: isPublished,
        })
        .eq("id", landingPage.id);

      if (error) {
        toast.error("Failed to save");
      } else {
        setLandingPage((prev) =>
          prev ? { ...prev, sections_json: sections, settings_json: settings, slug, is_published: isPublished } : prev
        );
      }
    },
    [landingPage]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!landingPage) return null;

  return (
    <LandingPageEditor
      landingPage={landingPage}
      assessment={assessment}
      onSave={saveLandingPage}
    />
  );
}
