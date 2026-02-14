import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS headers applied to every response
// ---------------------------------------------------------------------------
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hex hash of a plain-text API key. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a JSON Response with CORS headers. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Error response shorthand. */
function errorResponse(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/** Parse limit / offset from URLSearchParams with sensible defaults. */
function pagination(params: URLSearchParams): { limit: number; offset: number } {
  const limit = Math.min(Math.max(parseInt(params.get("limit") || "50", 10) || 50, 1), 100);
  const offset = Math.max(parseInt(params.get("offset") || "0", 10) || 0, 0);
  return { limit, offset };
}

// ---------------------------------------------------------------------------
// Scope mapping – each route pattern maps to the required scope
// ---------------------------------------------------------------------------
interface RouteMatch {
  pattern: string;
  scope: string;
  handler: (ctx: RequestContext) => Promise<Response>;
}

interface RequestContext {
  supabase: ReturnType<typeof createClient>;
  orgId: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  req: Request;
  body: unknown | null;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

// GET /v1/assessments
async function listAssessments(ctx: RequestContext): Promise<Response> {
  const { limit, offset } = pagination(ctx.searchParams);

  const { data, error, count } = await ctx.supabase
    .from("assessments")
    .select("id, title, description, type, status, created_at, updated_at", { count: "exact" })
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return json({ data, pagination: { total: count, limit, offset } });
}

// GET /v1/assessments/:id
async function getAssessment(ctx: RequestContext): Promise<Response> {
  const id = ctx.params.id;

  const { data: assessment, error: aErr } = await ctx.supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single();

  if (aErr || !assessment) return errorResponse("Assessment not found", 404);

  const [categoriesRes, questionsRes, optionsRes, tiersRes] = await Promise.all([
    ctx.supabase
      .from("categories")
      .select("*")
      .eq("assessment_id", id)
      .order("sort_order"),
    ctx.supabase
      .from("questions")
      .select("*")
      .eq("assessment_id", id)
      .order("sort_order"),
    ctx.supabase
      .from("answer_options")
      .select("*, questions!inner(assessment_id)")
      .eq("questions.assessment_id", id)
      .order("sort_order"),
    ctx.supabase
      .from("score_tiers")
      .select("*")
      .eq("assessment_id", id)
      .order("sort_order"),
  ]);

  // Group questions under categories, options under questions
  const optionsByQuestion = new Map<string, unknown[]>();
  for (const o of optionsRes.data || []) {
    const { questions: _join, ...option } = o as Record<string, unknown>;
    const arr = optionsByQuestion.get(option.question_id as string) || [];
    arr.push(option);
    optionsByQuestion.set(option.question_id as string, arr);
  }

  const questionsByCategory = new Map<string, unknown[]>();
  for (const q of questionsRes.data || []) {
    const question = { ...q, answer_options: optionsByQuestion.get(q.id) || [] };
    const arr = questionsByCategory.get(q.category_id) || [];
    arr.push(question);
    questionsByCategory.set(q.category_id, arr);
  }

  const categories = (categoriesRes.data || []).map((c: Record<string, unknown>) => ({
    ...c,
    questions: questionsByCategory.get(c.id as string) || [],
  }));

  return json({
    data: {
      ...assessment,
      categories,
      score_tiers: tiersRes.data || [],
    },
  });
}

// POST /v1/assessments
async function createAssessment(ctx: RequestContext): Promise<Response> {
  const body = ctx.body as Record<string, unknown> | null;
  if (!body || !body.title) return errorResponse("title is required");

  const { data, error } = await ctx.supabase
    .from("assessments")
    .insert({
      org_id: ctx.orgId,
      title: body.title,
      description: body.description || null,
      type: body.type || "scorecard",
      status: body.status || "draft",
      settings_json: body.settings_json || {},
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return json({ data }, 201);
}

// GET /v1/assessments/:id/responses
async function listResponses(ctx: RequestContext): Promise<Response> {
  const assessmentId = ctx.params.id;
  const { limit, offset } = pagination(ctx.searchParams);

  // Verify assessment belongs to org
  const { data: assessment } = await ctx.supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("org_id", ctx.orgId)
    .single();

  if (!assessment) return errorResponse("Assessment not found", 404);

  // Fetch responses via leads for this assessment
  const { data, error, count } = await ctx.supabase
    .from("responses")
    .select(
      "id, lead_id, question_id, selected_option_ids, open_text_value, points_awarded, responded_at, leads!inner(assessment_id)",
      { count: "exact" }
    )
    .eq("leads.assessment_id", assessmentId)
    .order("responded_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  // Strip the join column from output
  const cleaned = (data || []).map((r: Record<string, unknown>) => {
    const { leads: _join, ...rest } = r;
    return rest;
  });

  return json({ data: cleaned, pagination: { total: count, limit, offset } });
}

// GET /v1/assessments/:id/scores
async function listScores(ctx: RequestContext): Promise<Response> {
  const assessmentId = ctx.params.id;
  const { limit, offset } = pagination(ctx.searchParams);

  // Verify assessment belongs to org
  const { data: assessment } = await ctx.supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("org_id", ctx.orgId)
    .single();

  if (!assessment) return errorResponse("Assessment not found", 404);

  const { data, error, count } = await ctx.supabase
    .from("scores")
    .select("*", { count: "exact" })
    .eq("assessment_id", assessmentId)
    .order("calculated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errorResponse(error.message, 500);

  return json({ data, pagination: { total: count, limit, offset } });
}

// GET /v1/assessments/:id/benchmarks
async function getBenchmarks(ctx: RequestContext): Promise<Response> {
  const assessmentId = ctx.params.id;

  // Verify assessment belongs to org
  const { data: assessment } = await ctx.supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .eq("org_id", ctx.orgId)
    .single();

  if (!assessment) return errorResponse("Assessment not found", 404);

  const { data, error } = await ctx.supabase
    .from("benchmarks")
    .select("*")
    .eq("assessment_id", assessmentId);

  if (error) return errorResponse(error.message, 500);

  // Split into overall and per-category
  const overall = (data || []).find((b: Record<string, unknown>) => b.category_id === null) || null;
  const categories = (data || []).filter((b: Record<string, unknown>) => b.category_id !== null);

  return json({ data: { overall, categories } });
}

// GET /v1/leads
async function listLeads(ctx: RequestContext): Promise<Response> {
  const { limit, offset } = pagination(ctx.searchParams);
  const assessmentId = ctx.searchParams.get("assessment_id");

  let query = ctx.supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (assessmentId) {
    query = query.eq("assessment_id", assessmentId);
  }

  const { data, error, count } = await query;

  if (error) return errorResponse(error.message, 500);

  return json({ data, pagination: { total: count, limit, offset } });
}

// POST /v1/leads
async function createLead(ctx: RequestContext): Promise<Response> {
  const body = ctx.body as Record<string, unknown> | null;
  if (!body || !body.email || !body.assessment_id) {
    return errorResponse("email and assessment_id are required");
  }

  // Verify assessment belongs to org
  const { data: assessment } = await ctx.supabase
    .from("assessments")
    .select("id")
    .eq("id", body.assessment_id)
    .eq("org_id", ctx.orgId)
    .single();

  if (!assessment) return errorResponse("Assessment not found", 404);

  const { data, error } = await ctx.supabase
    .from("leads")
    .insert({
      assessment_id: body.assessment_id,
      org_id: ctx.orgId,
      email: body.email,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      company: body.company || null,
      phone: body.phone || null,
      custom_fields_json: body.custom_fields_json || {},
      source: body.source || "api",
      utm_json: body.utm_json || {},
    })
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return json({ data }, 201);
}

// POST /v1/webhooks
async function createWebhook(ctx: RequestContext): Promise<Response> {
  const body = ctx.body as Record<string, unknown> | null;
  if (!body || !body.url) return errorResponse("url is required");

  // Store webhook in assessment settings_json.  If assessment_id is provided
  // we set the webhook on that assessment; otherwise we treat it as an
  // org-level webhook stored in the organisations table metadata.
  const assessmentId = body.assessment_id as string | undefined;

  if (assessmentId) {
    // Verify assessment belongs to org
    const { data: assessment, error: aErr } = await ctx.supabase
      .from("assessments")
      .select("id, settings_json")
      .eq("id", assessmentId)
      .eq("org_id", ctx.orgId)
      .single();

    if (aErr || !assessment) return errorResponse("Assessment not found", 404);

    const settings = (assessment.settings_json as Record<string, unknown>) || {};
    settings.webhook_url = body.url;
    if (body.secret) settings.webhook_secret = body.secret;
    if (body.events) settings.webhook_events = body.events;

    const { error } = await ctx.supabase
      .from("assessments")
      .update({ settings_json: settings })
      .eq("id", assessmentId);

    if (error) return errorResponse(error.message, 500);

    return json({
      data: {
        assessment_id: assessmentId,
        url: body.url,
        events: body.events || ["assessment.completed"],
      },
    }, 201);
  }

  return errorResponse("assessment_id is required for webhook registration");
}

// GET /v1/webhooks
async function listWebhooks(ctx: RequestContext): Promise<Response> {
  const { data, error } = await ctx.supabase
    .from("assessments")
    .select("id, title, settings_json")
    .eq("org_id", ctx.orgId)
    .not("settings_json->webhook_url", "is", null);

  if (error) return errorResponse(error.message, 500);

  const webhooks = (data || [])
    .filter((a: Record<string, unknown>) => {
      const s = a.settings_json as Record<string, unknown> | null;
      return s && s.webhook_url;
    })
    .map((a: Record<string, unknown>) => {
      const s = a.settings_json as Record<string, string | string[]>;
      return {
        assessment_id: a.id,
        assessment_title: a.title,
        url: s.webhook_url,
        events: s.webhook_events || ["assessment.completed"],
      };
    });

  return json({ data: webhooks });
}

// GET /v1/openapi.json  – serve the static OpenAPI spec
async function openApiSpec(_ctx: RequestContext): Promise<Response> {
  // Read the co-located openapi.json.  In Deno Deploy / Supabase Edge
  // Functions the file is bundled alongside index.ts.
  try {
    const specPath = new URL("./openapi.json", import.meta.url);
    const specText = await (await fetch(specPath)).text();
    return new Response(specText, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return errorResponse("OpenAPI spec not found", 404);
  }
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------
const routes: RouteMatch[] = [
  // OpenAPI spec (no scope required – handled before auth)
  { pattern: "GET /v1/openapi.json", scope: "__public__", handler: openApiSpec },

  // Assessments
  { pattern: "GET /v1/assessments", scope: "assessments:read", handler: listAssessments },
  { pattern: "POST /v1/assessments", scope: "assessments:write", handler: createAssessment },
  { pattern: "GET /v1/assessments/:id", scope: "assessments:read", handler: getAssessment },
  { pattern: "GET /v1/assessments/:id/responses", scope: "responses:read", handler: listResponses },
  { pattern: "GET /v1/assessments/:id/scores", scope: "scores:read", handler: listScores },
  { pattern: "GET /v1/assessments/:id/benchmarks", scope: "scores:read", handler: getBenchmarks },

  // Leads
  { pattern: "GET /v1/leads", scope: "leads:read", handler: listLeads },
  { pattern: "POST /v1/leads", scope: "leads:write", handler: createLead },

  // Webhooks
  { pattern: "POST /v1/webhooks", scope: "webhooks:manage", handler: createWebhook },
  { pattern: "GET /v1/webhooks", scope: "webhooks:manage", handler: listWebhooks },
];

// ---------------------------------------------------------------------------
// Router – simple pattern matcher
// ---------------------------------------------------------------------------
interface MatchResult {
  route: RouteMatch;
  params: Record<string, string>;
}

function matchRoute(method: string, path: string): MatchResult | null {
  for (const route of routes) {
    const [routeMethod, routePath] = route.pattern.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePath.split("/").filter(Boolean);
    const pathParts = path.split("/").filter(Boolean);

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Match a route
    const match = matchRoute(method, path);
    if (!match) {
      return errorResponse("Not found", 404);
    }

    // -----------------------------------------------------------------------
    // Public routes (OpenAPI spec) – skip auth
    // -----------------------------------------------------------------------
    if (match.route.scope === "__public__") {
      const ctx: RequestContext = {
        supabase,
        orgId: "",
        params: match.params,
        searchParams: url.searchParams,
        req,
        body: null,
      };
      return await match.route.handler(ctx);
    }

    // -----------------------------------------------------------------------
    // Authenticate via API key
    // -----------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }

    const rawKey = authHeader.slice(7).trim();
    if (!rawKey) {
      return errorResponse("API key is required", 401);
    }

    const keyHash = await sha256Hex(rawKey);

    // Look up the key by its hash
    const { data: apiKey, error: keyErr } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .is("revoked_at", null)
      .single();

    if (keyErr || !apiKey) {
      return errorResponse("Invalid API key", 401);
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return errorResponse("API key has expired", 401);
    }

    // -----------------------------------------------------------------------
    // Check scope
    // -----------------------------------------------------------------------
    const requiredScope = match.route.scope;
    const keyScopes: string[] = apiKey.scopes || [];

    if (!keyScopes.includes(requiredScope) && !keyScopes.includes("*")) {
      return errorResponse(
        `Insufficient scope. Required: ${requiredScope}`,
        403
      );
    }

    // -----------------------------------------------------------------------
    // Rate limiting – count requests in the last hour
    // -----------------------------------------------------------------------
    const rateLimit: number = apiKey.rate_limit ?? 1000;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // We use a lightweight approach: count recent api_request_logs rows
    // for this key.  If the table does not exist yet we skip rate limiting.
    try {
      const { count } = await supabase
        .from("api_request_logs")
        .select("id", { count: "exact", head: true })
        .eq("api_key_id", apiKey.id)
        .gte("created_at", oneHourAgo);

      if (count !== null && count >= rateLimit) {
        return json(
          {
            error: "Rate limit exceeded",
            limit: rateLimit,
            retry_after_seconds: 60,
          },
          429
        );
      }
    } catch {
      // Table may not exist – skip rate limiting gracefully
    }

    // -----------------------------------------------------------------------
    // Update last_used_at and log the request (fire-and-forget)
    // -----------------------------------------------------------------------
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id)
      .then(() => {})
      .catch(() => {});

    // Log the request (non-blocking)
    supabase
      .from("api_request_logs")
      .insert({
        api_key_id: apiKey.id,
        org_id: apiKey.org_id,
        method,
        path,
        created_at: new Date().toISOString(),
      })
      .then(() => {})
      .catch(() => {});

    // -----------------------------------------------------------------------
    // Parse body for POST/PUT/PATCH
    // -----------------------------------------------------------------------
    let body: unknown = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        body = await req.json();
      } catch {
        return errorResponse("Invalid JSON body", 400);
      }
    }

    // -----------------------------------------------------------------------
    // Execute handler
    // -----------------------------------------------------------------------
    const ctx: RequestContext = {
      supabase,
      orgId: apiKey.org_id,
      params: match.params,
      searchParams: url.searchParams,
      req,
      body,
    };

    return await match.route.handler(ctx);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("API v1 error:", err);
    return errorResponse(message, 500);
  }
});
