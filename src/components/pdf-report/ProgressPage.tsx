import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { pageStyles } from "./shared-styles";
import { PdfBarChart } from "./charts/PdfBarChart";

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 20 },
  subheading: { fontSize: 12, color: "#64748B", marginBottom: 20 },
  overallRow: { flexDirection: "row", alignItems: "center", marginBottom: 24, padding: 12, backgroundColor: "#F8FAFC", borderRadius: 6 },
  overallLabel: { fontSize: 10, color: "#64748B", marginBottom: 2 },
  overallValue: { fontSize: 22, fontWeight: 700, color: "#1E293B" },
  deltaPositive: { fontSize: 12, fontWeight: 700, color: "#16A34A" },
  deltaNegative: { fontSize: 12, fontWeight: 700, color: "#DC2626" },
  deltaNeutral: { fontSize: 12, fontWeight: 700, color: "#64748B" },
  table: { marginTop: 12 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#E2E8F0", paddingBottom: 6, marginBottom: 4 },
  tableHeaderCell: { fontSize: 8, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderColor: "#F1F5F9" },
  tableCell: { fontSize: 10, color: "#334155" },
  tableCellBold: { fontSize: 10, color: "#1E293B", fontWeight: 700 },
  improvementSection: { marginTop: 24 },
  improvementHeading: { fontSize: 12, fontWeight: 700, color: "#1E293B", marginBottom: 8 },
  improvementItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  improvementDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  improvementText: { fontSize: 10, color: "#334155", flex: 1 },
  improvementDelta: { fontSize: 10, fontWeight: 700 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94A3B8" },
});

interface Props { data: ResultsData }

export function ProgressPage({ data }: Props) {
  const history = data.iterationHistory;
  if (!history || !history.isRetake || !history.currentIteration || !history.previousIteration) return null;

  const current = history.currentIteration;
  const previous = history.previousIteration;
  const overallDelta = (current.overall_percentage ?? 0) - (previous.overall_percentage ?? 0);

  // Category comparisons
  const comparisons = data.categories.map(cat => {
    const currPct = current.category_scores_json?.[cat.id]?.percentage ?? 0;
    const prevPct = previous.category_scores_json?.[cat.id]?.percentage ?? 0;
    return { name: cat.name, colour: cat.colour || data.brandColour, prev: prevPct, curr: currPct, delta: currPct - prevPct };
  });

  const mostImproved = [...comparisons].sort((a, b) => b.delta - a.delta).slice(0, 3).filter(c => c.delta > 0);
  const needsAttention = [...comparisons].sort((a, b) => a.delta - b.delta).slice(0, 3).filter(c => c.delta < 0);

  return (
    <Page size="A4" style={pageStyles.page}>
      <Text style={styles.heading}>Progress Report</Text>
      <Text style={styles.subheading}>
        Iteration {current.iteration_number} — Compared to Iteration {previous.iteration_number}
      </Text>

      {/* Overall delta */}
      <View style={styles.overallRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.overallLabel}>Current Score</Text>
          <Text style={styles.overallValue}>{current.overall_percentage ?? 0}%</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overallLabel}>Previous Score</Text>
          <Text style={{ fontSize: 18, color: "#64748B" }}>{previous.overall_percentage ?? 0}%</Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={styles.overallLabel}>Change</Text>
          <Text style={overallDelta > 0 ? styles.deltaPositive : overallDelta < 0 ? styles.deltaNegative : styles.deltaNeutral}>
            {overallDelta > 0 ? "+" : ""}{overallDelta} points
          </Text>
        </View>
      </View>

      {/* Category table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Category</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Previous</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Current</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Change</Text>
        </View>
        {comparisons.map(c => (
          <View key={c.name} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 3 }]}>{c.name}</Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>{c.prev}%</Text>
            <Text style={[styles.tableCellBold, { flex: 1, textAlign: "right" }]}>{c.curr}%</Text>
            <Text style={[c.delta > 0 ? styles.deltaPositive : c.delta < 0 ? styles.deltaNegative : styles.deltaNeutral, { flex: 1, textAlign: "right", fontSize: 10 }]}>
              {c.delta > 0 ? "+" : ""}{c.delta}
            </Text>
          </View>
        ))}
      </View>

      {/* Most improved */}
      {mostImproved.length > 0 && (
        <View style={styles.improvementSection}>
          <Text style={styles.improvementHeading}>Most Improved</Text>
          {mostImproved.map(c => (
            <View key={c.name} style={styles.improvementItem}>
              <View style={[styles.improvementDot, { backgroundColor: "#16A34A" }]} />
              <Text style={styles.improvementText}>{c.name}</Text>
              <Text style={[styles.improvementDelta, { color: "#16A34A" }]}>+{c.delta} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Needs attention */}
      {needsAttention.length > 0 && (
        <View style={styles.improvementSection}>
          <Text style={styles.improvementHeading}>Needs Attention</Text>
          {needsAttention.map(c => (
            <View key={c.name} style={styles.improvementItem}>
              <View style={[styles.improvementDot, { backgroundColor: "#DC2626" }]} />
              <Text style={styles.improvementText}>{c.name}</Text>
              <Text style={[styles.improvementDelta, { color: "#DC2626" }]}>{c.delta} pts</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{data.assessment.title} — Progress Report</Text>
        <Text style={styles.footerText}>Iteration {current.iteration_number}</Text>
      </View>
    </Page>
  );
}
