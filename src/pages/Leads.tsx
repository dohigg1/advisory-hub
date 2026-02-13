import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, ChevronDown, ChevronRight, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  assessment_id: string;
  scores: any;
  assessments: any;
}

interface Iteration {
  id: string;
  iteration_number: number;
  overall_percentage: number | null;
  completed_at: string;
  lead_id: string;
}

const Leads = () => {
  const { organisation } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [iterations, setIterations] = useState<Record<string, Iteration[]>>({});
  const [iterationCounts, setIterationCounts] = useState<Record<string, number>>({});

  const fetchLeads = useCallback(async () => {
    if (!organisation) return;
    const { data } = await supabase
      .from("leads")
      .select("*, scores(*), assessments(title)")
      .eq("org_id", organisation.id)
      .order("created_at", { ascending: false })
      .limit(200);
    const leadsData = (data ?? []) as Lead[];
    setLeads(leadsData);
    setLoading(false);

    // Fetch iteration counts grouped by email+assessment
    const emailAssessmentPairs = [...new Set(leadsData.map(l => `${l.email}|||${l.assessment_id}`))];
    const counts: Record<string, number> = {};
    for (const pair of emailAssessmentPairs) {
      const [email, assessmentId] = pair.split("|||");
      const { count } = await supabase
        .from("assessment_iterations" as any)
        .select("id", { count: "exact", head: true })
        .eq("lead_email", email)
        .eq("assessment_id", assessmentId);
      if (count && count > 1) {
        counts[pair] = count;
      }
    }
    setIterationCounts(counts);
  }, [organisation]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const toggleExpand = async (email: string, assessmentId: string) => {
    const key = `${email}|||${assessmentId}`;
    if (expandedEmail === key) {
      setExpandedEmail(null);
      return;
    }
    setExpandedEmail(key);
    if (!iterations[key]) {
      const { data } = await supabase
        .from("assessment_iterations" as any)
        .select("*")
        .eq("lead_email", email)
        .eq("assessment_id", assessmentId)
        .order("iteration_number", { ascending: true });
      setIterations(prev => ({ ...prev, [key]: (data as unknown as Iteration[]) ?? [] }));
    }
  };

  const exportProgress = (email: string, assessmentId: string) => {
    const key = `${email}|||${assessmentId}`;
    const its = iterations[key];
    if (!its || its.length === 0) return;
    const csv = ["Iteration,Score,Completed At", ...its.map(i => `${i.iteration_number},${i.overall_percentage ?? ""},${i.completed_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `progress-${email.replace("@", "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = [l.first_name, l.last_name].filter(Boolean).join(" ").toLowerCase();
      if (!name.includes(q) && !l.email.toLowerCase().includes(q) && !(l.company || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Leads</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Track and manage assessment leads</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or company..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-[13px]" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-soft-sm border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 mb-4">
              <Users className="h-6 w-6 text-accent" strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-semibold mb-1">No leads found</p>
            <p className="text-[13px] text-muted-foreground max-w-xs">Share an assessment to start collecting leads.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft-sm border-border/60">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 w-8" />
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Respondent</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Assessment</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Score</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Attempts</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(l => {
                  const key = `${l.email}|||${l.assessment_id}`;
                  const count = iterationCounts[key] || 1;
                  const isExpanded = expandedEmail === key;
                  const score = Array.isArray(l.scores) ? l.scores[0] : l.scores;
                  return (
                    <>
                      <TableRow key={l.id} className="border-border/30 cursor-pointer hover:bg-muted/30" onClick={() => count > 1 ? toggleExpand(l.email, l.assessment_id) : null}>
                        <TableCell className="w-8 pl-4">
                          {count > 1 && (isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />)}
                        </TableCell>
                        <TableCell>
                          <div className="text-[13px] font-medium">{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email}</div>
                          <div className="text-[11px] text-muted-foreground/60">{l.email}{l.company && ` · ${l.company}`}</div>
                        </TableCell>
                        <TableCell className="text-[13px] text-muted-foreground">{l.assessments?.title ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] font-semibold border-0 ${l.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-semibold mono">
                          {score?.percentage != null ? `${score.percentage}%` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {count > 1 ? (
                            <Badge variant="outline" className="text-[10px] font-semibold border-accent/30 text-accent">{count}×</Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">1</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-[11px] text-muted-foreground/60">
                          {l.completed_at ? format(new Date(l.completed_at), "MMM d, yyyy") : format(new Date(l.created_at), "MMM d")}
                        </TableCell>
                      </TableRow>
                      {isExpanded && iterations[key] && (
                        <TableRow key={`${l.id}-expanded`} className="bg-muted/20">
                          <TableCell colSpan={7} className="py-3 px-8">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score History</span>
                                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => exportProgress(l.email, l.assessment_id)}>
                                  <Download className="h-3 w-3 mr-1" /> Export CSV
                                </Button>
                              </div>
                              <div className="rounded-lg border border-border/50 overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                      <th className="text-left px-3 py-2">Attempt</th>
                                      <th className="text-right px-3 py-2">Score</th>
                                      <th className="text-right px-3 py-2">Date</th>
                                      <th className="text-right px-3 py-2" />
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {iterations[key].map((it, idx) => (
                                      <tr key={it.id} className={idx % 2 === 0 ? "" : "bg-muted/10"}>
                                        <td className="px-3 py-1.5 font-medium">#{it.iteration_number}</td>
                                        <td className="px-3 py-1.5 text-right font-semibold mono">{it.overall_percentage ?? "—"}%</td>
                                        <td className="px-3 py-1.5 text-right text-muted-foreground">{format(new Date(it.completed_at), "MMM d, yyyy")}</td>
                                        <td className="px-3 py-1.5 text-right">
                                          <a href={`/results/${it.lead_id}`} target="_blank" rel="noopener" className="text-accent hover:text-accent/80">
                                            <ExternalLink className="h-3 w-3 inline" />
                                          </a>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default Leads;
