import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { Assessment, Category, ScoreTier } from "@/types/assessment";

interface Props {
  assessment: Assessment;
  categories: Category[];
  scoreTiers: ScoreTier[];
  onRefresh: () => Promise<void>;
  onUpdateAssessment: (updates: Partial<Assessment>) => void;
  onRefreshCategories: () => Promise<void>;
}

export function ScoringTab({ assessment, categories, scoreTiers, onRefresh, onUpdateAssessment, onRefreshCategories }: Props) {
  const settings = assessment.settings_json || {};

  const addTier = async () => {
    if (scoreTiers.length >= 6) { toast.error("Maximum 6 tiers"); return; }
    await supabase.from("score_tiers").insert({
      assessment_id: assessment.id,
      label: "New Tier",
      min_pct: 0,
      max_pct: 100,
      colour: "#4A90D9",
      sort_order: scoreTiers.length,
    } as any);
    await onRefresh();
  };

  const updateTier = async (tierId: string, updates: Partial<ScoreTier>) => {
    await supabase.from("score_tiers").update(updates as any).eq("id", tierId);
    await onRefresh();
  };

  const deleteTier = async (tierId: string) => {
    if (scoreTiers.length <= 2) { toast.error("Minimum 2 tiers required"); return; }
    await supabase.from("score_tiers").delete().eq("id", tierId);
    await onRefresh();
  };

  const toggleCategoryScoring = async (catId: string, include: boolean) => {
    await supabase.from("categories").update({ include_in_total: include } as any).eq("id", catId);
    await onRefreshCategories();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-semibold">Scoring</h2>
        <p className="text-sm text-muted-foreground">Configure how scores are calculated and displayed</p>
      </div>

      {/* Score Display Format */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Score Display Format</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.scoreFormat ?? "percentage"}
            onValueChange={v => onUpdateAssessment({ settings_json: { ...settings, scoreFormat: v } })}
          >
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="out_of_10">Out of 10</SelectItem>
              <SelectItem value="actual_points">Actual Points</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Score Tiers */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Score Tiers</CardTitle>
          <Button variant="outline" size="sm" onClick={addTier} className="gap-1 text-xs" disabled={scoreTiers.length >= 6}>
            <Plus className="h-3 w-3" /> Add Tier
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {scoreTiers.map(tier => (
            <div key={tier.id} className="flex items-center gap-3 border p-3">
              <div className="h-8 w-3" style={{ backgroundColor: tier.colour }} />
              <Input
                value={tier.label}
                onChange={e => updateTier(tier.id, { label: e.target.value })}
                className="w-32 h-8 text-sm"
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Input type="number" value={tier.min_pct} onChange={e => updateTier(tier.id, { min_pct: parseInt(e.target.value) || 0 })} className="w-16 h-8 text-sm" />
                <span>–</span>
                <Input type="number" value={tier.max_pct} onChange={e => updateTier(tier.id, { max_pct: parseInt(e.target.value) || 100 })} className="w-16 h-8 text-sm" />
                <span>%</span>
              </div>
              <Input
                value={tier.colour}
                onChange={e => updateTier(tier.id, { colour: e.target.value })}
                className="w-24 h-8 text-sm"
              />
              <input type="color" value={tier.colour} onChange={e => updateTier(tier.id, { colour: e.target.value })} className="h-8 w-8 cursor-pointer" />
              {scoreTiers.length > 2 && (
                <Button variant="ghost" size="icon" onClick={() => deleteTier(tier.id)} className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category Scoring */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Category Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3" style={{ backgroundColor: cat.colour || "#4A90D9" }} />
                <span className="text-sm">{cat.name}</span>
              </div>
              <Switch checked={cat.include_in_total} onCheckedChange={v => toggleCategoryScoring(cat.id, v)} />
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories created yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
