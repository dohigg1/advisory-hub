import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData, CategoryScore } from "@/pages/PublicResults";
import type { ReportTheme } from "./themes";
import { PdfDonutChart } from "./charts/PdfDonutChart";
import { createPageStyles } from "./shared-styles";

interface Props {
  cs: CategoryScore;
  data: ResultsData;
  theme: ReportTheme;
}

export function CategoryPage({ cs, data, theme }: Props) {
  const t = theme;
  const ps = createPageStyles(t);

  const styles = StyleSheet.create({
    ...ps,
    header: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
    catName: {
      fontSize: t.typography.headingSizes.h2,
      fontWeight: 700,
      fontFamily: t.typography.headingFont,
      color: t.typography.headingColor,
    },
    tierBadge: { fontSize: 9, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
    content: { fontSize: 10, color: t.typography.bodyColor, lineHeight: 1.6, marginBottom: 10 },
    barContainer: { marginTop: 12 },
    barLabel: { fontSize: 8, color: t.typography.mutedColor, marginBottom: 4 },
    barBg: {
      height: 12,
      borderRadius: t.charts.barRadius,
      backgroundColor: t.charts.gridColor,
      width: "100%",
      position: "relative",
    },
    barFill: {
      height: 12,
      borderRadius: t.charts.barRadius,
      position: "absolute",
      top: 0,
      left: 0,
    },
    benchmarkLine: { position: "absolute", top: -2, width: 2, height: 16, backgroundColor: t.typography.bodyColor },
    benchmarkRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    benchmarkText: { fontSize: 8, color: t.typography.mutedColor },
  });

  const tierColour = cs.tier?.colour || data.brandColour;
  const benchmark = data.benchmarks?.categories?.[cs.category.id];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PdfDonutChart
          percentage={cs.percentage}
          size={90}
          strokeWidth={t.charts.donutStrokeWidth - 6}
          colour={tierColour}
          showLabel={false}
        />
        <View>
          <Text style={styles.catName}>{cs.category.name}</Text>
          {cs.tier && (
            <Text style={[styles.tierBadge, { backgroundColor: tierColour + "20", color: tierColour }]}>
              {cs.tier.label}
            </Text>
          )}
        </View>
      </View>

      {cs.category.description && (
        <Text style={styles.content}>{cs.category.description}</Text>
      )}

      <Text style={styles.content}>
        You scored {cs.totalPoints} out of {cs.maxPoints} possible points in this category ({cs.percentage}%).
        {cs.tier?.description ? ` ${cs.tier.description}.` : ""}
      </Text>

      <View style={styles.barContainer}>
        <Text style={styles.barLabel}>Score position: {cs.percentage}%</Text>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${cs.percentage}%`, backgroundColor: tierColour }]} />
          {benchmark && (
            <View style={[styles.benchmarkLine, { left: `${benchmark.avg_score}%` }]} />
          )}
        </View>
        {benchmark && (
          <View style={styles.benchmarkRow}>
            <Text style={styles.benchmarkText}>Your score: {cs.percentage}%</Text>
            <Text style={styles.benchmarkText}>Industry avg: {benchmark.avg_score}%</Text>
          </View>
        )}
      </View>
    </Page>
  );
}
