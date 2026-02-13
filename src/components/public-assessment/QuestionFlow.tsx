import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "./QuestionRenderer";
import type { AssessmentData } from "@/pages/PublicAssessment";
import type { Tables } from "@/integrations/supabase/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Question = Tables<"questions">;
type AnswerOption = Tables<"answer_options">;

interface Props {
  data: AssessmentData;
  leadId: string | null;
  brandColour: string;
  onCompleted: () => void;
  setLeadId: (id: string) => void;
}

// Answer state per question
export interface QuestionAnswer {
  selectedOptionIds: string[];
  openTextValue: string;
  pointsAwarded: number;
}

export function QuestionFlow({ data, leadId, brandColour, onCompleted, setLeadId }: Props) {
  const { questions, answerOptions, categories, settings } = data;

  // Sort questions by category sort order, then question sort order
  const sortedQuestions = useMemo(() => {
    const catOrder = new Map(categories.map(c => [c.id, c.sort_order]));
    return [...questions].sort((a, b) => {
      const catA = catOrder.get(a.category_id) ?? 0;
      const catB = catOrder.get(b.category_id) ?? 0;
      if (catA !== catB) return catA - catB;
      return a.sort_order - b.sort_order;
    });
  }, [questions, categories]);

  const optionsByQuestion = useMemo(() => {
    const map = new Map<string, AnswerOption[]>();
    answerOptions.forEach(o => {
      const arr = map.get(o.question_id) || [];
      arr.push(o);
      map.set(o.question_id, arr);
    });
    return map;
  }, [answerOptions]);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [transitioning, setTransitioning] = useState(false);

  const currentQuestion = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const progress = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;
  const category = currentQuestion ? categoryMap.get(currentQuestion.category_id) : null;

  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  const canAdvance = currentQuestion
    ? !currentQuestion.is_required || (currentAnswer && (currentAnswer.selectedOptionIds.length > 0 || currentAnswer.openTextValue.trim().length > 0))
    : false;

  const setAnswer = useCallback((questionId: string, answer: QuestionAnswer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const saveResponse = useCallback(async (questionId: string, answer: QuestionAnswer) => {
    if (!leadId) return;
    // Upsert response
    const { data: existing } = await supabase
      .from("responses")
      .select("id")
      .eq("lead_id", leadId)
      .eq("question_id", questionId)
      .maybeSingle();

    if (existing) {
      await supabase.from("responses").update({
        selected_option_ids: answer.selectedOptionIds,
        open_text_value: answer.openTextValue || null,
        points_awarded: answer.pointsAwarded,
        responded_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("responses").insert({
        lead_id: leadId,
        question_id: questionId,
        selected_option_ids: answer.selectedOptionIds,
        open_text_value: answer.openTextValue || null,
        points_awarded: answer.pointsAwarded,
      });
    }
  }, [leadId]);

  const transition = (cb: () => void) => {
    setTransitioning(true);
    setTimeout(() => {
      cb();
      setTransitioning(false);
    }, 200);
  };

  const handleNext = async () => {
    if (currentQuestion && currentAnswer) {
      await saveResponse(currentQuestion.id, currentAnswer);
    }

    if (currentIndex < totalQuestions - 1) {
      transition(() => setCurrentIndex(i => i + 1));
    } else {
      onCompleted();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      transition(() => setCurrentIndex(i => i - 1));
    }
  };

  if (!currentQuestion) {
    // No questions in this assessment — skip to completion
    if (totalQuestions === 0) {
      onCompleted();
    }
    return null;
  }

  const options = optionsByQuestion.get(currentQuestion.id) || [];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      {(settings.show_progress_bar !== false) && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" style={{ "--progress-color": brandColour } as any} />
        </div>
      )}

      {/* Question */}
      <div
        className="transition-opacity duration-200"
        style={{ opacity: transitioning ? 0 : 1 }}
      >
        {category && (
          <span className="text-xs font-medium uppercase tracking-wide mb-3 block" style={{ color: brandColour }}>
            {category.name}
          </span>
        )}

        <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>

        {currentQuestion.help_text && (
          <p className="text-sm text-muted-foreground mb-6">{currentQuestion.help_text}</p>
        )}

        <QuestionRenderer
          question={currentQuestion}
          options={options}
          answer={currentAnswer || { selectedOptionIds: [], openTextValue: "", pointsAwarded: 0 }}
          onAnswer={(a) => setAnswer(currentQuestion.id, a)}
          brandColour={brandColour}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-10">
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="flex items-center gap-1 h-10 px-6 rounded-md text-white text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: brandColour }}
        >
          {currentIndex === totalQuestions - 1 ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
