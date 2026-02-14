import { describe, it, expect } from "vitest";
import { getSampleAssessmentData } from "@/components/onboarding/SampleAssessment";

describe("Sample Assessment Data", () => {
  const data = getSampleAssessmentData();

  it("should have the correct title", () => {
    expect(data.title).toBe("Business Health Check");
  });

  it("should have exactly 3 categories", () => {
    expect(data.categories).toHaveLength(3);
  });

  it("should have 4 questions per category (12 total)", () => {
    data.categories.forEach(cat => {
      expect(cat.questions).toHaveLength(4);
    });
    const totalQuestions = data.categories.reduce((sum, c) => sum + c.questions.length, 0);
    expect(totalQuestions).toBe(12);
  });

  it("should have 4 answer options per question", () => {
    data.categories.forEach(cat => {
      cat.questions.forEach(q => {
        expect(q.answer_options).toHaveLength(4);
      });
    });
  });

  it("should have scores 1-4 for each answer option", () => {
    data.categories.forEach(cat => {
      cat.questions.forEach(q => {
        const scores = q.answer_options.map(a => a.score).sort((a, b) => a - b);
        expect(scores).toEqual([1, 2, 3, 4]);
      });
    });
  });

  it("should have 3 scoring tiers covering 0-100", () => {
    expect(data.scoreTiers).toHaveLength(3);
    expect(data.scoreTiers[0].min_score).toBe(0);
    expect(data.scoreTiers[data.scoreTiers.length - 1].max_score).toBe(100);

    // Check no gaps
    for (let i = 1; i < data.scoreTiers.length; i++) {
      expect(data.scoreTiers[i].min_score).toBe(data.scoreTiers[i - 1].max_score + 1);
    }
  });

  it("should have category weights summing to ~100", () => {
    const totalWeight = data.categories.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBeGreaterThanOrEqual(99);
    expect(totalWeight).toBeLessThanOrEqual(101);
  });

  it("should have all questions as multiple_choice type", () => {
    data.categories.forEach(cat => {
      cat.questions.forEach(q => {
        expect(q.type).toBe("multiple_choice");
      });
    });
  });
});
