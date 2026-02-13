import { Document } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { CoverPage } from "./CoverPage";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CategoryOverview } from "./CategoryOverview";
import { CategoryPage } from "./CategoryPage";
import { ProgressPage } from "./ProgressPage";
import { RecommendationsPage } from "./RecommendationsPage";
import { AboutPage } from "./AboutPage";

interface Props {
  data: ResultsData;
}

export function ReportDocument({ data }: Props) {
  const isRetake = data.iterationHistory?.isRetake && data.iterationHistory.iterations.length >= 2;

  return (
    <Document
      title={`${data.assessment.title} — Results Report`}
      author={data.organisation?.name || "AdvisoryScore"}
      subject="Assessment Results Report"
    >
      <CoverPage data={data} />
      <ExecutiveSummary data={data} />
      <CategoryOverview data={data} />

      {data.categoryScores.map(cs => (
        <CategoryPage key={cs.category.id} cs={cs} data={data} />
      ))}

      {isRetake && <ProgressPage data={data} />}

      <RecommendationsPage data={data} />
      <AboutPage data={data} />
    </Document>
  );
}
