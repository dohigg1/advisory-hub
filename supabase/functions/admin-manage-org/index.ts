import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TIERS = ["free", "starter", "professional", "firm"];

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
    // 1. Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) throw new Error("Auth error");

    // 2. Check super admin
    const { data: adminRow } = await supabaseAdmin
      .from("super_admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, params = {} } = body;

    switch (action) {
      case "list_orgs":
        return await handleListOrgs(supabaseAdmin, params);
      case "get_org":
        return await handleGetOrg(supabaseAdmin, params);
      case "set_plan_tier":
        return await handleSetPlanTier(supabaseAdmin, user.id, params);
      case "set_permissions":
        return await handleSetPermissions(supabaseAdmin, user.id, params);
      case "get_audit_log":
        return await handleGetAuditLog(supabaseAdmin, params);
      case "platform_stats":
        return await handlePlatformStats(supabaseAdmin);
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── list_orgs ───────────────────────────────────────────────
async function handleListOrgs(
  sb: ReturnType<typeof createClient>,
  params: { search?: string; limit?: number; offset?: number }
) {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;

  let query = sb
    .from("organisations")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,slug.ilike.%${params.search}%`
    );
  }

  const { data: orgs, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);

  // Enrich each org with counts and overrides
  const orgIds = (orgs ?? []).map((o: any) => o.id);

  const [memberRes, assessmentRes, leadRes, overridesRes] = await Promise.all([
    sb.from("profiles").select("org_id").in("org_id", orgIds),
    sb.from("assessments").select("id, org_id").in("org_id", orgIds),
    sb
      .from("leads")
      .select("id, org_id")
      .in("org_id", orgIds)
      .eq("status", "completed"),
    sb
      .from("plan_permission_overrides")
      .select("*")
      .in("org_id", orgIds),
  ]);

  const memberMap: Record<string, number> = {};
  (memberRes.data ?? []).forEach((p: any) => {
    memberMap[p.org_id] = (memberMap[p.org_id] || 0) + 1;
  });

  const assessmentMap: Record<string, number> = {};
  (assessmentRes.data ?? []).forEach((a: any) => {
    assessmentMap[a.org_id] = (assessmentMap[a.org_id] || 0) + 1;
  });

  const leadMap: Record<string, number> = {};
  (leadRes.data ?? []).forEach((l: any) => {
    leadMap[l.org_id] = (leadMap[l.org_id] || 0) + 1;
  });

  const overrideMap: Record<string, any[]> = {};
  (overridesRes.data ?? []).forEach((o: any) => {
    if (!overrideMap[o.org_id]) overrideMap[o.org_id] = [];
    overrideMap[o.org_id].push(o);
  });

  const enriched = (orgs ?? []).map((org: any) => ({
    ...org,
    effective_tier: org.admin_plan_tier || org.plan_tier || "free",
    member_count: memberMap[org.id] || 0,
    assessment_count: assessmentMap[org.id] || 0,
    completed_leads_count: leadMap[org.id] || 0,
    permission_overrides: overrideMap[org.id] || [],
  }));

  return jsonResponse({ orgs: enriched });
}

// ─── get_org ─────────────────────────────────────────────────
async function handleGetOrg(
  sb: ReturnType<typeof createClient>,
  params: { org_id: string }
) {
  if (!params.org_id) return jsonResponse({ error: "org_id required" }, 400);

  const [orgRes, membersRes, assessmentsRes, leadsRes, overridesRes] =
    await Promise.all([
      sb.from("organisations").select("*").eq("id", params.org_id).single(),
      sb
        .from("profiles")
        .select("id, auth_user_id, full_name, email, role, created_at")
        .eq("org_id", params.org_id),
      sb
        .from("assessments")
        .select("id, title, status, created_at")
        .eq("org_id", params.org_id)
        .order("created_at", { ascending: false }),
      sb
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("org_id", params.org_id)
        .eq("status", "completed"),
      sb
        .from("plan_permission_overrides")
        .select("*")
        .eq("org_id", params.org_id),
    ]);

  if (orgRes.error)
    return jsonResponse({ error: orgRes.error.message }, 500);

  return jsonResponse({
    org: orgRes.data,
    members: membersRes.data ?? [],
    assessments: assessmentsRes.data ?? [],
    completed_leads_count: leadsRes.count ?? 0,
    permission_overrides: overridesRes.data ?? [],
  });
}

// ─── set_plan_tier ───────────────────────────────────────────
async function handleSetPlanTier(
  sb: ReturnType<typeof createClient>,
  adminUserId: string,
  params: { org_id: string; plan_tier: string | null; notes?: string }
) {
  if (!params.org_id) return jsonResponse({ error: "org_id required" }, 400);

  if (params.plan_tier !== null && !VALID_TIERS.includes(params.plan_tier)) {
    return jsonResponse({ error: "Invalid plan tier" }, 400);
  }

  const updateData: Record<string, unknown> = {
    admin_plan_tier: params.plan_tier,
    admin_notes: params.notes ?? null,
    admin_override_at: params.plan_tier ? new Date().toISOString() : null,
    admin_override_by: params.plan_tier ? adminUserId : null,
  };

  // When setting (not null): also update plan_tier so it takes effect immediately
  if (params.plan_tier) {
    updateData.plan_tier = params.plan_tier;
  }

  const { error } = await sb
    .from("organisations")
    .update(updateData)
    .eq("id", params.org_id);

  if (error) return jsonResponse({ error: error.message }, 500);

  // Audit log
  await sb.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action: params.plan_tier ? "set_plan_tier" : "remove_plan_tier",
    target_org_id: params.org_id,
    details: {
      plan_tier: params.plan_tier,
      notes: params.notes || null,
    },
  });

  return jsonResponse({ success: true });
}

// ─── set_permissions ─────────────────────────────────────────
async function handleSetPermissions(
  sb: ReturnType<typeof createClient>,
  adminUserId: string,
  params: { org_id: string; overrides: Array<{ key: string; value: string | null }> }
) {
  if (!params.org_id) return jsonResponse({ error: "org_id required" }, 400);
  if (!Array.isArray(params.overrides))
    return jsonResponse({ error: "overrides must be an array" }, 400);

  for (const override of params.overrides) {
    if (!override.value || override.value === "") {
      // Delete override
      await sb
        .from("plan_permission_overrides")
        .delete()
        .eq("org_id", params.org_id)
        .eq("permission_key", override.key);
    } else {
      // Upsert override
      await sb.from("plan_permission_overrides").upsert(
        {
          org_id: params.org_id,
          permission_key: override.key,
          permission_value: override.value,
          created_by: adminUserId,
        },
        { onConflict: "org_id,permission_key" }
      );
    }
  }

  // Audit log
  await sb.from("admin_audit_log").insert({
    admin_user_id: adminUserId,
    action: "set_permissions",
    target_org_id: params.org_id,
    details: { overrides: params.overrides },
  });

  return jsonResponse({ success: true });
}

// ─── get_audit_log ───────────────────────────────────────────
async function handleGetAuditLog(
  sb: ReturnType<typeof createClient>,
  params: { org_id?: string; limit?: number }
) {
  const limit = params.limit ?? 100;

  let query = sb
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.org_id) {
    query = query.eq("target_org_id", params.org_id);
  }

  const { data, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ logs: data ?? [] });
}

// ─── platform_stats ──────────────────────────────────────────
async function handlePlatformStats(sb: ReturnType<typeof createClient>) {
  const [orgsRes, usersRes, assessmentsRes, leadsRes] = await Promise.all([
    sb.from("organisations").select("id, plan_tier, admin_plan_tier").is("deleted_at", null),
    sb.from("profiles").select("id", { count: "exact", head: true }),
    sb.from("assessments").select("id", { count: "exact", head: true }),
    sb
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  const orgs = orgsRes.data ?? [];

  // Tier breakdown using effective tier
  const tierBreakdown: Record<string, number> = {};
  orgs.forEach((org: any) => {
    const effectiveTier = org.admin_plan_tier || org.plan_tier || "free";
    tierBreakdown[effectiveTier] = (tierBreakdown[effectiveTier] || 0) + 1;
  });

  return jsonResponse({
    total_orgs: orgs.length,
    total_users: usersRes.count ?? 0,
    total_assessments: assessmentsRes.count ?? 0,
    total_completed_leads: leadsRes.count ?? 0,
    tier_breakdown: tierBreakdown,
  });
}
