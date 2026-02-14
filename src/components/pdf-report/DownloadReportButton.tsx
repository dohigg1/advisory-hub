import { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResultsData } from "@/pages/PublicResults";
import { ReportDocument } from "./ReportDocument";

interface Props {
  data: ResultsData;
}

export function DownloadReportButton({ data }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await pdf(<ReportDocument data={data} />).toBlob();
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
  }, [data]);

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
