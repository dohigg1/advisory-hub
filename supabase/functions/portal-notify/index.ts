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

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { action } = await req.json();

    // ── Notify clients of new assessment ──
    if (action === "notify-new-assessment") {
      const body = await req.clone().json();
      const { assessment_id, org_id } = body;

      // Get org + assessment info
      const [orgRes, assessmentRes] = await Promise.all([
        supabase.from("organisations").select("*").eq("id", org_id).single(),
        supabase.from("assessments").select("*").eq("id", assessment_id).single(),
      ]);

      const org = orgRes.data;
      const assessment = assessmentRes.data;
      if (!org || !assessment) throw new Error("Org or assessment not found");

      // Get portal settings
      const { data: portalSettings } = await supabase
        .from("portal_settings")
        .select("*")
        .eq("org_id", org_id)
        .single();

      if (!portalSettings?.enabled) {
        return new Response(JSON.stringify({ skipped: true, reason: "Portal not enabled" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get unique client emails
      const { data: leads } = await supabase
        .from("leads")
        .select("email")
        .eq("org_id", org_id)
        .eq("status", "completed");

      const uniqueEmails = [...new Set((leads || []).map(l => l.email))];
      if (uniqueEmails.length === 0) {
        return new Response(JSON.stringify({ sent: 0 }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const brandColour = org.primary_colour || "#1B3A5C";
      const portalUrl = `https://advisoryscore.com/portal/${org.slug}`;

      let sentCount = 0;
      for (const email of uniqueEmails) {
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:32px 40px;text-align:center;">
    <h2 style="color:${brandColour};margin:0 0 16px;">${org.name}</h2>
    <h1 style="font-size:20px;margin:0 0 12px;">New Assessment Available</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;">
      <strong>${assessment.title}</strong> is now available in your portal. Log in to take it.
    </p>
    <a href="${portalUrl}" style="display:inline-block;background:${brandColour};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;margin-top:16px;">
      Go to Portal
    </a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${org.name} <noreply@advisoryscore.com>`,
              to: [email],
              subject: `New assessment available: ${assessment.title}`,
              html,
            }),
          });
          sentCount++;
        } catch (e) {
          console.error(`Failed to send to ${email}:`, e);
        }
      }

      return new Response(JSON.stringify({ sent: sentCount }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Portal notify error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
