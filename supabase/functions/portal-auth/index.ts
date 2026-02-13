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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  try {
    const body = await req.json();
    const { action } = body;

    // ── ACTION: request-magic-link ──
    if (action === "request-magic-link") {
      const { email, org_slug } = body;
      if (!email || !org_slug) {
        return new Response(JSON.stringify({ error: "email and org_slug required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find org by slug
      const { data: org, error: orgErr } = await supabase
        .from("organisations")
        .select("id, name, logo_url, primary_colour, slug")
        .eq("slug", org_slug)
        .single();

      if (orgErr || !org) {
        return new Response(JSON.stringify({ error: "Organisation not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check portal is enabled
      const { data: portalSettings } = await supabase
        .from("portal_settings")
        .select("enabled")
        .eq("org_id", org.id)
        .single();

      if (!portalSettings?.enabled) {
        return new Response(JSON.stringify({ error: "Client portal is not enabled for this organisation" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify this email has lead records for this org
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("email", email.toLowerCase());

      if (!count || count === 0) {
        // Don't reveal whether email exists - just say "sent"
        return new Response(JSON.stringify({ success: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a random token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

      // Hash token for storage
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      // Store session
      await supabase.from("portal_sessions").insert({
        org_id: org.id,
        lead_email: email.toLowerCase(),
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Log access
      await supabase.from("portal_access_logs").insert({
        org_id: org.id,
        lead_email: email.toLowerCase(),
        action: "magic_link_requested",
      });

      // Send email with magic link
      if (RESEND_API_KEY) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        // Derive app URL from supabase URL
        const portalUrl = body.portal_base_url || `${supabaseUrl.replace(".supabase.co", "")
          ? "https://advisoryscore.com" : "https://advisoryscore.com"}`;
        const magicLink = `${portalUrl}/portal/${org_slug}?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;
        const brandColour = org.primary_colour || "#1B3A5C";

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="padding:32px 40px 24px;text-align:center;">
    ${org.logo_url ? `<img src="${org.logo_url}" alt="${org.name}" style="max-height:48px;margin-bottom:16px;" />` : `<h2 style="color:${brandColour};margin:0 0 16px;">${org.name}</h2>`}
  </td></tr>
  <tr><td style="padding:0 40px 32px;">
    <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 12px;">Sign in to your portal</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
      Click the button below to access your assessment results and progress.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${magicLink}" style="display:inline-block;background:${brandColour};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
          Sign in to Portal
        </a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#999;margin-top:24px;text-align:center;">
      This link expires in 7 days. If you didn't request this, you can safely ignore this email.
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">Sent by ${org.name}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${org.name} <noreply@advisoryscore.com>`,
            to: [email.toLowerCase()],
            subject: `Sign in to your ${org.name} portal`,
            html,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: validate-token ──
    if (action === "validate-token") {
      const { token, email, org_slug } = body;
      if (!token || !email || !org_slug) {
        return new Response(JSON.stringify({ error: "token, email, and org_slug required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Hash the provided token
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      // Find org
      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("slug", org_slug)
        .single();

      if (!org) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find valid session
      const { data: session } = await supabase
        .from("portal_sessions")
        .select("*")
        .eq("org_id", org.id)
        .eq("lead_email", email.toLowerCase())
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update last accessed
      await supabase
        .from("portal_sessions")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("id", session.id);

      // Log access
      await supabase.from("portal_access_logs").insert({
        org_id: org.id,
        lead_email: email.toLowerCase(),
        action: "login",
      });

      // Return a new session token for the client to store
      const sessionTokenBytes = new Uint8Array(32);
      crypto.getRandomValues(sessionTokenBytes);
      const sessionToken = Array.from(sessionTokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

      const sessionHashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(sessionToken));
      const sessionTokenHash = Array.from(new Uint8Array(sessionHashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      // Store new persistent session
      await supabase.from("portal_sessions").insert({
        org_id: org.id,
        lead_email: email.toLowerCase(),
        token_hash: sessionTokenHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

      return new Response(JSON.stringify({
        success: true,
        session_token: sessionToken,
        email: email.toLowerCase(),
        org_id: org.id,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: verify-session ──
    if (action === "verify-session") {
      const { session_token, email, org_slug } = body;
      if (!session_token || !email || !org_slug) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(session_token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("slug", org_slug)
        .single();

      if (!org) {
        return new Response(JSON.stringify({ valid: false }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session } = await supabase
        .from("portal_sessions")
        .select("id")
        .eq("org_id", org.id)
        .eq("lead_email", email.toLowerCase())
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      return new Response(JSON.stringify({ valid: !!session }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: get-portal-data ──
    if (action === "get-portal-data") {
      const { email, org_slug, session_token } = body;

      // Verify session first
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(session_token));
      const tokenHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

      const { data: org } = await supabase
        .from("organisations")
        .select("*")
        .eq("slug", org_slug)
        .single();

      if (!org) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: session } = await supabase
        .from("portal_sessions")
        .select("id")
        .eq("org_id", org.id)
        .eq("lead_email", email.toLowerCase())
        .eq("token_hash", tokenHash)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: "Invalid session" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch portal settings
      const { data: portalSettings } = await supabase
        .from("portal_settings")
        .select("*")
        .eq("org_id", org.id)
        .single();

      // Fetch completed leads for this email + org
      const { data: leads } = await supabase
        .from("leads")
        .select("*, scores(*), assessments(id, title, description, type, status, portal_visible)")
        .eq("org_id", org.id)
        .eq("email", email.toLowerCase())
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      // Fetch available portal-visible assessments they haven't completed
      const { data: allAssessments } = await supabase
        .from("assessments")
        .select("id, title, description, type")
        .eq("org_id", org.id)
        .eq("status", "published")
        .eq("portal_visible", true);

      const completedAssessmentIds = new Set((leads || []).map(l => l.assessment_id));
      const availableAssessments = (allAssessments || []).filter(a => !completedAssessmentIds.has(a.id));

      // Fetch iterations for this email
      const { data: iterations } = await supabase
        .from("assessment_iterations")
        .select("*")
        .eq("lead_email", email.toLowerCase())
        .in("assessment_id", (leads || []).map(l => l.assessment_id))
        .order("iteration_number", { ascending: true });

      // Fetch landing pages for available assessments (to get slugs)
      const availableIds = availableAssessments.map(a => a.id);
      let landingPages: any[] = [];
      if (availableIds.length > 0) {
        const { data: lps } = await supabase
          .from("landing_pages")
          .select("assessment_id, slug")
          .in("assessment_id", availableIds)
          .eq("is_published", true);
        landingPages = lps || [];
      }

      // Get first name from most recent lead
      const firstName = leads?.[0]?.first_name || email.split("@")[0];

      return new Response(JSON.stringify({
        organisation: {
          name: org.name,
          logo_url: org.logo_url,
          primary_colour: org.primary_colour,
          slug: org.slug,
        },
        portal_settings: portalSettings,
        client_name: firstName,
        completed_assessments: (leads || []).map(l => ({
          lead_id: l.id,
          assessment_id: l.assessment_id,
          assessment_title: (l as any).assessments?.title || "Assessment",
          assessment_type: (l as any).assessments?.type || "scorecard",
          score_percentage: (l as any).scores?.[0]?.percentage ?? (l as any).scores?.percentage ?? null,
          completed_at: l.completed_at,
          iteration_count: (iterations || []).filter(i => i.assessment_id === l.assessment_id).length,
        })),
        available_assessments: availableAssessments.map(a => ({
          ...a,
          slug: landingPages.find(lp => lp.assessment_id === a.id)?.slug || null,
        })),
        iterations: iterations || [],
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Portal auth error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
