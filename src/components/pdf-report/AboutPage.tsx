import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import type { ReportTheme } from "./themes";
import { createPageStyles } from "./shared-styles";

interface Props {
  data: ResultsData;
  theme: ReportTheme;
}

export function AboutPage({ data, theme }: Props) {
  const t = theme;
  const ps = createPageStyles(t);

  const styles = StyleSheet.create({
    ...ps,
    heading: {
      fontSize: t.typography.headingSizes.h1,
      fontWeight: 700,
      fontFamily: t.typography.headingFont,
      color: t.typography.headingColor,
      marginBottom: 20,
    },
    card: {
      backgroundColor: t.sections.backgroundColor,
      borderRadius: t.sections.borderRadius,
      padding: 24,
      alignItems: "center",
      ...(t.sections.backgroundColor === "#FFFFFF" ? { borderWidth: 1, borderColor: t.sections.borderColor } : {}),
    },
    orgLogo: { width: 80, marginBottom: 16 },
    orgName: { fontSize: 16, fontWeight: 600, color: t.typography.headingColor, marginBottom: 8 },
    contactText: { fontSize: 10, color: t.typography.bodyColor, marginBottom: 4, textAlign: "center" },
    cta: { marginTop: 20, fontSize: 11, fontWeight: 600, textAlign: "center" },
  });

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
