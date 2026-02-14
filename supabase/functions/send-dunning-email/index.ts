import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DunningPayload {
  org_id: string;
  attempt_number: number;
  customer_email: string;
  portal_url: string;
}

const subjects: Record<number, string> = {
  1: "Action required: your payment failed",
  2: "Reminder: please update your payment details",
  3: "Final notice: your account will be downgraded tomorrow",
};

function buildHtml(attemptNumber: number, portalUrl: string): string {
  const brandColour = "#1B3A5C";

  const messages: Record<number, { heading: string; body: string; urgency: string }> = {
    1: {
      heading: "Your payment didn't go through",
      body: "We were unable to process your latest payment for AdvisoryScore. This is usually caused by an expired card or insufficient funds. Please update your payment details to continue using your account without interruption.",
      urgency: "",
    },
    2: {
      heading: "Your payment is still outstanding",
      body: "This is a friendly reminder that your payment is still overdue. Please update your payment details within the next few days to avoid any disruption to your service.",
      urgency: "If we don't receive payment soon, your access to paid features may be restricted.",
    },
    3: {
      heading: "Final notice: action required today",
      body: "We have been unable to collect your payment after multiple attempts. If payment is not received by tomorrow, your account will be automatically downgraded to the Free plan.",
      urgency: "Your data will be preserved, but you will lose access to all paid features including advanced analytics, team members, and custom branding.",
    },
  };

  const msg = messages[attemptNumber] || messages[1];

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="padding:32px 40px 24px;text-align:center;">
    <h2 style="color:${brandColour};margin:0 0 16px;">AdvisoryScore</h2>
  </td></tr>
  <tr><td style="padding:0 40px 24px;">
    ${attemptNumber >= 3 ? '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:24px;"><span style="color:#dc2626;font-weight:600;font-size:13px;">Urgent: your account will be downgraded</span></div>' : ""}
    <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 8px;">${msg.heading}</h1>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 16px;">
      ${msg.body}
    </p>
    ${msg.urgency ? `<p style="font-size:14px;color:#dc2626;line-height:1.6;margin:0 0 24px;font-weight:500;">${msg.urgency}</p>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:12px;">
        <a href="${portalUrl}" style="display:inline-block;background:${brandColour};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
          Update Payment Details
        </a>
      </td></tr>
    </table>
    <p style="font-size:13px;color:#888;line-height:1.5;margin:16px 0 0;">
      If you believe this is an error or need assistance, reply to this email and we'll be happy to help.
    </p>
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid #eee;text-align:center;">
    <p style="font-size:12px;color:#999;margin:0;">
      This email was sent by AdvisoryScore regarding your subscription billing.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { org_id, attempt_number, customer_email, portal_url }: DunningPayload =
      await req.json();

    if (!org_id || !customer_email) {
      return new Response(
        JSON.stringify({ error: "org_id and customer_email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const attempt = attempt_number || 1;
    const subject = subjects[attempt] || subjects[1];
    const html = buildHtml(attempt, portal_url || "https://advisoryscore.com/settings");

    // Plain-text fallback
    const textBodies: Record<number, string> = {
      1: `We were unable to process your payment. Please update your payment details to continue using AdvisoryScore.\n\nUpdate payment: ${portal_url}`,
      2: `This is a reminder that your payment is still outstanding. Please update your payment details within the next few days to avoid service interruption.\n\nUpdate payment: ${portal_url}`,
      3: `This is your final notice. If payment is not received by tomorrow, your account will be downgraded to the Free plan. Your data will be preserved, but you will lose access to paid features.\n\nUpdate payment: ${portal_url}`,
    };
    const text = textBodies[attempt] || textBodies[1];

    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AdvisoryScore <billing@advisoryscore.com>",
          to: [customer_email],
          subject,
          html,
          text,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.error("[DUNNING] Resend error:", resendData);
        return new Response(
          JSON.stringify({ error: "Failed to send email", details: resendData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(
        `[DUNNING] Sent attempt ${attempt} email to ${customer_email} for org ${org_id} (email_id: ${resendData.id})`
      );

      return new Response(
        JSON.stringify({ success: true, email_id: resendData.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No API key -- log and return success so the webhook doesn't fail
    console.log(
      `[DUNNING] No RESEND_API_KEY set. Would send to ${customer_email}:\n  Subject: ${subject}\n  Org: ${org_id}\n  Attempt: ${attempt}`
    );

    return new Response(
      JSON.stringify({ success: true, dry_run: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[DUNNING] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
