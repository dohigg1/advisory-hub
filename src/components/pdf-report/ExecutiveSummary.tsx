import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { PdfDonutChart } from "./charts/PdfDonutChart";
import { pageStyles } from "./shared-styles";

const styles = StyleSheet.create({
  ...pageStyles,
  row: { flexDirection: "row", gap: 30, marginBottom: 20 },
  chartCol: { alignItems: "center", width: 140 },
  textCol: { flex: 1 },
  heading: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 16 },
  paragraph: { fontSize: 10, color: "#475569", lineHeight: 1.6, marginBottom: 10 },
  highlight: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, gap: 16 },
  highlightCard: { flex: 1, padding: 12, borderRadius: 6, backgroundColor: "#F8FAFC" },
  highlightLabel: { fontSize: 8, color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 },
  highlightName: { fontSize: 11, fontWeight: 600, color: "#1E293B", marginBottom: 2 },
  highlightScore: { fontSize: 10, color: "#64748B" },
});

interface Props { data: ResultsData }

export function ExecutiveSummary({ data }: Props) {
  const tierColour = data.overallTier?.colour || data.brandColour;
  const sorted = [...data.categoryScores].sort((a, b) => b.percentage - a.percentage);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const summaryText = data.overallTier?.description
    || `Your overall score of ${data.overallPercentage}% places you in the ${data.overallTier?.label || "assessed"} tier.`;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Executive Summary</Text>

      <View style={styles.row}>
        <View style={styles.chartCol}>
          <PdfDonutChart
            percentage={data.overallPercentage}
            size={120}
            strokeWidth={14}
            colour={tierColour}
            label={data.overallTier?.label}
          />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.paragraph}>{summaryText}</Text>
          <Text style={styles.paragraph}>
            This report provides a detailed breakdown of your performance across {data.categories.length} categories,
            highlighting areas of strength and opportunities for improvement.
          </Text>
        </View>
      </View>

      {highest && lowest && sorted.length > 1 && (
        <View style={styles.highlight}>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Strongest Area</Text>
            <Text style={styles.highlightName}>{highest.category.name}</Text>
            <Text style={styles.highlightScore}>{highest.percentage}% — {highest.tier?.label || ""}</Text>
          </View>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>Area for Improvement</Text>
            <Text style={styles.highlightName}>{lowest.category.name}</Text>
            <Text style={styles.highlightScore}>{lowest.percentage}% — {lowest.tier?.label || ""}</Text>
          </View>
        </View>
      )}
    </Page>
  );
}
