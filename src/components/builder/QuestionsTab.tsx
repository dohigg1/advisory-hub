import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Copy, ArrowUpDown } from "lucide-react";
import type { Assessment, Category, Question, AnswerOption, QuestionType } from "@/types/assessment";
import { QUESTION_TYPE_LABELS } from "@/types/assessment";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";

interface Props {
  assessment: Assessment;
  categories: Category[];
  questions: Question[];
  answerOptions: AnswerOption[];
  selectedCategoryId: string | null;
  selectedQuestionId: string | null;
  onSelectQuestion: (qId: string | null, catId: string | null) => void;
  onRefreshQuestions: () => Promise<void>;
  onRefreshOptions: () => Promise<void>;
}

export function QuestionsTab({
  assessment, categories, questions, answerOptions,
  selectedCategoryId, selectedQuestionId, onSelectQuestion,
  onRefreshQuestions, onRefreshOptions,
}: Props) {
  const [adding, setAdding] = useState(false);

  const filteredQuestions = selectedCategoryId
    ? questions.filter(q => q.category_id === selectedCategoryId)
    : questions;

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);
  const questionOptions = selectedQuestion
    ? answerOptions.filter(o => o.question_id === selectedQuestion.id).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const handleAdd = async () => {
    const catId = selectedCategoryId || categories[0]?.id;
    if (!catId) {
      toast.error("Create a category first");
      return;
    }
    setAdding(true);
    const { data, error } = await supabase.from("questions").insert({
      assessment_id: assessment.id,
      category_id: catId,
      text: "New Question",
      type: "multiple_choice",
      sort_order: filteredQuestions.length,
    } as any).select().single();
    if (error) toast.error(error.message);
    else {
      const q = data as unknown as Question;
      // Add default options for multiple choice
      await supabase.from("answer_options").insert([
        { question_id: q.id, text: "Option A", points: 3, sort_order: 0 },
        { question_id: q.id, text: "Option B", points: 2, sort_order: 1 },
        { question_id: q.id, text: "Option C", points: 1, sort_order: 2 },
      ] as any);
      await Promise.all([onRefreshQuestions(), onRefreshOptions()]);
      onSelectQuestion(q.id, catId);
    }
    setAdding(false);
  };

  const handleUpdateQuestion = async (qId: string, updates: Partial<Question>) => {
    const { error } = await supabase.from("questions").update(updates as any).eq("id", qId);
    if (error) toast.error(error.message);
    else await onRefreshQuestions();
  };

  const handleDeleteQuestion = async (qId: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", qId);
    if (error) toast.error(error.message);
    else {
      if (selectedQuestionId === qId) onSelectQuestion(null, selectedCategoryId);
      await Promise.all([onRefreshQuestions(), onRefreshOptions()]);
      toast.success("Question deleted");
    }
  };

  const handleDuplicate = async (q: Question) => {
    const { data, error } = await supabase.from("questions").insert({
      assessment_id: q.assessment_id,
      category_id: q.category_id,
      text: q.text + " (copy)",
      type: q.type,
      help_text: q.help_text,
      is_required: q.is_required,
      sort_order: filteredQuestions.length,
      settings_json: q.settings_json,
    } as any).select().single();
    if (error) { toast.error(error.message); return; }
    const newQ = data as unknown as Question;

    // Copy answer options
    const opts = answerOptions.filter(o => o.question_id === q.id);
    if (opts.length > 0) {
      await supabase.from("answer_options").insert(
        opts.map(o => ({ question_id: newQ.id, text: o.text, points: o.points, image_url: o.image_url, sort_order: o.sort_order })) as any
      );
    }
    await Promise.all([onRefreshQuestions(), onRefreshOptions()]);
    onSelectQuestion(newQ.id, newQ.category_id);
    toast.success("Question duplicated");
  };

  const handleChangeType = async (qId: string, newType: QuestionType) => {
    // Delete existing options and create defaults for new type
    await supabase.from("answer_options").delete().eq("question_id", qId);
    await handleUpdateQuestion(qId, { type: newType });

    const defaults: Partial<AnswerOption>[] = [];
    if (newType === "yes_no") {
      defaults.push({ question_id: qId, text: "Yes", points: 1, sort_order: 0 });
      defaults.push({ question_id: qId, text: "No", points: 0, sort_order: 1 });
    } else if (newType === "multiple_choice" || newType === "checkbox_select") {
      defaults.push({ question_id: qId, text: "Option A", points: 3, sort_order: 0 });
      defaults.push({ question_id: qId, text: "Option B", points: 2, sort_order: 1 });
      defaults.push({ question_id: qId, text: "Option C", points: 1, sort_order: 2 });
    }
    if (defaults.length) await supabase.from("answer_options").insert(defaults as any);
    await onRefreshOptions();
  };

  const handleMoveToCategory = async (qId: string, newCatId: string) => {
    await handleUpdateQuestion(qId, { category_id: newCatId } as any);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Questions</h2>
          <p className="text-sm text-muted-foreground">
            {selectedCategoryId
              ? `Showing questions in "${categories.find(c => c.id === selectedCategoryId)?.name}"`
              : "All questions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {categories.length > 0 && (
            <Select value={selectedCategoryId || "all"} onValueChange={v => onSelectQuestion(null, v === "all" ? null : v)}>
              <SelectTrigger className="w-48 h-9 text-sm">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAdd} disabled={adding} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Question
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Question list */}
        <div className="lg:col-span-1 space-y-1">
          {filteredQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id, q.category_id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors border ${
                selectedQuestionId === q.id ? "border-accent bg-accent/5" : "border-transparent hover:bg-muted/50"
              }`}
            >
              <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate">{q.text || "Untitled"}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{QUESTION_TYPE_LABELS[q.type]}</Badge>
                  {q.type === "open_text" && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">No score</Badge>}
                </div>
              </div>
            </button>
          ))}
          {filteredQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {categories.length === 0 ? "Create a category first." : "Add your first question."}
            </p>
          )}
        </div>

        {/* Question editor */}
        {selectedQuestion && (
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Edit Question</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleDuplicate(selectedQuestion)} className="h-8 w-8">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(selectedQuestion.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Question text</Label>
                <Textarea
                  value={selectedQuestion.text}
                  onChange={e => handleUpdateQuestion(selectedQuestion.id, { text: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Help text (optional)</Label>
                <Input
                  value={selectedQuestion.help_text || ""}
                  onChange={e => handleUpdateQuestion(selectedQuestion.id, { help_text: e.target.value || null })}
                  placeholder="Additional context for respondents"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Question type</Label>
                  <Select value={selectedQuestion.type} onValueChange={v => handleChangeType(selectedQuestion.id, v as QuestionType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={selectedQuestion.category_id} onValueChange={v => handleMoveToCategory(selectedQuestion.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selectedQuestion.is_required}
                  onCheckedChange={v => handleUpdateQuestion(selectedQuestion.id, { is_required: v })}
                />
                <Label className="text-xs">Required</Label>
              </div>

              {/* Type-specific options editor */}
              <QuestionOptionsEditor
                question={selectedQuestion}
                options={questionOptions}
                onRefresh={onRefreshOptions}
                onUpdateQuestion={handleUpdateQuestion}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
