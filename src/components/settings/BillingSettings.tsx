import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, X, ExternalLink, CreditCard, AlertTriangle } from "lucide-react";
import { PLAN_CONFIGS, PLAN_TIERS, FEATURE_LABELS, type PlanTier } from "@/config/plans";
import { motion } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";
import { CancellationModal } from "./CancellationModal";
import { trackEvent, AnalyticsEvents } from "@/lib/posthog";

type Invoice = Tables<"invoices">;

export function BillingSettings() {
  const { organisation } = useAuth();
  const planLimits = usePlanLimits();
  const [annual, setAnnual] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadInvoices = async () => {
    if (!organisation || invoicesLoaded) return;
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("org_id", organisation.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setInvoices((data as Invoice[]) ?? []);
    setInvoicesLoaded(true);
  };

  // Load invoices on mount
  if (!invoicesLoaded && organisation) loadInvoices();

  const handleCheckout = async (tier: PlanTier) => {
    const config = PLAN_CONFIGS[tier];
    const priceId = annual ? config.annualPriceId : config.monthlyPriceId;
    if (!priceId) return;
    
    setCheckingOut(tier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setManagingPortal(false);
    }
  };

  const usageColor = (pct: number) => {
    if (pct >= 90) return "text-destructive";
    if (pct >= 70) return "text-warning";
    return "text-success";
  };

  const progressColor = (pct: number) => {
    if (pct >= 90) return "bg-destructive";
    if (pct >= 70) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="space-y-6">
      {/* Payment failed banner */}
      {planLimits.subscriptionStatus === "past_due" && (
        <Card className="border-destructive bg-destructive/5 shadow-soft-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-destructive">Payment failed</p>
              <p className="text-[12px] text-muted-foreground">Your last payment failed. Please update your payment method to avoid service interruption.</p>
            </div>
            <Button size="sm" variant="destructive" onClick={handleManageSubscription} disabled={managingPortal}>
              <CreditCard className="h-4 w-4 mr-1" /> Update Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current plan + usage */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-semibold tracking-tight">Current Plan</CardTitle>
            {planLimits.subscribed && (
              <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5" onClick={handleManageSubscription} disabled={managingPortal}>
                <ExternalLink className="h-3.5 w-3.5" />
                {managingPortal ? "Opening…" : "Manage Subscription"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-[15px] font-bold">{PLAN_CONFIGS[planLimits.tier].name}</p>
              <p className="text-[12px] text-muted-foreground">
                {planLimits.tier === "free" ? "No active subscription" : (
                  <>
                    {planLimits.subscriptionEnd && `Renews ${new Date(planLimits.subscriptionEnd).toLocaleDateString()}`}
                    <Badge className="ml-2 text-[10px]" variant={planLimits.subscriptionStatus === "active" ? "default" : "destructive"}>
                      {planLimits.subscriptionStatus}
                    </Badge>
                  </>
                )}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Usage</p>
            {(["assessments", "responses_per_month", "team_members"] as const).map((key) => {
              const u = planLimits.usage[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">{FEATURE_LABELS[key]}</span>
                    <span className={`font-mono font-medium ${usageColor(u.percentage)}`}>
                      {u.current} / {u.limit === -1 ? "∞" : u.limit}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor(u.percentage)}`}
                      style={{ width: `${Math.min(u.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[14px] font-semibold tracking-tight">Plans</CardTitle>
            <div className="flex items-center gap-2 text-[12px]">
              <span className={!annual ? "font-semibold" : "text-muted-foreground"}>Monthly</span>
              <Switch checked={annual} onCheckedChange={setAnnual} />
              <span className={annual ? "font-semibold" : "text-muted-foreground"}>Annual</span>
              {annual && <Badge variant="secondary" className="text-[10px]">Save 20%</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_TIERS.map((t) => {
              const config = PLAN_CONFIGS[t];
              const isCurrent = t === planLimits.tier;
              const price = annual ? config.annualPrice : config.monthlyPrice;
              const interval = annual ? "/yr" : "/mo";

              return (
                <motion.div
                  key={t}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-4 space-y-3 ${isCurrent ? "border-accent bg-accent/5 ring-1 ring-accent/20" : "border-border/60"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-bold">{config.name}</p>
                      {isCurrent && <Badge className="text-[10px] bg-accent text-accent-foreground">Current</Badge>}
                    </div>
                    <p className="text-[20px] font-bold mt-1">
                      {price === 0 ? "Free" : `£${price}`}
                      {price > 0 && <span className="text-[12px] font-normal text-muted-foreground">{interval}</span>}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">
                      {config.limits.assessments === -1 ? "Unlimited" : config.limits.assessments} assessments
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {config.limits.responses_per_month.toLocaleString()} responses/mo
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {config.limits.team_members} team members
                    </p>
                    {Object.entries(config.limits)
                      .filter(([k]) => !["assessments", "responses_per_month", "team_members"].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {typeof v === "boolean" ? (
                            v ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground/40" />
                          ) : (
                            <Check className="h-3 w-3 text-success" />
                          )}
                          <span>{FEATURE_LABELS[k] || k}</span>
                        </div>
                      ))}
                  </div>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full h-8 text-[12px]" disabled>
                      Current Plan
                    </Button>
                  ) : t === "free" ? (
                    <Button variant="ghost" className="w-full h-8 text-[12px]" disabled>
                      —
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-8 text-[12px]"
                      onClick={() => handleCheckout(t)}
                      disabled={!!checkingOut}
                    >
                      {checkingOut === t ? "Redirecting…" : (
                        planLimits.tier === "free" ? "Subscribe" :
                        PLAN_TIERS.indexOf(t) > PLAN_TIERS.indexOf(planLimits.tier) ? "Upgrade" : "Change Plan"
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <CardTitle className="text-[14px] font-semibold tracking-tight">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-4 text-center">No invoices yet</p>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13px] font-medium">
                      £{(inv.amount_paid / 100).toFixed(2)} {inv.currency.toUpperCase()}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inv.status === "paid" ? "default" : "destructive"} className="text-[10px]">
                      {inv.status}
                    </Badge>
                    {inv.invoice_url && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Cancel subscription button for paid plans */}
      {planLimits.subscribed && planLimits.tier !== "free" && (
        <Card className="shadow-soft-sm border-destructive/20">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-[13px] font-semibold">Cancel Subscription</p>
              <p className="text-[12px] text-muted-foreground">Your plan will remain active until the end of the billing period.</p>
            </div>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setCancelOpen(true)}>
              Cancel Plan
            </Button>
          </CardContent>
        </Card>
      )}

      <CancellationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirmCancel={() => {
          trackEvent(AnalyticsEvents.PLAN_CANCELLED, { tier: planLimits.tier });
          handleManageSubscription();
          setCancelOpen(false);
        }}
      />
    </div>
  );
}
