import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lead_id } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check cache first
    const { data: existingScore } = await supabaseAdmin
      .from("scores")
      .select("id, narrative_json, assessment_id, lead_id, percentage, category_scores_json, tier_id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    if (!existingScore) throw new Error("Score not found for lead");

    // Return cached narrative if available
    if (existingScore.narrative_json && Object.keys(existingScore.narrative_json).length > 0) {
      return new Response(JSON.stringify({ narrative: existingScore.narrative_json, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if AI narratives are enabled for this assessment
    const { data: assessment } = await supabaseAdmin
      .from("assessments")
      .select("title, description, settings_json")
      .eq("id", existingScore.assessment_id)
      .single();

    if (!assessment) throw new Error("Assessment not found");

    const settings = (assessment.settings_json as Record<string, any>) || {};
    if (!settings.ai_narratives_enabled) {
      return new Response(JSON.stringify({ narrative: null, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch categories and tiers for context
    const [categoriesRes, tiersRes, leadRes] = await Promise.all([
      supabaseAdmin.from("categories").select("id, name, description").eq("assessment_id", existingScore.assessment_id).order("sort_order"),
      supabaseAdmin.from("score_tiers").select("id, label, description, min_pct, max_pct").eq("assessment_id", existingScore.assessment_id).order("sort_order"),
      supabaseAdmin.from("leads").select("first_name, email").eq("id", lead_id).single(),
    ]);

    const categories = categoriesRes.data || [];
    const tiers = tiersRes.data || [];
    const lead = leadRes.data;
    const catScores = (existingScore.category_scores_json as Record<string, any>) || {};
    const overallTier = tiers.find((t: any) => t.id === existingScore.tier_id);

    // Build category score summary for prompt
    const categorySummary = categories.map((cat: any) => {
      const cs = catScores[cat.id];
      const pct = cs?.percentage ?? 0;
      return `- ${cat.name}: ${pct}% (${cat.description || "no description"})`;
    }).join("\n");

    const firstName = lead?.first_name || "the respondent";

    const prompt = `You are an expert assessment consultant. Generate a personalised narrative report for someone who just completed the "${assessment.title}" assessment.

Assessment: ${assessment.title}
${assessment.description ? `Description: ${assessment.description}` : ""}
Overall Score: ${existingScore.percentage}%
Overall Tier: ${overallTier?.label || "N/A"} — ${overallTier?.description || ""}

Category Scores:
${categorySummary}

Generate a JSON response with these fields:
1. "summary" — A 2-3 sentence executive summary of their results, addressing them as "${firstName}". Be encouraging but honest.
2. "strengths" — An array of 2-3 strings identifying their strongest areas (categories scoring highest).
3. "improvements" — An array of 2-3 strings identifying areas that need the most improvement (categories scoring lowest), with actionable advice.
4. "next_steps" — A single paragraph (3-4 sentences) recommending concrete next steps based on their specific scores.

Keep the tone professional, constructive, and encouraging. Do NOT use markdown formatting in the values.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "generate_narrative",
            description: "Generate a personalised assessment narrative",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                next_steps: { type: "string" },
              },
              required: ["summary", "strengths", "improvements", "next_steps"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_narrative" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const narrative = JSON.parse(toolCall.function.arguments);

    // Cache the narrative on the score row
    await supabaseAdmin
      .from("scores")
      .update({ narrative_json: narrative })
      .eq("id", existingScore.id);

    return new Response(JSON.stringify({ narrative, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-narrative error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
