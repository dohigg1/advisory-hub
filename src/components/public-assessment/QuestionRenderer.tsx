import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { Tables } from "@/integrations/supabase/types";
import type { QuestionAnswer } from "./QuestionFlow";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Question = Tables<"questions">;
type AnswerOption = Tables<"answer_options">;

interface Props {
  question: Question;
  options: AnswerOption[];
  answer: QuestionAnswer;
  onAnswer: (a: QuestionAnswer) => void;
  brandColour: string;
}

/* ── animation variants ─────────────────────────────────────── */

const cardVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.98 },
  selected: {
    scale: [1, 1.03, 1],
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 25 },
  },
};

const ratingVariants = {
  idle: { scale: 1 },
  tap: { scale: 0.9 },
  selected: {
    scale: [1, 1.2, 1],
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
};

/* ── component ──────────────────────────────────────────────── */

export function QuestionRenderer({ question, options, answer, onAnswer, brandColour }: Props) {
  const type = question.type;
  const qSettings = (question.settings_json as Record<string, any>) || {};

  const selectOption = (optionId: string) => {
    const opt = options.find(o => o.id === optionId);
    onAnswer({
      selectedOptionIds: [optionId],
      openTextValue: "",
      pointsAwarded: opt?.points || 0,
    });
  };

  const toggleOption = (optionId: string) => {
    const current = answer.selectedOptionIds;
    const next = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    const points = next.reduce((sum, id) => {
      const opt = options.find(o => o.id === id);
      return sum + (opt?.points || 0);
    }, 0);
    onAnswer({ selectedOptionIds: next, openTextValue: "", pointsAwarded: points });
  };

  /* ── YES / NO ─────────────────────────────────────────────── */

  if (type === "yes_no") {
    return (
      <div className="flex gap-4">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              variants={cardVariants}
              initial="idle"
              whileTap="tap"
              animate={selected ? "selected" : "idle"}
              className={[
                "flex-1 min-h-[48px] rounded-xl border-2 p-5 text-sm font-medium transition-colors duration-200",
                selected
                  ? "border-primary bg-primary/10 shadow-md text-primary"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      variants={checkVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <span>{opt.text}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* ── MULTIPLE CHOICE ──────────────────────────────────────── */

  if (type === "multiple_choice") {
    return (
      <div className="space-y-3">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              variants={cardVariants}
              initial="idle"
              whileTap="tap"
              animate={selected ? "selected" : "idle"}
              className={[
                "w-full flex items-center gap-3 rounded-xl border-2 p-5 text-left text-sm min-h-[48px] transition-colors duration-200",
                selected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-transparent hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
              ].join(" ")}
            >
              <div
                className={[
                  "h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                  selected
                    ? "border-primary bg-primary"
                    : "border-border",
                ].join(" ")}
              >
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      variants={checkVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className={selected ? "text-foreground font-medium" : "text-foreground"}>
                {opt.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* ── SLIDING SCALE ────────────────────────────────────────── */

  if (type === "sliding_scale") {
    const min = qSettings.min ?? 0;
    const max = qSettings.max ?? 10;
    const currentVal = answer.pointsAwarded || min;
    return (
      <div className="space-y-6 pt-4">
        <Slider
          value={[currentVal]}
          min={min}
          max={max}
          step={1}
          onValueChange={([val]) => {
            onAnswer({ selectedOptionIds: ["__scale"], openTextValue: "", pointsAwarded: val });
          }}
          className="w-full"
        />
        <div className="flex items-end justify-between text-xs text-muted-foreground">
          <span className="font-medium">{qSettings.min_label || min}</span>
          <motion.span
            key={currentVal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold text-primary"
          >
            {currentVal}
          </motion.span>
          <span className="font-medium">{qSettings.max_label || max}</span>
        </div>
      </div>
    );
  }

  /* ── RATING SCALE ─────────────────────────────────────────── */

  if (type === "rating_scale") {
    const max = qSettings.max ?? 5;
    const values = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <div className="flex gap-3 justify-center pt-4 flex-wrap">
        {values.map(val => {
          const selected = answer.pointsAwarded === val && answer.selectedOptionIds.includes("__rating");
          return (
            <motion.button
              key={val}
              onClick={() => onAnswer({ selectedOptionIds: ["__rating"], openTextValue: "", pointsAwarded: val })}
              variants={ratingVariants}
              initial="idle"
              whileTap="tap"
              animate={selected ? "selected" : "idle"}
              className={[
                "h-14 w-14 rounded-full border-2 text-sm font-semibold transition-colors duration-200 flex items-center justify-center",
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
              ].join(" ")}
            >
              {val}
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* ── OPEN TEXT ─────────────────────────────────────────────── */

  if (type === "open_text") {
    const isLong = qSettings.multiline !== false;
    return isLong ? (
      <Textarea
        value={answer.openTextValue}
        onChange={e => onAnswer({ selectedOptionIds: [], openTextValue: e.target.value, pointsAwarded: 0 })}
        rows={4}
        placeholder="Type your answer..."
        className="text-sm rounded-xl border-2 border-border p-5 min-h-[48px] transition-colors duration-200 focus:border-primary focus:ring-primary/20"
      />
    ) : (
      <Input
        value={answer.openTextValue}
        onChange={e => onAnswer({ selectedOptionIds: [], openTextValue: e.target.value, pointsAwarded: 0 })}
        placeholder="Type your answer..."
        className="h-[48px] text-sm rounded-xl border-2 border-border px-5 transition-colors duration-200 focus:border-primary focus:ring-primary/20"
      />
    );
  }

  /* ── CHECKBOX SELECT ──────────────────────────────────────── */

  if (type === "checkbox_select") {
    return (
      <div className="space-y-3">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              variants={cardVariants}
              initial="idle"
              whileTap="tap"
              animate={selected ? "selected" : "idle"}
              className={[
                "w-full flex items-center gap-3 rounded-xl border-2 p-5 text-left text-sm min-h-[48px] transition-colors duration-200",
                selected
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-transparent hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
              ].join(" ")}
            >
              <Checkbox
                checked={selected}
                className={[
                  "pointer-events-none transition-colors duration-200",
                  selected
                    ? "border-primary bg-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    : "border-border",
                ].join(" ")}
              />
              <span className={selected ? "text-foreground font-medium" : "text-foreground"}>
                {opt.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* ── IMAGE SELECT ─────────────────────────────────────────── */

  if (type === "image_select") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <motion.button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              variants={cardVariants}
              initial="idle"
              whileTap="tap"
              animate={selected ? "selected" : "idle"}
              className={[
                "rounded-xl border-2 overflow-hidden transition-colors duration-200 min-h-[48px]",
                selected
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/30 hover:shadow-sm",
              ].join(" ")}
            >
              {opt.image_url && (
                <div className="relative">
                  <img src={opt.image_url} alt={opt.text} className="w-full h-32 object-cover" />
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        variants={checkVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div className={[
                "p-3 text-xs text-center font-medium transition-colors duration-200",
                selected ? "bg-primary/10 text-foreground" : "text-muted-foreground",
              ].join(" ")}>
                {opt.text}
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Unsupported question type</p>;
}
