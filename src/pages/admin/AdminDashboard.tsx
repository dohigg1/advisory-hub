import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Users,
  ClipboardCheck,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalAssessments: number;
  totalCompletions: number;
  planCounts: Record<string, number>;
}

interface WeeklySignup {
  week: string;
  count: number;
}

interface DailyCompletion {
  date: string;
  count: number;
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 29,
  professional: 79,
  pro: 79,
  growth: 149,
  enterprise: 299,
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [weeklySignups, setWeeklySignups] = useState<WeeklySignup[]>([]);
  const [dailyCompletions, setDailyCompletions] = useState<DailyCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);

    const [orgsRes, usersRes, assessmentsRes, completionsRes] = await Promise.all([
      supabase.from("organisations").select("id, plan_tier, created_at"),
      supabase.from("profiles").select("id, created_at"),
      supabase.from("assessments").select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
    ]);

    const orgs = orgsRes.data ?? [];
    const users = usersRes.data ?? [];

    // Plan tier counts
    const planCounts: Record<string, number> = {};
    orgs.forEach((org: any) => {
      const tier = org.plan_tier || "free";
      planCounts[tier] = (planCounts[tier] || 0) + 1;
    });

    setStats({
      totalOrgs: orgs.length,
      totalUsers: users.length,
      totalAssessments: assessmentsRes.count ?? 0,
      totalCompletions: completionsRes.count ?? 0,
      planCounts,
    });

    // Weekly signups (last 4 weeks)
    const weeks: WeeklySignup[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const count = users.filter((u: any) => {
        const d = new Date(u.created_at);
        return d >= weekStart && d <= weekEnd;
      }).length;
      weeks.push({
        week: format(weekStart, "MMM d"),
        count,
      });
    }
    setWeeklySignups(weeks);

    // Daily completions (last 30 days)
    const { data: recentCompletions } = await supabase
      .from("leads")
      .select("completed_at")
      .eq("status", "completed")
      .gte("completed_at", subDays(new Date(), 30).toISOString())
      .order("completed_at", { ascending: true });

    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const day = format(subDays(new Date(), i), "yyyy-MM-dd");
      dailyMap[day] = 0;
    }
    (recentCompletions ?? []).forEach((l: any) => {
      if (l.completed_at) {
        const day = format(new Date(l.completed_at), "yyyy-MM-dd");
        if (dailyMap[day] !== undefined) {
          dailyMap[day]++;
        }
      }
    });
    setDailyCompletions(
      Object.entries(dailyMap).map(([date, count]) => ({
        date: format(new Date(date), "MMM d"),
        count,
      }))
    );

    setLoading(false);
  };

  const mrr = stats
    ? Object.entries(stats.planCounts).reduce(
        (sum, [tier, count]) => sum + (PLAN_PRICES[tier.toLowerCase()] ?? 0) * count,
        0
      )
    : 0;

  const summaryCards = [
    {
      label: "Organisations",
      value: stats?.totalOrgs ?? 0,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      ring: "ring-blue-500/20",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      ring: "ring-emerald-500/20",
    },
    {
      label: "Assessments",
      value: stats?.totalAssessments ?? 0,
      icon: ClipboardCheck,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      ring: "ring-violet-500/20",
    },
    {
      label: "Completions",
      value: stats?.totalCompletions ?? 0,
      icon: CheckCircle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      ring: "ring-amber-500/20",
    },
    {
      label: "Est. MRR",
      value: `$${mrr.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/10",
      ring: "ring-green-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading platform data...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Hero */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 border border-slate-700/50 p-6 lg:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Platform Overview
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform-wide metrics and activity at a glance.
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((stat) => (
          <motion.div key={stat.label} variants={item}>
            <Card className="bg-slate-900/80 border-slate-700/50 hover:border-slate-600/60 transition-all duration-300 group">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ring-1 ${stat.ring}`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={1.8} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Plan breakdown */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] font-semibold tracking-tight text-slate-200 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(stats?.planCounts ?? {}).map(([tier, count]) => (
                <div
                  key={tier}
                  className="rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-3 text-center"
                >
                  <div className="text-lg font-bold text-white">{count}</div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {tier}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly signups */}
        <motion.div variants={item}>
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold tracking-tight text-slate-200 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Signups (Last 4 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySignups} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "#475569" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "#475569" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Signups" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily completions */}
        <motion.div variants={item}>
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[13px] font-semibold tracking-tight text-slate-200 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Assessment Completions (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCompletions} barCategoryGap="10%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94a3b8", fontSize: 9 }}
                      axisLine={{ stroke: "#475569" }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={{ stroke: "#475569" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#f59e0b"
                      radius={[2, 2, 0, 0]}
                      name="Completions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
