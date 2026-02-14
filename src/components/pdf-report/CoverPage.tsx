import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import type { ReportTheme } from "./themes";
import { PdfDonutChart } from "./charts/PdfDonutChart";

interface Props {
  data: ResultsData;
  theme: ReportTheme;
}

export function CoverPage({ data, theme }: Props) {
  const t = theme;
  const tierColour = data.overallTier?.colour || data.brandColour;
  const respondent = [data.lead.first_name, data.lead.last_name].filter(Boolean).join(" ");

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
      backgroundColor: t.cover.backgroundColor,
      fontFamily: t.typography.bodyFont,
    },
    accentBar: t.cover.accentBar
      ? {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: t.cover.accentBar.height,
          backgroundColor: t.cover.accentBar.color,
        }
      : { height: 0 },
    logo: { width: 120, marginBottom: 40 },
    title: {
      fontSize: t.typography.headingSizes.h1,
      fontWeight: 700,
      fontFamily: t.typography.headingFont,
      color: t.cover.titleColor,
      textAlign: "center",
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: t.cover.subtitleColor,
      textAlign: "center",
      marginBottom: 40,
    },
    respondentName: {
      fontSize: 16,
      color: t.cover.respondentColor,
      textAlign: "center",
      marginBottom: 4,
    },
    company: {
      fontSize: 12,
      color: t.cover.subtitleColor,
      textAlign: "center",
      marginBottom: 30,
    },
    date: {
      fontSize: 10,
      color: t.cover.dateColor,
      textAlign: "center",
      marginTop: 20,
    },
    chartContainer: { alignItems: "center", marginTop: 10 },
  });

  return (
    <Page size="A4" style={styles.page}>
      {t.cover.accentBar && <View style={styles.accentBar} />}

      {data.organisation?.logo_url && (
        <Image src={data.organisation.logo_url} style={styles.logo} />
      )}
      <Text style={styles.title}>{data.assessment.title}</Text>
      <Text style={styles.subtitle}>Assessment Results Report</Text>

      {respondent && <Text style={styles.respondentName}>{respondent}</Text>}
      {data.lead.company && <Text style={styles.company}>{data.lead.company}</Text>}

      <View style={styles.chartContainer}>
        <PdfDonutChart
          percentage={data.overallPercentage}
          size={160}
          strokeWidth={t.charts.donutStrokeWidth}
          colour={tierColour}
          label={data.overallTier?.label}
        />
      </View>

      {data.lead.completed_at && (
        <Text style={styles.date}>
          Completed {new Date(data.lead.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </Text>
      )}
    </Page>
  );
}
