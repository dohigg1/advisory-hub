import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Loader2, Eye } from "lucide-react";
import type { Assessment } from "@/types/assessment";
import { ASSESSMENT_TYPE_LABELS } from "@/types/assessment";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  assessment: Assessment;
  saveStatus: "saved" | "saving" | "unsaved";
  onUpdate: (updates: Partial<Assessment>) => void;
  onBack: () => void;
}

export function BuilderTopBar({ assessment, saveStatus, onUpdate, onBack }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(assessment.title);

  const handlePublish = async () => {
    const { error } = await supabase
      .from("assessments")
      .update({ status: assessment.status === "published" ? "draft" : "published" } as any)
      .eq("id", assessment.id);
    if (error) toast.error(error.message);
    else {
      onUpdate({ status: assessment.status === "published" ? "draft" : "published" });
      toast.success(assessment.status === "published" ? "Unpublished" : "Published!");
    }
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleValue.trim() && titleValue !== assessment.title) {
      onUpdate({ title: titleValue.trim() });
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {editingTitle ? (
          <Input
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => e.key === "Enter" && commitTitle()}
            className="h-8 w-64 text-sm font-medium"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-sm font-semibold truncate hover:underline"
          >
            {assessment.title}
          </button>
        )}

        <Badge className="bg-secondary text-secondary-foreground text-xs flex-shrink-0">
          {ASSESSMENT_TYPE_LABELS[assessment.type]}
        </Badge>
        <Badge className={assessment.status === "published" ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"}>
          {assessment.status}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>}
          {saveStatus === "saved" && <><Check className="h-3 w-3" /> Saved</>}
          {saveStatus === "unsaved" && "Unsaved changes"}
        </span>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Preview
        </Button>
        <Button size="sm" onClick={handlePublish}>
          {assessment.status === "published" ? "Unpublish" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
