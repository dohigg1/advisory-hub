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
      // Check subscription status and permission overrides in parallel
      const [subRes, overridesRes] = await Promise.all([
        supabase.functions.invoke("check-subscription"),
        supabase
          .from("plan_permission_overrides" as any)
          .select("permission_key, permission_value")
          .eq("org_id", organisation.id),
      ]);

      const subData = subRes.data;
      const overridesData = (overridesRes.data as any[]) || [];

      // Build overrides map
      const overridesMap: Record<string, string> = {};
      overridesData.forEach((o: any) => {
        overridesMap[o.permission_key] = o.permission_value;
      });
      setPermissionOverrides(overridesMap);

      if (subData) {
        const planTier = (subData.plan_tier || "free") as PlanTier;
        setTier(planTier);
        setSubscribed(subData.subscribed || false);
        setSubscriptionEnd(subData.subscription_end || null);
        setSubscriptionStatus(subData.subscription_status || "inactive");
        setAdminOverride(subData.admin_override || false);

        const limits = PLAN_CONFIGS[planTier].limits;

        // Apply numeric overrides to limits
        const effectiveAssessmentLimit = overridesMap.assessments
          ? parseInt(overridesMap.assessments, 10)
          : limits.assessments;
        const effectiveResponseLimit = overridesMap.responses_per_month
          ? parseInt(overridesMap.responses_per_month, 10)
          : limits.responses_per_month;
        const effectiveMemberLimit = overridesMap.team_members
          ? parseInt(overridesMap.team_members, 10)
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
            limit: effectiveResponseLimit,
            percentage: effectiveResponseLimit === -1 ? 0 : Math.round((responses / effectiveResponseLimit) * 100),
          },
          team_members: {
            current: members,
            limit: effectiveMemberLimit,
            percentage: effectiveMemberLimit === -1 ? 0 : Math.round((members / effectiveMemberLimit) * 100),
          },
        });
      }
    } catch (err) {
      console.error("Failed to check plan limits:", err);
      const orgTier = (organisation.plan_tier || "free") as PlanTier;
      setTier(orgTier);
    } finally {
      setLoading(false);
    }
  }, [organisation]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const canCreate = useCallback((limitType: string) => {
    // Check permission overrides first
    const overrideVal = permissionOverrides[limitType];
    if (overrideVal !== undefined) {
      const numVal = parseInt(overrideVal, 10);
      if (!isNaN(numVal)) {
        if (numVal === -1) return true;
        const usageData = (usage as any)[limitType];
        return usageData ? usageData.current < numVal : true;
      }
    }
    const config = PLAN_CONFIGS[tier].limits;
    const limit = (config as any)[limitType];
    if (limit === -1) return true;
    const usageData = (usage as any)[limitType];
    return usageData ? usageData.current < limit : true;
  }, [tier, usage, permissionOverrides]);

  const isFeatureEnabled = useCallback((feature: string) => {
    // Check permission overrides first
    const overrideVal = permissionOverrides[feature];
    if (overrideVal !== undefined) {
      if (overrideVal === "true") return true;
      if (overrideVal === "false") return false;
      if (typeof overrideVal === "string" && overrideVal !== "none") return true;
      const numVal = parseInt(overrideVal, 10);
      if (!isNaN(numVal)) return numVal !== 0;
      return false;
    }
    const config = PLAN_CONFIGS[tier].limits;
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
