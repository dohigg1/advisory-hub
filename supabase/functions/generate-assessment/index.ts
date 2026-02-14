import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AI generation limits per plan tier (per calendar month)
const AI_GENERATION_LIMITS: Record<string, number> = {
  free: 3,
  starter: 15,
  professional: 50,
  firm: -1, // unlimited
};

interface AssessmentRequest {
  topic: string;
  assessment_type: string;
  question_count: number;
  category_count: number;
  org_id: string;
}

interface GeneratedCategory {
  name: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface GeneratedAnswerOption {
  label: string;
  points: number;
  sort_order: number;
}

interface GeneratedQuestion {
  text: string;
  type: string;
  category_index: number;
  sort_order: number;
  answer_options: GeneratedAnswerOption[];
}

interface GeneratedScoreTier {
  label: string;
  min_pct: number;
  max_pct: number;
  colour: string;
  description: string;
}

interface GeneratedAssessment {
  title: string;
  description: string;
  categories: GeneratedCategory[];
  questions: GeneratedQuestion[];
  score_tiers: GeneratedScoreTier[];
}

function buildSystemPrompt(): string {
  return `You are an expert assessment designer for professional consulting firms. Your task is to generate structured assessment content in JSON format.

You MUST respond with valid JSON only, no markdown, no explanations, no code fences. Just the raw JSON object.

The JSON object must have this exact structure:
{
  "title": "string - a compelling assessment title",
  "description": "string - a 1-2 sentence description of the assessment purpose",
  "categories": [
    {
      "name": "string - short category name",
      "description": "string - what this category evaluates",
      "icon": "string - a single relevant emoji icon for this category",
      "sort_order": number
    }
  ],
  "questions": [
    {
      "text": "string - the question text, written professionally",
      "type": "single_select",
      "category_index": number (0-based index into the categories array),
      "sort_order": number (global sort order across all questions),
      "answer_options": [
        {
          "label": "string - answer text",
          "points": number (0 = worst, higher = better),
          "sort_order": number
        }
      ]
    }
  ],
  "score_tiers": [
    {
      "label": "string - tier name (e.g. 'Needs Improvement', 'Developing', 'Advanced', 'Leading')",
      "min_pct": number (0-100),
      "max_pct": number (0-100),
      "colour": "string - hex colour code",
      "description": "string - what this tier means for the respondent"
    }
  ]
}

Rules:
- Each question must have exactly 4 answer options scored 0, 1, 2, 3 (worst to best)
- Questions should be distributed evenly across categories
- Score tiers must cover the full 0-100 range with no gaps or overlaps
- Use professional, consultant-quality language
- Questions should be specific and actionable, not vague
- Categories should be distinct and cover different aspects of the topic
- Generate exactly 4 score tiers`;
}

function buildUserPrompt(req: AssessmentRequest): string {
  return `Generate a professional assessment about: "${req.topic}"

Assessment type: ${req.assessment_type}
Number of categories: ${req.category_count}
Number of questions: ${req.question_count}

Distribute the ${req.question_count} questions evenly across the ${req.category_count} categories. Each question should have 4 answer options scored 0-3.`;
}

function getMockData(req: AssessmentRequest): GeneratedAssessment {
  const categories: GeneratedCategory[] = Array.from(
    { length: req.category_count },
    (_, i) => ({
      name: `Category ${i + 1}`,
      description: `Evaluates aspect ${i + 1} of ${req.topic}`,
      icon: ["📊", "🎯", "🔧", "📈", "💡"][i % 5],
      sort_order: i,
    })
  );

  const questionsPerCategory = Math.ceil(
    req.question_count / req.category_count
  );
  const questions: GeneratedQuestion[] = [];
  let globalSort = 0;

  for (let catIdx = 0; catIdx < req.category_count; catIdx++) {
    const count =
      catIdx < req.category_count - 1
        ? questionsPerCategory
        : req.question_count - globalSort;

    for (let q = 0; q < count && globalSort < req.question_count; q++) {
      questions.push({
        text: `How would you rate your organisation's ${req.topic.toLowerCase()} in area ${catIdx + 1}, aspect ${q + 1}?`,
        type: "single_select",
        category_index: catIdx,
        sort_order: globalSort,
        answer_options: [
          { label: "Not started or unaware", points: 0, sort_order: 0 },
          { label: "Beginning to explore", points: 1, sort_order: 1 },
          { label: "Established and functional", points: 2, sort_order: 2 },
          { label: "Optimised and leading", points: 3, sort_order: 3 },
        ],
      });
      globalSort++;
    }
  }

  return {
    title: `${req.topic} Assessment`,
    description: `Evaluate your organisation's ${req.topic.toLowerCase()} maturity across ${req.category_count} key areas.`,
    categories,
    questions,
    score_tiers: [
      {
        label: "Needs Improvement",
        min_pct: 0,
        max_pct: 25,
        colour: "#EF4444",
        description:
          "Significant gaps exist. Immediate action recommended.",
      },
      {
        label: "Developing",
        min_pct: 26,
        max_pct: 50,
        colour: "#F59E0B",
        description:
          "Foundation in place but key areas require attention.",
      },
      {
        label: "Advanced",
        min_pct: 51,
        max_pct: 75,
        colour: "#3B82F6",
        description:
          "Strong capabilities with room for optimisation.",
      },
      {
        label: "Leading",
        min_pct: 76,
        max_pct: 100,
        colour: "#10B981",
        description:
          "Best-in-class performance across evaluated areas.",
      },
    ],
  };
}

async function callAnthropicWithRetry(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  maxRetries: number = 2
): Promise<{ content: string; tokens_used: number }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          temperature: 0.7,
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

      const tokensUsed =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      return { content: textBlock.text, tokens_used: tokensUsed };
    } catch (err: any) {
      lastError = err;
      console.error(
        `Anthropic API attempt ${attempt + 1} failed:`,
        err.message
      );

      // Only retry on timeout or 5xx errors
      const isRetryable =
        err.name === "AbortError" ||
        (err.message && err.message.includes("5"));

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 2s, 4s
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }

  throw lastError || new Error("Anthropic API call failed after retries");
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
    const body: AssessmentRequest = await req.json();

    // Validate required fields
    if (!body.topic || !body.assessment_type || !body.org_id) {
      return new Response(
        JSON.stringify({
          error: "topic, assessment_type, and org_id are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const questionCount = body.question_count || 10;
    const categoryCount = body.category_count || 4;

    const request: AssessmentRequest = {
      topic: body.topic,
      assessment_type: body.assessment_type,
      question_count: questionCount,
      category_count: categoryCount,
      org_id: body.org_id,
    };

    // ── Check org plan limits ──────────────────────────────────
    const { data: org } = await supabase
      .from("organisations")
      .select("plan_tier")
      .eq("id", request.org_id)
      .single();

    const tier = org?.plan_tier || "free";
    const limit = AI_GENERATION_LIMITS[tier] ?? AI_GENERATION_LIMITS.free;

    if (limit !== -1) {
      // Count AI generations for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("ai_generations")
        .select("*", { count: "exact", head: true })
        .eq("org_id", request.org_id)
        .gte("created_at", startOfMonth.toISOString());

      const currentCount = count || 0;

      if (currentCount >= limit) {
        return new Response(
          JSON.stringify({
            error: "AI generation limit reached for your plan",
            current: currentCount,
            limit,
            tier,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Generate assessment content ────────────────────────────
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    let result: GeneratedAssessment;
    let tokensUsed = 0;
    let model = "mock";

    if (!anthropicApiKey) {
      // Development mode: return mock data
      console.warn(
        "ANTHROPIC_API_KEY not set - returning mock assessment data"
      );
      result = getMockData(request);
    } else {
      // Production: call Anthropic API
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildUserPrompt(request);

      const apiResponse = await callAnthropicWithRetry(
        systemPrompt,
        userPrompt,
        anthropicApiKey
      );

      tokensUsed = apiResponse.tokens_used;
      model = "claude-3-5-sonnet-20241022";

      // Parse the JSON response - strip any markdown fences if present
      let jsonStr = apiResponse.content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        result = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error("Failed to parse AI response:", jsonStr.substring(0, 500));
        throw new Error(
          "AI returned invalid JSON. Please try again."
        );
      }

      // Validate the structure
      if (
        !result.title ||
        !result.categories ||
        !result.questions ||
        !result.score_tiers
      ) {
        throw new Error(
          "AI response missing required fields (title, categories, questions, score_tiers)"
        );
      }
    }

    // ── Log generation to ai_generations table ─────────────────
    await supabase.from("ai_generations").insert({
      org_id: request.org_id,
      type: "assessment",
      input_json: {
        topic: request.topic,
        assessment_type: request.assessment_type,
        question_count: request.question_count,
        category_count: request.category_count,
      },
      output_json: {
        title: result.title,
        category_count: result.categories.length,
        question_count: result.questions.length,
      },
      model,
      tokens_used: tokensUsed,
    });

    // ── Return generated content ───────────────────────────────
    return new Response(
      JSON.stringify({
        title: result.title,
        description: result.description,
        categories: result.categories,
        questions: result.questions,
        score_tiers: result.score_tiers,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("generate-assessment error:", err);

    return new Response(
      JSON.stringify({ error: err.message || "Assessment generation failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
