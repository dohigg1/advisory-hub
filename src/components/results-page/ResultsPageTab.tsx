import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Assessment, ScoreTier, Category } from "@/types/assessment";
import type { ResultsPageSection } from "@/types/results-page";
import { ResultsPageEditor } from "./ResultsPageEditor";
import { generateDefaultResultsSections } from "@/lib/generate-default-pages";

interface Props {
  assessment: Assessment;
  scoreTiers: ScoreTier[];
  categories: Category[];
}

export function ResultsPageTab({ assessment, scoreTiers, categories }: Props) {
  const [sections, setSections] = useState<ResultsPageSection[]>([]);
  const [resultsPageId, setResultsPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreate = useCallback(async () => {
    const { data, error } = await supabase
      .from("results_pages")
      .select("*")
      .eq("assessment_id", assessment.id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load results page");
      setLoading(false);
      return;
    }

    if (data) {
      setResultsPageId(data.id);
      setSections((data.sections_json as any) ?? []);
    } else {
      const defaultSections = generateDefaultResultsSections(assessment);
      const { data: created, error: createErr } = await supabase
        .from("results_pages")
        .insert({
          assessment_id: assessment.id,
          sections_json: defaultSections as any,
        })
        .select()
        .single();

      if (createErr) {
        toast.error("Failed to create results page");
      } else if (created) {
        setResultsPageId(created.id);
        setSections((created.sections_json as any) ?? defaultSections);
      }
    }
    setLoading(false);
  }, [assessment.id]);

  useEffect(() => { fetchOrCreate(); }, [fetchOrCreate]);

  const saveSections = useCallback(async (newSections: ResultsPageSection[]) => {
    if (!resultsPageId) return;
    const { error } = await supabase
      .from("results_pages")
      .update({ sections_json: newSections as any })
      .eq("id", resultsPageId);
    if (error) toast.error("Failed to save");
  }, [resultsPageId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ResultsPageEditor
      sections={sections}
      setSections={setSections}
      onSave={saveSections}
      scoreTiers={scoreTiers}
      categories={categories}
      assessment={assessment}
    />
  );
}
