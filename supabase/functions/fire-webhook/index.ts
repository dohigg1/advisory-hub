import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function sendWithRetry(
  url: string, payload: any, secret: string | null,
  supabase: any, assessmentId: string, leadId: string
): Promise<void> {
  const body = JSON.stringify(payload);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (secret) {
        headers["X-Webhook-Signature"] = await hmacSign(secret, body);
      }

      const res = await fetch(url, { method: "POST", headers, body });
      const resBody = await res.text();

      await supabase.from("webhook_logs").insert({
        assessment_id: assessmentId,
        lead_id: leadId,
        webhook_url: url,
        status_code: res.status,
        request_payload: payload,
        response_body: resBody.substring(0, 2000),
        attempt,
        success: res.ok,
        error_message: res.ok ? null : `HTTP ${res.status}`,
      });

      if (res.ok) return;
    } catch (err: any) {
      await supabase.from("webhook_logs").insert({
        assessment_id: assessmentId,
        lead_id: leadId,
        webhook_url: url,
        request_payload: payload,
        attempt,
        success: false,
        error_message: err.message || String(err),
      });
    }

    if (attempt < maxAttempts) {
      // Exponential backoff: 2s, 4s
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey
  );

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    // Fetch lead, score, assessment
    const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (!lead) throw new Error("Lead not found");

    const [assessmentRes, scoreRes, categoriesRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", lead.assessment_id).single(),
      supabase.from("scores").select("*").eq("lead_id", lead_id).single(),
      supabase.from("categories").select("*").eq("assessment_id", lead.assessment_id).order("sort_order"),
    ]);

    const assessment = assessmentRes.data;
    const score = scoreRes.data;
    if (!assessment) throw new Error("Assessment not found");

    const settings = (assessment.settings_json as any) || {};
    const webhookUrl = settings.webhook_url;
    if (!webhookUrl) {
      return new Response(JSON.stringify({ skipped: true, reason: "No webhook URL configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = settings.webhook_secret || null;

    // Fetch tier if available
    let tierLabel = null;
    if (score?.tier_id) {
      const { data: tier } = await supabase.from("score_tiers").select("label").eq("id", score.tier_id).single();
      tierLabel = tier?.label;
    }

    // Build category scores with names
    const categoryScores: any[] = [];
    const catScoresJson = (score?.category_scores_json as any) || {};
    for (const cat of (categoriesRes.data || [])) {
      const cs = catScoresJson[cat.id];
      if (cs) {
        categoryScores.push({
          category_name: cat.name,
          points: cs.points,
          possible: cs.possible,
          percentage: cs.percentage,
          tier_label: cs.tier_label,
        });
      }
    }

    const payload = {
      event: "assessment.completed",
      lead: {
        id: lead.id,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        custom_fields: lead.custom_fields_json,
        utm: lead.utm_json,
      },
      assessment: {
        id: assessment.id,
        title: assessment.title,
      },
      score: {
        total_points: score?.total_points ?? 0,
        total_possible: score?.total_possible ?? 0,
        percentage: score?.percentage ?? null,
        tier_label: tierLabel,
        category_scores: categoryScores,
      },
      completed_at: lead.completed_at,
    };

    await sendWithRetry(webhookUrl, payload, webhookSecret, supabase, assessment.id, lead.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
