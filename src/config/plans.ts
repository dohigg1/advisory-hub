// Stripe pricing configuration for AdvisoryScore
export type PlanTier = "free" | "starter" | "professional" | "firm";

export interface PlanConfig {
  name: string;
  monthlyPrice: number; // in GBP
  annualPrice: number;  // in GBP
  monthlyPriceId: string;
  annualPriceId: string;
  productId: string;
  annualProductId: string;
  limits: {
    assessments: number; // -1 = unlimited
    responses_per_month: number;
    team_members: number;
    custom_domain: boolean;
    pdf_reports: "none" | "basic" | "full" | "full_benchmark";
    client_portal: boolean;
    abandon_emails: boolean;
    webhooks: "none" | "zapier" | "full" | "full_api";
    remove_branding: boolean;
    ab_testing: boolean;
    data_enrichment: boolean;
    ai_generations_per_month: number; // -1 = unlimited
    ai_narratives: boolean;
  };
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: "",
    annualPriceId: "",
    productId: "",
    annualProductId: "",
    limits: {
      assessments: 1,
      responses_per_month: 10,
      team_members: 1,
      custom_domain: false,
      pdf_reports: "none",
      client_portal: false,
      abandon_emails: false,
      webhooks: "none",
      remove_branding: false,
      ab_testing: false,
      data_enrichment: false,
      ai_generations_per_month: 1,
      ai_narratives: false,
    },
  },
  starter: {
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 278,
    monthlyPriceId: "price_1T0UtcFOchv77fjFLTxXFvfG",
    annualPriceId: "price_1T0UwaFOchv77fjFj6Y4lQfj",
    productId: "prod_TyRnJnxPjfNopj",
    annualProductId: "prod_TyRqwPBwtyh0Qu",
    limits: {
      assessments: 5,
      responses_per_month: 200,
      team_members: 2,
      custom_domain: false,
      pdf_reports: "basic",
      client_portal: false,
      abandon_emails: false,
      webhooks: "zapier",
      remove_branding: false,
      ab_testing: false,
      data_enrichment: false,
      ai_generations_per_month: 5,
      ai_narratives: false,
    },
  },
  professional: {
    name: "Professional",
    monthlyPrice: 79,
    annualPrice: 758,
    monthlyPriceId: "price_1T0UwNFOchv77fjFYlBmruy0",
    annualPriceId: "price_1T0UwbFOchv77fjF1ZS9g9si",
    productId: "prod_TyRqUP7kRSC5ME",
    annualProductId: "prod_TyRqhx1x04QCjS",
    limits: {
      assessments: 20,
      responses_per_month: 2000,
      team_members: 5,
      custom_domain: true,
      pdf_reports: "full",
      client_portal: false,
      abandon_emails: true,
      webhooks: "full",
      remove_branding: true,
      ab_testing: false,
      data_enrichment: false,
      ai_generations_per_month: 20,
      ai_narratives: true,
    },
  },
  firm: {
    name: "Firm",
    monthlyPrice: 149,
    annualPrice: 1430,
    monthlyPriceId: "price_1T0UwWFOchv77fjFbwRcJ0RT",
    annualPriceId: "price_1T0UwcFOchv77fjFQ5ncBLyL",
    productId: "prod_TyRqQ8VWrr7uiA",
    annualProductId: "prod_TyRqQyWgiPvAkO",
    limits: {
      assessments: -1,
      responses_per_month: 10000,
      team_members: 15,
      custom_domain: true,
      pdf_reports: "full_benchmark",
      client_portal: true,
      abandon_emails: true,
      webhooks: "full_api",
      remove_branding: true,
      ab_testing: true,
      data_enrichment: true,
      ai_generations_per_month: -1,
      ai_narratives: true,
    },
  },
};

export const PLAN_TIERS: PlanTier[] = ["free", "starter", "professional", "firm"];

export const FEATURE_LABELS: Record<string, string> = {
  assessments: "Assessments",
  responses_per_month: "Responses / month",
  team_members: "Team members",
  custom_domain: "Custom domain",
  pdf_reports: "PDF reports",
  client_portal: "Client portal",
  abandon_emails: "Abandon emails",
  webhooks: "Webhooks & integrations",
  remove_branding: "Remove branding",
  ab_testing: "A/B testing",
  data_enrichment: "Data enrichment",
  ai_generations_per_month: "AI generations / month",
  ai_narratives: "AI narrative summaries",
};
