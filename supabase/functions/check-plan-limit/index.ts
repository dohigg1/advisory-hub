import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: { assessments: 1, responses_per_month: 10, team_members: 1 },
  starter: { assessments: 5, responses_per_month: 200, team_members: 2 },
  professional: { assessments: 20, responses_per_month: 2000, team_members: 5 },
  firm: { assessments: -1, responses_per_month: 10000, team_members: 15 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { org_id, limit_type } = await req.json();
    if (!org_id || !limit_type) throw new Error("org_id and limit_type required");

    // Get org plan
    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("plan_tier")
      .eq("id", org_id)
      .single();

    const tier = org?.plan_tier || "free";
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;
    const limit = limits[limit_type];

    if (limit === undefined) throw new Error(`Unknown limit_type: ${limit_type}`);
    if (limit === -1) {
      return new Response(JSON.stringify({ allowed: true, current: 0, limit: -1, tier }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let current = 0;

    if (limit_type === "assessments") {
      const { count } = await supabaseAdmin
        .from("assessments")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org_id);
      current = count || 0;
    } else if (limit_type === "responses_per_month") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabaseAdmin
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org_id)
        .eq("status", "completed")
        .gte("completed_at", startOfMonth.toISOString());
      current = count || 0;
    } else if (limit_type === "team_members") {
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org_id);
      current = count || 0;
    }

    // 10% grace period for responses
    const effectiveLimit = limit_type === "responses_per_month" ? Math.ceil(limit * 1.1) : limit;
    const allowed = current < effectiveLimit;
    const percentage = Math.round((current / limit) * 100);

    return new Response(JSON.stringify({
      allowed,
      current,
      limit,
      tier,
      percentage,
      grace_limit: effectiveLimit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
