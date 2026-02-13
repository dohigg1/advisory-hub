import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Users, TrendingUp, CheckCircle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDashboardStats, useTopAssessments, useRecentLeads } from "@/hooks/useAnalytics";
import { format } from "date-fns";

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { pct: 100, icon: ArrowUp, color: "text-success" } : { pct: 0, icon: Minus, color: "text-muted-foreground" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { pct, icon: ArrowUp, color: "text-success" };
  if (pct < 0) return { pct: Math.abs(pct), icon: ArrowDown, color: "text-destructive" };
  return { pct: 0, icon: Minus, color: "text-muted-foreground" };
}

const Dashboard = () => {
  const { organisation } = useAuth();
  const { data: stats } = useOrgDashboardStats();
  const { data: topAssessments } = useTopAssessments();
  const { data: recentLeads } = useRecentLeads();

  const leadsChange = pctChange(stats?.leads_this_month ?? 0, stats?.leads_last_month ?? 0);
  const completionsChange = pctChange(stats?.completions_this_month ?? 0, stats?.completions_last_month ?? 0);

  const summaryCards = [
    { label: "Leads This Month", value: stats?.leads_this_month ?? 0, icon: Users, change: leadsChange, accent: "hsl(var(--accent))" },
    { label: "Completions", value: stats?.completions_this_month ?? 0, icon: CheckCircle, change: completionsChange, accent: "hsl(var(--success))" },
    { label: "Active Assessments", value: topAssessments?.length ?? 0, icon: ClipboardCheck, change: null, accent: "hsl(var(--primary))" },
    { label: "Top Completion Rate", value: topAssessments?.[0]?.completion_rate != null ? `${topAssessments[0].completion_rate}%` : "—", icon: TrendingUp, change: null, accent: "hsl(var(--warning))" },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back to {organisation?.name ?? "your workspace"}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-shadow duration-200">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: stat.accent }} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
              <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              {stat.change && (
                <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${stat.change.color}`}>
                  <stat.change.icon className="h-3 w-3" />
                  <span>{stat.change.pct}% vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="shadow-soft-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold tracking-tight">Top Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            {topAssessments && topAssessments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Starts</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAssessments.map((a: any) => (
                    <TableRow key={a.id} className="border-border/40">
                      <TableCell className="font-medium text-sm">{a.title}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{a.total_starts}</TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant="secondary" className="font-semibold tabular-nums">{a.completion_rate}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No assessments yet. Create your first to get started.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold tracking-tight">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads && recentLeads.length > 0 ? (
              <div className="max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assessment</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Score</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((l: any) => {
                      const score = Array.isArray(l.scores) ? l.scores[0] : l.scores;
                      const tier = score?.score_tiers;
                      const tierLabel = Array.isArray(tier) ? tier[0]?.label : tier?.label;
                      return (
                        <TableRow key={l.id} className="border-border/40">
                          <TableCell className="text-sm">
                            <div className="font-medium">{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email}</div>
                            <div className="text-xs text-muted-foreground">{l.email}</div>
                          </TableCell>
                          <TableCell className="text-sm">{(l as any).assessments?.title ?? "—"}</TableCell>
                          <TableCell className="text-right text-sm">
                            {score?.percentage != null ? (
                              <div>
                                <span className="font-semibold tabular-nums">{score.percentage}%</span>
                                {tierLabel && <Badge variant="outline" className="ml-1.5 text-[10px]">{tierLabel}</Badge>}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {l.completed_at ? format(new Date(l.completed_at), "MMM d") : "In progress"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No leads captured yet. Share an assessment to start.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
