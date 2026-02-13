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
    // Find abandoned leads: started > 1 hour ago, not completed, not yet emailed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "started")
      .eq("abandon_email_sent", false)
      .lt("started_at", oneHourAgo)
      .limit(50);

    if (error) throw error;
    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by assessment for settings lookup
    const assessmentIds = [...new Set(leads.map(l => l.assessment_id))];
    const [assessmentsRes, orgsRes] = await Promise.all([
      supabase.from("assessments").select("*").in("id", assessmentIds),
      supabase.from("organisations").select("*").in("id", [...new Set(leads.map(l => l.org_id))]),
    ]);

    const assessmentMap = new Map((assessmentsRes.data || []).map((a: any) => [a.id, a]));
    const orgMap = new Map((orgsRes.data || []).map((o: any) => [o.id, o]));

    let sentCount = 0;

    for (const lead of leads) {
      const assessment = assessmentMap.get(lead.assessment_id);
      const org = orgMap.get(lead.org_id);
      if (!assessment || !org) continue;

      const settings = (assessment.settings_json as any) || {};
      if (settings.abandon_email_enabled === false) {
        // Mark as sent so we don't re-check
        await supabase.from("leads").update({ abandon_email_sent: true }).eq("id", lead.id);
        continue;
      }

      const brandColour = org.primary_colour || "#1B3A5C";
      const firstName = lead.first_name || "there";
      const resumeUrl = settings.abandon_resume_url || `https://advisoryscore.com/assess/${assessment.id}?lead=${lead.id}`;
      const logoHtml = org.logo_url
        ? `<img src="${org.logo_url}" alt="${org.name}" style="max-height:48px;margin-bottom:16px;" />`
        : `<h2 style="color:${brandColour};margin:0 0 16px;">${org.name}</h2>`;

      const subject = settings.abandon_email_subject || `Don't forget to finish your ${assessment.title}`;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="padding:32px 40px 24px;text-align:center;">${logoHtml}</td></tr>
  <tr><td style="padding:0 40px 24px;">
    <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 8px;">Hi ${firstName},</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
      You started the <strong>${assessment.title}</strong> but haven't finished yet. 
      Your progress has been saved — pick up right where you left off.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${resumeUrl}" style="display:inline-block;background:${brandColour};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
          Continue Your Assessment
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">This email was sent by ${org.name} via AdvisoryScore</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

      const fromName = settings.email_from_name || org.name;
      const fromAddress = settings.email_from_address || "noreply@advisoryscore.com";

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromAddress}>`,
            to: [lead.email],
            subject,
            html,
          }),
        });
        await res.json();
        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send abandon email to ${lead.email}:`, emailErr);
      }

      // Mark as sent regardless to avoid retrying failures forever
      await supabase.from("leads").update({ abandon_email_sent: true }).eq("id", lead.id);
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Abandon email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
