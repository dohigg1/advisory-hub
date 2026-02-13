import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import type { Tables } from "@/integrations/supabase/types";
import type { QuestionAnswer } from "./QuestionFlow";
import { Check } from "lucide-react";

type Question = Tables<"questions">;
type AnswerOption = Tables<"answer_options">;

interface Props {
  question: Question;
  options: AnswerOption[];
  answer: QuestionAnswer;
  onAnswer: (a: QuestionAnswer) => void;
  brandColour: string;
}

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

  // YES / NO
  if (type === "yes_no") {
    return (
      <div className="flex gap-4">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              className="flex-1 h-14 rounded-lg border-2 text-sm font-medium transition-all"
              style={{
                borderColor: selected ? brandColour : "#e2e8f0",
                backgroundColor: selected ? brandColour + "10" : "transparent",
                color: selected ? brandColour : "#64748b",
              }}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    );
  }

  // MULTIPLE CHOICE
  if (type === "multiple_choice") {
    return (
      <div className="space-y-3">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left text-sm transition-all"
              style={{
                borderColor: selected ? brandColour : "#e2e8f0",
                backgroundColor: selected ? brandColour + "10" : "transparent",
              }}
            >
              <div
                className="h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: selected ? brandColour : "#cbd5e1", backgroundColor: selected ? brandColour : "transparent" }}
              >
                {selected && <Check className="h-3 w-3 text-white" />}
              </div>
              <span style={{ color: selected ? brandColour : "#334155" }}>{opt.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // SLIDING SCALE
  if (type === "sliding_scale") {
    const min = qSettings.min ?? 0;
    const max = qSettings.max ?? 10;
    const currentVal = answer.pointsAwarded || min;
    return (
      <div className="space-y-4 pt-4">
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
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{qSettings.min_label || min}</span>
          <span className="text-lg font-semibold" style={{ color: brandColour }}>{currentVal}</span>
          <span>{qSettings.max_label || max}</span>
        </div>
      </div>
    );
  }

  // RATING SCALE
  if (type === "rating_scale") {
    const max = qSettings.max ?? 5;
    const values = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <div className="flex gap-3 justify-center pt-4">
        {values.map(val => {
          const selected = answer.pointsAwarded === val && answer.selectedOptionIds.includes("__rating");
          return (
            <button
              key={val}
              onClick={() => onAnswer({ selectedOptionIds: ["__rating"], openTextValue: "", pointsAwarded: val })}
              className="h-12 w-12 rounded-full border-2 text-sm font-semibold transition-all"
              style={{
                borderColor: selected ? brandColour : "#e2e8f0",
                backgroundColor: selected ? brandColour : "transparent",
                color: selected ? "#fff" : "#64748b",
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    );
  }

  // OPEN TEXT
  if (type === "open_text") {
    const isLong = qSettings.multiline !== false;
    return isLong ? (
      <Textarea
        value={answer.openTextValue}
        onChange={e => onAnswer({ selectedOptionIds: [], openTextValue: e.target.value, pointsAwarded: 0 })}
        rows={4}
        placeholder="Type your answer..."
        className="text-sm"
      />
    ) : (
      <Input
        value={answer.openTextValue}
        onChange={e => onAnswer({ selectedOptionIds: [], openTextValue: e.target.value, pointsAwarded: 0 })}
        placeholder="Type your answer..."
        className="h-11 text-sm"
      />
    );
  }

  // CHECKBOX SELECT
  if (type === "checkbox_select") {
    return (
      <div className="space-y-3">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              className="w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left text-sm transition-all"
              style={{
                borderColor: selected ? brandColour : "#e2e8f0",
                backgroundColor: selected ? brandColour + "10" : "transparent",
              }}
            >
              <Checkbox
                checked={selected}
                className="pointer-events-none"
                style={{ borderColor: selected ? brandColour : undefined, backgroundColor: selected ? brandColour : undefined } as any}
              />
              <span style={{ color: selected ? brandColour : "#334155" }}>{opt.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // IMAGE SELECT
  if (type === "image_select") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {options.map(opt => {
          const selected = answer.selectedOptionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => selectOption(opt.id)}
              className="rounded-lg border-2 overflow-hidden transition-all"
              style={{
                borderColor: selected ? brandColour : "#e2e8f0",
              }}
            >
              {opt.image_url && (
                <img src={opt.image_url} alt={opt.text} className="w-full h-32 object-cover" />
              )}
              <div className="p-2 text-xs text-center">{opt.text}</div>
            </button>
          );
        })}
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Unsupported question type</p>;
}
