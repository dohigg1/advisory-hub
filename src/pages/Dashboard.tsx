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
    {
      label: "Leads This Month",
      value: stats?.leads_this_month ?? 0,
      icon: Users,
      change: leadsChange,
    },
    {
      label: "Completions This Month",
      value: stats?.completions_this_month ?? 0,
      icon: CheckCircle,
      change: completionsChange,
    },
    {
      label: "Active Assessments",
      value: topAssessments?.length ?? 0,
      icon: ClipboardCheck,
      change: null,
    },
    {
      label: "Top Completion Rate",
      value: topAssessments?.[0]?.completion_rate != null ? `${topAssessments[0].completion_rate}%` : "—",
      icon: TrendingUp,
      change: null,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome to {organisation?.name ?? "your workspace"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat) => (
          <Card key={stat.label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
              {stat.change && (
                <div className={`flex items-center gap-1 text-xs mt-1 ${stat.change.color}`}>
                  <stat.change.icon className="h-3 w-3" />
                  <span>{stat.change.pct}% vs last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Assessments */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Assessments by Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {topAssessments && topAssessments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead className="text-right">Starts</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAssessments.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium text-sm">{a.title}</TableCell>
                      <TableCell className="text-right text-sm">{a.total_starts}</TableCell>
                      <TableCell className="text-right text-sm">
                        <Badge variant="secondary">{a.completion_rate}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                No assessments yet. Create your first assessment to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads && recentLeads.length > 0 ? (
              <div className="max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLeads.map((l: any) => {
                      const score = Array.isArray(l.scores) ? l.scores[0] : l.scores;
                      const tier = score?.score_tiers;
                      const tierLabel = Array.isArray(tier) ? tier[0]?.label : tier?.label;
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm">
                            <div>{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email}</div>
                            <div className="text-xs text-muted-foreground">{l.email}</div>
                          </TableCell>
                          <TableCell className="text-sm">{(l as any).assessments?.title ?? "—"}</TableCell>
                          <TableCell className="text-right text-sm">
                            {score?.percentage != null ? (
                              <div>
                                <span className="font-medium">{score.percentage}%</span>
                                {tierLabel && <Badge variant="outline" className="ml-1 text-[10px]">{tierLabel}</Badge>}
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
                No leads captured yet. Share an assessment to start collecting leads.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
