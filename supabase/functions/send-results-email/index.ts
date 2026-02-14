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

  // Validate internal call (service role bearer)
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey
  );

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    // Fetch lead with score
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*, scores(*)")
      .eq("id", lead_id)
      .single();
    if (leadErr || !lead) throw new Error(`Lead not found: ${lead_id}`);

    // Fetch assessment and org in parallel
    const [assessmentRes, orgRes, tiersRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", lead.assessment_id).single(),
      supabase.from("organisations").select("*").eq("id", lead.org_id).single(),
      supabase.from("score_tiers").select("*").eq("assessment_id", lead.assessment_id).order("min_pct"),
    ]);

    const assessment = assessmentRes.data;
    const org = orgRes.data;
    const tiers = tiersRes.data || [];
    if (!assessment || !org) throw new Error("Assessment or org not found");

    const settings = (assessment.settings_json as any) || {};
    if (settings.results_email_enabled === false) {
      return new Response(JSON.stringify({ skipped: true, reason: "Results email disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const score = lead.scores?.[0] || (Array.isArray(lead.scores) ? undefined : lead.scores);
    const percentage = score?.percentage ?? null;
    const tier = percentage !== null
      ? tiers.find((t: any) => percentage >= t.min_pct && percentage <= t.max_pct)
      : null;

    const brandColour = org.primary_colour || "#1B3A5C";
    const resultsUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")
      ? settings.results_base_url || `https://advisoryscore.com`
      : "https://advisoryscore.com"}/results/${lead_id}`;

    const subjectTemplate = settings.results_email_subject || "Your {assessment_title} Results";
    const subject = subjectTemplate
      .replace("{assessment_title}", assessment.title)
      .replace("{first_name}", lead.first_name || "")
      .replace("{score_percentage}", percentage !== null ? `${percentage}%` : "N/A")
      .replace("{tier_label}", tier?.label || "");

    const firstName = lead.first_name || "there";
    const tierLabel = tier?.label || "Complete";
    const tierColour = tier?.colour || brandColour;
    const logoHtml = org.logo_url
      ? `<img src="${org.logo_url}" alt="${org.name}" style="max-height:48px;margin-bottom:16px;" />`
      : `<h2 style="color:${brandColour};margin:0 0 16px;">${org.name}</h2>`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="padding:32px 40px 24px;text-align:center;">
    ${logoHtml}
  </td></tr>
  <tr><td style="padding:0 40px 24px;">
    <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 8px;">Hi ${firstName},</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
      Thank you for completing the <strong>${assessment.title}</strong>. Here's a summary of your results:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;padding:24px;margin-bottom:24px;">
      <tr><td align="center">
        <div style="font-size:48px;font-weight:700;color:${tierColour};margin-bottom:4px;">
          ${percentage !== null ? `${percentage}%` : "—"}
        </div>
        <div style="font-size:14px;font-weight:600;color:${tierColour};text-transform:uppercase;letter-spacing:0.5px;">
          ${tierLabel}
        </div>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:12px;">
        <a href="${resultsUrl}" style="display:inline-block;background:${brandColour};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
          View Your Full Results
        </a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">
      This email was sent by ${org.name} via AdvisoryScore
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

    const fromName = settings.email_from_name || org.name;
    const fromAddress = settings.email_from_address || "noreply@advisoryscore.com";
    const replyTo = settings.email_reply_to || undefined;

    const resendRes = await fetch("https://api.resend.com/emails", {
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
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Send results email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
