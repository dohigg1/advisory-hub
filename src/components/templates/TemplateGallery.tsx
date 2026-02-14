import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, ArrowLeft, Layers, HelpCircle, BarChart3, Sparkles, Lock, Crown } from "lucide-react";
import { TEMPLATE_CATEGORY_LABELS, type TemplateFixture, type TemplateCategory } from "@/data/templates";
import { useTemplates, type TemplateWithAccess } from "@/hooks/useTemplates";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { motion } from "framer-motion";

interface Props {
  onUseTemplate: (template: TemplateFixture) => void;
  onBack: () => void;
  loading?: boolean;
}

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  consulting: "bg-accent/10 text-accent border-0",
  accounting: "bg-success/10 text-success border-0",
  advisory: "bg-purple-500/10 text-purple-600 border-0",
  technology: "bg-blue-500/10 text-blue-600 border-0",
  hr: "bg-pink-500/10 text-pink-600 border-0",
  compliance: "bg-amber-500/10 text-amber-600 border-0",
  operations: "bg-emerald-500/10 text-emerald-600 border-0",
};

const TIER_LABEL: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  firm: "Firm",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export function TemplateGallery({ onUseTemplate, onBack, loading }: Props) {
  const { tier } = usePlanLimits();
  const { templates: allTemplates, loading: templatesLoading } = useTemplates(tier);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateWithAccess | null>(null);

  const filtered = useMemo(() => {
    return allTemplates.filter(t => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, categoryFilter, allTemplates]);

  return (
    <>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Template Library</h2>
            <p className="text-[12px] text-muted-foreground">Pre-built assessment frameworks for professional services</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", ...Object.keys(TEMPLATE_CATEGORY_LABELS)] as const).map(cat => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                className="h-9 text-[12px] px-3"
                onClick={() => setCategoryFilter(cat as TemplateCategory | "all")}
              >
                {cat === "all" ? "All" : TEMPLATE_CATEGORY_LABELS[cat as TemplateCategory]}
              </Button>
            ))}
          </div>
        </div>

        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-[13px] font-medium">No templates match your search</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
            {filtered.map((t, i) => (
              <motion.div key={t.id || i} variants={item}>
                <Card
                  className={`group cursor-pointer shadow-soft-xs hover:shadow-soft-md transition-all duration-300 border-border/60 overflow-hidden ${
                    t.locked
                      ? "opacity-75 hover:border-amber-200"
                      : "hover:border-accent/20"
                  }`}
                  onClick={() => setPreviewTemplate(t)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-[14px] font-semibold tracking-tight truncate flex items-center gap-1.5">
                          {t.title}
                          {t.locked && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.min_plan_tier && (
                          <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600">
                            {TIER_LABEL[t.min_plan_tier] || t.min_plan_tier}+
                          </Badge>
                        )}
                        <Badge className={`text-[10px] font-semibold shrink-0 ${CATEGORY_BADGE_STYLES[t.category] || ""}`}>
                          {TEMPLATE_CATEGORY_LABELS[t.category as TemplateCategory] || t.category}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <p className="text-[12px] text-muted-foreground/70 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {t.question_count} questions</span>
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {t.template_data_json.categories?.length || 0} categories</span>
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {t.template_data_json.score_tiers?.length || 0} tiers</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={open => !open && setPreviewTemplate(null)}>
        <DialogContent className="shadow-soft-lg max-w-2xl max-h-[85vh] flex flex-col">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-[10px] font-semibold ${CATEGORY_BADGE_STYLES[previewTemplate.category] || ""}`}>
                    {TEMPLATE_CATEGORY_LABELS[previewTemplate.category as TemplateCategory] || previewTemplate.category}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {previewTemplate.question_count} questions · {previewTemplate.template_data_json.categories?.length || 0} categories
                  </span>
                  {previewTemplate.min_plan_tier && (
                    <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-600 gap-0.5">
                      <Crown className="h-2.5 w-2.5" />
                      {TIER_LABEL[previewTemplate.min_plan_tier] || previewTemplate.min_plan_tier}+
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg">{previewTemplate.title}</DialogTitle>
                <p className="text-[13px] text-muted-foreground mt-1">{previewTemplate.description}</p>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-5 pb-4">
                  {/* Categories */}
                  {previewTemplate.template_data_json.categories && (
                    <div>
                      <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categories</h3>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {previewTemplate.template_data_json.categories.map((cat: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
                            <div className="h-2 w-2 rounded-full mt-1.5 shrink-0" style={{ background: cat.colour }} />
                            <div>
                              <p className="text-[12px] font-medium">{cat.name}</p>
                              <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score Tiers */}
                  {previewTemplate.template_data_json.score_tiers && (
                    <div>
                      <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Score Tiers</h3>
                      <div className="space-y-1.5">
                        {previewTemplate.template_data_json.score_tiers.map((t: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
                            <div className="h-3 w-3 rounded-full shrink-0" style={{ background: t.colour }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] font-medium">{t.label}</span>
                              <span className="text-[11px] text-muted-foreground ml-2">{t.min_pct}% - {t.max_pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Questions */}
                  {previewTemplate.template_data_json.questions && (
                    <div>
                      <h3 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Sample Questions</h3>
                      <div className="space-y-1.5">
                        {previewTemplate.template_data_json.questions.slice(0, 6).map((q: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40">
                            <span className="text-[10px] text-muted-foreground/60 mono mt-0.5 shrink-0 w-4 text-right">{i + 1}</span>
                            <p className="text-[12px]">{q.text}</p>
                          </div>
                        ))}
                        {previewTemplate.template_data_json.questions.length > 6 && (
                          <p className="text-[11px] text-muted-foreground text-center pt-1">
                            + {previewTemplate.template_data_json.questions.length - 6} more questions
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="pt-3 border-t">
                {previewTemplate.locked ? (
                  <div className="text-center py-2">
                    <p className="text-[12px] text-amber-600 font-medium mb-2 flex items-center justify-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Requires {TIER_LABEL[previewTemplate.min_plan_tier!] || previewTemplate.min_plan_tier} plan or higher
                    </p>
                    <Button variant="outline" className="w-full gap-2 h-10 border-amber-300 text-amber-700 hover:bg-amber-50">
                      <Crown className="h-4 w-4" />
                      Upgrade to Unlock
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2 h-10"
                    onClick={() => {
                      onUseTemplate(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    disabled={loading}
                  >
                    <Sparkles className="h-4 w-4" />
                    {loading ? "Creating..." : "Use This Template"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
