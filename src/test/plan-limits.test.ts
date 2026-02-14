import { describe, it, expect } from "vitest";
import { PLAN_CONFIGS, PLAN_TIERS, type PlanTier } from "@/config/plans";

describe("Plan Configuration", () => {
  it("should have all four tiers defined", () => {
    expect(PLAN_TIERS).toEqual(["free", "starter", "professional", "firm"]);
    PLAN_TIERS.forEach(tier => {
      expect(PLAN_CONFIGS[tier]).toBeDefined();
    });
  });

  it("should have increasing prices across tiers", () => {
    const prices = PLAN_TIERS.map(t => PLAN_CONFIGS[t].monthlyPrice);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("should have increasing limits across tiers", () => {
    const assessmentLimits = PLAN_TIERS.map(t => PLAN_CONFIGS[t].limits.assessments);
    // Free=1, Starter=5, Professional=20, Firm=-1(unlimited)
    expect(assessmentLimits[0]).toBe(1);
    expect(assessmentLimits[1]).toBe(5);
    expect(assessmentLimits[2]).toBe(20);
    expect(assessmentLimits[3]).toBe(-1); // unlimited
  });

  it("should have valid Stripe price IDs for paid tiers", () => {
    const paidTiers: PlanTier[] = ["starter", "professional", "firm"];
    paidTiers.forEach(tier => {
      const config = PLAN_CONFIGS[tier];
      expect(config.monthlyPriceId).toBeTruthy();
      expect(config.annualPriceId).toBeTruthy();
      expect(config.productId).toBeTruthy();
    });
  });

  it("free tier should have no Stripe IDs", () => {
    expect(PLAN_CONFIGS.free.monthlyPriceId).toBe("");
    expect(PLAN_CONFIGS.free.annualPriceId).toBe("");
  });

  it("should have annual prices less than 12x monthly", () => {
    const paidTiers: PlanTier[] = ["starter", "professional", "firm"];
    paidTiers.forEach(tier => {
      const config = PLAN_CONFIGS[tier];
      expect(config.annualPrice).toBeLessThan(config.monthlyPrice * 12);
    });
  });

  it("should gate features correctly by tier", () => {
    // Free: no PDF, no portal, no branding removal
    expect(PLAN_CONFIGS.free.limits.pdf_reports).toBe("none");
    expect(PLAN_CONFIGS.free.limits.client_portal).toBe(false);
    expect(PLAN_CONFIGS.free.limits.remove_branding).toBe(false);
    expect(PLAN_CONFIGS.free.limits.ai_narratives).toBe(false);

    // Starter: basic PDF, no portal
    expect(PLAN_CONFIGS.starter.limits.pdf_reports).toBe("basic");
    expect(PLAN_CONFIGS.starter.limits.client_portal).toBe(false);

    // Professional: full PDF, custom domain, branding removal
    expect(PLAN_CONFIGS.professional.limits.pdf_reports).toBe("full");
    expect(PLAN_CONFIGS.professional.limits.custom_domain).toBe(true);
    expect(PLAN_CONFIGS.professional.limits.remove_branding).toBe(true);
    expect(PLAN_CONFIGS.professional.limits.ai_narratives).toBe(true);

    // Firm: everything
    expect(PLAN_CONFIGS.firm.limits.pdf_reports).toBe("full_benchmark");
    expect(PLAN_CONFIGS.firm.limits.client_portal).toBe(true);
    expect(PLAN_CONFIGS.firm.limits.ab_testing).toBe(true);
    expect(PLAN_CONFIGS.firm.limits.data_enrichment).toBe(true);
  });

  it("should have valid AI generation limits", () => {
    expect(PLAN_CONFIGS.free.limits.ai_generations_per_month).toBe(1);
    expect(PLAN_CONFIGS.starter.limits.ai_generations_per_month).toBe(5);
    expect(PLAN_CONFIGS.professional.limits.ai_generations_per_month).toBe(20);
    expect(PLAN_CONFIGS.firm.limits.ai_generations_per_month).toBe(-1); // unlimited
  });

  it("should have valid team member limits", () => {
    expect(PLAN_CONFIGS.free.limits.team_members).toBe(1);
    expect(PLAN_CONFIGS.starter.limits.team_members).toBe(2);
    expect(PLAN_CONFIGS.professional.limits.team_members).toBe(5);
    expect(PLAN_CONFIGS.firm.limits.team_members).toBe(15);
  });
});
