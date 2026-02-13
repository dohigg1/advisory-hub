import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_CONFIGS, type PlanTier } from "@/config/plans";

interface PlanLimits {
  tier: PlanTier;
  subscribed: boolean;
  subscriptionEnd: string | null;
  subscriptionStatus: string;
  usage: {
    assessments: { current: number; limit: number; percentage: number };
    responses_per_month: { current: number; limit: number; percentage: number };
    team_members: { current: number; limit: number; percentage: number };
  };
  loading: boolean;
  canCreate: (limitType: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  refresh: () => Promise<void>;
}

export function usePlanLimits(): PlanLimits {
  const { organisation } = useAuth();
  const [tier, setTier] = useState<PlanTier>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [usage, setUsage] = useState({
    assessments: { current: 0, limit: 1, percentage: 0 },
    responses_per_month: { current: 0, limit: 10, percentage: 0 },
    team_members: { current: 0, limit: 1, percentage: 0 },
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organisation) return;
    
    try {
      // Check subscription status
      const { data: subData } = await supabase.functions.invoke("check-subscription");
      if (subData) {
        const planTier = (subData.plan_tier || "free") as PlanTier;
        setTier(planTier);
        setSubscribed(subData.subscribed || false);
        setSubscriptionEnd(subData.subscription_end || null);
        setSubscriptionStatus(subData.subscription_status || "inactive");

        const limits = PLAN_CONFIGS[planTier].limits;

        // Fetch current usage counts
        const [assessmentCount, responseCount, memberCount] = await Promise.all([
          supabase
            .from("assessments")
            .select("*", { count: "exact", head: true })
            .eq("org_id", organisation.id),
          supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("org_id", organisation.id)
            .eq("status", "completed")
            .gte("completed_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("org_id", organisation.id),
        ]);

        const assessments = assessmentCount.count || 0;
        const responses = responseCount.count || 0;
        const members = memberCount.count || 0;

        setUsage({
          assessments: {
            current: assessments,
            limit: limits.assessments,
            percentage: limits.assessments === -1 ? 0 : Math.round((assessments / limits.assessments) * 100),
          },
          responses_per_month: {
            current: responses,
            limit: limits.responses_per_month,
            percentage: Math.round((responses / limits.responses_per_month) * 100),
          },
          team_members: {
            current: members,
            limit: limits.team_members,
            percentage: Math.round((members / limits.team_members) * 100),
          },
        });
      }
    } catch (err) {
      console.error("Failed to check plan limits:", err);
      // Fallback to org's plan_tier
      const orgTier = (organisation.plan_tier || "free") as PlanTier;
      setTier(orgTier);
    } finally {
      setLoading(false);
    }
  }, [organisation]);

  useEffect(() => {
    refresh();
    // Refresh every 60 seconds
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const canCreate = useCallback((limitType: string) => {
    const config = PLAN_CONFIGS[tier].limits;
    const limit = (config as any)[limitType];
    if (limit === -1) return true;
    const usageData = (usage as any)[limitType];
    return usageData ? usageData.current < limit : true;
  }, [tier, usage]);

  const isFeatureEnabled = useCallback((feature: string) => {
    const config = PLAN_CONFIGS[tier].limits;
    const val = (config as any)[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val !== "none";
    if (typeof val === "number") return val !== 0;
    return false;
  }, [tier]);

  return {
    tier,
    subscribed,
    subscriptionEnd,
    subscriptionStatus,
    usage,
    loading,
    canCreate,
    isFeatureEnabled,
    refresh,
  };
}
