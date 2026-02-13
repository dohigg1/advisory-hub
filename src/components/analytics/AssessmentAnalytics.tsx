import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, CheckCircle, Percent, Clock, BarChart3 } from "lucide-react";
import {
  useAssessmentAnalytics,
  useScoreDistribution,
  useTierDistribution,
  useCategoryAverages,
  useCompletionsTimeline,
  useDropoffAnalysis,
  useResponsePatterns,
  exportLeadsCSV,
  exportResponsesCSV,
} from "@/hooks/useAnalytics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { toast } from "@/hooks/use-toast";

interface Props {
  assessmentId: string;
  assessmentTitle: string;
}

const CHART_COLORS = [
  "hsl(213, 68%, 56%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(262, 52%, 47%)", "hsl(174, 62%, 47%)",
];

export function AssessmentAnalytics({ assessmentId, assessmentTitle }: Props) {
  const { data: summary } = useAssessmentAnalytics(assessmentId);
  const { data: scoreDist } = useScoreDistribution(assessmentId);
  const { data: tierDist } = useTierDistribution(assessmentId);
  const { data: catAvg } = useCategoryAverages(assessmentId);
  const { data: timeline } = useCompletionsTimeline(assessmentId);
  const { data: dropoff } = useDropoffAnalysis(assessmentId);
  const { data: patterns } = useResponsePatterns(assessmentId);

  const handleExportLeads = async () => {
    try {
      await exportLeadsCSV(assessmentId);
      toast({ title: "Leads exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleExportResponses = async () => {
    try {
      await exportResponsesCSV(assessmentId);
      toast({ title: "Responses exported" });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const summaryCards = [
    { label: "Total Starts", value: summary?.total_starts ?? 0, icon: Users },
    { label: "Completions", value: summary?.total_completions ?? 0, icon: CheckCircle },
    { label: "Completion Rate", value: `${summary?.completion_rate ?? 0}%`, icon: Percent },
    { label: "Avg Score", value: summary?.avg_score != null ? `${summary.avg_score}%` : "—", icon: BarChart3 },
    { label: "Avg Time", value: summary?.avg_time_minutes != null ? `${summary.avg_time_minutes} min` : "—", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{assessmentTitle}</h2>
          <p className="text-sm text-muted-foreground">Assessment-level analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportLeads}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export Leads
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportResponses}>
            <Download className="h-3.5 w-3.5 mr-1" /> Export Responses
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Score Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreDist && scoreDist.some((b) => b.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreDist}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(213, 68%, 56%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {tierDist && tierDist.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tierDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tierDist.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Category Averages */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Category Score Averages</CardTitle>
          </CardHeader>
          <CardContent>
            {catAvg && catAvg.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={catAvg} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} className="fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="avg" radius={[0, 2, 2, 0]}>
                    {catAvg.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Drop-off Analysis */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Drop-off Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {dropoff && dropoff.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dropoff}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="question" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded border bg-background p-2 text-xs shadow-lg">
                        <p className="font-medium">{d.fullText}</p>
                        <p className="text-muted-foreground">{d.respondents} respondents</p>
                      </div>
                    );
                  }} />
                  <Bar dataKey="respondents" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Completions Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline && timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="completions" stroke="hsl(213, 68%, 56%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data yet</div>
          )}
        </CardContent>
      </Card>

      {/* Response Patterns */}
      {patterns && patterns.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Response Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {patterns.map((q, qi) => (
              <div key={qi}>
                <p className="text-xs font-medium mb-2 text-muted-foreground">Q{q.sortOrder + 1}: {q.questionText}</p>
                <ResponsiveContainer width="100%" height={Math.max(100, q.options.length * 32)}>
                  <BarChart data={q.options} layout="vertical">
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis type="category" dataKey="text" tick={{ fontSize: 10 }} width={150} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[qi % CHART_COLORS.length]} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
