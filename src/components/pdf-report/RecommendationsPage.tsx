import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { pageStyles } from "./shared-styles";

const styles = StyleSheet.create({
  ...pageStyles,
  heading: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 20 },
  step: { flexDirection: "row", gap: 12, marginBottom: 14 },
  number: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#1E293B", color: "#FFFFFF", fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 24 },
  stepText: { flex: 1, fontSize: 10, color: "#475569", lineHeight: 1.6, paddingTop: 3 },
  stepTitle: { fontSize: 11, fontWeight: 600, color: "#1E293B", marginBottom: 2 },
});

interface Props { data: ResultsData }

export function RecommendationsPage({ data }: Props) {
  // Build recommendations from low-scoring categories
  const sorted = [...data.categoryScores].sort((a, b) => a.percentage - b.percentage);
  const recommendations = sorted.map((cs, i) => ({
    title: cs.category.name,
    text: cs.percentage < 50
      ? `Focus on improving your ${cs.category.name.toLowerCase()} — currently at ${cs.percentage}%. Consider seeking expert guidance in this area.`
      : cs.percentage < 75
      ? `Continue developing your ${cs.category.name.toLowerCase()} capability. You're at ${cs.percentage}% — targeted improvements can push you higher.`
      : `Maintain your strong performance in ${cs.category.name.toLowerCase()} (${cs.percentage}%). Share best practices with your team.`,
  }));

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Recommended Next Steps</Text>

      {recommendations.map((rec, i) => (
        <View key={i} style={styles.step}>
          <Text style={styles.number}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{rec.title}</Text>
            <Text style={styles.stepText}>{rec.text}</Text>
          </View>
        </View>
      ))}
    </Page>
  );
}
