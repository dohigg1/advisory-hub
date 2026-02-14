export type ReportThemeId = "corporate" | "modern" | "minimal";

export interface ReportTheme {
  id: ReportThemeId;
  name: string;
  description: string;
  // Page
  page: {
    backgroundColor: string;
    padding: number;
    paddingBottom: number;
  };
  // Cover
  cover: {
    backgroundColor: string;
    titleColor: string;
    subtitleColor: string;
    respondentColor: string;
    dateColor: string;
    accentBar?: { color: string; height: number };
  };
  // Typography
  typography: {
    headingFont: string;
    bodyFont: string;
    headingColor: string;
    bodyColor: string;
    mutedColor: string;
    headingSizes: { h1: number; h2: number; h3: number };
  };
  // Cards / Sections
  sections: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
    padding: number;
  };
  // Charts
  charts: {
    donutStrokeWidth: number;
    barRadius: number;
    gridColor: string;
  };
}

const corporateTheme: ReportTheme = {
  id: "corporate",
  name: "Corporate",
  description: "Navy headers, serif headings, conservative layout",
  page: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    paddingBottom: 60,
  },
  cover: {
    backgroundColor: "#FFFFFF",
    titleColor: "#1B2A4A",
    subtitleColor: "#64748B",
    respondentColor: "#334155",
    dateColor: "#94A3B8",
    accentBar: { color: "#1B2A4A", height: 6 },
  },
  typography: {
    headingFont: "Times-Roman",
    bodyFont: "Helvetica",
    headingColor: "#1B2A4A",
    bodyColor: "#334155",
    mutedColor: "#94A3B8",
    headingSizes: { h1: 24, h2: 18, h3: 14 },
  },
  sections: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 6,
    padding: 12,
  },
  charts: {
    donutStrokeWidth: 16,
    barRadius: 4,
    gridColor: "#E2E8F0",
  },
};

const modernTheme: ReportTheme = {
  id: "modern",
  name: "Modern",
  description: "Clean sans-serif, bold accent colors, larger chart elements",
  page: {
    backgroundColor: "#FFFFFF",
    padding: 40,
    paddingBottom: 60,
  },
  cover: {
    backgroundColor: "#FFFFFF",
    titleColor: "#0F172A",
    subtitleColor: "#475569",
    respondentColor: "#334155",
    dateColor: "#94A3B8",
    accentBar: { color: "#3B82F6", height: 10 },
  },
  typography: {
    headingFont: "Helvetica",
    bodyFont: "Helvetica",
    headingColor: "#0F172A",
    bodyColor: "#475569",
    mutedColor: "#94A3B8",
    headingSizes: { h1: 28, h2: 20, h3: 15 },
  },
  sections: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 14,
  },
  charts: {
    donutStrokeWidth: 20,
    barRadius: 6,
    gridColor: "#E2E8F0",
  },
};

const minimalTheme: ReportTheme = {
  id: "minimal",
  name: "Minimal",
  description: "Maximum whitespace, monochrome with one accent",
  page: {
    backgroundColor: "#FFFFFF",
    padding: 48,
    paddingBottom: 64,
  },
  cover: {
    backgroundColor: "#FFFFFF",
    titleColor: "#18181B",
    subtitleColor: "#52525B",
    respondentColor: "#3F3F46",
    dateColor: "#A1A1AA",
  },
  typography: {
    headingFont: "Helvetica",
    bodyFont: "Helvetica",
    headingColor: "#18181B",
    bodyColor: "#52525B",
    mutedColor: "#A1A1AA",
    headingSizes: { h1: 22, h2: 16, h3: 13 },
  },
  sections: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E4E4E7",
    borderRadius: 4,
    padding: 12,
  },
  charts: {
    donutStrokeWidth: 14,
    barRadius: 3,
    gridColor: "#E4E4E7",
  },
};

export const REPORT_THEMES: Record<ReportThemeId, ReportTheme> = {
  corporate: corporateTheme,
  modern: modernTheme,
  minimal: minimalTheme,
};

export function getReportTheme(id?: ReportThemeId): ReportTheme {
  if (id && REPORT_THEMES[id]) {
    return REPORT_THEMES[id];
  }
  return REPORT_THEMES.corporate;
}
