import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  global_enabled: boolean;
  rollout_percentage: number;
}

interface FeatureFlagOverride {
  flag_id: string;
  enabled: boolean;
}

export function useFeatureFlags() {
  const { organisation } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [overrides, setOverrides] = useState<FeatureFlagOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // Fetch all flags
      const { data: flagData } = await supabase
        .from("feature_flags" as any)
        .select("*");

      if (flagData) setFlags(flagData as any);

      // Fetch org-specific overrides
      if (organisation?.id) {
        const { data: overrideData } = await supabase
          .from("feature_flag_overrides" as any)
          .select("flag_id, enabled")
          .eq("org_id", organisation.id);

        if (overrideData) setOverrides(overrideData as any);
      }
    } catch (err) {
      console.error("Failed to load feature flags:", err);
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Deterministic hash for percentage rollout based on org ID
  const orgHash = useMemo(() => {
    if (!organisation?.id) return 0;
    let hash = 0;
    const str = organisation.id;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }, [organisation?.id]);

  const isEnabled = useCallback((flagName: string): boolean => {
    const flag = flags.find(f => f.name === flagName);
    if (!flag) return false;

    // Check org-specific override first
    const override = overrides.find(o => o.flag_id === flag.id);
    if (override) return override.enabled;

    // Check global enabled
    if (flag.global_enabled) return true;

    // Check percentage rollout
    if (flag.rollout_percentage > 0) {
      return orgHash < flag.rollout_percentage;
    }

    return false;
  }, [flags, overrides, orgHash]);

  return { isEnabled, loading, refresh, flags };
}
