import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Assessment, Category, Question, AnswerOption, ScoreTier } from "@/types/assessment";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { CategoriesTab } from "@/components/builder/CategoriesTab";
import { QuestionsTab } from "@/components/builder/QuestionsTab";
import { ScoringTab } from "@/components/builder/ScoringTab";
import { SettingsTab } from "@/components/builder/SettingsTab";
import { ShareTab } from "@/components/builder/ShareTab";
import { LandingPageTab } from "@/components/landing-page/LandingPageTab";
import { ResultsPageTab } from "@/components/results-page/ResultsPageTab";

export type BuilderTab = "categories" | "questions" | "scoring" | "settings" | "share" | "landing-page" | "results-page";

const AssessmentBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);
  const [scoreTiers, setScoreTiers] = useState<ScoreTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BuilderTab>("categories");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchAll = useCallback(async () => {
    if (!id) return;
    const [aRes, cRes, qRes, aoRes, stRes] = await Promise.all([
      supabase.from("assessments").select("*").eq("id", id).single(),
      supabase.from("categories").select("*").eq("assessment_id", id).order("sort_order"),
      supabase.from("questions").select("*").eq("assessment_id", id).order("sort_order"),
      supabase.from("answer_options").select("*, questions!inner(assessment_id)").eq("questions.assessment_id", id).order("sort_order"),
      supabase.from("score_tiers").select("*").eq("assessment_id", id).order("sort_order"),
    ]);

    if (aRes.error || !aRes.data) {
      toast.error("Assessment not found");
      navigate("/assessments");
      return;
    }

    setAssessment(aRes.data as unknown as Assessment);
    setCategories((cRes.data as unknown as Category[]) ?? []);
    setQuestions((qRes.data as unknown as Question[]) ?? []);
    // answer_options join returns extra fields, clean it
    setAnswerOptions(((aoRes.data ?? []) as any[]).map(({ questions: _, ...rest }) => rest) as AnswerOption[]);
    setScoreTiers((stRes.data as unknown as ScoreTier[]) ?? []);
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const autosave = useCallback((fn: () => Promise<void>) => {
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      await fn();
      setSaveStatus("saved");
    }, 800);
  }, []);

  const updateAssessment = useCallback((updates: Partial<Assessment>) => {
    if (!assessment) return;
    setAssessment(prev => prev ? { ...prev, ...updates } : prev);
    autosave(async () => {
      await supabase.from("assessments").update(updates as any).eq("id", assessment.id);
    });
  }, [assessment, autosave]);

  const refreshCategories = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("categories").select("*").eq("assessment_id", id).order("sort_order");
    setCategories((data as unknown as Category[]) ?? []);
  }, [id]);

  const refreshQuestions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("questions").select("*").eq("assessment_id", id).order("sort_order");
    setQuestions((data as unknown as Question[]) ?? []);
  }, [id]);

  const refreshAnswerOptions = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("answer_options").select("*, questions!inner(assessment_id)").eq("questions.assessment_id", id).order("sort_order");
    setAnswerOptions(((data ?? []) as any[]).map(({ questions: _, ...rest }) => rest) as AnswerOption[]);
  }, [id]);

  const refreshScoreTiers = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from("score_tiers").select("*").eq("assessment_id", id).order("sort_order");
    setScoreTiers((data as unknown as ScoreTier[]) ?? []);
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <BuilderTopBar
        assessment={assessment}
        saveStatus={saveStatus}
        onUpdate={updateAssessment}
        onBack={() => navigate("/assessments")}
      />
      <div className="flex flex-1 overflow-hidden">
        <BuilderSidebar
          categories={categories}
          questions={questions}
          selectedCategoryId={selectedCategoryId}
          selectedQuestionId={selectedQuestionId}
          onSelectCategory={(catId) => {
            setSelectedCategoryId(catId);
            setSelectedQuestionId(null);
            setActiveTab("categories");
          }}
          onSelectQuestion={(qId, catId) => {
            setSelectedQuestionId(qId);
            setSelectedCategoryId(catId);
            setActiveTab("questions");
          }}
        />
        <div className="flex-1 overflow-auto">
          <div className="border-b bg-card px-6">
            <nav className="flex gap-6">
              {(["categories", "questions", "scoring", "settings", "share", "landing-page", "results-page"] as BuilderTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                   }`}
                >
                  {tab === "landing-page" ? "Landing Page" : tab === "results-page" ? "Results Page" : tab}
                </button>
              ))}
            </nav>
          </div>
          {activeTab === "landing-page" ? (
            <LandingPageTab assessment={assessment} />
          ) : activeTab === "results-page" ? (
            <ResultsPageTab assessment={assessment} scoreTiers={scoreTiers} categories={categories} />
          ) : (
            <div className="p-6">
              {activeTab === "categories" && (
                <CategoriesTab
                  assessment={assessment}
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onSelect={setSelectedCategoryId}
                  onRefresh={refreshCategories}
                />
              )}
              {activeTab === "questions" && (
                <QuestionsTab
                  assessment={assessment}
                  categories={categories}
                  questions={questions}
                  answerOptions={answerOptions}
                  selectedCategoryId={selectedCategoryId}
                  selectedQuestionId={selectedQuestionId}
                  onSelectQuestion={(qId, catId) => {
                    setSelectedQuestionId(qId);
                    setSelectedCategoryId(catId);
                  }}
                  onRefreshQuestions={refreshQuestions}
                  onRefreshOptions={refreshAnswerOptions}
                />
              )}
              {activeTab === "scoring" && (
                <ScoringTab
                  assessment={assessment}
                  categories={categories}
                  scoreTiers={scoreTiers}
                  onRefresh={refreshScoreTiers}
                  onUpdateAssessment={updateAssessment}
                  onRefreshCategories={refreshCategories}
                />
              )}
              {activeTab === "settings" && (
                <SettingsTab
                  assessment={assessment}
                  onUpdate={updateAssessment}
                />
              )}
              {activeTab === "share" && (
                <ShareTab assessment={assessment} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentBuilder;
