import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { TEMPLATE_CATEGORY_LABELS, type TemplateFixture, type TemplateCategory } from "@/data/templates";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_BADGE_STYLES: Record<TemplateCategory, string> = {
  consulting: "bg-accent/10 text-accent border-0",
  accounting: "bg-success/10 text-success border-0",
  advisory: "bg-purple-500/10 text-purple-600 border-0",
  technology: "bg-blue-500/10 text-blue-600 border-0",
  hr: "bg-pink-500/10 text-pink-600 border-0",
  compliance: "bg-amber-500/10 text-amber-600 border-0",
  operations: "bg-emerald-500/10 text-emerald-600 border-0",
};

interface Props {
  template: TemplateFixture | null;
  onClose: () => void;
  onUseTemplate: (template: TemplateFixture) => void;
  loading?: boolean;
}

export function TemplatePreviewDialog({ template, onClose, onUseTemplate, loading }: Props) {
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  if (!template) return null;

  const { categories, questions, score_tiers } = template.template_data_json;

  // Group questions by category
  const questionsByCategory = categories.map((cat, catIndex) => ({
    category: cat,
    questions: questions.filter(q => q.category_index === catIndex),
  }));

  const handleClose = () => {
    setInteractiveMode(false);
    setCurrentQuestionIndex(0);
    onClose();
  };

  if (interactiveMode) {
    const q = questions[currentQuestionIndex];
    const cat = categories[q.category_index];
    const total = questions.length;

    return (
      <Dialog open onOpenChange={open => !open && handleClose()}>
        <DialogContent className="shadow-soft-lg max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <Badge className={`text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[template.category]}`}>
                Preview Mode
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {currentQuestionIndex + 1} of {total}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / total) * 100}%` }}
              />
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col justify-center py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.colour }} />
                  <span className="text-[11px] text-muted-foreground font-medium">{cat.name}</span>
                </div>
                <p className="text-[15px] font-medium leading-relaxed">{q.text}</p>
                {q.help_text && (
                  <p className="text-[12px] text-muted-foreground flex items-start gap-1.5">
                    <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {q.help_text}
                  </p>
                )}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors cursor-default"
                      >
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        <span className="text-[13px] flex-1">{opt.text}</span>
                        <span className="text-[10px] text-muted-foreground/40 font-mono">{opt.points}pt</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="shrink-0 flex items-center justify-between pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(i => i - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px] text-muted-foreground"
              onClick={() => { setInteractiveMode(false); setCurrentQuestionIndex(0); }}
            >
              Exit Preview
            </Button>
            {currentQuestionIndex < total - 1 ? (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => setCurrentQuestionIndex(i => i + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => { setInteractiveMode(false); setCurrentQuestionIndex(0); }}
              >
                Done
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={open => !open && handleClose()}>
      <DialogContent className="shadow-soft-lg max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[template.category]}`}>
              {TEMPLATE_CATEGORY_LABELS[template.category]}
            </Badge>
            <span className="text-[11px] text-muted-foreground">
              {template.question_count} questions · {categories.length} categories
            </span>
          </div>
          <DialogTitle className="text-lg">{template.title}</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">{template.description}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-5 pb-4">
            {/* Score Tiers */}
            <div>
              <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score Tiers</h3>
              <div className="space-y-1.5">
                {score_tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: tier.colour }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium">{tier.label}</span>
                      <span className="text-[11px] text-muted-foreground ml-2">{tier.min_pct}% – {tier.max_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Questions grouped by category */}
            {questionsByCategory.map((group, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: group.category.colour }} />
                  <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.category.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground/50">
                    {group.questions.length} question{group.questions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2 ml-[18px]">{group.category.description}</p>
                <div className="space-y-1.5">
                  {group.questions.map((q, qi) => (
                    <div key={qi} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
                      <span className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 shrink-0 w-4 text-right">
                        {qi + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px]">{q.text}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.options.map((opt, oi) => (
                              <span key={oi} className="text-[10px] text-muted-foreground/50 bg-muted/60 px-1.5 py-0.5 rounded">
                                {opt.text} ({opt.points}pt)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[9px] shrink-0 border-border/40 text-muted-foreground/50">
                        {q.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="shrink-0 pt-3 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 h-10"
            onClick={() => { setInteractiveMode(true); setCurrentQuestionIndex(0); }}
          >
            <Play className="h-4 w-4" />
            Preview Assessment
          </Button>
          <Button
            className="flex-1 gap-2 h-10"
            onClick={() => {
              onUseTemplate(template);
              handleClose();
            }}
            disabled={loading}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Creating…" : "Use Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
