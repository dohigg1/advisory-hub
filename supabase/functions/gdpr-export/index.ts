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
    const { email, org_id } = await req.json();

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
        JSON.stringify({ error: "Cannot export data for another organisation" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Query all tables for records matching the email ──────────

    // 1. Leads - directly matched by email + org_id
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .eq("email", email)
      .eq("org_id", org_id);

    const leadRecords = leads || [];
    const leadIds = leadRecords.map((l: any) => l.id);

    // 2. Responses - linked via lead_id
    const { data: responses } = leadIds.length > 0
      ? await supabase
          .from("responses")
          .select("*")
          .in("lead_id", leadIds)
      : { data: [] };

    // 3. Scores - linked via lead_id
    const { data: scores } = leadIds.length > 0
      ? await supabase
          .from("scores")
          .select("*")
          .in("lead_id", leadIds)
      : { data: [] };

    // 4. Assessment iterations - matched by lead_email
    const { data: iterations } = await supabase
      .from("assessment_iterations")
      .select("*")
      .eq("lead_email", email);

    // 5. Portal sessions - matched by lead_email + org_id
    const { data: portalSessions } = await supabase
      .from("portal_sessions")
      .select("*")
      .eq("lead_email", email)
      .eq("org_id", org_id);

    // ── Compile GDPR export document ────────────────────────────

    const exportDocument = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        data_subject_email: email,
        org_id: org_id,
        requested_by: user.id,
        format_version: "1.0",
      },
      personal_data: {
        leads: leadRecords,
        responses: responses || [],
        scores: scores || [],
        assessment_iterations: iterations || [],
        portal_sessions: portalSessions || [],
      },
      record_counts: {
        leads: leadRecords.length,
        responses: (responses || []).length,
        scores: (scores || []).length,
        assessment_iterations: (iterations || []).length,
        portal_sessions: (portalSessions || []).length,
      },
    };

    // ── Log the export in audit_log ─────────────────────────────

    await supabase.from("audit_log").insert({
      org_id: org_id,
      user_id: profile.id,
      action: "gdpr_data_export",
      target_type: "data_subject",
      target_id: email,
      metadata_json: {
        record_counts: exportDocument.record_counts,
        exported_at: exportDocument.export_metadata.exported_at,
      },
    });

    // ── Return as downloadable JSON ─────────────────────────────

    const filename = `gdpr-export-${email.replace(/[^a-zA-Z0-9]/g, "_")}-${Date.now()}.json`;

    return new Response(JSON.stringify(exportDocument, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GDPR export error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "GDPR export failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
