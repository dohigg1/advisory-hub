import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import type { ReportTheme } from "./themes";
import { PdfRadarChart } from "./charts/PdfRadarChart";
import { createPageStyles } from "./shared-styles";

interface Props {
  data: ResultsData;
  theme: ReportTheme;
}

export function CategoryOverview({ data, theme }: Props) {
  const t = theme;
  const ps = createPageStyles(t);

  const styles = StyleSheet.create({
    ...ps,
    heading: {
      fontSize: t.typography.headingSizes.h1,
      fontWeight: 700,
      fontFamily: t.typography.headingFont,
      color: t.typography.headingColor,
      marginBottom: 16,
    },
    chartContainer: { alignItems: "center", marginBottom: 20 },
    table: { width: "100%" },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: t.sections.borderColor,
      paddingBottom: 6,
      marginBottom: 6,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: t.charts.gridColor,
    },
    colName: { flex: 3, fontSize: 10, color: t.typography.bodyColor },
    colScore: { flex: 1, fontSize: 10, color: t.typography.bodyColor, textAlign: "center" },
    colBenchmark: { flex: 1, fontSize: 10, color: t.typography.mutedColor, textAlign: "center" },
    colTier: { flex: 1.5, fontSize: 10, textAlign: "center" },
    headerText: { fontSize: 8, color: t.typography.mutedColor, textTransform: "uppercase", fontWeight: 600 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
    tierRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  });

  const radarItems = data.categoryScores.map(cs => ({
    label: cs.category.name,
    value: cs.percentage,
  }));

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Category Overview</Text>

      {radarItems.length >= 3 && (
        <View style={styles.chartContainer}>
          <PdfRadarChart items={radarItems} size={260} colour={data.brandColour} />
        </View>
      )}

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colName, styles.headerText]}>Category</Text>
          <Text style={[styles.colScore, styles.headerText]}>Score</Text>
          {data.benchmarks?.categories && Object.keys(data.benchmarks.categories).length > 0 && (
            <Text style={[styles.colBenchmark, styles.headerText]}>Avg</Text>
          )}
          <Text style={[styles.colTier, styles.headerText]}>Tier</Text>
        </View>
        {data.categoryScores.map(cs => {
          const bm = data.benchmarks?.categories?.[cs.category.id];
          return (
            <View key={cs.category.id} style={styles.tableRow}>
              <Text style={styles.colName}>{cs.category.name}</Text>
              <Text style={styles.colScore}>{cs.percentage}%</Text>
              {data.benchmarks?.categories && Object.keys(data.benchmarks.categories).length > 0 && (
                <Text style={styles.colBenchmark}>{bm ? `${bm.avg_score}%` : "—"}</Text>
              )}
              <View style={[styles.colTier, styles.tierRow]}>
                {cs.tier && (
                  <View style={[styles.dot, { backgroundColor: cs.tier.colour }]} />
                )}
                <Text style={{ fontSize: 10, color: cs.tier?.colour || t.typography.bodyColor }}>
                  {cs.tier?.label || "—"}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Page>
  );
}
