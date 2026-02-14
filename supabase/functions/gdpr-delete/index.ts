import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, org_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.org_id || profile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { email, org_id, confirm } = await req.json();

    if (!email || !org_id) {
      return new Response(
        JSON.stringify({ error: "email and org_id are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ensure the requesting admin belongs to the target org
    if (profile.org_id !== org_id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete data for another organisation" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Count records that would be affected ────────────────────

    // 1. Leads
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .eq("email", email)
      .eq("org_id", org_id);

    const leadIds = (leads || []).map((l: any) => l.id);

    // 2. Responses (via lead_id)
    const { count: responsesCount } = leadIds.length > 0
      ? await supabase
          .from("responses")
          .select("id", { count: "exact", head: true })
          .in("lead_id", leadIds)
      : { count: 0 };

    // 3. Scores (via lead_id)
    const { count: scoresCount } = leadIds.length > 0
      ? await supabase
          .from("scores")
          .select("id", { count: "exact", head: true })
          .in("lead_id", leadIds)
      : { count: 0 };

    // 4. Assessment iterations (by lead_email)
    const { count: iterationsCount } = await supabase
      .from("assessment_iterations")
      .select("id", { count: "exact", head: true })
      .eq("lead_email", email);

    // 5. Portal sessions (by lead_email + org_id)
    const { count: portalSessionsCount } = await supabase
      .from("portal_sessions")
      .select("id", { count: "exact", head: true })
      .eq("lead_email", email)
      .eq("org_id", org_id);

    const recordCounts = {
      leads: leadIds.length,
      responses: responsesCount ?? 0,
      scores: scoresCount ?? 0,
      assessment_iterations: iterationsCount ?? 0,
      portal_sessions: portalSessionsCount ?? 0,
    };

    const totalRecords = Object.values(recordCounts).reduce(
      (sum, c) => sum + c,
      0
    );

    // ── Dry-run mode: return counts only ────────────────────────

    if (!confirm) {
      return new Response(
        JSON.stringify({
          mode: "dry_run",
          message: `Found ${totalRecords} record(s) that would be deleted.`,
          record_counts: recordCounts,
          total_records: totalRecords,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Confirmed deletion: cascade delete all records ──────────

    // Delete in dependency order (children first):
    // responses -> scores -> assessment_iterations -> portal_sessions -> leads

    let deletedCounts = {
      responses: 0,
      scores: 0,
      assessment_iterations: 0,
      portal_sessions: 0,
      leads: 0,
    };

    // 1. Delete responses (depends on leads via lead_id)
    if (leadIds.length > 0) {
      const { count } = await supabase
        .from("responses")
        .delete({ count: "exact" })
        .in("lead_id", leadIds);
      deletedCounts.responses = count ?? 0;
    }

    // 2. Delete scores (depends on leads via lead_id)
    if (leadIds.length > 0) {
      const { count } = await supabase
        .from("scores")
        .delete({ count: "exact" })
        .in("lead_id", leadIds);
      deletedCounts.scores = count ?? 0;
    }

    // 3. Delete assessment iterations (by lead_email)
    {
      const { count } = await supabase
        .from("assessment_iterations")
        .delete({ count: "exact" })
        .eq("lead_email", email);
      deletedCounts.assessment_iterations = count ?? 0;
    }

    // 4. Delete portal sessions (by lead_email + org_id)
    {
      const { count } = await supabase
        .from("portal_sessions")
        .delete({ count: "exact" })
        .eq("lead_email", email)
        .eq("org_id", org_id);
      deletedCounts.portal_sessions = count ?? 0;
    }

    // 5. Delete leads (the parent records)
    if (leadIds.length > 0) {
      const { count } = await supabase
        .from("leads")
        .delete({ count: "exact" })
        .in("id", leadIds);
      deletedCounts.leads = count ?? 0;
    }

    const totalDeleted = Object.values(deletedCounts).reduce(
      (sum, c) => sum + c,
      0
    );

    // ── Log the deletion in audit_log (metadata only, no PII) ──

    await supabase.from("audit_log").insert({
      org_id: org_id,
      user_id: profile.id,
      action: "gdpr_data_deletion",
      target_type: "data_subject",
      target_id: "[redacted]",
      metadata_json: {
        deleted_counts: deletedCounts,
        total_deleted: totalDeleted,
        performed_at: new Date().toISOString(),
        performed_by: user.id,
      },
    });

    return new Response(
      JSON.stringify({
        mode: "confirmed",
        message: `Successfully deleted ${totalDeleted} record(s) for the data subject.`,
        deleted_counts: deletedCounts,
        total_deleted: totalDeleted,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("GDPR deletion error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "GDPR deletion failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
