import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, ChevronRight, ChevronLeft, Check, GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } } };

const QUICK_START_CHIPS = [
  "Financial health check for small businesses",
  "Digital maturity assessment for mid-market",
  "Employee engagement survey",
  "Cybersecurity readiness evaluation",
  "Client onboarding questionnaire",
  "Leadership effectiveness review",
];

const ASSESSMENT_TYPES = [
  {
    value: "scorecard",
    label: "Scorecard",
    description: "Rate performance across categories with weighted scoring",
    icon: "📊",
  },
  {
    value: "maturity_model",
    label: "Maturity Model",
    description: "Evaluate progression levels from basic to advanced",
    icon: "📈",
  },
  {
    value: "diagnostic",
    label: "Diagnostic",
    description: "Identify strengths, weaknesses, and recommendations",
    icon: "🔍",
  },
  {
    value: "readiness_check",
    label: "Readiness Check",
    description: "Assess preparedness for a specific initiative or change",
    icon: "✅",
  },
];

// Mock generated assessment data (placeholder for AI generation)
const MOCK_GENERATED = {
  categories: [
    {
      name: "Strategy & Planning",
      description: "Strategic vision, planning, and alignment",
      questions: [
        "How well-defined is your organisation's strategic plan?",
        "Are goals clearly communicated to all stakeholders?",
        "How frequently is your strategy reviewed and updated?",
        "Rate the alignment between strategy and day-to-day operations.",
      ],
    },
    {
      name: "People & Culture",
      description: "Team capabilities, engagement, and culture",
      questions: [
        "How would you rate employee engagement levels?",
        "Are training and development opportunities available?",
        "How effectively does your organisation manage change?",
        "Rate the strength of your organisational culture.",
      ],
    },
    {
      name: "Technology & Innovation",
      description: "Technology adoption and innovation practices",
      questions: [
        "How current is your technology infrastructure?",
        "What level of process automation have you achieved?",
        "How do you foster innovation within the organisation?",
        "Rate your data-driven decision-making capabilities.",
      ],
    },
    {
      name: "Operations & Efficiency",
      description: "Operational processes and resource management",
      questions: [
        "How standardised are your core business processes?",
        "Rate the efficiency of your resource allocation.",
        "How well do you measure operational performance?",
        "What level of quality management is in place?",
      ],
    },
  ],
};

const STEPS = [
  { number: 1, label: "Describe" },
  { number: 2, label: "Review" },
  { number: 3, label: "Finalize" },
];

const AIAssessmentGenerator = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("scorecard");
  const [questionCount, setQuestionCount] = useState([16]);
  const [categoryCount, setCategoryCount] = useState([4]);

  // Step 2 state (mock editable data)
  const [categories, setCategories] = useState(MOCK_GENERATED.categories);
  const [editingQuestion, setEditingQuestion] = useState<{ catIdx: number; qIdx: number } | null>(null);
  const [editText, setEditText] = useState("");

  // Step 3 state
  const [title, setTitle] = useState("");
  const [finalDescription, setFinalDescription] = useState("");

  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate AI generation delay
    setTimeout(() => {
      setCategories(MOCK_GENERATED.categories);
      setGenerating(false);
      setCurrentStep(2);
    }, 2000);
  };

  const handleEditQuestion = (catIdx: number, qIdx: number) => {
    setEditingQuestion({ catIdx, qIdx });
    setEditText(categories[catIdx].questions[qIdx]);
  };

  const handleSaveQuestion = () => {
    if (!editingQuestion) return;
    const updated = [...categories];
    updated[editingQuestion.catIdx].questions[editingQuestion.qIdx] = editText;
    setCategories(updated);
    setEditingQuestion(null);
    setEditText("");
  };

  const handleDeleteQuestion = (catIdx: number, qIdx: number) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      questions: updated[catIdx].questions.filter((_, i) => i !== qIdx),
    };
    setCategories(updated);
  };

  const handleAddQuestion = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      questions: [...updated[catIdx].questions, "New question - click to edit"],
    };
    setCategories(updated);
  };

  const totalQuestions = categories.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-soft-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Assessment Generator</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Describe what you need and let AI build it for you
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step Indicator */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (step.number < currentStep) setCurrentStep(step.number);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  currentStep === step.number
                    ? "bg-indigo-600 text-white shadow-soft-sm"
                    : currentStep > step.number
                    ? "bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100"
                    : "bg-muted/60 text-muted-foreground/50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    currentStep > step.number
                      ? "bg-indigo-600 text-white"
                      : currentStep === step.number
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground/50"
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.number
                  )}
                </span>
                {step.label}
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {/* Step 1: Describe */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Description */}
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Describe your assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the assessment you want to create. For example: 'A financial health check for small business owners covering cash flow, tax planning, and growth readiness...'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="text-[13px] resize-none"
                />
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick start
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_START_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setDescription(chip)}
                        className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 border ${
                          description === chip
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-muted-foreground border-border/60 hover:bg-muted/40 hover:border-border"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Type */}
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  Assessment type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ASSESSMENT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                        selectedType === type.value
                          ? "border-indigo-300 bg-indigo-50/50 ring-1 ring-indigo-200"
                          : "border-border/60 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <div>
                        <p className="text-[13px] font-semibold">{type.label}</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sliders */}
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Size & scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[12px] font-medium text-muted-foreground">
                      Number of questions
                    </Label>
                    <span className="text-[13px] font-bold text-indigo-600 mono">
                      {questionCount[0]}
                    </span>
                  </div>
                  <Slider
                    value={questionCount}
                    onValueChange={setQuestionCount}
                    min={5}
                    max={50}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>5 (quick)</span>
                    <span>50 (comprehensive)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[12px] font-medium text-muted-foreground">
                      Number of categories
                    </Label>
                    <span className="text-[13px] font-bold text-indigo-600 mono">
                      {categoryCount[0]}
                    </span>
                  </div>
                  <Slider
                    value={categoryCount}
                    onValueChange={setCategoryCount}
                    min={2}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>2 (focused)</span>
                    <span>10 (broad)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={!description.trim() || generating}
                className="gap-2 h-10 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-soft-sm text-[13px]"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate Assessment
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Review */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Summary Bar */}
            <Card className="shadow-soft-sm border-border/60 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[11px] font-semibold">
                      {categories.length} categories
                    </Badge>
                    <Badge className="bg-violet-100 text-violet-700 border-0 text-[11px] font-semibold">
                      {totalQuestions} questions
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[11px] font-semibold">
                      {ASSESSMENT_TYPES.find((t) => t.value === selectedType)?.label}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Click any question to edit it
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Categories & Questions */}
            {categories.map((category, catIdx) => (
              <Card key={catIdx} className="shadow-soft-sm border-border/60">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-[14px] font-semibold tracking-tight">
                        {category.name}
                      </CardTitle>
                      <p className="text-[12px] text-muted-foreground/70 mt-0.5">
                        {category.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold border-border/50"
                    >
                      {category.questions.length} questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {category.questions.map((question, qIdx) => (
                    <div
                      key={qIdx}
                      className="group flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-muted-foreground/40 w-5 flex-shrink-0">
                        {qIdx + 1}
                      </span>
                      {editingQuestion?.catIdx === catIdx &&
                      editingQuestion?.qIdx === qIdx ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="h-8 text-[13px] flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveQuestion();
                              if (e.key === "Escape") setEditingQuestion(null);
                            }}
                          />
                          <Button
                            size="sm"
                            className="h-7 text-[11px] bg-indigo-600 hover:bg-indigo-700"
                            onClick={handleSaveQuestion}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[13px] text-foreground/80 flex-1">
                            {question}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditQuestion(catIdx, qIdx)}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteQuestion(catIdx, qIdx)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddQuestion(catIdx)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-indigo-600 font-medium hover:bg-indigo-50 transition-colors w-full"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add question
                  </button>
                </CardContent>
              </Card>
            ))}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                className="gap-2 h-9 text-[13px] shadow-soft-sm"
                onClick={() => setCurrentStep(1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to description
              </Button>
              <Button
                className="gap-2 h-10 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-soft-sm text-[13px]"
                onClick={() => setCurrentStep(3)}
              >
                Continue to finalize
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Finalize */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  Assessment details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">
                    Title
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Digital Maturity Assessment"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">
                    Description
                  </Label>
                  <Textarea
                    value={finalDescription}
                    onChange={(e) => setFinalDescription(e.target.value)}
                    placeholder="A brief description of this assessment for your clients..."
                    rows={3}
                    className="text-[13px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/40 p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600 mono">
                      {categories.length}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                      Categories
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 text-center">
                    <p className="text-2xl font-bold text-violet-600 mono">
                      {totalQuestions}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                      Questions
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600 mono">
                      {ASSESSMENT_TYPES.find((t) => t.value === selectedType)?.label ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                      Type
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-[13px] font-medium">{cat.name}</span>
                      <span className="text-[11px] text-muted-foreground/60 font-medium">
                        {cat.questions.length} questions
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                className="gap-2 h-9 text-[13px] shadow-soft-sm"
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft className="h-4 w-4" />
                Back to review
              </Button>
              <Button
                className="gap-2 h-10 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-soft-sm text-[13px]"
                disabled={!title.trim()}
              >
                <Sparkles className="h-4 w-4" />
                Create Assessment
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIAssessmentGenerator;
