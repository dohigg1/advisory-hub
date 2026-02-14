import { describe, it, expect } from "vitest";

// Test scoring utility functions
describe("Score Calculations", () => {
  it("should calculate percentage correctly", () => {
    const calculate = (points: number, maxPoints: number) =>
      maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;

    expect(calculate(75, 100)).toBe(75);
    expect(calculate(0, 100)).toBe(0);
    expect(calculate(100, 100)).toBe(100);
    expect(calculate(33, 100)).toBe(33);
    expect(calculate(0, 0)).toBe(0);
  });

  it("should determine correct tier for a score", () => {
    const tiers = [
      { label: "Needs Improvement", min_score: 0, max_score: 40 },
      { label: "Developing", min_score: 41, max_score: 70 },
      { label: "Leading", min_score: 71, max_score: 100 },
    ];

    const findTier = (percentage: number) =>
      tiers.find(t => percentage >= t.min_score && percentage <= t.max_score) || null;

    expect(findTier(0)?.label).toBe("Needs Improvement");
    expect(findTier(25)?.label).toBe("Needs Improvement");
    expect(findTier(40)?.label).toBe("Needs Improvement");
    expect(findTier(41)?.label).toBe("Developing");
    expect(findTier(70)?.label).toBe("Developing");
    expect(findTier(71)?.label).toBe("Leading");
    expect(findTier(100)?.label).toBe("Leading");
  });

  it("should handle weighted category scoring", () => {
    const categories = [
      { percentage: 80, weight: 40 },
      { percentage: 60, weight: 30 },
      { percentage: 90, weight: 30 },
    ];

    const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = categories.reduce(
      (sum, c) => sum + (c.percentage * c.weight / totalWeight), 0
    );

    expect(Math.round(weightedScore)).toBe(77); // (80*40 + 60*30 + 90*30) / 100 = 77
  });

  it("should handle equal weights when no weights specified", () => {
    const categories = [
      { percentage: 80, weight: 0 },
      { percentage: 60, weight: 0 },
      { percentage: 40, weight: 0 },
    ];

    // Equal weight fallback
    const avg = categories.reduce((sum, c) => sum + c.percentage, 0) / categories.length;
    expect(Math.round(avg)).toBe(60);
  });

  it("should handle edge case of single category", () => {
    const categories = [{ percentage: 85, weight: 100 }];
    const score = categories[0].percentage;
    expect(score).toBe(85);
  });

  it("should sort categories by score for breakdown display", () => {
    const scores = [
      { name: "A", percentage: 45 },
      { name: "B", percentage: 90 },
      { name: "C", percentage: 20 },
      { name: "D", percentage: 75 },
    ];

    const ascending = [...scores].sort((a, b) => a.percentage - b.percentage);
    expect(ascending.map(s => s.name)).toEqual(["C", "A", "D", "B"]);

    const descending = [...scores].sort((a, b) => b.percentage - a.percentage);
    expect(descending.map(s => s.name)).toEqual(["B", "D", "A", "C"]);
  });
});
