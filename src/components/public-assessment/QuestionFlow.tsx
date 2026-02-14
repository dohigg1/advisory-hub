import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { QuestionRenderer } from "./QuestionRenderer";
import type { AssessmentData } from "@/pages/PublicAssessment";
import type { Tables } from "@/integrations/supabase/types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

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

// Single-select question types that should auto-advance
const SINGLE_SELECT_TYPES = new Set(["multiple_choice", "yes_no", "image_select", "rating_scale"]);

// Minimum endowed progress percentage
const ENDOWED_PROGRESS = 8;

// Auto-advance delay in ms after single-select answer
const AUTO_ADVANCE_DELAY = 600;

/**
 * Computes category segment boundaries for the progress bar.
 * Each segment is proportional to the number of questions in that category.
 */
function buildCategorySegments(
  sortedQuestions: Question[],
  categoryMap: Map<string, Tables<"categories">>,
) {
  const segments: {
    categoryId: string;
    name: string;
    colour: string | null;
    startIndex: number;
    endIndex: number; // exclusive
  }[] = [];

  let prevCategoryId: string | null = null;
  for (let i = 0; i < sortedQuestions.length; i++) {
    const catId = sortedQuestions[i].category_id;
    if (catId !== prevCategoryId) {
      const cat = categoryMap.get(catId);
      segments.push({
        categoryId: catId,
        name: cat?.name ?? "",
        colour: cat?.colour ?? null,
        startIndex: i,
        endIndex: i + 1,
      });
      prevCategoryId = catId;
    } else {
      segments[segments.length - 1].endIndex = i + 1;
    }
  }
  return segments;
}

export function QuestionFlow({ data, leadId, brandColour, onCompleted, setLeadId }: Props) {
  const { questions, answerOptions, categories, settings } = data;

  // ── Derived data ─────────────────────────────────────────────
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

  const categoryMap = useMemo(
    () => new Map(categories.map(c => [c.id, c])),
    [categories],
  );

  const categorySegments = useMemo(
    () => buildCategorySegments(sortedQuestions, categoryMap),
    [sortedQuestions, categoryMap],
  );

  // ── State ────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = forward, -1 = back
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialSegmentIdx, setInterstitialSegmentIdx] = useState(-1);
  const [autoAdvanceCheck, setAutoAdvanceCheck] = useState(false);

  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdvancingRef = useRef(false);

  // ── Current question helpers ─────────────────────────────────
  const currentQuestion = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const category = currentQuestion ? categoryMap.get(currentQuestion.category_id) : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

  const canAdvance = currentQuestion
    ? !currentQuestion.is_required ||
      (currentAnswer &&
        (currentAnswer.selectedOptionIds.length > 0 ||
          currentAnswer.openTextValue.trim().length > 0))
    : false;

  // ── Progress calculation with endowed progress ───────────────
  const rawProgress =
    totalQuestions > 0 ? (currentIndex / totalQuestions) * 100 : 0;
  const progress = ENDOWED_PROGRESS + rawProgress * ((100 - ENDOWED_PROGRESS) / 100);

  const questionsRemaining = totalQuestions - currentIndex;
  const completionRatio = totalQuestions > 0 ? currentIndex / totalQuestions : 0;

  // ── Callbacks ────────────────────────────────────────────────
  const setAnswer = useCallback(
    (questionId: string, answer: QuestionAnswer) => {
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    },
    [],
  );

  const saveResponse = useCallback(
    async (questionId: string, answer: QuestionAnswer) => {
      if (!leadId) return;
      const { data: existing } = await supabase
        .from("responses")
        .select("id")
        .eq("lead_id", leadId)
        .eq("question_id", questionId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("responses")
          .update({
            selected_option_ids: answer.selectedOptionIds,
            open_text_value: answer.openTextValue || null,
            points_awarded: answer.pointsAwarded,
            responded_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("responses").insert({
          lead_id: leadId,
          question_id: questionId,
          selected_option_ids: answer.selectedOptionIds,
          open_text_value: answer.openTextValue || null,
          points_awarded: answer.pointsAwarded,
        });
      }
    },
    [leadId],
  );

  /**
   * Returns the segment index for a given question index,
   * or -1 if not found.
   */
  const segmentIndexForQuestion = useCallback(
    (qIdx: number) =>
      categorySegments.findIndex(
        s => qIdx >= s.startIndex && qIdx < s.endIndex,
      ),
    [categorySegments],
  );

  /**
   * Determine whether we need an interstitial before moving to nextIdx.
   * An interstitial is shown when nextIdx enters a new category segment
   * that the user hasn't seen yet (only forward navigation).
   */
  const needsInterstitial = useCallback(
    (prevIdx: number, nextIdx: number) => {
      if (nextIdx <= prevIdx) return false; // going backward, no interstitial
      const prevSeg = segmentIndexForQuestion(prevIdx);
      const nextSeg = segmentIndexForQuestion(nextIdx);
      return nextSeg > prevSeg && nextSeg > 0; // don't show for the very first category
    },
    [segmentIndexForQuestion],
  );

  const advanceToIndex = useCallback(
    (nextIdx: number) => {
      setDirection(1);
      if (needsInterstitial(currentIndex, nextIdx)) {
        const nextSeg = segmentIndexForQuestion(nextIdx);
        setInterstitialSegmentIdx(nextSeg);
        setShowInterstitial(true);
        // After a brief pause, move to the question
        setTimeout(() => {
          setShowInterstitial(false);
          setCurrentIndex(nextIdx);
        }, 2200);
      } else {
        setCurrentIndex(nextIdx);
      }
    },
    [currentIndex, needsInterstitial, segmentIndexForQuestion],
  );

  const handleNext = useCallback(async () => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    if (currentQuestion && currentAnswer) {
      await saveResponse(currentQuestion.id, currentAnswer);
    }

    if (currentIndex < totalQuestions - 1) {
      advanceToIndex(currentIndex + 1);
    } else {
      onCompleted();
    }

    // Reset lock after a short delay to avoid double-taps
    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 350);
  }, [
    currentQuestion,
    currentAnswer,
    currentIndex,
    totalQuestions,
    saveResponse,
    advanceToIndex,
    onCompleted,
  ]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  // ── Auto-advance for single-select questions ─────────────────
  const handleAnswer = useCallback(
    (questionId: string, answer: QuestionAnswer) => {
      setAnswer(questionId, answer);
    },
    [setAnswer],
  );

  // Watch for single-select answer changes to trigger auto-advance
  useEffect(() => {
    // Clear any pending auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (!currentQuestion) return;
    if (!SINGLE_SELECT_TYPES.has(currentQuestion.type)) return;

    const ans = answers[currentQuestion.id];
    if (!ans) return;
    if (ans.selectedOptionIds.length === 0) return;

    // Show checkmark, then auto-advance
    setAutoAdvanceCheck(true);
    autoAdvanceTimerRef.current = setTimeout(() => {
      setAutoAdvanceCheck(false);
      handleNext();
    }, AUTO_ADVANCE_DELAY);

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentQuestion?.id,
    answers[currentQuestion?.id ?? ""]?.selectedOptionIds.join(","),
  ]);

  // Reset auto-advance check when question changes
  useEffect(() => {
    setAutoAdvanceCheck(false);
  }, [currentIndex]);

  // ── Edge case: no questions ──────────────────────────────────
  if (!currentQuestion) {
    if (totalQuestions === 0) {
      onCompleted();
    }
    return null;
  }

  const options = optionsByQuestion.get(currentQuestion.id) || [];

  // ── Animation variants ───────────────────────────────────────
  const slideVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      y: dir > 0 ? 60 : -60,
    }),
    center: {
      opacity: 1,
      y: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      y: dir > 0 ? -60 : 60,
    }),
  };

  const interstitialVariants = {
    enter: { opacity: 0, scale: 0.95 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  // ── Interstitial segment data ────────────────────────────────
  const interstitialSegment =
    interstitialSegmentIdx >= 0
      ? categorySegments[interstitialSegmentIdx]
      : null;
  const interstitialCategory = interstitialSegment
    ? categoryMap.get(interstitialSegment.categoryId)
    : null;
  const interstitialQuestionCount = interstitialSegment
    ? interstitialSegment.endIndex - interstitialSegment.startIndex
    : 0;

  // ── Progress label ───────────────────────────────────────────
  const progressLabel =
    completionRatio >= 0.75
      ? `Just ${questionsRemaining} question${questionsRemaining === 1 ? "" : "s"} to go!`
      : `Question ${currentIndex + 1} of ${totalQuestions}`;

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="relative w-full min-h-screen flex flex-col">
      {/* ── Fixed segmented progress bar at top of viewport ────── */}
      {settings.show_progress_bar !== false && (
        <div className="fixed top-0 left-0 right-0 z-50 flex h-[3px]">
          {categorySegments.map((seg, idx) => {
            const segQuestionCount = seg.endIndex - seg.startIndex;
            const widthPercent = (segQuestionCount / totalQuestions) * 100;

            // How much of this segment is filled
            let segFill = 0;
            if (currentIndex >= seg.endIndex) {
              segFill = 100;
            } else if (currentIndex >= seg.startIndex) {
              const rawFill =
                ((currentIndex - seg.startIndex) / segQuestionCount) * 100;
              // Apply endowed progress only to the first segment
              segFill =
                idx === 0 ? Math.max(ENDOWED_PROGRESS, rawFill) : rawFill;
            } else if (idx === 0) {
              // First segment always shows endowed progress
              segFill = ENDOWED_PROGRESS;
            }

            const segColour = seg.colour || brandColour;

            return (
              <div
                key={seg.categoryId}
                className="relative h-full"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: `${segColour}20`,
                }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0"
                  style={{ backgroundColor: segColour }}
                  initial={false}
                  animate={{ width: `${segFill}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
                {/* Gap between segments */}
                {idx < categorySegments.length - 1 && (
                  <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main content area: vertically centered ──────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            {showInterstitial && interstitialCategory ? (
              /* ── Category interstitial ──────────────────────────── */
              <motion.div
                key={`interstitial-${interstitialSegmentIdx}`}
                variants={interstitialVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center justify-center text-center min-h-[60vh]"
              >
                {interstitialCategory.icon && (
                  <span className="text-4xl mb-4">
                    {interstitialCategory.icon}
                  </span>
                )}
                <span
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: brandColour }}
                >
                  Up next
                </span>
                <h2
                  className="text-3xl md:text-4xl font-bold mb-3"
                  style={{
                    color:
                      interstitialCategory.colour || brandColour,
                  }}
                >
                  {interstitialCategory.name}
                </h2>
                {interstitialCategory.description && (
                  <p className="text-base text-muted-foreground max-w-md mb-4">
                    {interstitialCategory.description}
                  </p>
                )}
                <span className="text-sm text-muted-foreground">
                  {interstitialQuestionCount} question
                  {interstitialQuestionCount === 1 ? "" : "s"}
                </span>
              </motion.div>
            ) : (
              /* ── Question card ──────────────────────────────────── */
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col justify-center min-h-[60vh]"
              >
                {/* Progress label */}
                {settings.show_progress_bar !== false && (
                  <p className="text-xs text-muted-foreground mb-8">
                    {progressLabel}
                  </p>
                )}

                {/* Category label */}
                {category && (
                  <span
                    className="text-xs font-semibold uppercase tracking-widest mb-3 block"
                    style={{ color: category.colour || brandColour }}
                  >
                    {category.name}
                  </span>
                )}

                {/* Question text */}
                <h2 className="text-2xl md:text-3xl font-semibold mb-4 leading-snug">
                  {currentQuestion.text}
                </h2>

                {currentQuestion.help_text && (
                  <p className="text-sm text-muted-foreground mb-8">
                    {currentQuestion.help_text}
                  </p>
                )}

                {/* Answer options */}
                <div className="mt-2 mb-20 sm:mb-8">
                  <QuestionRenderer
                    question={currentQuestion}
                    options={options}
                    answer={
                      currentAnswer || {
                        selectedOptionIds: [],
                        openTextValue: "",
                        pointsAwarded: 0,
                      }
                    }
                    onAnswer={a => handleAnswer(currentQuestion.id, a)}
                    brandColour={brandColour}
                  />
                </div>

                {/* Auto-advance checkmark overlay */}
                <AnimatePresence>
                  {autoAdvanceCheck &&
                    SINGLE_SELECT_TYPES.has(currentQuestion.type) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-center mt-2"
                      >
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: brandColour }}
                        >
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop navigation */}
                <div className="hidden sm:flex justify-between items-center mt-6">
                  <button
                    onClick={handleBack}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>

                  {/* Only show Next on non-single-select, or when auto-advance hasn't fired */}
                  <button
                    onClick={handleNext}
                    disabled={!canAdvance}
                    className="flex items-center gap-1 h-10 px-6 rounded-md text-white text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: brandColour }}
                  >
                    {currentIndex === totalQuestions - 1 ? "Finish" : "Next"}{" "}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Mobile fixed bottom bar ─────────────────────────────── */}
      {!showInterstitial && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-40">
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
            className="flex items-center gap-1 h-10 px-8 rounded-md text-white text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColour }}
          >
            {currentIndex === totalQuestions - 1 ? "Finish" : "Next"}{" "}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
