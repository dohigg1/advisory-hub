import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { pageStyles } from "./shared-styles";

const styles = StyleSheet.create({
  ...pageStyles,
  heading: { fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 20 },
  card: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 24, alignItems: "center" },
  orgLogo: { width: 80, marginBottom: 16 },
  orgName: { fontSize: 16, fontWeight: 600, color: "#1E293B", marginBottom: 8 },
  contactText: { fontSize: 10, color: "#64748B", marginBottom: 4, textAlign: "center" },
  cta: { marginTop: 20, fontSize: 11, fontWeight: 600, textAlign: "center" },
});

interface Props { data: ResultsData }

export function AboutPage({ data }: Props) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>About</Text>

      <View style={styles.card}>
        {data.organisation?.logo_url && (
          <Image src={data.organisation.logo_url} style={styles.orgLogo} />
        )}
        <Text style={styles.orgName}>{data.organisation?.name || "Our Organisation"}</Text>
        <Text style={styles.contactText}>
          For questions about your results or to discuss next steps, please get in touch.
        </Text>
        <Text style={[styles.cta, { color: data.brandColour }]}>
          Book a follow-up consultation to discuss your results in detail.
        </Text>
      </View>
    </Page>
  );
}
