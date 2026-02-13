export type SectionType =
  | "hero"
  | "value_proposition"
  | "social_proof"
  | "how_it_works"
  | "about"
  | "faq"
  | "cta"
  | "video";

export interface LandingPageSection {
  id: string;
  type: SectionType;
  content_json: Record<string, any>;
  sort_order: number;
  is_visible: boolean;
}

export interface LandingPageSettings {
  background_colour?: string;
  heading_font_colour?: string;
  body_font_colour?: string;
  button_colour?: string;
  button_text_colour?: string;
  seo_title?: string;
  seo_description?: string;
  social_image_url?: string;
}

export interface LandingPage {
  id: string;
  assessment_id: string;
  sections_json: LandingPageSection[];
  settings_json: LandingPageSettings;
  slug: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero Banner",
  value_proposition: "Value Proposition",
  social_proof: "Social Proof",
  how_it_works: "How It Works",
  about: "About / Content Block",
  faq: "FAQ Accordion",
  cta: "CTA Section",
  video: "Video Embed",
};

export const SECTION_TYPE_ICONS: Record<SectionType, string> = {
  hero: "image",
  value_proposition: "star",
  social_proof: "users",
  how_it_works: "list-ordered",
  about: "file-text",
  faq: "help-circle",
  cta: "mouse-pointer-click",
  video: "play",
};

export function createDefaultSection(type: SectionType, sortOrder: number): LandingPageSection {
  const id = crypto.randomUUID();
  const defaults: Record<SectionType, Record<string, any>> = {
    hero: {
      heading: "Discover Your Score",
      subheading: "Take our comprehensive assessment",
      description: "Find out where you stand and get actionable insights to improve.",
      cta_text: "Start Assessment",
      bg_colour: "#1B3A5C",
    },
    value_proposition: {
      heading: "What You'll Learn",
      cards: [
        { icon: "bar-chart-3", title: "Benchmarking", description: "See how you compare to industry standards" },
        { icon: "target", title: "Key Gaps", description: "Identify your most critical improvement areas" },
        { icon: "lightbulb", title: "Actionable Insights", description: "Get specific recommendations to improve" },
      ],
    },
    social_proof: {
      heading: "Trusted By Leading Firms",
      mode: "logos",
      logos: [],
      testimonials: [
        { quote: "This assessment transformed how we approach our strategy.", author: "Jane Smith", company: "Acme Corp" },
      ],
    },
    how_it_works: {
      heading: "How It Works",
      steps: [
        { title: "Answer Questions", description: "Complete a short series of targeted questions about your current state." },
        { title: "Get Your Score", description: "Receive an instant, detailed scorecard across key categories." },
        { title: "Review Insights", description: "Explore personalised recommendations and next steps." },
      ],
    },
    about: {
      heading: "About This Assessment",
      content: "This assessment was created by industry experts to help you understand your current position and identify opportunities for growth.",
    },
    faq: {
      heading: "Frequently Asked Questions",
      items: [
        { question: "How long does the assessment take?", answer: "Most respondents complete it in 5–10 minutes." },
        { question: "Is my data kept confidential?", answer: "Yes, all responses are stored securely and only shared with the assessment creator." },
        { question: "Will I receive a report?", answer: "Yes, you'll receive a detailed scorecard immediately upon completion." },
      ],
    },
    cta: {
      heading: "Ready to Get Started?",
      subheading: "Take the assessment now and discover your score.",
      cta_text: "Start Assessment",
    },
    video: {
      heading: "Watch the Overview",
      url: "",
    },
  };

  return { id, type, content_json: defaults[type], sort_order: sortOrder, is_visible: true };
}
