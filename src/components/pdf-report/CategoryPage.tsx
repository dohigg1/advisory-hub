import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData, CategoryScore } from "@/pages/PublicResults";
import { PdfDonutChart } from "./charts/PdfDonutChart";
import { pageStyles } from "./shared-styles";

const styles = StyleSheet.create({
  ...pageStyles,
  header: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 20 },
  catName: { fontSize: 18, fontWeight: 700, color: "#1E293B" },
  tierBadge: { fontSize: 9, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  content: { fontSize: 10, color: "#475569", lineHeight: 1.6, marginBottom: 10 },
  barContainer: { marginTop: 12 },
  barLabel: { fontSize: 8, color: "#94A3B8", marginBottom: 4 },
  barBg: { height: 12, borderRadius: 6, backgroundColor: "#F1F5F9", width: "100%", position: "relative" },
  barFill: { height: 12, borderRadius: 6, position: "absolute", top: 0, left: 0 },
});

interface Props { cs: CategoryScore; data: ResultsData }

export function CategoryPage({ cs, data }: Props) {
  const tierColour = cs.tier?.colour || data.brandColour;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PdfDonutChart
          percentage={cs.percentage}
          size={90}
          strokeWidth={10}
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
        </View>
      </View>
    </Page>
  );
}
