import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { CoverPage } from "./CoverPage";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { CategoryOverview } from "./CategoryOverview";
import { CategoryPage } from "./CategoryPage";
import { RecommendationsPage } from "./RecommendationsPage";
import { AboutPage } from "./AboutPage";

const footerStyles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 7, color: "#94A3B8" },
});

interface Props {
  data: ResultsData;
}

export function ReportDocument({ data }: Props) {
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

      <RecommendationsPage data={data} />
      <AboutPage data={data} />
    </Document>
  );
}
