import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NarrativeRequest {
  lead_id: string;
  assessment_id: string;
  score_data: {
    total_points: number;
    total_possible: number;
    percentage: number;
    tier_label?: string;
  };
  category_scores: Record<
    string,
    {
      name?: string;
      points: number;
      possible: number;
      percentage: number;
      tier_label?: string;
    }
  >;
  benchmarks?: {
    average_percentage?: number;
    median_percentage?: number;
    percentile_rank?: number;
    total_respondents?: number;
  };
  org_context?: string;
  tone?: string;
}

interface NarrativeResult {
  executive_summary: string;
  strengths: Array<{ title: string; detail: string }>;
  improvements: Array<{ title: string; detail: string }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: string;
  }>;
  benchmark_context: string;
}

function buildSystemPrompt(tone: string): string {
  const toneInstruction =
    tone === "formal"
      ? "Use formal, executive-level language appropriate for board presentations."
      : tone === "friendly"
        ? "Use a warm, encouraging but professional tone."
        : "Use a professional, consultative tone suitable for advisory engagements.";

  return `You are a senior management consultant preparing a personalised results narrative for a client who has completed a professional assessment. ${toneInstruction}

You MUST respond with valid JSON only, no markdown, no explanations, no code fences. Just the raw JSON object.

The JSON object must have this exact structure:
{
  "executive_summary": "string - 2-3 paragraph executive summary of the assessment results, highlighting key findings and overall positioning",
  "strengths": [
    {
      "title": "string - concise strength title",
      "detail": "string - 2-3 sentences elaborating on this strength and its business impact"
    }
  ],
  "improvements": [
    {
      "title": "string - concise area for improvement title",
      "detail": "string - 2-3 sentences explaining the gap and why it matters"
    }
  ],
  "recommendations": [
    {
      "title": "string - actionable recommendation title",
      "description": "string - 2-3 sentences describing the recommended action and expected outcome",
      "priority": "string - one of: 'high', 'medium', 'low'"
    }
  ],
  "benchmark_context": "string - 1-2 paragraphs contextualising the results against benchmarks and industry standards"
}

Rules:
- Generate 2-4 strengths based on the highest-scoring categories
- Generate 2-4 improvements based on the lowest-scoring categories
- Generate 3-5 recommendations, prioritised by impact
- Recommendations should be specific and actionable, not generic advice
- Reference actual scores and percentages where relevant
- If benchmark data is provided, compare the respondent's performance to peers
- Write as if you are presenting findings to the client directly
- Never mention you are an AI or that this was auto-generated`;
}

function buildUserPrompt(req: NarrativeRequest): string {
  const categoryDetails = Object.entries(req.category_scores)
    .map(([id, cat]) => {
      const name = cat.name || id;
      return `- ${name}: ${cat.points}/${cat.possible} (${cat.percentage}%)${cat.tier_label ? ` - ${cat.tier_label}` : ""}`;
    })
    .join("\n");

  let prompt = `Generate a personalised results narrative for the following assessment results:

Overall Score: ${req.score_data.total_points}/${req.score_data.total_possible} (${req.score_data.percentage}%)${req.score_data.tier_label ? `\nOverall Tier: ${req.score_data.tier_label}` : ""}

Category Breakdown:
${categoryDetails}`;

  if (req.benchmarks) {
    prompt += `\n\nBenchmark Data:`;
    if (req.benchmarks.average_percentage !== undefined) {
      prompt += `\n- Average score: ${req.benchmarks.average_percentage}%`;
    }
    if (req.benchmarks.median_percentage !== undefined) {
      prompt += `\n- Median score: ${req.benchmarks.median_percentage}%`;
    }
    if (req.benchmarks.percentile_rank !== undefined) {
      prompt += `\n- This respondent's percentile rank: ${req.benchmarks.percentile_rank}th`;
    }
    if (req.benchmarks.total_respondents !== undefined) {
      prompt += `\n- Total respondents in benchmark: ${req.benchmarks.total_respondents}`;
    }
  }

  if (req.org_context) {
    prompt += `\n\nAdditional context about the organisation:\n${req.org_context}`;
  }

  return prompt;
}

function getMockNarrative(req: NarrativeRequest): NarrativeResult {
  const pct = req.score_data.percentage;
  const tierLabel = req.score_data.tier_label || "N/A";

  const categoryEntries = Object.entries(req.category_scores);
  const sorted = [...categoryEntries].sort(
    (a, b) => (b[1].percentage || 0) - (a[1].percentage || 0)
  );

  const topCategories = sorted.slice(0, 2);
  const bottomCategories = sorted.slice(-2);

  return {
    executive_summary: `Your organisation achieved an overall score of ${pct}%, placing you in the "${tierLabel}" tier. This assessment evaluated ${categoryEntries.length} key areas, revealing a mixed performance profile with notable strengths alongside clear opportunities for growth.\n\nThe results indicate that while foundational capabilities are in place, strategic investment in underperforming areas could yield significant improvements in overall organisational maturity.`,
    strengths: topCategories.map(([id, cat]) => ({
      title: `Strong performance in ${cat.name || id}`,
      detail: `Scoring ${cat.percentage}% in this area demonstrates solid capability and established processes. This positions your organisation well relative to the overall assessment framework and suggests mature practices that can serve as a model for other areas.`,
    })),
    improvements: bottomCategories.map(([id, cat]) => ({
      title: `Opportunity in ${cat.name || id}`,
      detail: `A score of ${cat.percentage}% in this area indicates room for development. Addressing gaps here could have a meaningful impact on overall organisational performance and resilience.`,
    })),
    recommendations: [
      {
        title: "Develop a targeted improvement plan",
        description:
          "Focus initial efforts on the lowest-scoring categories with quick-win initiatives that can demonstrate early progress and build momentum for broader transformation.",
        priority: "high",
      },
      {
        title: "Leverage existing strengths",
        description:
          "Document and share best practices from your highest-performing areas to accelerate improvement in weaker categories through knowledge transfer.",
        priority: "medium",
      },
      {
        title: "Establish regular reassessment cadence",
        description:
          "Schedule quarterly reassessments to track progress against these baseline results and adjust priorities based on measurable improvements.",
        priority: "medium",
      },
    ],
    benchmark_context: req.benchmarks
      ? `Compared to ${req.benchmarks.total_respondents || "other"} respondents, your score of ${pct}% places you at the ${req.benchmarks.percentile_rank || "N/A"}th percentile. The average score across all respondents is ${req.benchmarks.average_percentage || "N/A"}%, suggesting your organisation is ${pct > (req.benchmarks.average_percentage || 50) ? "performing above" : "performing below"} the peer average.`
      : `Benchmark data was not available for this assessment. As more respondents complete the assessment, comparative insights will become available to contextualise your results against industry peers.`,
  };
}

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
    const body: NarrativeRequest = await req.json();

    // Validate required fields
    if (!body.lead_id || !body.assessment_id || !body.score_data || !body.category_scores) {
      return new Response(
        JSON.stringify({
          error:
            "lead_id, assessment_id, score_data, and category_scores are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Check for cached narrative ─────────────────────────────
    const { data: existingScore } = await supabase
      .from("scores")
      .select("id, narrative_json")
      .eq("lead_id", body.lead_id)
      .eq("assessment_id", body.assessment_id)
      .maybeSingle();

    if (existingScore?.narrative_json) {
      return new Response(
        JSON.stringify({
          ...existingScore.narrative_json,
          cached: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Get org_id from lead for plan check and logging ────────
    const { data: lead } = await supabase
      .from("leads")
      .select("org_id")
      .eq("id", body.lead_id)
      .single();

    if (!lead?.org_id) {
      return new Response(
        JSON.stringify({ error: "Lead not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orgId = lead.org_id;

    // ── Generate narrative ─────────────────────────────────────
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const tone = body.tone || "professional";

    let narrative: NarrativeResult;
    let tokensUsed = 0;
    let model = "mock";

    if (!anthropicApiKey) {
      // Development mode: return mock data
      console.warn(
        "ANTHROPIC_API_KEY not set - returning mock narrative data"
      );
      narrative = getMockNarrative(body);
    } else {
      // Production: call Anthropic API
      const systemPrompt = buildSystemPrompt(tone);
      const userPrompt = buildUserPrompt(body);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          temperature: 0.4,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Anthropic API error ${response.status}: ${errorBody}`
        );
      }

      const data = await response.json();
      const textBlock = data.content?.find(
        (b: any) => b.type === "text"
      );
      if (!textBlock?.text) {
        throw new Error("No text content in Anthropic response");
      }

      tokensUsed =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
      model = "claude-3-5-sonnet-20241022";

      // Parse the JSON response - strip any markdown fences if present
      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      try {
        narrative = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error(
          "Failed to parse AI narrative response:",
          jsonStr.substring(0, 500)
        );
        throw new Error(
          "AI returned invalid JSON for narrative. Please try again."
        );
      }

      // Validate the structure
      if (
        !narrative.executive_summary ||
        !narrative.strengths ||
        !narrative.improvements ||
        !narrative.recommendations
      ) {
        throw new Error(
          "AI response missing required narrative fields"
        );
      }
    }

    // ── Cache narrative in scores table ────────────────────────
    if (existingScore?.id) {
      await supabase
        .from("scores")
        .update({ narrative_json: narrative })
        .eq("id", existingScore.id);
    }

    // ── Log generation to ai_generations table ─────────────────
    await supabase.from("ai_generations").insert({
      org_id: orgId,
      type: "narrative",
      input_json: {
        lead_id: body.lead_id,
        assessment_id: body.assessment_id,
        overall_percentage: body.score_data.percentage,
        tone,
      },
      output_json: {
        strengths_count: narrative.strengths.length,
        improvements_count: narrative.improvements.length,
        recommendations_count: narrative.recommendations.length,
      },
      model,
      tokens_used: tokensUsed,
    });

    // ── Return narrative ───────────────────────────────────────
    return new Response(
      JSON.stringify({
        executive_summary: narrative.executive_summary,
        strengths: narrative.strengths,
        improvements: narrative.improvements,
        recommendations: narrative.recommendations,
        benchmark_context: narrative.benchmark_context,
        cached: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("generate-narrative error:", err);

    return new Response(
      JSON.stringify({
        error: err.message || "Narrative generation failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
