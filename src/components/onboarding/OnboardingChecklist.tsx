import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  PartyPopper,
  Rocket,
  X,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { OnboardingStep } from "@/hooks/useOnboarding";

const DISMISS_KEY = "advisory-hub:onboarding-dismissed";

export function OnboardingChecklist() {
  const { steps, completedCount, totalCount, isComplete, loading } =
    useOnboarding();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });

  if (loading || dismissed) return null;

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // localStorage not available
    }
    setDismissed(true);
  };

  const handleCta = (step: OnboardingStep) => {
    if (step.ctaUrl) {
      navigate(step.ctaUrl);
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="relative overflow-hidden shadow-soft-md border-border/60">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />

            <CardHeader className="relative pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                    <Rocket className="h-5 w-5 text-accent" strokeWidth={1.8} />
                  </div>
                  <div>
                    <CardTitle className="text-[15px] font-bold tracking-tight">
                      Getting Started
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete these steps to set up your account
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-semibold mono bg-accent/10 text-accent border-0"
                  >
                    {completedCount}/{totalCount}
                  </Badge>
                  <button
                    onClick={handleDismiss}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    aria-label="Dismiss checklist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <Progress
                  value={progressPercent}
                  className="h-1.5 bg-muted/50"
                />
              </div>
            </CardHeader>

            <CardContent className="relative pb-5">
              <AnimatePresence>
                {isComplete ? (
                  <motion.div
                    key="celebration"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <motion.div
                      initial={{ rotate: -10, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 15,
                        delay: 0.1,
                      }}
                    >
                      <PartyPopper className="h-10 w-10 text-accent mb-3" />
                    </motion.div>
                    <h3 className="text-lg font-bold tracking-tight">
                      You're all set!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Congratulations! You've completed all the setup steps.
                      Your account is fully configured and ready to go.
                    </p>
                    {/* Confetti dots */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 rounded-full"
                          style={{
                            background: [
                              "hsl(var(--accent))",
                              "hsl(var(--primary))",
                              "hsl(var(--success))",
                              "#f59e0b",
                              "#ec4899",
                            ][i % 5],
                            left: `${10 + Math.random() * 80}%`,
                            top: `${Math.random() * 30}%`,
                          }}
                          initial={{ opacity: 0, y: -20, scale: 0 }}
                          animate={{
                            opacity: [0, 1, 1, 0],
                            y: [
                              -20,
                              20 + Math.random() * 60,
                              40 + Math.random() * 80,
                              80 + Math.random() * 100,
                            ],
                            x: [0, (Math.random() - 0.5) * 60],
                            scale: [0, 1, 1, 0.5],
                            rotate: [0, Math.random() * 360],
                          }}
                          transition={{
                            duration: 1.8 + Math.random() * 1.2,
                            delay: Math.random() * 0.5,
                            ease: "easeOut",
                          }}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDismiss}
                      className="mt-4 text-[12px]"
                    >
                      Dismiss
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-0.5">
                    {steps.map((step, index) => (
                      <StepRow
                        key={step.key}
                        step={step}
                        index={index}
                        onCtaClick={() => handleCta(step)}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepRow({
  step,
  index,
  onCtaClick,
}: {
  step: OnboardingStep;
  index: number;
  onCtaClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 ${
        step.completed
          ? "bg-transparent"
          : "hover:bg-muted/40"
      }`}
    >
      {/* Checkbox icon */}
      <div className="flex-shrink-0">
        <AnimatePresence mode="wait">
          {step.completed ? (
            <motion.div
              key="checked"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <CheckCircle2 className="h-5 w-5 text-success" strokeWidth={2} />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Circle
                className="h-5 w-5 text-muted-foreground/30"
                strokeWidth={1.5}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] font-medium leading-tight transition-all duration-300 ${
            step.completed
              ? "line-through text-muted-foreground/50"
              : "text-foreground"
          }`}
        >
          {step.label}
        </p>
        <p
          className={`text-[11px] mt-0.5 leading-tight transition-all duration-300 ${
            step.completed
              ? "text-muted-foreground/30"
              : "text-muted-foreground/60"
          }`}
        >
          {step.description}
        </p>
      </div>

      {/* CTA button */}
      {!step.completed && step.ctaUrl && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCtaClick}
          className="flex-shrink-0 text-[11px] h-7 px-2.5 text-accent hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          {step.ctaLabel}
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      )}
    </motion.div>
  );
}
