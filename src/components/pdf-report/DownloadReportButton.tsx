import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { ResultsData } from "@/pages/PublicResults";
import type { ReportThemeId } from "./themes";
import { ReportDocument } from "./ReportDocument";

interface Props {
  data: ResultsData;
  themeId?: ReportThemeId;
  commentary?: { content: string; authorName?: string } | null;
}

export function DownloadReportButton({ data, themeId, commentary: externalCommentary }: Props) {
  const [generating, setGenerating] = useState(false);

  const fetchCommentary = useCallback(async (): Promise<{ content: string; authorName?: string } | null> => {
    // If commentary was passed as a prop, use that
    if (externalCommentary) return externalCommentary;

    try {
      const { data: row } = await supabase
        .from("lead_commentary" as any)
        .select("content_md, author_id")
        .eq("lead_id", data.lead.id)
        .maybeSingle();

      if (!row || !(row as any).content_md) return null;

      // Fetch author name
      let authorName: string | undefined;
      if ((row as any).author_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("auth_user_id", (row as any).author_id)
          .maybeSingle();
        if (profile?.full_name) {
          authorName = profile.full_name;
        }
      }

      return { content: (row as any).content_md, authorName };
    } catch {
      return null;
    }
  }, [data.lead.id, externalCommentary]);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const commentary = await fetchCommentary();
      const blob = await pdf(
        <ReportDocument data={data} themeId={themeId} commentary={commentary} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = [data.lead.first_name, data.lead.last_name].filter(Boolean).join("-") || "report";
      a.download = `${data.assessment.title.replace(/\s+/g, "-")}-${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setGenerating(false);
    }
  }, [data, themeId, fetchCommentary]);

  return (
    <Button
      onClick={handleDownload}
      disabled={generating}
      variant="outline"
      className="gap-2 text-[13px] h-9 shrink-0"
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {generating ? "Generating..." : "Download Full Report (PDF)"}
    </Button>
  );
}
