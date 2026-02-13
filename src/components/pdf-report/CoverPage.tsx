import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { ResultsData } from "@/pages/PublicResults";
import { PdfDonutChart } from "./charts/PdfDonutChart";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
    backgroundColor: "#FFFFFF",
  },
  logo: { width: 120, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 700, color: "#1E293B", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 40 },
  respondentName: { fontSize: 16, color: "#334155", textAlign: "center", marginBottom: 4 },
  company: { fontSize: 12, color: "#64748B", textAlign: "center", marginBottom: 30 },
  date: { fontSize: 10, color: "#94A3B8", textAlign: "center", marginTop: 20 },
  chartContainer: { alignItems: "center", marginTop: 10 },
});

interface Props { data: ResultsData }

export function CoverPage({ data }: Props) {
  const tierColour = data.overallTier?.colour || data.brandColour;
  const respondent = [data.lead.first_name, data.lead.last_name].filter(Boolean).join(" ");

  return (
    <Page size="A4" style={styles.page}>
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
          strokeWidth={18}
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
