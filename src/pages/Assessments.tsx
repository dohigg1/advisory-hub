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
import { Plus, ClipboardCheck, MoreVertical, Trash2, ArrowUpRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Assessment, AssessmentType } from "@/types/assessment";
import { ASSESSMENT_TYPE_LABELS, DEFAULT_SCORE_TIERS } from "@/types/assessment";
import { motion } from "framer-motion";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-0",
  published: "bg-success/10 text-success border-0",
  archived: "bg-muted/60 text-muted-foreground/60 border-0",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Assessments</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Create and manage client assessments</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-soft-sm h-9 text-[13px]"><Plus className="h-4 w-4" /> New Assessment</Button>
          </DialogTrigger>
          <DialogContent className="shadow-soft-lg">
            <DialogHeader>
              <DialogTitle>New Assessment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Financial Health Check" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this assessment" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Type</Label>
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
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : assessments.length === 0 ? (
        <motion.div variants={item}>
          <Card className="shadow-soft-sm border-border/60 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-4">
                <ClipboardCheck className="h-6 w-6 text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] font-semibold mb-1">No assessments yet</p>
              <p className="text-[13px] text-muted-foreground mb-6 max-w-xs">Create your first assessment to start capturing leads and insights.</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2 shadow-soft-sm h-9 text-[13px]">
                <Plus className="h-4 w-4" /> Create Assessment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map(a => (
            <motion.div key={a.id} variants={item}>
              <Card
                className="group relative overflow-hidden shadow-soft-xs hover:shadow-soft-md transition-all duration-300 cursor-pointer border-border/60 hover:border-accent/20"
                onClick={() => navigate(`/assessments/${a.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-[14px] font-semibold tracking-tight truncate">{a.title}</CardTitle>
                    <p className="text-[11px] text-muted-foreground/70 font-medium">{ASSESSMENT_TYPE_LABELS[a.type]}</p>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <Badge className={`text-[10px] font-semibold ${STATUS_STYLES[a.status]}`}>{a.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="shadow-soft-md">
                        <DropdownMenuItem className="text-destructive text-[13px]" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-[12px] text-muted-foreground/70 line-clamp-2 mb-4">{a.description || "No description"}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground/50 mono">
                      {new Date(a.updated_at).toLocaleDateString()}
                    </p>
                    <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-300">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Assessments;
