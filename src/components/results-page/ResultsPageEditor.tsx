import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Assessment, ScoreTier, Category } from "@/types/assessment";
import type { ResultsPageSection, ResultsSectionType } from "@/types/results-page";
import { createDefaultResultsSection, RESULTS_SECTION_LABELS, RESULTS_SECTION_DESCRIPTIONS } from "@/types/results-page";
import { ResultsSectionEditor } from "./ResultsSectionEditor";
import { ResultsPagePreview } from "./ResultsPagePreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  sections: ResultsPageSection[];
  setSections: (s: ResultsPageSection[]) => void;
  onSave: (s: ResultsPageSection[]) => Promise<void>;
  scoreTiers: ScoreTier[];
  categories: Category[];
  assessment: Assessment;
}

export function ResultsPageEditor({ sections, setSections, onSave, scoreTiers, categories, assessment }: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const autosave = useCallback((newSections: ResultsPageSection[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await onSave(newSections);
      setSaving(false);
    }, 1200);
  }, [onSave]);

  const addSection = (type: ResultsSectionType) => {
    const newSection = createDefaultResultsSection(type, sections.length);
    const updated = [...sections, newSection];
    setSections(updated);
    setSelectedSectionId(newSection.id);
    autosave(updated);
  };

  const updateSection = (id: string, content: Record<string, any>) => {
    const updated = sections.map(s => s.id === id ? { ...s, content_json: content } : s);
    setSections(updated);
    autosave(updated);
  };

  const moveSection = (id: string, dir: "up" | "down") => {
    const idx = sections.findIndex(s => s.id === id);
    if ((dir === "up" && idx === 0) || (dir === "down" && idx === sections.length - 1)) return;
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    const updated = [...sections];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    autosave(updated);
  };

  const toggleVisibility = (id: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s);
    setSections(updated);
    autosave(updated);
  };

  const deleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    if (selectedSectionId === id) setSelectedSectionId(null);
    autosave(updated);
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {(Object.keys(RESULTS_SECTION_LABELS) as ResultsSectionType[]).map(type => (
              <DropdownMenuItem key={type} onClick={() => addSection(type)}>
                <div>
                  <div className="font-medium text-sm">{RESULTS_SECTION_LABELS[type]}</div>
                  <div className="text-xs text-muted-foreground">{RESULTS_SECTION_DESCRIPTIONS[type]}</div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Section list */}
        <div className="w-[40%] min-w-[320px] overflow-y-auto border-r bg-background p-4">
          {selectedSection ? (
            <ResultsSectionEditor
              section={selectedSection}
              onUpdate={(content) => updateSection(selectedSection.id, content)}
              onClose={() => setSelectedSectionId(null)}
              scoreTiers={scoreTiers}
              categories={categories}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {sections.length === 0
                  ? 'Click "Add Section" to start building your results page.'
                  : "Click a section to edit it."}
              </p>
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`flex items-center justify-between rounded border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !section.is_visible ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{RESULTS_SECTION_LABELS[section.type]}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); moveSection(section.id, "up"); }} disabled={idx === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↑</button>
                    <button onClick={e => { e.stopPropagation(); moveSection(section.id, "down"); }} disabled={idx === sections.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">↓</button>
                    <button onClick={e => { e.stopPropagation(); toggleVisibility(section.id); }} className="p-1 text-muted-foreground hover:text-foreground">
                      {section.is_visible ? "👁" : "👁‍🗨"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (confirm("Delete this section?")) deleteSection(section.id); }} className="p-1 text-destructive hover:text-destructive/80">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="flex-1 overflow-y-auto">
          <ResultsPagePreview
            sections={sections}
            scoreTiers={scoreTiers}
            categories={categories}
            assessment={assessment}
          />
        </div>
      </div>
    </div>
  );
}
