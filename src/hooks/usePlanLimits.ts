import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_CONFIGS, type PlanTier } from "@/config/plans";

interface PlanLimits {
  tier: PlanTier;
  subscribed: boolean;
  subscriptionEnd: string | null;
  subscriptionStatus: string;
  adminOverride: boolean;
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
  const [adminOverride, setAdminOverride] = useState(false);
  const [permissionOverrides, setPermissionOverrides] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState({
    assessments: { current: 0, limit: 1, percentage: 0 },
    responses_per_month: { current: 0, limit: 10, percentage: 0 },
    team_members: { current: 0, limit: 1, percentage: 0 },
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organisation) return;

    try {
      // Check subscription status and fetch permission overrides in parallel
      const [subResult, overridesResult] = await Promise.all([
        supabase.functions.invoke("check-subscription"),
        supabase
          .from("plan_permission_overrides" as any)
          .select("permission_key, permission_value")
          .eq("org_id", organisation.id),
      ]);

      const subData = subResult.data;

      // Build permission overrides map
      const overrideMap: Record<string, string> = {};
      if (overridesResult.data) {
        (overridesResult.data as any[]).forEach((row: any) => {
          overrideMap[row.permission_key] = row.permission_value;
        });
      }
      setPermissionOverrides(overrideMap);

      if (subData) {
        const planTier = (subData.plan_tier || "free") as PlanTier;
        setTier(planTier);
        setSubscribed(subData.subscribed || false);
        setSubscriptionEnd(subData.subscription_end || null);
        setSubscriptionStatus(subData.subscription_status || "inactive");
        setAdminOverride(subData.admin_override || false);

        const limits = PLAN_CONFIGS[planTier]?.limits ?? PLAN_CONFIGS.free.limits;

        // Compute effective numeric limits (applying overrides)
        const effectiveAssessmentLimit = overrideMap.assessments
          ? parseInt(overrideMap.assessments, 10)
          : limits.assessments;
        const effectiveResponsesLimit = overrideMap.responses_per_month
          ? parseInt(overrideMap.responses_per_month, 10)
          : limits.responses_per_month;
        const effectiveTeamLimit = overrideMap.team_members
          ? parseInt(overrideMap.team_members, 10)
          : limits.team_members;

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
            limit: effectiveAssessmentLimit,
            percentage: effectiveAssessmentLimit === -1 ? 0 : Math.round((assessments / effectiveAssessmentLimit) * 100),
          },
          responses_per_month: {
            current: responses,
            limit: effectiveResponsesLimit,
            percentage: effectiveResponsesLimit === -1 ? 0 : Math.round((responses / effectiveResponsesLimit) * 100),
          },
          team_members: {
            current: members,
            limit: effectiveTeamLimit,
            percentage: effectiveTeamLimit === -1 ? 0 : Math.round((members / effectiveTeamLimit) * 100),
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
    // Check permission overrides first
    const overrideVal = permissionOverrides[limitType];
    if (overrideVal !== undefined) {
      const numLimit = parseInt(overrideVal, 10);
      if (numLimit === -1) return true;
      const usageData = (usage as any)[limitType];
      return usageData ? usageData.current < numLimit : true;
    }

    const config = PLAN_CONFIGS[tier]?.limits ?? PLAN_CONFIGS.free.limits;
    const limit = (config as any)[limitType];
    if (limit === -1) return true;
    const usageData = (usage as any)[limitType];
    return usageData ? usageData.current < limit : true;
  }, [tier, usage, permissionOverrides]);

  const isFeatureEnabled = useCallback((feature: string) => {
    // Check permission overrides first
    const overrideVal = permissionOverrides[feature];
    if (overrideVal !== undefined) {
      // Boolean check
      if (overrideVal === "true") return true;
      if (overrideVal === "false") return false;
      // Enum string check (e.g. "none", "basic", "full")
      if (overrideVal === "none") return false;
      // Numeric check
      const num = parseInt(overrideVal, 10);
      if (!isNaN(num)) return num !== 0;
      // Any other string value means enabled
      return true;
    }

    const config = PLAN_CONFIGS[tier]?.limits ?? PLAN_CONFIGS.free.limits;
    const val = (config as any)[feature];
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val !== "none";
    if (typeof val === "number") return val !== 0;
    return false;
  }, [tier, permissionOverrides]);

  return {
    tier,
    subscribed,
    subscriptionEnd,
    subscriptionStatus,
    adminOverride,
    usage,
    loading,
    canCreate,
    isFeatureEnabled,
    refresh,
  };
}
