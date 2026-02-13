import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ClipboardCheck, MoreVertical, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Assessment, AssessmentType } from "@/types/assessment";
import { ASSESSMENT_TYPE_LABELS, DEFAULT_SCORE_TIERS } from "@/types/assessment";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  published: "bg-success text-success-foreground",
  archived: "bg-muted text-muted-foreground",
};

const Assessments = () => {
  const { organisation } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<AssessmentType>("scorecard");
  const [creating, setCreating] = useState(false);

  const fetchAssessments = useCallback(async () => {
    if (!organisation) return;
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .eq("org_id", organisation.id)
      .order("created_at", { ascending: false });
    setAssessments((data as Assessment[]) ?? []);
    setLoading(false);
  }, [organisation]);

  useEffect(() => { fetchAssessments(); }, [fetchAssessments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisation) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("assessments")
      .insert({
        org_id: organisation.id,
        title: title.trim(),
        description: description.trim() || null,
        type,
        settings_json: {
          lead_form_position: "before",
          show_progress_bar: true,
          allow_retakes: false,
          completion_message: "Thank you for completing this assessment!",
          lead_fields: {
            first_name: { enabled: true, required: true },
            last_name: { enabled: true, required: false },
            email: { enabled: true, required: true },
            company: { enabled: true, required: false },
            phone: { enabled: false, required: false },
          },
        },
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }

    // Create default score tiers
    const tiersToInsert = DEFAULT_SCORE_TIERS.map(t => ({
      ...t,
      assessment_id: (data as Assessment).id,
    }));
    await supabase.from("score_tiers").insert(tiersToInsert);

    toast.success("Assessment created");
    setCreateOpen(false);
    setTitle("");
    setDescription("");
    navigate(`/assessments/${(data as Assessment).id}`);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Assessment deleted");
      fetchAssessments();
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessments</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage client assessments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Create Assessment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Financial Health Check" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this assessment" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={type} onValueChange={v => setType(v as AssessmentType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating…" : "Create Assessment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent" />
        </div>
      ) : assessments.length === 0 ? (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">No assessments yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first assessment to get started.</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map(a => (
            <Card key={a.id} className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/assessments/${a.id}`)}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium truncate">{a.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{ASSESSMENT_TYPE_LABELS[a.type]}</p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <Badge className={STATUS_STYLES[a.status]}>{a.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.description || "No description"}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Updated {new Date(a.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Assessments;
