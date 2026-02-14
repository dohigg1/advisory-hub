import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TIERS = ["free", "starter", "professional", "firm"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check super admin
    const { data: adminCheck } = await supabase
      .from("super_admins")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "list_orgs": {
        const { search, limit = 50, offset = 0 } = params;
        let query = supabase
          .from("organisations")
          .select("*")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        const { data: orgs, error: orgsErr } = await query;
        if (orgsErr) throw orgsErr;

        // Enrich with counts
        const orgIds = (orgs || []).map((o: any) => o.id);
        
        const [profilesRes, assessmentsRes, leadsRes, overridesRes] = await Promise.all([
          supabase.from("profiles").select("org_id").in("org_id", orgIds),
          supabase.from("assessments").select("id, org_id").in("org_id", orgIds),
          supabase.from("leads").select("org_id").in("org_id", orgIds).eq("status", "completed"),
          supabase.from("plan_permission_overrides").select("*").in("org_id", orgIds),
        ]);

        const memberMap: Record<string, number> = {};
        (profilesRes.data ?? []).forEach((p: any) => {
          memberMap[p.org_id] = (memberMap[p.org_id] || 0) + 1;
        });

        const assessmentMap: Record<string, number> = {};
        (assessmentsRes.data ?? []).forEach((a: any) => {
          assessmentMap[a.org_id] = (assessmentMap[a.org_id] || 0) + 1;
        });

        const leadMap: Record<string, number> = {};
        (leadsRes.data ?? []).forEach((l: any) => {
          leadMap[l.org_id] = (leadMap[l.org_id] || 0) + 1;
        });

        const overrideMap: Record<string, any[]> = {};
        (overridesRes.data ?? []).forEach((o: any) => {
          if (!overrideMap[o.org_id]) overrideMap[o.org_id] = [];
          overrideMap[o.org_id].push(o);
        });

        const enriched = (orgs || []).map((org: any) => ({
          ...org,
          effective_tier: org.admin_plan_tier || org.plan_tier,
          member_count: memberMap[org.id] || 0,
          assessment_count: assessmentMap[org.id] || 0,
          completed_leads_count: leadMap[org.id] || 0,
          permission_overrides: overrideMap[org.id] || [],
        }));

        return new Response(JSON.stringify({ orgs: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_org": {
        const { org_id } = params;
        if (!org_id) throw new Error("org_id required");

        const [orgRes, membersRes, assessmentsRes, leadsRes, overridesRes, subsRes] = await Promise.all([
          supabase.from("organisations").select("*").eq("id", org_id).single(),
          supabase.from("profiles").select("id, email, full_name, role, created_at").eq("org_id", org_id),
          supabase.from("assessments").select("id, title, status, created_at").eq("org_id", org_id).order("created_at", { ascending: false }),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("org_id", org_id).eq("status", "completed"),
          supabase.from("plan_permission_overrides").select("*").eq("org_id", org_id),
          supabase.from("subscriptions").select("*").eq("org_id", org_id).order("created_at", { ascending: false }).limit(5),
        ]);

        return new Response(JSON.stringify({
          org: orgRes.data,
          members: membersRes.data || [],
          assessments: assessmentsRes.data || [],
          completed_leads_count: leadsRes.count || 0,
          permission_overrides: overridesRes.data || [],
          subscriptions: subsRes.data || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_plan_tier": {
        const { org_id, plan_tier, notes } = params;
        if (!org_id) throw new Error("org_id required");

        if (plan_tier !== null && plan_tier !== undefined && !VALID_TIERS.includes(plan_tier)) {
          throw new Error(`Invalid plan tier: ${plan_tier}`);
        }

        const updateData: any = {
          admin_plan_tier: plan_tier || null,
          admin_notes: notes || null,
          admin_override_at: plan_tier ? new Date().toISOString() : null,
          admin_override_by: plan_tier ? user.id : null,
        };

        // When setting, also update plan_tier directly
        if (plan_tier) {
          updateData.plan_tier = plan_tier;
        }

        const { error: updateErr } = await supabase
          .from("organisations")
          .update(updateData)
          .eq("id", org_id);

        if (updateErr) throw updateErr;

        // Audit log
        await supabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action: plan_tier ? "set_plan_tier" : "remove_plan_override",
          target_org_id: org_id,
          details: { plan_tier, notes },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "set_permissions": {
        const { org_id, overrides } = params;
        if (!org_id) throw new Error("org_id required");
        if (!Array.isArray(overrides)) throw new Error("overrides must be an array");

        for (const override of overrides) {
          if (!override.value || override.value === "") {
            // Delete override
            await supabase
              .from("plan_permission_overrides")
              .delete()
              .eq("org_id", org_id)
              .eq("permission_key", override.key);
          } else {
            // Upsert override
            await supabase
              .from("plan_permission_overrides")
              .upsert({
                org_id,
                permission_key: override.key,
                permission_value: String(override.value),
                created_by: user.id,
              }, { onConflict: "org_id,permission_key" });
          }
        }

        // Audit log
        await supabase.from("admin_audit_log").insert({
          admin_user_id: user.id,
          action: "set_permissions",
          target_org_id: org_id,
          details: { overrides },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_audit_log": {
        const { org_id, limit = 50 } = params;
        let query = supabase
          .from("admin_audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (org_id) {
          query = query.eq("target_org_id", org_id);
        }

        const { data: logs, error: logsErr } = await query;
        if (logsErr) throw logsErr;

        // Enrich with admin emails and org names
        const adminIds = [...new Set((logs || []).map((l: any) => l.admin_user_id))];
        const orgIds = [...new Set((logs || []).filter((l: any) => l.target_org_id).map((l: any) => l.target_org_id))];

        const [adminsRes, orgsRes] = await Promise.all([
          adminIds.length > 0 ? supabase.auth.admin.listUsers() : Promise.resolve({ data: { users: [] } }),
          orgIds.length > 0 ? supabase.from("organisations").select("id, name").in("id", orgIds) : Promise.resolve({ data: [] }),
        ]);

        const adminEmailMap: Record<string, string> = {};
        ((adminsRes as any).data?.users ?? []).forEach((u: any) => {
          adminEmailMap[u.id] = u.email || "Unknown";
        });

        const orgNameMap: Record<string, string> = {};
        ((orgsRes as any).data ?? []).forEach((o: any) => {
          orgNameMap[o.id] = o.name;
        });

        const enrichedLogs = (logs || []).map((log: any) => ({
          ...log,
          admin_email: adminEmailMap[log.admin_user_id] || "Unknown",
          org_name: log.target_org_id ? orgNameMap[log.target_org_id] || "Unknown" : null,
        }));

        return new Response(JSON.stringify({ logs: enrichedLogs }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "platform_stats": {
        const [orgsRes, usersRes, assessmentsRes, leadsRes] = await Promise.all([
          supabase.from("organisations").select("id, plan_tier, admin_plan_tier", { count: "exact" }).is("deleted_at", null),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("assessments").select("id", { count: "exact", head: true }),
          supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "completed"),
        ]);

        const tierBreakdown: Record<string, number> = {};
        (orgsRes.data ?? []).forEach((o: any) => {
          const tier = o.admin_plan_tier || o.plan_tier;
          tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
        });

        return new Response(JSON.stringify({
          total_orgs: orgsRes.count || 0,
          total_users: usersRes.count || 0,
          total_assessments: assessmentsRes.count || 0,
          total_completed_leads: leadsRes.count || 0,
          tier_breakdown: tierBreakdown,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
