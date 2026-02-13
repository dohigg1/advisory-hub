import type { ResultsData } from "@/pages/PublicResults";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { DownloadReportButton } from "@/components/pdf-report/DownloadReportButton";

interface Props {
  data: ResultsData;
}

export function ShareButtons({ data }: Props) {
  const { assessment, overallPercentage, overallTier, organisation } = data;
  const pageUrl = window.location.href;
  const shareText = `I scored ${overallPercentage}%${overallTier ? ` (${overallTier.label})` : ""} on the ${assessment.title} assessment${organisation?.name ? ` by ${organisation.name}` : ""}!`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`My ${assessment.title} Results`)}&body=${encodeURIComponent(`${shareText}\n\nView my results: ${pageUrl}`)}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Share Your Results</h3>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Linkedin className="h-4 w-4" /> LinkedIn
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Twitter className="h-4 w-4" /> X / Twitter
        </a>
        <a
          href={emailUrl}
          className="flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Mail className="h-4 w-4" /> Email
        </a>
        <DownloadReportButton data={data} />
      </div>
    </div>
  );
}
