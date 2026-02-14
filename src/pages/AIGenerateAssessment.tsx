import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Check, Layers, HelpCircle, BarChart3 } from "lucide-react";
import { ASSESSMENT_TYPE_LABELS } from "@/types/assessment";
import type { AssessmentType } from "@/types/assessment";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedData {
  title: string;
  description: string;
  categories: { name: string; description: string; icon: string; colour: string; sort_order: number }[];
  questions: { category_index: number; type: string; text: string; help_text: string | null; is_required: boolean; sort_order: number; options: { text: string; points: number; sort_order: number }[] }[];
  score_tiers: { label: string; min_pct: number; max_pct: number; colour: string; description: string; sort_order: number }[];
}

const AIGenerateAssessment = () => {
  const navigate = useNavigate();
  const { organisation } = useAuth();
  const { canCreate, usage } = usePlanLimits();
  const [step, setStep] = useState(0);

  // Step 1 form
  const [topic, setTopic] = useState("");
  const [assessmentType, setAssessmentType] = useState<AssessmentType>("scorecard");
  const [questionCount, setQuestionCount] = useState(15);
  const [categoryCount, setCategoryCount] = useState(4);

  // Step 2 data
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedData | null>(null);

  // Step 3
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error("Please enter a topic"); return; }
    if (!canCreate("assessments")) {
      toast.error(`You've reached your plan limit of ${usage.assessments.limit} assessments.`);
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-assessment", {
        body: { topic: topic.trim(), assessment_type: assessmentType, question_count: questionCount, category_count: categoryCount },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGenerated(data.data);
      setStep(1);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!organisation || !generated) return;
    setSaving(true);
    try {
      // 1. Create assessment
      const { data: assessment, error: aErr } = await supabase
        .from("assessments")
        .insert({
          org_id: organisation.id,
          title: generated.title,
          description: generated.description,
          type: assessmentType,
          settings_json: {
            lead_form_position: "before",
            show_progress_bar: true,
            allow_retakes: false,
            completion_message: "Thank you for completing this assessment!",
            lead_fields: { first_name: { enabled: true, required: true }, last_name: { enabled: true, required: false }, email: { enabled: true, required: true }, company: { enabled: true, required: false }, phone: { enabled: false, required: false } },
          },
        })
        .select()
        .single();
      if (aErr || !assessment) throw new Error(aErr?.message || "Failed to create assessment");
      const assessmentId = (assessment as any).id;

      // 2. Categories
      const catsToInsert = generated.categories.map(c => ({ assessment_id: assessmentId, name: c.name, description: c.description, icon: c.icon, colour: c.colour, sort_order: c.sort_order }));
      const { data: createdCats, error: cErr } = await supabase.from("categories").insert(catsToInsert).select();
      if (cErr || !createdCats) throw new Error(cErr?.message || "Failed to create categories");

      const catIdMap = new Map<number, string>();
      createdCats.forEach((cat: any, idx: number) => catIdMap.set(idx, cat.id));

      // 3. Questions
      const qsToInsert = generated.questions.map(q => ({
        assessment_id: assessmentId,
        category_id: catIdMap.get(q.category_index)!,
        type: q.type as any,
        text: q.text,
        help_text: q.help_text,
        is_required: q.is_required,
        sort_order: q.sort_order,
      }));
      const { data: createdQs, error: qErr } = await supabase.from("questions").insert(qsToInsert).select();
      if (qErr || !createdQs) throw new Error(qErr?.message || "Failed to create questions");

      // 4. Answer options
      const optsToInsert: any[] = [];
      generated.questions.forEach((q, idx) => {
        const questionId = (createdQs as any[])[idx]?.id;
        if (questionId && q.options) {
          q.options.forEach(opt => optsToInsert.push({ question_id: questionId, text: opt.text, points: opt.points, sort_order: opt.sort_order }));
        }
      });
      if (optsToInsert.length > 0) {
        const { error: oErr } = await supabase.from("answer_options").insert(optsToInsert);
        if (oErr) throw new Error(oErr.message);
      }

      // 5. Score tiers
      const tiersToInsert = generated.score_tiers.map(t => ({ assessment_id: assessmentId, label: t.label, min_pct: t.min_pct, max_pct: t.max_pct, colour: t.colour, description: t.description, sort_order: t.sort_order }));
      const { error: tErr } = await supabase.from("score_tiers").insert(tiersToInsert);
      if (tErr) throw new Error(tErr.message);

      toast.success(`"${generated.title}" created successfully`);
      navigate(`/assessments/${assessmentId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save assessment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/assessments")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold">AI Assessment Generator</h1>
            <p className="text-[11px] text-muted-foreground">Step {step + 1} of 2</p>
          </div>
          <div className="flex gap-1.5">
            {[0, 1].map(s => (
              <div key={s} className={`h-1.5 w-8 rounded-full transition-colors ${s <= step ? "bg-accent" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Describe your assessment</h2>
                <p className="text-[13px] text-muted-foreground mt-1">Tell us what you want to assess and we'll generate a complete framework.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Topic / Description</Label>
                  <Textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Cybersecurity readiness for mid-market financial services firms"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">Assessment Type</Label>
                    <Select value={assessmentType} onValueChange={v => setAssessmentType(v as AssessmentType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">Questions: {questionCount}</Label>
                    <Slider value={[questionCount]} onValueChange={v => setQuestionCount(v[0])} min={5} max={40} step={5} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">Categories: {categoryCount}</Label>
                    <Slider value={[categoryCount]} onValueChange={v => setCategoryCount(v[0])} min={2} max={8} step={1} />
                  </div>
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate Assessment"}
              </Button>
            </motion.div>
          )}

          {step === 1 && generated && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{generated.title}</h2>
                  <p className="text-[13px] text-muted-foreground mt-1">{generated.description}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep(0)} className="shrink-0">
                  <ArrowLeft className="h-3 w-3 mr-1" /> Edit Inputs
                </Button>
              </div>

              <div className="flex gap-4 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {generated.categories.length} categories</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5" /> {generated.questions.length} questions</span>
                <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> {generated.score_tiers.length} tiers</span>
              </div>

              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-5 pr-2">
                  {/* Categories */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {generated.categories.map((cat, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40">
                          <div className="h-2.5 w-2.5 rounded-full mt-1 shrink-0" style={{ background: cat.colour }} />
                          <div>
                            <p className="text-[12px] font-medium">{cat.name}</p>
                            <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Questions preview */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Questions</h3>
                    <div className="space-y-1.5">
                      {generated.questions.map((q, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
                          <span className="text-[10px] text-muted-foreground/60 mono mt-0.5 shrink-0 w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px]">{q.text}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ background: generated.categories[q.category_index]?.colour }} />
                              <span className="text-[10px] text-muted-foreground">{generated.categories[q.category_index]?.name}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score tiers */}
                  <div>
                    <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score Tiers</h3>
                    <div className="space-y-1.5">
                      {generated.score_tiers.map((tier, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ background: tier.colour }} />
                          <span className="text-[12px] font-medium">{tier.label}</span>
                          <span className="text-[11px] text-muted-foreground">{tier.min_pct}%–{tier.max_pct}%</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{tier.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={generating} className="gap-2">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Regenerate
                </Button>
                <Button onClick={handleCreate} disabled={saving} className="gap-2 flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? "Creating…" : "Create Assessment"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIGenerateAssessment;
