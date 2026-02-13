import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function toCsv(data: any[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Unauthorized");

    // Get org
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("org_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.org_id || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const orgId = profile.org_id;

    // Fetch all data
    const [assessments, leads, scores, categories] = await Promise.all([
      supabaseAdmin.from("assessments").select("*").eq("org_id", orgId),
      supabaseAdmin.from("leads").select("*").eq("org_id", orgId),
      supabaseAdmin.from("scores").select("*").eq("assessment_id", orgId), // will fix below
      supabaseAdmin.from("categories").select("*, assessments!inner(org_id)").eq("assessments.org_id", orgId),
    ]);

    // Get all assessment IDs for this org
    const assessmentIds = (assessments.data || []).map((a: any) => a.id);

    // Get scores for org's assessments
    const { data: scoresData } = assessmentIds.length > 0
      ? await supabaseAdmin.from("scores").select("*").in("assessment_id", assessmentIds)
      : { data: [] };

    // Get responses via leads
    const leadIds = (leads.data || []).map((l: any) => l.id);
    const { data: responsesData } = leadIds.length > 0
      ? await supabaseAdmin.from("responses").select("*").in("lead_id", leadIds)
      : { data: [] };

    // Build CSV files content as a combined JSON response
    const exportData = {
      assessments: toCsv(assessments.data || []),
      leads: toCsv(leads.data || []),
      scores: toCsv(scoresData || []),
      categories: toCsv((categories.data || []).map(({ assessments: _, ...rest }: any) => rest)),
      responses: toCsv(responsesData || []),
    };

    // Log audit
    await supabaseAdmin.from("audit_log").insert({
      org_id: orgId,
      user_id: profile.org_id, // we'll use profile id
      action: "data_exported",
      target_type: "organisation",
      target_id: orgId,
    });

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
