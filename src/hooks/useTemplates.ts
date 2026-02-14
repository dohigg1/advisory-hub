import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TEMPLATE_FIXTURES, type TemplateFixture } from "@/data/templates";
import type { PlanTier } from "@/config/plans";

const TIER_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  firm: 3,
};

export interface DBTemplate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  preview_image_url: string | null;
  question_count: number;
  template_data_json: any;
  is_active: boolean;
  min_plan_tier: string | null;
  sort_order: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithAccess extends TemplateFixture {
  id?: string;
  min_plan_tier: string | null;
  featured: boolean;
  locked: boolean;
  sort_order: number;
}

/**
 * Fetches templates from the database. Falls back to TEMPLATE_FIXTURES
 * if no DB templates exist. Computes `locked` based on the user's tier.
 */
export function useTemplates(userTier: PlanTier = "free") {
  const [templates, setTemplates] = useState<TemplateWithAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("templates" as any)
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false });

        const dbTemplates = (data ?? []) as unknown as DBTemplate[];

        if (dbTemplates.length > 0) {
          // Use DB templates
          const userRank = TIER_RANK[userTier] ?? 0;
          const mapped: TemplateWithAccess[] = dbTemplates.map((t) => {
            const minRank = t.min_plan_tier ? (TIER_RANK[t.min_plan_tier] ?? 0) : 0;
            return {
              id: t.id,
              title: t.title,
              description: t.description || "",
              category: t.category as any,
              question_count: t.question_count,
              template_data_json: t.template_data_json,
              min_plan_tier: t.min_plan_tier,
              featured: t.featured,
              locked: userRank < minRank,
              sort_order: t.sort_order,
            };
          });
          setTemplates(mapped);
        } else {
          // Fallback to fixtures (all free, unlocked)
          const mapped: TemplateWithAccess[] = TEMPLATE_FIXTURES.map((t, idx) => ({
            ...t,
            min_plan_tier: null,
            featured: false,
            locked: false,
            sort_order: idx,
          }));
          setTemplates(mapped);
        }
      } catch {
        // Fallback to fixtures
        const mapped: TemplateWithAccess[] = TEMPLATE_FIXTURES.map((t, idx) => ({
          ...t,
          min_plan_tier: null,
          featured: false,
          locked: false,
          sort_order: idx,
        }));
        setTemplates(mapped);
      } finally {
        setLoading(false);
      }
    })();
  }, [userTier]);

  return { templates, loading };
}

/** Check if a user's tier meets the minimum required tier */
export function meetsMinTier(userTier: string, minTier: string | null): boolean {
  if (!minTier) return true;
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[minTier] ?? 0);
}
