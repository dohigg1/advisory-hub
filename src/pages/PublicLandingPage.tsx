import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { LandingPage, LandingPageSection, LandingPageSettings } from "@/types/landing-page";
import { LandingPagePreview } from "@/components/landing-page/LandingPagePreview";
import type { Tables } from "@/integrations/supabase/types";

const PublicLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [organisation, setOrganisation] = useState<Tables<"organisations"> | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const lp: LandingPage = {
        ...data,
        sections_json: (data.sections_json as any) ?? [],
        settings_json: (data.settings_json as any) ?? {},
      } as LandingPage;
      setLandingPage(lp);

      // Fetch assessment title & org
      const { data: assessment } = await supabase
        .from("assessments")
        .select("title, org_id")
        .eq("id", data.assessment_id)
        .single();

      if (assessment) {
        setAssessmentTitle(assessment.title);
        const { data: org } = await supabase
          .from("organisations")
          .select("*")
          .eq("id", assessment.org_id)
          .single();
        setOrganisation(org);
      }

      // SEO
      if (lp.settings_json.seo_title) {
        document.title = lp.settings_json.seo_title;
      }

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !landingPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This landing page doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  return (
    <LandingPagePreview
      sections={landingPage.sections_json.filter((s) => s.is_visible)}
      settings={landingPage.settings_json}
      organisation={organisation}
      assessmentTitle={assessmentTitle}
    />
  );
};

export default PublicLandingPage;
