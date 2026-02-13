import { usePortal } from "@/contexts/PortalContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, LogOut, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { DownloadReportButton } from "@/components/pdf-report/DownloadReportButton";

export function PortalDashboard() {
  const { data, logout } = usePortal();

  if (!data) return null;

  const { organisation, portal_settings, client_name, completed_assessments, available_assessments, iterations } = data;
  const brandColour = organisation.primary_colour || "#1B3A5C";
  const welcomeMessage = portal_settings?.welcome_message || "Welcome to your assessment portal";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {organisation.logo_url ? (
            <img src={organisation.logo_url} alt={organisation.name} className="h-8 object-contain" />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: brandColour }}
            >
              {organisation.name.charAt(0)}
            </div>
          )}
          <span className="text-sm font-semibold" style={{ color: brandColour }}>{organisation.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-muted-foreground gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight">Hello, {client_name} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{welcomeMessage}</p>
        </motion.div>

        {/* Completed Assessments */}
        {completed_assessments.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Results</h2>
            <div className="grid gap-3">
              {completed_assessments.map((a, i) => {
                const assessmentIterations = iterations.filter(it => it.assessment_id === a.assessment_id);
                return (
                  <Card key={`${a.lead_id}-${i}`} className="shadow-soft-sm border-border/60 group hover:shadow-soft-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">{a.assessment_title}</h3>
                            {a.iteration_count > 1 && (
                              <Badge variant="outline" className="text-[10px] font-semibold border-accent/30 text-accent">
                                {a.iteration_count} attempts
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Completed {a.completed_at ? format(new Date(a.completed_at), "MMM d, yyyy") : "—"}
                          </p>

                          {/* Iteration timeline */}
                          {assessmentIterations.length > 1 && (
                            <div className="mt-3 flex items-center gap-1.5">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <div className="flex items-center gap-1">
                                {assessmentIterations.map((it: any, idx: number) => (
                                  <div
                                    key={it.id}
                                    className="flex items-center gap-1"
                                  >
                                    <span className="text-[10px] font-mono font-semibold" style={{ color: brandColour }}>
                                      {it.overall_percentage ?? 0}%
                                    </span>
                                    {idx < assessmentIterations.length - 1 && (
                                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Score */}
                          <div className="text-right">
                            <div className="text-2xl font-bold mono" style={{ color: brandColour }}>
                              {a.score_percentage != null ? `${a.score_percentage}%` : "—"}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1.5">
                            <a
                              href={`/results/${a.lead_id}`}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold text-white transition-colors"
                              style={{ backgroundColor: brandColour }}
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Available Assessments */}
        {available_assessments.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Assessments</h2>
            <div className="grid gap-3">
              {available_assessments.map(a => (
                <Card key={a.id} className="shadow-soft-sm border-border/60 border-dashed hover:border-solid hover:shadow-soft-md transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{a.title}</h3>
                      {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                    </div>
                    {a.slug && (
                      <a
                        href={`/a/${a.slug}/start`}
                        className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-[11px] font-semibold text-white transition-colors"
                        style={{ backgroundColor: brandColour }}
                      >
                        <BarChart3 className="h-3 w-3" /> Take Assessment
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {completed_assessments.length === 0 && available_assessments.length === 0 && (
          <Card className="shadow-soft-sm border-border/60 border-dashed">
            <CardContent className="py-16 text-center">
              <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold">No assessments yet</p>
              <p className="text-xs text-muted-foreground mt-1">Your consultant will share assessments with you soon.</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        {portal_settings?.show_powered_by !== false && (
          <footer className="text-center text-[10px] text-muted-foreground/50 pt-8 pb-4">
            Powered by AdvisoryScore
          </footer>
        )}
      </main>
    </div>
  );
}
