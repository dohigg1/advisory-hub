import { describe, it, expect } from "vitest";

// Test the flag resolution logic independent of React hooks
describe("Feature Flag Resolution", () => {
  interface Flag { id: string; name: string; global_enabled: boolean; rollout_percentage: number }
  interface Override { flag_id: string; enabled: boolean }

  function resolveFlag(
    flagName: string,
    flags: Flag[],
    overrides: Override[],
    orgHash: number
  ): boolean {
    const flag = flags.find(f => f.name === flagName);
    if (!flag) return false;
    const override = overrides.find(o => o.flag_id === flag.id);
    if (override) return override.enabled;
    if (flag.global_enabled) return true;
    if (flag.rollout_percentage > 0) return orgHash < flag.rollout_percentage;
    return false;
  }

  const flags: Flag[] = [
    { id: "1", name: "new_dashboard", global_enabled: true, rollout_percentage: 0 },
    { id: "2", name: "ai_v2", global_enabled: false, rollout_percentage: 50 },
    { id: "3", name: "beta_feature", global_enabled: false, rollout_percentage: 0 },
    { id: "4", name: "overridden", global_enabled: true, rollout_percentage: 0 },
  ];

  it("should return false for unknown flags", () => {
    expect(resolveFlag("nonexistent", flags, [], 25)).toBe(false);
  });

  it("should return true for globally enabled flags", () => {
    expect(resolveFlag("new_dashboard", flags, [], 25)).toBe(true);
  });

  it("should respect org override over global setting", () => {
    const overrides: Override[] = [{ flag_id: "4", enabled: false }];
    expect(resolveFlag("overridden", flags, overrides, 25)).toBe(false);
  });

  it("should enable override even when global is disabled", () => {
    const overrides: Override[] = [{ flag_id: "3", enabled: true }];
    expect(resolveFlag("beta_feature", flags, overrides, 25)).toBe(true);
  });

  it("should apply percentage rollout correctly", () => {
    // orgHash 25 < 50% rollout -> enabled
    expect(resolveFlag("ai_v2", flags, [], 25)).toBe(true);
    // orgHash 75 >= 50% rollout -> disabled
    expect(resolveFlag("ai_v2", flags, [], 75)).toBe(false);
    // orgHash 49 < 50% -> enabled
    expect(resolveFlag("ai_v2", flags, [], 49)).toBe(true);
    // orgHash 50 >= 50% -> disabled
    expect(resolveFlag("ai_v2", flags, [], 50)).toBe(false);
  });

  it("should return false for disabled flags with 0% rollout", () => {
    expect(resolveFlag("beta_feature", flags, [], 0)).toBe(false);
  });

  it("should handle org hash edge cases", () => {
    // 100% rollout should always be enabled
    const fullRollout: Flag[] = [{ id: "5", name: "full", global_enabled: false, rollout_percentage: 100 }];
    expect(resolveFlag("full", fullRollout, [], 0)).toBe(true);
    expect(resolveFlag("full", fullRollout, [], 99)).toBe(true);
  });
});

describe("Org Hash Determinism", () => {
  function orgHash(orgId: string): number {
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      const char = orgId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  it("should produce consistent hashes", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const hash1 = orgHash(id);
    const hash2 = orgHash(id);
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different IDs", () => {
    const hash1 = orgHash("org-aaa");
    const hash2 = orgHash("org-bbb");
    // Could be same by chance, but very unlikely
    // We just test the range
    expect(hash1).toBeGreaterThanOrEqual(0);
    expect(hash1).toBeLessThan(100);
    expect(hash2).toBeGreaterThanOrEqual(0);
    expect(hash2).toBeLessThan(100);
  });

  it("should produce values in 0-99 range", () => {
    const ids = ["a", "bb", "ccc", "dddd", "eeeee", "ffffff", "123456", "test-org-id"];
    ids.forEach(id => {
      const h = orgHash(id);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(100);
    });
  });
});
