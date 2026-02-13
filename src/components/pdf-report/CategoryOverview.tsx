import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { PdfRadarChart } from "./charts/PdfRadarChart";
import { pageStyles } from "./shared-styles";

const styles = StyleSheet.create({
  ...pageStyles,
  heading: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 16 },
  chartContainer: { alignItems: "center", marginBottom: 20 },
  table: { width: "100%" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#F1F5F9" },
  colName: { flex: 3, fontSize: 10, color: "#334155" },
  colScore: { flex: 1, fontSize: 10, color: "#334155", textAlign: "center" },
  colTier: { flex: 1.5, fontSize: 10, textAlign: "center" },
  headerText: { fontSize: 8, color: "#94A3B8", textTransform: "uppercase", fontWeight: 600 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  tierRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
});

interface Props { data: ResultsData }

export function CategoryOverview({ data }: Props) {
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
          <Text style={[styles.colTier, styles.headerText]}>Tier</Text>
        </View>
        {data.categoryScores.map(cs => (
          <View key={cs.category.id} style={styles.tableRow}>
            <Text style={styles.colName}>{cs.category.name}</Text>
            <Text style={styles.colScore}>{cs.percentage}%</Text>
            <View style={[styles.colTier, styles.tierRow]}>
              {cs.tier && (
                <View style={[styles.dot, { backgroundColor: cs.tier.colour }]} />
              )}
              <Text style={{ fontSize: 10, color: cs.tier?.colour || "#64748B" }}>
                {cs.tier?.label || "—"}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}
