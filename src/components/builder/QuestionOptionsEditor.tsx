import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Question, AnswerOption } from "@/types/assessment";

interface Props {
  question: Question;
  options: AnswerOption[];
  onRefresh: () => Promise<void>;
  onUpdateQuestion: (qId: string, updates: Partial<Question>) => Promise<void>;
}

export function QuestionOptionsEditor({ question, options, onRefresh, onUpdateQuestion }: Props) {
  const settings = question.settings_json || {};

  const addOption = async () => {
    await supabase.from("answer_options").insert({
      question_id: question.id,
      text: `Option ${options.length + 1}`,
      points: 0,
      sort_order: options.length,
    } as any);
    await onRefresh();
  };

  const updateOption = async (optId: string, updates: Partial<AnswerOption>) => {
    await supabase.from("answer_options").update(updates as any).eq("id", optId);
    await onRefresh();
  };

  const deleteOption = async (optId: string) => {
    await supabase.from("answer_options").delete().eq("id", optId);
    await onRefresh();
  };

  const updateSettings = (newSettings: any) => {
    onUpdateQuestion(question.id, { settings_json: { ...settings, ...newSettings } });
  };

  // YES/NO
  if (question.type === "yes_no") {
    return (
      <div className="space-y-3">
        <Label className="text-xs font-medium">Answer Options</Label>
        {options.map(opt => (
          <div key={opt.id} className="flex items-center gap-3">
            <div className="w-24 text-sm font-medium">{opt.text}</div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Points</Label>
              <Input
                type="number"
                value={opt.points}
                onChange={e => updateOption(opt.id, { points: parseInt(e.target.value) || 0 })}
                className="w-20 h-8 text-sm"
              />
            </div>
          </div>
        ))}
        {options.length < 3 && (
          <Button variant="outline" size="sm" onClick={() => {
            supabase.from("answer_options").insert({
              question_id: question.id, text: "Maybe", points: 0, sort_order: 2,
            } as any).then(() => onRefresh());
          }} className="text-xs">
            + Add "Maybe" option
          </Button>
        )}
      </div>
    );
  }

  // MULTIPLE CHOICE / CHECKBOX SELECT
  if (question.type === "multiple_choice" || question.type === "checkbox_select") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Answer Options</Label>
          {options.length < 8 && (
            <Button variant="outline" size="sm" onClick={addOption} className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Option
            </Button>
          )}
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
            <Input
              value={opt.text}
              onChange={e => updateOption(opt.id, { text: e.target.value })}
              className="flex-1 h-8 text-sm"
            />
            <Input
              type="number"
              value={opt.points}
              onChange={e => updateOption(opt.id, { points: parseInt(e.target.value) || 0 })}
              className="w-20 h-8 text-sm"
              placeholder="Points"
            />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => deleteOption(opt.id)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        {question.type === "multiple_choice" && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={settings.multiSelect || false}
              onChange={e => updateSettings({ multiSelect: e.target.checked })}
              className="h-3.5 w-3.5"
            />
            <Label className="text-xs text-muted-foreground">Allow multiple selections</Label>
          </div>
        )}
        {question.type === "checkbox_select" && (
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Min selections</Label>
              <Input type="number" value={settings.minSelections ?? 1} onChange={e => updateSettings({ minSelections: parseInt(e.target.value) || 1 })} className="w-16 h-7 text-xs" />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Max selections</Label>
              <Input type="number" value={settings.maxSelections ?? options.length} onChange={e => updateSettings({ maxSelections: parseInt(e.target.value) || options.length })} className="w-16 h-7 text-xs" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // SLIDING SCALE
  if (question.type === "sliding_scale") {
    const min = settings.min ?? 1;
    const max = settings.max ?? 10;
    return (
      <div className="space-y-3">
        <Label className="text-xs font-medium">Scale Configuration</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Min value</Label>
            <Input type="number" value={min} onChange={e => updateSettings({ min: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Max value</Label>
            <Input type="number" value={max} onChange={e => updateSettings({ max: parseInt(e.target.value) || 10 })} className="h-8 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Low end label</Label>
            <Input value={settings.lowLabel ?? "Low"} onChange={e => updateSettings({ lowLabel: e.target.value })} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">High end label</Label>
            <Input value={settings.highLabel ?? "High"} onChange={e => updateSettings({ highLabel: e.target.value })} className="h-8 text-sm" />
          </div>
        </div>
        <div className="bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <div className="flex items-center gap-3">
            <span className="text-xs">{settings.lowLabel ?? "Low"}</span>
            <Slider defaultValue={[Math.floor((min + max) / 2)]} min={min} max={max} step={1} className="flex-1" />
            <span className="text-xs">{settings.highLabel ?? "High"}</span>
          </div>
        </div>
      </div>
    );
  }

  // RATING SCALE
  if (question.type === "rating_scale") {
    const scaleMax = settings.scaleMax ?? 5;
    return (
      <div className="space-y-3">
        <Label className="text-xs font-medium">Rating Configuration</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Scale (1 to N)</Label>
          <Input type="number" value={scaleMax} min={3} max={10} onChange={e => updateSettings({ scaleMax: parseInt(e.target.value) || 5 })} className="w-24 h-8 text-sm" />
        </div>
        <div className="bg-muted p-3">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <div className="flex gap-2">
            {Array.from({ length: scaleMax }, (_, i) => (
              <button key={i} className="h-9 w-9 border bg-card text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // OPEN TEXT
  if (question.type === "open_text") {
    return (
      <div className="space-y-3">
        <Label className="text-xs font-medium">Text Input Configuration</Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.multiline ?? false}
            onChange={e => updateSettings({ multiline: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          <Label className="text-xs text-muted-foreground">Multi-line text area</Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Character limit</Label>
          <Input type="number" value={settings.charLimit ?? 500} onChange={e => updateSettings({ charLimit: parseInt(e.target.value) || 500 })} className="w-24 h-8 text-sm" />
        </div>
        <div className="bg-warning/10 border border-warning/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Open text questions do not contribute to scoring.</p>
        </div>
      </div>
    );
  }

  // IMAGE SELECT
  if (question.type === "image_select") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Image Options</Label>
          {options.length < 6 && (
            <Button variant="outline" size="sm" onClick={addOption} className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Add Option
            </Button>
          )}
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} className="flex items-center gap-2 border p-2">
            <div className="h-12 w-12 bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
              {opt.image_url ? <img src={opt.image_url} alt="" className="h-full w-full object-cover" /> : "IMG"}
            </div>
            <div className="flex-1 space-y-1">
              <Input value={opt.text} onChange={e => updateOption(opt.id, { text: e.target.value })} className="h-7 text-xs" placeholder="Label" />
              <Input value={opt.image_url || ""} onChange={e => updateOption(opt.id, { image_url: e.target.value || null })} className="h-7 text-xs" placeholder="Image URL" />
            </div>
            <Input type="number" value={opt.points} onChange={e => updateOption(opt.id, { points: parseInt(e.target.value) || 0 })} className="w-16 h-8 text-sm" placeholder="Pts" />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => deleteOption(opt.id)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" checked={settings.multiSelect || false} onChange={e => updateSettings({ multiSelect: e.target.checked })} className="h-3.5 w-3.5" />
          <Label className="text-xs text-muted-foreground">Allow multiple selections</Label>
        </div>
      </div>
    );
  }

  return null;
}
