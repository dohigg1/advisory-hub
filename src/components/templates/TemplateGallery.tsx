import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, ArrowLeft, Layers, HelpCircle, BarChart3 } from "lucide-react";
import { TEMPLATE_FIXTURES, TEMPLATE_CATEGORY_LABELS, type TemplateFixture, type TemplateCategory } from "@/data/templates";
import { TemplatePreviewDialog } from "./TemplatePreviewDialog";
import { motion } from "framer-motion";

interface Props {
  onUseTemplate: (template: TemplateFixture) => void;
  onBack: () => void;
  loading?: boolean;
}

const CATEGORY_BADGE_STYLES: Record<TemplateCategory, string> = {
  consulting: "bg-accent/10 text-accent border-0",
  accounting: "bg-success/10 text-success border-0",
  advisory: "bg-purple-500/10 text-purple-600 border-0",
  technology: "bg-blue-500/10 text-blue-600 border-0",
  hr: "bg-pink-500/10 text-pink-600 border-0",
  compliance: "bg-amber-500/10 text-amber-600 border-0",
  operations: "bg-emerald-500/10 text-emerald-600 border-0",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export function TemplateGallery({ onUseTemplate, onBack, loading }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateFixture | null>(null);

  const filtered = useMemo(() => {
    return TEMPLATE_FIXTURES.filter(t => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, categoryFilter]);

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
              placeholder="Search templates…"
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

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-[13px] font-medium">No templates match your search</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
            {filtered.map((t, i) => (
              <motion.div key={i} variants={item}>
                <Card
                  className="group cursor-pointer shadow-soft-xs hover:shadow-soft-md transition-all duration-300 border-border/60 hover:border-accent/20 overflow-hidden"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-[14px] font-semibold tracking-tight truncate">{t.title}</CardTitle>
                      </div>
                      <Badge className={`text-[10px] font-semibold shrink-0 ${CATEGORY_BADGE_STYLES[t.category]}`}>
                        {TEMPLATE_CATEGORY_LABELS[t.category]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <p className="text-[12px] text-muted-foreground/70 line-clamp-2">{t.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> {t.question_count} questions</span>
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {t.template_data_json.categories.length} categories</span>
                      <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {t.template_data_json.score_tiers.length} tiers</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <TemplatePreviewDialog
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={onUseTemplate}
        loading={loading}
      />
    </>
  );
}
