import { StyleSheet } from "@react-pdf/renderer";
import type { ReportTheme } from "./themes";
import { getReportTheme } from "./themes";

export function createPageStyles(theme?: ReportTheme) {
  const t = theme || getReportTheme();
  return StyleSheet.create({
    page: {
      flexDirection: "column" as const,
      padding: t.page.padding,
      paddingBottom: t.page.paddingBottom,
      backgroundColor: t.page.backgroundColor,
      fontFamily: t.typography.bodyFont,
    },
  });
}

// Keep backward compat
export const pageStyles = createPageStyles();
