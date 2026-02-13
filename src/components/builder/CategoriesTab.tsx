import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Assessment, Category } from "@/types/assessment";

const PRESET_COLOURS = ["#4A90D9", "#1B3A5C", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

interface Props {
  assessment: Assessment;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRefresh: () => Promise<void>;
}

export function CategoriesTab({ assessment, categories, selectedId, onSelect, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = categories.find(c => c.id === selectedId);

  const handleAdd = async () => {
    setAdding(true);
    const { data, error } = await supabase.from("categories").insert({
      assessment_id: assessment.id,
      name: newName.trim() || "New Category",
      sort_order: categories.length,
    } as any).select().single();
    if (error) toast.error(error.message);
    else {
      await onRefresh();
      onSelect((data as unknown as Category).id);
      setNewName("");
    }
    setAdding(false);
  };

  const handleUpdate = async (catId: string, updates: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(updates as any).eq("id", catId);
    if (error) toast.error(error.message);
    else await onRefresh();
  };

  const handleDelete = async (catId: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", catId);
    if (error) toast.error(error.message);
    else {
      if (selectedId === catId) onSelect(null);
      await onRefresh();
      toast.success("Category deleted");
    }
  };

  const moveCategory = async (catId: string, direction: "up" | "down") => {
    const idx = categories.findIndex(c => c.id === catId);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    await Promise.all([
      supabase.from("categories").update({ sort_order: swapIdx } as any).eq("id", categories[idx].id),
      supabase.from("categories").update({ sort_order: idx } as any).eq("id", categories[swapIdx].id),
    ]);
    await onRefresh();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Scoring dimensions for your assessment</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Category name"
            className="w-48 h-9"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Category list */}
        <div className="lg:col-span-1 space-y-1">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors border ${
                selectedId === cat.id ? "border-accent bg-accent/5" : "border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, "up"); }} className="text-muted-foreground hover:text-foreground text-[10px]">▲</button>
                <button onClick={(e) => { e.stopPropagation(); moveCategory(cat.id, "down"); }} className="text-muted-foreground hover:text-foreground text-[10px]">▼</button>
              </div>
              <div className="h-4 w-4 flex-shrink-0" style={{ backgroundColor: cat.colour || "#4A90D9" }} />
              <span className="truncate flex-1 text-left">{cat.name}</span>
            </button>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Add your first category to get started.</p>
          )}
        </div>

        {/* Category editor */}
        {selected && (
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Edit Category</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(selected.id)} className="h-8 w-8 text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name</Label>
                <Input
                  value={selected.name}
                  onChange={e => handleUpdate(selected.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={selected.description || ""}
                  onChange={e => handleUpdate(selected.id, { description: e.target.value || null })}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Colour</Label>
                <div className="flex gap-2">
                  {PRESET_COLOURS.map(c => (
                    <button
                      key={c}
                      onClick={() => handleUpdate(selected.id, { colour: c })}
                      className={`h-7 w-7 border-2 transition-all ${selected.colour === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={selected.include_in_total}
                  onCheckedChange={v => handleUpdate(selected.id, { include_in_total: v })}
                />
                <Label className="text-xs">Include in total score</Label>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
