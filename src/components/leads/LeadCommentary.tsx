import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  leadId: string;
}

export function LeadCommentary({ leadId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCommentary();
  }, [leadId]);

  const loadCommentary = async () => {
    const { data } = await supabase
      .from("lead_commentary" as any)
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setContent((data as any).content || "");
      setSavedContent((data as any).content || "");
    }
    setLoading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);

    // Get the profile id for author_id
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    const { error } = await supabase
      .from("lead_commentary" as any)
      .insert({
        lead_id: leadId,
        author_id: profileData?.id,
        content: content,
      } as any);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save commentary",
        variant: "destructive",
      });
    } else {
      setSavedContent(content);
      toast({ title: "Saved", description: "Commentary saved successfully" });
    }
    setSaving(false);
  };

  const hasChanges = content !== savedContent;

  if (loading) return null;

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Consultant Commentary
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Add personalised observations and recommendations. This will appear in
          the PDF report.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your commentary here. Use paragraphs to separate sections. This will be included in the client's PDF report as a dedicated 'Consultant Commentary' section."
          className="min-h-[160px] text-sm resize-y"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {content.length > 0
              ? `${content.split(/\s+/).filter(Boolean).length} words`
              : "No commentary yet"}
          </span>
          <Button size="sm" onClick={save} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Commentary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
