import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Copy } from "lucide-react";
import type { ResultsPageSection } from "@/types/results-page";
import { RESULTS_SECTION_LABELS } from "@/types/results-page";
import type { ScoreTier, Category } from "@/types/assessment";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  section: ResultsPageSection;
  onUpdate: (content: Record<string, any>) => void;
  onClose: () => void;
  scoreTiers: ScoreTier[];
  categories: Category[];
}

export function ResultsSectionEditor({ section, onUpdate, onClose, scoreTiers, categories }: Props) {
  const c = section.content_json;
  const set = (key: string, value: any) => onUpdate({ ...c, [key]: value });
  const [activeTier, setActiveTier] = useState<string>(scoreTiers[0]?.label || "");

  const tierContent = c.tier_content || {};

  const setTierField = (tierLabel: string, field: string, value: any) => {
    const updated = {
      ...tierContent,
      [tierLabel]: { ...(tierContent[tierLabel] || {}), [field]: value },
    };
    set("tier_content", updated);
  };

  const copyToAllTiers = () => {
    if (!activeTier || !tierContent[activeTier]) return;
    const source = tierContent[activeTier];
    const updated: Record<string, any> = {};
    scoreTiers.forEach(t => { updated[t.label] = { ...source }; });
    set("tier_content", updated);
    toast.success("Copied to all tiers");
  };

  const renderDynamicTabs = (renderFields: (tierLabel: string) => React.ReactNode) => {
    if (!c.is_dynamic || scoreTiers.length === 0) return null;

    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Dynamic Content by Tier</Label>
          <Button size="sm" variant="ghost" onClick={copyToAllTiers} className="text-xs h-7">
            <Copy className="mr-1 h-3 w-3" /> Copy to all tiers
          </Button>
        </div>
        <div className="flex gap-1 border-b">
          {scoreTiers.map(tier => (
            <button
              key={tier.label}
              onClick={() => setActiveTier(tier.label)}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTier === tier.label
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={activeTier === tier.label ? { borderColor: tier.colour } : undefined}
            >
              {tier.label}
            </button>
          ))}
        </div>
        <div className="pt-2">{renderFields(activeTier)}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">{RESULTS_SECTION_LABELS[section.type]}</h3>
      </div>

      {/* OVERALL SCORE */}
      {section.type === "overall_score" && (
        <>
          <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show tier description</Label>
            <Switch checked={c.show_tier_description ?? true} onCheckedChange={v => set("show_tier_description", v)} />
          </div>
        </>
      )}

      {/* CATEGORY BREAKDOWN */}
      {section.type === "category_breakdown" && (
        <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
      )}

      {/* RADAR CHART */}
      {section.type === "radar_chart" && (
        <>
          <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
        </>
      )}

      {/* CATEGORY DETAIL */}
      {section.type === "category_detail" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={c.category_id || ""} onValueChange={v => set("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show score chart</Label>
            <Switch checked={c.show_score_chart ?? true} onCheckedChange={v => set("show_score_chart", v)} />
          </div>
          <FieldTextarea label="Content" value={c.content} onChange={v => set("content", v)} rows={4} />
        </>
      )}

      {/* DYNAMIC TEXT */}
      {section.type === "dynamic_text" && (
        <>
          <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dynamic by tier</Label>
            <Switch checked={c.is_dynamic ?? true} onCheckedChange={v => set("is_dynamic", v)} />
          </div>
          {!c.is_dynamic && (
            <FieldTextarea label="Content" value={c.static_content || ""} onChange={v => set("static_content", v)} rows={4} />
          )}
          {renderDynamicTabs((tierLabel) => (
            <FieldTextarea
              label={`Content for "${tierLabel}" tier`}
              value={tierContent[tierLabel]?.content || ""}
              onChange={v => setTierField(tierLabel, "content", v)}
              rows={4}
            />
          ))}
        </>
      )}

      {/* CTA */}
      {section.type === "cta" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dynamic by tier</Label>
            <Switch checked={c.is_dynamic ?? true} onCheckedChange={v => set("is_dynamic", v)} />
          </div>
          {!c.is_dynamic && (
            <>
              <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
              <FieldTextarea label="Description" value={c.description} onChange={v => set("description", v)} />
              <Field label="Button Text" value={c.button_text} onChange={v => set("button_text", v)} />
              <Field label="Button URL" value={c.button_url} onChange={v => set("button_url", v)} />
            </>
          )}
          {renderDynamicTabs((tierLabel) => (
            <div className="space-y-3">
              <Field label="Heading" value={tierContent[tierLabel]?.heading || ""} onChange={v => setTierField(tierLabel, "heading", v)} />
              <FieldTextarea label="Description" value={tierContent[tierLabel]?.description || ""} onChange={v => setTierField(tierLabel, "description", v)} />
              <Field label="Button Text" value={tierContent[tierLabel]?.button_text || ""} onChange={v => setTierField(tierLabel, "button_text", v)} />
              <Field label="Button URL" value={tierContent[tierLabel]?.button_url || ""} onChange={v => setTierField(tierLabel, "button_url", v)} />
            </div>
          ))}
        </>
      )}

      {/* NEXT STEPS */}
      {section.type === "next_steps" && (
        <>
          <Field label="Heading" value={c.heading} onChange={v => set("heading", v)} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dynamic by tier</Label>
            <Switch checked={c.is_dynamic ?? true} onCheckedChange={v => set("is_dynamic", v)} />
          </div>
          {!c.is_dynamic && (
            <StepsList steps={c.steps || []} onChange={v => set("steps", v)} />
          )}
          {renderDynamicTabs((tierLabel) => (
            <StepsList
              steps={tierContent[tierLabel]?.steps || []}
              onChange={v => setTierField(tierLabel, "steps", v)}
            />
          ))}
        </>
      )}

      {/* CONSULTANT INFO */}
      {section.type === "consultant_info" && (
        <>
          <Field label="Name" value={c.name} onChange={v => set("name", v)} />
          <Field label="Title / Credentials" value={c.title} onChange={v => set("title", v)} />
          <Field label="Photo URL" value={c.photo_url} onChange={v => set("photo_url", v)} />
          <Field label="Email" value={c.email} onChange={v => set("email", v)} />
          <Field label="Phone" value={c.phone} onChange={v => set("phone", v)} />
          <Field label="LinkedIn URL" value={c.linkedin_url} onChange={v => set("linkedin_url", v)} />
          <FieldTextarea label="Bio" value={c.bio} onChange={v => set("bio", v)} rows={3} />
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={rows} />
    </div>
  );
}

function StepsList({ steps, onChange }: { steps: any[]; onChange: (steps: any[]) => void }) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Steps</Label>
      {steps.map((step: any, i: number) => (
        <div key={i} className="space-y-2 rounded border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
            <button onClick={() => onChange(steps.filter((_, j) => j !== i))} className="text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <Input
            placeholder="Title"
            value={step.title || ""}
            onChange={e => {
              const updated = [...steps];
              updated[i] = { ...updated[i], title: e.target.value };
              onChange(updated);
            }}
          />
          <Textarea
            placeholder="Description"
            value={step.description || ""}
            onChange={e => {
              const updated = [...steps];
              updated[i] = { ...updated[i], description: e.target.value };
              onChange(updated);
            }}
            rows={2}
          />
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...steps, { title: "", description: "" }])}>
        <Plus className="mr-1 h-3 w-3" /> Add Step
      </Button>
    </div>
  );
}
