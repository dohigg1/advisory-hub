import { Document } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import type { ReportThemeId } from "./themes";
import { getReportTheme } from "./themes";
import { CoverPage } from "./CoverPage";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CategoryOverview } from "./CategoryOverview";
import { CategoryPage } from "./CategoryPage";
import { ProgressPage } from "./ProgressPage";
import { RecommendationsPage } from "./RecommendationsPage";
import { CommentaryPage } from "./CommentaryPage";
import { AboutPage } from "./AboutPage";

interface Props {
  data: ResultsData;
  themeId?: ReportThemeId;
  commentary?: { content: string; authorName?: string } | null;
}

export function ReportDocument({ data, themeId, commentary }: Props) {
  const theme = getReportTheme(themeId);
  const isRetake = data.iterationHistory?.isRetake && data.iterationHistory.iterations.length >= 2;

  return (
    <Document
      title={`${data.assessment.title} — Results Report`}
      author={data.organisation?.name || "AdvisoryScore"}
      subject="Assessment Results Report"
    >
      <CoverPage data={data} theme={theme} />
      <ExecutiveSummary data={data} theme={theme} />
      <CategoryOverview data={data} theme={theme} />

      {data.categoryScores.map(cs => (
        <CategoryPage key={cs.category.id} cs={cs} data={data} theme={theme} />
      ))}

      {commentary?.content && (
        <CommentaryPage
          commentary={commentary.content}
          authorName={commentary.authorName}
          theme={theme}
        />
      )}

      {isRetake && <ProgressPage data={data} theme={theme} />}

      <RecommendationsPage data={data} theme={theme} />
      <AboutPage data={data} theme={theme} />
    </Document>
  );
}
