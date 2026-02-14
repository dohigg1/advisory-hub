import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  ctaUrl: string | null;
  ctaLabel: string;
  completed: boolean;
  completedAt: string | null;
}

const ONBOARDING_STEPS = [
  {
    key: "setup_org",
    label: "Set up your organisation",
    description: "Add your organisation name and logo",
    ctaUrl: "/settings",
    ctaLabel: "Go to Settings",
  },
  {
    key: "create_assessment",
    label: "Create your first assessment",
    description: "Start building a client assessment",
    ctaUrl: "/assessments",
    ctaLabel: "Create Assessment",
  },
  {
    key: "add_questions",
    label: "Add questions",
    description: "Add at least 5 questions to your assessment",
    ctaUrl: null,
    ctaLabel: "Open Builder",
  },
  {
    key: "configure_scoring",
    label: "Configure scoring tiers",
    description: "Define at least 2 scoring tiers",
    ctaUrl: null,
    ctaLabel: "Set Up Scoring",
  },
  {
    key: "customise_landing",
    label: "Customise your landing page",
    description: "Edit the hero text on your landing page",
    ctaUrl: null,
    ctaLabel: "Edit Landing Page",
  },
  {
    key: "publish",
    label: "Publish and share",
    description: "Set your assessment to published",
    ctaUrl: null,
    ctaLabel: "Publish Now",
  },
  {
    key: "first_response",
    label: "Get your first response",
    description: "Share your assessment and receive a completion",
    ctaUrl: null,
    ctaLabel: "Share Link",
  },
] as const;

interface UseOnboardingReturn {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  loading: boolean;
  markComplete: (stepKey: string) => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const { organisation, user } = useAuth();
  const [completedKeys, setCompletedKeys] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!organisation?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from("onboarding_progress")
        .select("step_key, completed_at")
        .eq("org_id", organisation.id);

      if (error) {
        console.error("Failed to fetch onboarding progress:", error);
        return;
      }

      const map: Record<string, string> = {};
      if (data) {
        for (const row of data) {
          map[row.step_key] = row.completed_at;
        }
      }
      setCompletedKeys(map);
    } catch (err) {
      console.error("Failed to fetch onboarding progress:", err);
    } finally {
      setLoading(false);
    }
  }, [organisation?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const markComplete = useCallback(
    async (stepKey: string) => {
      if (!organisation?.id || !user?.id) return;

      // Optimistic update
      const now = new Date().toISOString();
      setCompletedKeys((prev) => ({ ...prev, [stepKey]: now }));

      try {
        const { error } = await (supabase as any).from("onboarding_progress").upsert(
          {
            org_id: organisation.id,
            step_key: stepKey,
            completed_at: now,
            completed_by: user.id,
          },
          { onConflict: "org_id,step_key" }
        );

        if (error) {
          console.error("Failed to mark step complete:", error);
          // Revert optimistic update
          setCompletedKeys((prev) => {
            const next = { ...prev };
            delete next[stepKey];
            return next;
          });
        }
      } catch (err) {
        console.error("Failed to mark step complete:", err);
        setCompletedKeys((prev) => {
          const next = { ...prev };
          delete next[stepKey];
          return next;
        });
      }
    },
    [organisation?.id, user?.id]
  );

  const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    description: step.description,
    ctaUrl: step.ctaUrl,
    ctaLabel: step.ctaLabel,
    completed: !!completedKeys[step.key],
    completedAt: completedKeys[step.key] ?? null,
  }));

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const isComplete = completedCount === totalCount;

  return {
    steps,
    completedCount,
    totalCount,
    isComplete,
    loading,
    markComplete,
  };
}
