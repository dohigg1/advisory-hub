import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { LeadCaptureForm } from "@/components/public-assessment/LeadCaptureForm";
import { QuestionFlow } from "@/components/public-assessment/QuestionFlow";
import { CalculatingResults } from "@/components/public-assessment/CalculatingResults";
import { AlreadyCompleted } from "@/components/public-assessment/AlreadyCompleted";
import { AssessmentHeader } from "@/components/public-assessment/AssessmentHeader";

type Assessment = Tables<"assessments">;
type Category = Tables<"categories">;
type Question = Tables<"questions">;
type AnswerOption = Tables<"answer_options">;
type Organisation = Tables<"organisations">;

export interface AssessmentData {
  assessment: Assessment;
  categories: Category[];
  questions: Question[];
  answerOptions: AnswerOption[];
  organisation: Organisation | null;
  settings: Record<string, any>;
}

type FlowStep = "loading" | "landing" | "lead_form" | "questions" | "calculating" | "completed" | "already_completed";

export default function PublicAssessment() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<FlowStep>("loading");
  const [data, setData] = useState<AssessmentData | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Extract UTM params
  const utmParams = {
    utm_source: searchParams.get("utm_source") || undefined,
    utm_medium: searchParams.get("utm_medium") || undefined,
    utm_campaign: searchParams.get("utm_campaign") || undefined,
    utm_term: searchParams.get("utm_term") || undefined,
    utm_content: searchParams.get("utm_content") || undefined,
  };

  useEffect(() => {
    if (!slug) return;
    loadAssessmentData(slug);
  }, [slug]);

  const loadAssessmentData = async (slug: string) => {
    // Get landing page to find assessment
    const { data: lp, error: lpErr } = await supabase
      .from("landing_pages")
      .select("assessment_id")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (lpErr || !lp) {
      setNotFound(true);
      setStep("loading");
      return;
    }

    const assessmentId = lp.assessment_id;

    // Fetch all data in parallel
    const [assessmentRes, categoriesRes, questionsRes, optionsRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", assessmentId).single(),
      supabase.from("categories").select("*").eq("assessment_id", assessmentId).order("sort_order"),
      supabase.from("questions").select("*").eq("assessment_id", assessmentId).order("sort_order"),
      supabase.from("answer_options").select("*").order("sort_order"),
    ]);

    if (!assessmentRes.data) {
      setNotFound(true);
      return;
    }

    const assessment = assessmentRes.data;
    const questions = questionsRes.data || [];
    const allOptions = optionsRes.data || [];

    // Filter options to only those belonging to our questions
    const questionIds = new Set(questions.map(q => q.id));
    const answerOptions = allOptions.filter(o => questionIds.has(o.question_id));

    // Get org
    const { data: org } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", assessment.org_id)
      .single();

    const settings = (assessment.settings_json as Record<string, any>) || {};

    setData({
      assessment,
      categories: categoriesRes.data || [],
      questions,
      answerOptions,
      organisation: org,
      settings,
    });

    // Determine first step based on lead_form_position
    const position = settings.lead_form_position || "before";
    if (position === "before") {
      setStep("lead_form");
    } else {
      setStep("questions");
    }
  };

  const handleLeadSubmitted = useCallback((newLeadId: string) => {
    setLeadId(newLeadId);
    const position = data?.settings.lead_form_position || "before";
    if (position === "before") {
      setStep("questions");
    } else {
      // After questions, lead form was shown, now calculate
      setStep("calculating");
      setTimeout(() => setStep("completed"), 2000);
    }
  }, [data]);

  const handleQuestionsCompleted = useCallback(() => {
    const position = data?.settings.lead_form_position || "before";
    if (position === "after") {
      setStep("lead_form");
    } else {
      setStep("calculating");
      setTimeout(() => {
        // Mark lead as completed
        if (leadId) {
          supabase.from("leads").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", leadId).then();
        }
        setStep("completed");
      }, 2000);
    }
  }, [data, leadId]);

  const handleAlreadyCompleted = useCallback(() => {
    setStep("already_completed");
  }, []);

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">This assessment doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  if (step === "loading" || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const brandColour = data.organisation?.primary_colour || "#1B3A5C";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AssessmentHeader organisation={data.organisation} brandColour={brandColour} />

      <main className="flex-1 flex items-center justify-center p-4">
        {step === "lead_form" && (
          <LeadCaptureForm
            data={data}
            utmParams={utmParams}
            brandColour={brandColour}
            onSubmitted={handleLeadSubmitted}
            onAlreadyCompleted={handleAlreadyCompleted}
          />
        )}

        {step === "questions" && (
          <QuestionFlow
            data={data}
            leadId={leadId}
            brandColour={brandColour}
            onCompleted={handleQuestionsCompleted}
            setLeadId={setLeadId}
          />
        )}

        {step === "calculating" && <CalculatingResults brandColour={brandColour} />}

        {step === "completed" && (
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-3">Assessment Complete</h2>
            <p className="text-muted-foreground">{data.settings.completion_message || "Thank you for completing this assessment!"}</p>
          </div>
        )}

        {step === "already_completed" && (
          <AlreadyCompleted
            allowRetakes={data.settings.allow_retakes}
            brandColour={brandColour}
            onRetake={() => {
              const position = data.settings.lead_form_position || "before";
              setLeadId(null);
              setStep(position === "before" ? "lead_form" : "questions");
            }}
          />
        )}
      </main>
    </div>
  );
}
