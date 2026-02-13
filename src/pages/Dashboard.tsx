import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Users, TrendingUp, CheckCircle, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgDashboardStats, useTopAssessments, useRecentLeads } from "@/hooks/useAnalytics";
import { format } from "date-fns";
import { motion } from "framer-motion";

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { pct: 100, icon: ArrowUp, color: "text-success" } : { pct: 0, icon: Minus, color: "text-muted-foreground" };
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return { pct, icon: ArrowUp, color: "text-success" };
  if (pct < 0) return { pct: Math.abs(pct), icon: ArrowDown, color: "text-destructive" };
  return { pct: 0, icon: Minus, color: "text-muted-foreground" };
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } } };

const Dashboard = () => {
  const { organisation } = useAuth();
  const { data: stats } = useOrgDashboardStats();
  const { data: topAssessments } = useTopAssessments();
  const { data: recentLeads } = useRecentLeads();

  const leadsChange = pctChange(stats?.leads_this_month ?? 0, stats?.leads_last_month ?? 0);
  const completionsChange = pctChange(stats?.completions_this_month ?? 0, stats?.completions_last_month ?? 0);

  const summaryCards = [
    { label: "Leads", value: stats?.leads_this_month ?? 0, icon: Users, change: leadsChange, gradient: "from-accent/10 to-accent/5" },
    { label: "Completions", value: stats?.completions_this_month ?? 0, icon: CheckCircle, change: completionsChange, gradient: "from-success/10 to-success/5" },
    { label: "Assessments", value: topAssessments?.length ?? 0, icon: ClipboardCheck, change: null, gradient: "from-primary/10 to-primary/5" },
    { label: "Completion Rate", value: topAssessments?.[0]?.completion_rate != null ? `${topAssessments[0].completion_rate}%` : "—", icon: TrendingUp, change: null, gradient: "from-warning/10 to-warning/5" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Welcome hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-xl bg-primary p-6 lg:p-8 shadow-soft-md">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary/40" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Welcome back{organisation?.name ? ` to ${organisation.name}` : ""}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Here's how your assessments are performing this month.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((stat, i) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="relative overflow-hidden shadow-soft-sm hover:shadow-soft-md transition-all duration-300 group border-border/60">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <CardContent className="relative pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80 group-hover:bg-card transition-colors">
                    <stat.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="text-3xl font-bold tracking-tight mono">{stat.value}</div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${stat.change.color}`}>
                    <stat.change.icon className="h-3 w-3" />
                    <span>{stat.change.pct}% vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div variants={item}>
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                Top Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topAssessments && topAssessments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Assessment</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Starts</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAssessments.map((a: any) => (
                      <TableRow key={a.id} className="border-border/30">
                        <TableCell className="font-medium text-[13px]">{a.title}</TableCell>
                        <TableCell className="text-right text-[13px] mono">{a.total_starts}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-semibold mono text-[11px] bg-accent/10 text-accent border-0">{a.completion_rate}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={ClipboardCheck} message="No assessments yet" sub="Create your first to get started." />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold tracking-tight flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLeads && recentLeads.length > 0 ? (
                <div className="max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Assessment</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Score</TableHead>
                        <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentLeads.map((l: any) => {
                        const score = Array.isArray(l.scores) ? l.scores[0] : l.scores;
                        const tier = score?.score_tiers;
                        const tierLabel = Array.isArray(tier) ? tier[0]?.label : tier?.label;
                        return (
                          <TableRow key={l.id} className="border-border/30">
                            <TableCell className="text-[13px]">
                              <div className="font-medium">{[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email}</div>
                              <div className="text-[11px] text-muted-foreground/60">{l.email}</div>
                            </TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">{(l as any).assessments?.title ?? "—"}</TableCell>
                            <TableCell className="text-right text-[13px]">
                              {score?.percentage != null ? (
                                <div>
                                  <span className="font-semibold mono">{score.percentage}%</span>
                                  {tierLabel && <Badge variant="outline" className="ml-1.5 text-[9px] border-border/50">{tierLabel}</Badge>}
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-[11px] text-muted-foreground/60">
                              {l.completed_at ? format(new Date(l.completed_at), "MMM d") : "In progress"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState icon={Users} message="No leads yet" sub="Share an assessment to start." />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <p className="text-[13px] font-medium text-foreground/70">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
    </div>
  );
}

export default Dashboard;
