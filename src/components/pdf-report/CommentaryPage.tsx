import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { ReportTheme } from "./themes";
import { getReportTheme } from "./themes";

const createStyles = (theme: ReportTheme) =>
  StyleSheet.create({
    page: {
      flexDirection: "column",
      padding: theme.page.padding,
      paddingBottom: theme.page.paddingBottom,
      backgroundColor: theme.page.backgroundColor,
      fontFamily: theme.typography.bodyFont,
    },
    heading: {
      fontSize: theme.typography.headingSizes.h2,
      fontWeight: 700,
      color: theme.typography.headingColor,
      fontFamily: theme.typography.headingFont,
      marginBottom: 20,
    },
    authorInfo: {
      fontSize: 9,
      color: theme.typography.mutedColor,
      marginBottom: 16,
    },
    paragraph: {
      fontSize: 10,
      color: theme.typography.bodyColor,
      lineHeight: 1.7,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.sections.borderColor,
      marginVertical: 16,
    },
  });

interface Props {
  commentary: string;
  authorName?: string;
  theme?: ReportTheme;
}

export function CommentaryPage({ commentary, authorName, theme }: Props) {
  const t = theme || getReportTheme();
  const styles = createStyles(t);

  // Split markdown into paragraphs (simple rendering)
  const paragraphs = commentary.split(/\n\n+/).filter(Boolean);

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Consultant Commentary</Text>
      {authorName && (
        <Text style={styles.authorInfo}>Prepared by {authorName}</Text>
      )}
      <View style={styles.divider} />
      {paragraphs.map((para, i) => (
        <Text key={i} style={styles.paragraph}>
          {para.replace(/^#+\s/, "").replace(/\*\*/g, "").trim()}
        </Text>
      ))}
    </Page>
  );
}
