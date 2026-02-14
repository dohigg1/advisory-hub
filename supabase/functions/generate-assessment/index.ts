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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { topic, assessment_type, question_count, category_count } = await req.json();
    if (!topic) throw new Error("Topic is required");

    const qCount = question_count || 15;
    const cCount = category_count || 4;
    const aType = assessment_type || "scorecard";

    const prompt = `You are an expert assessment designer for professional services firms. Generate a complete assessment about: "${topic}".

Requirements:
- Assessment type: ${aType}
- Create exactly ${cCount} categories
- Create exactly ${qCount} questions distributed across categories
- Each question must have 4 answer options with points 1-4
- Create 4 score tiers

Return a JSON object (no markdown, no code fences) with this exact structure:
{
  "title": "string",
  "description": "string (2 sentences max)",
  "categories": [
    { "name": "string", "description": "string (1 sentence)", "icon": "string (lucide icon name)", "colour": "#hex", "sort_order": number }
  ],
  "questions": [
    { "category_index": number (0-based), "type": "multiple_choice", "text": "string", "help_text": null, "is_required": true, "sort_order": number, "options": [{ "text": "string", "points": number (1-4), "sort_order": number }] }
  ],
  "score_tiers": [
    { "label": "string", "min_pct": number, "max_pct": number, "colour": "#hex", "description": "string", "sort_order": number }
  ]
}

Ensure questions are thoughtful, professional, and varied. Use different lucide icon names for categories. Score tiers should cover 0-100% without gaps.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI request failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const generated = JSON.parse(content);

    return new Response(JSON.stringify({ success: true, data: generated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
