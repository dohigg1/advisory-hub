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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { lead_id } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadErr || !lead) {
      throw new Error(`Lead not found: ${lead_id}`);
    }

    const assessmentId = lead.assessment_id;

    // Fetch all needed data in parallel
    const [responsesRes, questionsRes, categoriesRes, tiersRes] =
      await Promise.all([
        supabase.from("responses").select("*").eq("lead_id", lead_id),
        supabase
          .from("questions")
          .select("*")
          .eq("assessment_id", assessmentId),
        supabase
          .from("categories")
          .select("*")
          .eq("assessment_id", assessmentId)
          .order("sort_order"),
        supabase
          .from("score_tiers")
          .select("*")
          .eq("assessment_id", assessmentId)
          .order("min_pct"),
      ]);

    const responses = responsesRes.data || [];
    const questions = questionsRes.data || [];
    const categories = categoriesRes.data || [];
    const tiers = tiersRes.data || [];

    // Fetch all answer options for these questions
    const questionIds = questions.map((q: any) => q.id);
    const { data: allOptions } = await supabase
      .from("answer_options")
      .select("*")
      .in("question_id", questionIds)
      .order("sort_order");
    const options = allOptions || [];

    // Build lookup maps
    const optionsByQuestion = new Map<string, any[]>();
    for (const o of options) {
      const arr = optionsByQuestion.get(o.question_id) || [];
      arr.push(o);
      optionsByQuestion.set(o.question_id, arr);
    }

    const responsesByQuestion = new Map<string, any>();
    for (const r of responses) {
      responsesByQuestion.set(r.question_id, r);
    }

    // Calculate per-question scores and update responses
    const questionScores = new Map<
      string,
      { points: number; possible: number; categoryId: string }
    >();

    for (const q of questions) {
      const qOptions = optionsByQuestion.get(q.id) || [];
      const response = responsesByQuestion.get(q.id);

      // Skip open_text questions from scoring
      if (q.type === "open_text") {
        questionScores.set(q.id, {
          points: 0,
          possible: 0,
          categoryId: q.category_id,
        });
        continue;
      }

      let pointsAwarded = 0;
      let totalPossible = 0;

      if (q.type === "sliding_scale") {
        // For sliding scale: points = selected value, possible = max value
        const settings = (q.settings_json as any) || {};
        totalPossible = settings.max ?? 10;
        if (response && response.selected_option_ids?.length > 0) {
          // The "option id" for sliding scale stores the numeric value
          pointsAwarded = parseInt(response.selected_option_ids[0]) || 0;
        } else if (response) {
          pointsAwarded = response.points_awarded || 0;
        }
      } else if (q.type === "checkbox_select") {
        // Multi-select: sum points of all selected; possible = sum of all positive-value options
        totalPossible = qOptions
          .filter((o: any) => o.points > 0)
          .reduce((s: number, o: any) => s + o.points, 0);
        if (response && response.selected_option_ids?.length > 0) {
          const selectedSet = new Set(response.selected_option_ids);
          pointsAwarded = qOptions
            .filter((o: any) => selectedSet.has(o.id))
            .reduce((s: number, o: any) => s + o.points, 0);
        }
      } else {
        // Single-select: max points of any option is possible
        totalPossible =
          qOptions.length > 0
            ? Math.max(...qOptions.map((o: any) => o.points))
            : 0;
        if (response && response.selected_option_ids?.length > 0) {
          const selectedId = response.selected_option_ids[0];
          const selectedOption = qOptions.find(
            (o: any) => o.id === selectedId
          );
          pointsAwarded = selectedOption ? selectedOption.points : 0;
        }
      }

      questionScores.set(q.id, {
        points: pointsAwarded,
        possible: totalPossible,
        categoryId: q.category_id,
      });

      // Update response with correct points_awarded
      if (response) {
        await supabase
          .from("responses")
          .update({ points_awarded: pointsAwarded })
          .eq("id", response.id);
      }
    }

    // Aggregate by category
    const categoryScoresJson: Record<
      string,
      {
        points: number;
        possible: number;
        percentage: number | null;
        tier_id: string | null;
        tier_label: string | null;
        tier_colour: string | null;
      }
    > = {};

    let overallPoints = 0;
    let overallPossible = 0;

    for (const cat of categories) {
      const catQuestions = questions.filter(
        (q: any) => q.category_id === cat.id
      );
      let catPoints = 0;
      let catPossible = 0;

      for (const q of catQuestions) {
        const qs = questionScores.get(q.id);
        if (qs) {
          catPoints += qs.points;
          catPossible += qs.possible;
        }
      }

      const catPct =
        catPossible > 0
          ? Math.round((catPoints / catPossible) * 100)
          : null;
      const catTier =
        catPct !== null
          ? tiers.find(
              (t: any) => catPct >= t.min_pct && catPct <= t.max_pct
            ) || null
          : null;

      categoryScoresJson[cat.id] = {
        points: catPoints,
        possible: catPossible,
        percentage: catPct,
        tier_id: catTier?.id || null,
        tier_label: catTier?.label || null,
        tier_colour: catTier?.colour || null,
      };

      if (cat.include_in_total) {
        overallPoints += catPoints;
        overallPossible += catPossible;
      }
    }

    const overallPct =
      overallPossible > 0
        ? Math.round((overallPoints / overallPossible) * 100)
        : null;
    const overallTier =
      overallPct !== null
        ? tiers.find(
            (t: any) => overallPct >= t.min_pct && overallPct <= t.max_pct
          ) || null
        : null;

    // Upsert score record
    const { data: existingScore } = await supabase
      .from("scores")
      .select("id")
      .eq("lead_id", lead_id)
      .maybeSingle();

    let scoreRecord;
    const scoreData = {
      lead_id,
      assessment_id: assessmentId,
      total_points: overallPoints,
      total_possible: overallPossible,
      percentage: overallPct,
      tier_id: overallTier?.id || null,
      category_scores_json: categoryScoresJson,
      calculated_at: new Date().toISOString(),
    };

    if (existingScore) {
      const { data, error } = await supabase
        .from("scores")
        .update(scoreData)
        .eq("id", existingScore.id)
        .select()
        .single();
      if (error) throw error;
      scoreRecord = data;
    } else {
      const { data, error } = await supabase
        .from("scores")
        .insert(scoreData)
        .select()
        .single();
      if (error) throw error;
      scoreRecord = data;
    }

    // Update lead with score_id and mark completed
    await supabase
      .from("leads")
      .update({
        score_id: scoreRecord.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", lead_id);

    // Fire automations in background (don't block response)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const automationHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    };
    const automationBody = JSON.stringify({ lead_id });

    // Fire and forget - results email
    fetch(`${supabaseUrl}/functions/v1/send-results-email`, {
      method: "POST",
      headers: automationHeaders,
      body: automationBody,
    }).catch(e => console.error("Results email trigger failed:", e));

    // Fire and forget - webhook
    fetch(`${supabaseUrl}/functions/v1/fire-webhook`, {
      method: "POST",
      headers: automationHeaders,
      body: automationBody,
    }).catch(e => console.error("Webhook trigger failed:", e));

    return new Response(
      JSON.stringify({
        score: scoreRecord,
        categories: categoryScoresJson,
        overall_percentage: overallPct,
        overall_tier: overallTier,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Scoring error:", err);

    // Log to scoring_errors table
    try {
      const body = await req.clone().json().catch(() => ({}));
      await supabase.from("scoring_errors").insert({
        lead_id: body.lead_id || null,
        error_message: err.message || String(err),
        error_details: { stack: err.stack },
      });
    } catch (_) {
      // ignore logging errors
    }

    return new Response(
      JSON.stringify({ error: err.message || "Scoring failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
