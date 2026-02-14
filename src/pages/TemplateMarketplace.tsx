import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, LayoutTemplate, ArrowRight, Sparkles, Filter, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { TEMPLATE_FIXTURES, TEMPLATE_CATEGORY_LABELS } from "@/data/templates";
import type { TemplateCategory } from "@/data/templates";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } } };

type FilterCategory = "all" | TemplateCategory | "technology" | "hr" | "operations" | "compliance";

const CATEGORY_TABS: { value: FilterCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "consulting", label: "Consulting" },
  { value: "accounting", label: "Accounting" },
  { value: "advisory", label: "Advisory" },
  { value: "technology", label: "Technology" },
  { value: "hr", label: "HR" },
  { value: "operations", label: "Operations" },
  { value: "compliance", label: "Compliance" },
];

const EXTENDED_CATEGORY_LABELS: Record<string, string> = {
  ...TEMPLATE_CATEGORY_LABELS,
  technology: "Technology",
  hr: "HR",
  operations: "Operations",
  compliance: "Compliance",
};

const CATEGORY_COLORS: Record<string, string> = {
  consulting: "bg-blue-50 text-blue-700 border-blue-200",
  accounting: "bg-emerald-50 text-emerald-700 border-emerald-200",
  advisory: "bg-violet-50 text-violet-700 border-violet-200",
  technology: "bg-amber-50 text-amber-700 border-amber-200",
  hr: "bg-pink-50 text-pink-700 border-pink-200",
  operations: "bg-cyan-50 text-cyan-700 border-cyan-200",
  compliance: "bg-orange-50 text-orange-700 border-orange-200",
};

const TemplateMarketplace = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const filtered = useMemo(() => {
    return TEMPLATE_FIXTURES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.description.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 text-center">
          <div className="absolute top-4 left-4 sm:left-6 lg:left-8">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5" asChild>
              <Link to="/dashboard">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <LayoutTemplate className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Template Marketplace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl lg:text-5xl font-bold text-white tracking-tight mb-4"
          >
            Professional Assessment Templates
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-base lg:text-lg text-white/60 max-w-2xl mx-auto mb-8"
          >
            Pre-built, expert-designed templates for consulting, accounting, and
            advisory firms. Launch client assessments in minutes.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 text-[14px] bg-white/95 backdrop-blur-sm border-0 shadow-soft-md rounded-xl"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-2 mb-8 overflow-x-auto pb-1"
        >
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                activeCategory === tab.value
                  ? "bg-indigo-600 text-white shadow-soft-sm"
                  : "bg-white text-muted-foreground hover:bg-muted/60 border border-border/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Results Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="text-[13px] text-muted-foreground mb-6"
        >
          Showing{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          template{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "all" && (
            <>
              {" "}
              in{" "}
              <span className="font-semibold text-foreground">
                {EXTENDED_CATEGORY_LABELS[activeCategory]}
              </span>
            </>
          )}
        </motion.p>

        {/* Template Grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-soft-sm border-border/60 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-4">
                  <LayoutTemplate className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-semibold mb-1">No templates found</p>
                <p className="text-[13px] text-muted-foreground max-w-xs">
                  Try adjusting your search or category filter.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((template, index) => (
              <motion.div key={`${template.title}-${index}`} variants={item}>
                <Card className="group relative overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300 border-border/60 hover:border-indigo-200 h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {EXTENDED_CATEGORY_LABELS[template.category] ?? template.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground/60 font-medium whitespace-nowrap">
                        {template.question_count} questions
                      </span>
                    </div>
                    <CardTitle className="text-[14px] font-semibold tracking-tight leading-snug">
                      {template.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-[12px] text-muted-foreground/70 leading-relaxed line-clamp-3 mb-5 flex-1">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          {template.template_data_json.type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 text-[12px] gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-soft-sm"
                      >
                        Use Template
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TemplateMarketplace;
