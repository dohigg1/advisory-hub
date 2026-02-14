import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ResultsData } from "@/pages/PublicResults";
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

interface Narrative {
  summary: string;
  strengths: string[];
  improvements: string[];
  next_steps: string;
}

interface Props {
  data: ResultsData;
}

export function AiNarrativeSection({ data }: Props) {
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNarrative();
  }, [data.lead.id]);

  const fetchNarrative = async () => {
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("generate-narrative", {
        body: { lead_id: data.lead.id },
      });

      if (fnError) throw fnError;
      if (result?.narrative) {
        setNarrative(result.narrative);
      } else if (result?.reason === "disabled") {
        setLoading(false);
        return;
      }
    } catch (e: any) {
      console.error("AI narrative error:", e);
      setError("Unable to generate personalised insights right now.");
    } finally {
      setLoading(false);
    }
  };

  if (!loading && !narrative && !error) return null;

  if (loading) {
    return (
      <section className="rounded-sm border border-border bg-card shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Generating Your Personalised Insights…</h2>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse w-full" />
            <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
            <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-sm border border-border bg-card shadow-sm">
        <div className="p-8">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </section>
    );
  }

  if (!narrative) return null;

  return (
    <section className="rounded-sm border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Personalised Insights</h2>
        </div>

        <p className="text-muted-foreground leading-relaxed">{narrative.summary}</p>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Strengths */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <h3 className="text-sm font-semibold text-foreground">Key Strengths</h3>
            </div>
            <ul className="space-y-1.5">
              {narrative.strengths.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <h3 className="text-sm font-semibold text-foreground">Areas to Improve</h3>
            </div>
            <ul className="space-y-1.5">
              {narrative.improvements.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Next Steps */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommended Next Steps</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{narrative.next_steps}</p>
        </div>
      </div>
    </section>
  );
}
