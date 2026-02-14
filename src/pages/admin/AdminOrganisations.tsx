import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Eye, Shield, RotateCcw, Save, X } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { PLAN_CONFIGS, FEATURE_LABELS, PLAN_TIERS, type PlanTier } from "@/config/plans";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

interface EnrichedOrg {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  plan_tier: string;
  admin_plan_tier: string | null;
  admin_notes: string | null;
  admin_override_at: string | null;
  effective_tier: string;
  member_count: number;
  assessment_count: number;
  completed_leads_count: number;
  permission_overrides: Array<{ permission_key: string; permission_value: string }>;
  stripe_customer_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  created_at: string;
}

interface OrgDetail {
  org: any;
  members: Array<{ id: string; email: string; full_name: string | null; role: string; created_at: string }>;
  assessments: Array<{ id: string; title: string; status: string; created_at: string }>;
  completed_leads_count: number;
  permission_overrides: Array<{ permission_key: string; permission_value: string }>;
  subscriptions: any[];
}

// Determine value type for a permission key
function getPermissionType(key: string): "boolean" | "enum" | "number" {
  const sample = PLAN_CONFIGS.free.limits as any;
  const val = sample[key];
  if (typeof val === "boolean") return "boolean";
  if (typeof val === "string") return "enum";
  return "number";
}

function getEnumOptions(key: string): string[] {
  if (key === "pdf_reports") return ["none", "basic", "full", "full_benchmark"];
  if (key === "webhooks") return ["none", "zapier", "full", "full_api"];
  return [];
}

const ALL_PERMISSION_KEYS = Object.keys(PLAN_CONFIGS.free.limits);

const AdminOrganisations = () => {
  const [orgs, setOrgs] = useState<EnrichedOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { toast } = useToast();

  // Plan override form state
  const [overrideTier, setOverrideTier] = useState<string>("none");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [savingTier, setSavingTier] = useState(false);

  // Permission overrides form state
  const [permEdits, setPermEdits] = useState<Record<string, string | null>>({});
  const [savingPerms, setSavingPerms] = useState(false);

  const invokeAdmin = useCallback(async (action: string, params: any = {}) => {
    const { data, error } = await supabase.functions.invoke("admin-manage-org", {
      body: { action, ...params },
    });
    if (error) throw error;
    return data;
  }, []);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_orgs", { search: search || undefined });
      setOrgs(data.orgs || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, invokeAdmin, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchOrgs, 300);
    return () => clearTimeout(timer);
  }, [fetchOrgs]);

  const openOrgDetail = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setSheetOpen(true);
    setDetailLoading(true);
    try {
      const data = await invokeAdmin("get_org", { org_id: orgId });
      setOrgDetail(data);

      // Initialize form state
      const org = data.org;
      setOverrideTier(org.admin_plan_tier || "none");
      setOverrideNotes(org.admin_notes || "");

      // Initialize perm edits from existing overrides
      const editMap: Record<string, string | null> = {};
      (data.permission_overrides || []).forEach((o: any) => {
        editMap[o.permission_key] = o.permission_value;
      });
      setPermEdits(editMap);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveTier = async () => {
    if (!selectedOrgId) return;
    setSavingTier(true);
    try {
      await invokeAdmin("set_plan_tier", {
        org_id: selectedOrgId,
        plan_tier: overrideTier === "none" ? null : overrideTier,
        notes: overrideNotes || undefined,
      });
      toast({ title: "Plan override saved" });
      fetchOrgs();
      // Refresh detail
      const data = await invokeAdmin("get_org", { org_id: selectedOrgId });
      setOrgDetail(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingTier(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedOrgId) return;
    setSavingPerms(true);
    try {
      const overrides = Object.entries(permEdits).map(([key, value]) => ({
        key,
        value: value || null,
      }));
      await invokeAdmin("set_permissions", { org_id: selectedOrgId, overrides });
      toast({ title: "Permission overrides saved" });
      fetchOrgs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPerms(false);
    }
  };

  const effectiveTier = orgDetail?.org
    ? (orgDetail.org.admin_plan_tier || orgDetail.org.plan_tier) as PlanTier
    : "free";

  const tierBadgeVariant = (tier: string, hasOverride: boolean) => {
    if (hasOverride) return "default" as const;
    switch (tier) {
      case "free": return "secondary" as const;
      case "suspended": return "destructive" as const;
      default: return "outline" as const;
    }
  };

  if (loading && orgs.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading organisations...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-xl font-bold text-white tracking-tight">Organisations</h1>
        <p className="text-sm text-slate-400 mt-1">{orgs.length} organisations on the platform.</p>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search organisations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-amber-500/50"
          />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  {["Organisation", "Effective Plan", "Members", "Assessments", "Leads", "Created", ""].map((h) => (
                    <TableHead key={h} className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      {search ? "No organisations match your search." : "No organisations found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  orgs.map((org) => (
                    <TableRow key={org.id} className="border-slate-700/30 hover:bg-slate-800/40 cursor-pointer" onClick={() => openOrgDetail(org.id)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <img src={org.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain ring-1 ring-slate-700" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                              <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-[13px] font-medium text-slate-200">{org.name}</div>
                            <div className="text-[11px] text-slate-500">{org.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={tierBadgeVariant(org.effective_tier, !!org.admin_plan_tier)} className="text-[10px]">
                            {org.effective_tier}
                          </Badge>
                          {org.admin_plan_tier && (
                            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                              <Shield className="h-2.5 w-2.5 mr-0.5" />override
                            </Badge>
                          )}
                          {org.permission_overrides.length > 0 && (
                            <Badge variant="outline" className="text-[9px] border-blue-500/40 text-blue-400">
                              +{org.permission_overrides.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[13px] text-slate-300 tabular-nums">{org.member_count}</TableCell>
                      <TableCell className="text-right text-[13px] text-slate-300 tabular-nums">{org.assessment_count}</TableCell>
                      <TableCell className="text-right text-[13px] text-slate-300 tabular-nums">{org.completed_leads_count}</TableCell>
                      <TableCell className="text-right text-[11px] text-slate-500">
                        {format(new Date(org.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200" onClick={() => openOrgDetail(org.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Organisation Management Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-700 text-slate-200 w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100 flex items-center gap-3">
              {orgDetail?.org?.logo_url ? (
                <img src={orgDetail.org.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain ring-1 ring-slate-700" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
              )}
              {orgDetail?.org?.name || "Loading..."}
            </SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : orgDetail ? (
            <div className="mt-6 space-y-8">
              {/* Section 1: Org Info */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organisation Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Slug" value={orgDetail.org.slug || "—"} />
                  <DetailField label="Stripe Plan" value={orgDetail.org.plan_tier} />
                  <DetailField label="Created" value={format(new Date(orgDetail.org.created_at), "MMM d, yyyy")} />
                  <DetailField label="Subscription" value={orgDetail.org.subscription_status || "None"} />
                  <DetailField label="Stripe Customer" value={orgDetail.org.stripe_customer_id || "None"} />
                  <DetailField label="Period End" value={orgDetail.org.current_period_end ? format(new Date(orgDetail.org.current_period_end), "MMM d, yyyy") : "N/A"} />
                </div>

                {/* Members */}
                {orgDetail.members.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Members ({orgDetail.members.length})</h4>
                    <div className="space-y-1.5">
                      {orgDetail.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded bg-slate-800/50">
                          <div>
                            <span className="text-[12px] text-slate-200">{m.full_name || m.email}</span>
                            {m.full_name && <span className="text-[11px] text-slate-500 ml-2">{m.email}</span>}
                          </div>
                          <Badge variant="outline" className="text-[9px]">{m.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <Separator className="bg-slate-700/50" />

              {/* Section 2: Plan Override */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Override</h3>
                {orgDetail.org.admin_plan_tier && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/20">
                    <Shield className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[11px] text-amber-300">
                      Admin override active since {orgDetail.org.admin_override_at ? format(new Date(orgDetail.org.admin_override_at), "MMM d, yyyy") : "unknown"}
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Override Tier</label>
                    <Select value={overrideTier} onValueChange={setOverrideTier}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="none">No override (use Stripe plan)</SelectItem>
                        {PLAN_TIERS.map((t) => (
                          <SelectItem key={t} value={t}>{PLAN_CONFIGS[t].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 mb-1 block">Admin Notes</label>
                    <Textarea
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder="e.g. Beta tester – free firm access until March 2026"
                      className="bg-slate-800 border-slate-700 text-slate-200 text-[13px] min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTier} disabled={savingTier} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {savingTier ? "Saving..." : "Save Plan Override"}
                    </Button>
                    {orgDetail.org.admin_plan_tier && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300"
                        onClick={() => { setOverrideTier("none"); setOverrideNotes(""); }}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Remove Override
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              <Separator className="bg-slate-700/50" />

              {/* Section 3: Permission Overrides */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Permission Overrides</h3>
                <p className="text-[11px] text-slate-500">Override individual permissions. Overridden values take precedence over the plan tier.</p>

                <div className="space-y-2">
                  {ALL_PERMISSION_KEYS.map((key) => {
                    const type = getPermissionType(key);
                    const planDefault = (PLAN_CONFIGS[effectiveTier]?.limits as any)?.[key];
                    const hasOverride = permEdits[key] !== undefined && permEdits[key] !== null;
                    const currentValue = permEdits[key];

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${hasOverride ? "bg-blue-500/5 border border-blue-500/20" : "bg-slate-800/30"}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-slate-200">{FEATURE_LABELS[key] || key}</div>
                          <div className="text-[10px] text-slate-500">
                            Plan default: {typeof planDefault === "boolean" ? (planDefault ? "Yes" : "No") : String(planDefault === -1 ? "Unlimited" : planDefault)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {type === "boolean" && (
                            <Switch
                              checked={hasOverride ? currentValue === "true" : !!planDefault}
                              onCheckedChange={(checked) => {
                                setPermEdits((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
                              }}
                              className="data-[state=checked]:bg-amber-500"
                            />
                          )}

                          {type === "enum" && (
                            <Select
                              value={hasOverride ? currentValue! : String(planDefault)}
                              onValueChange={(val) => setPermEdits((prev) => ({ ...prev, [key]: val }))}
                            >
                              <SelectTrigger className="w-[120px] h-8 bg-slate-800 border-slate-700 text-[11px] text-slate-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {getEnumOptions(key).map((opt) => (
                                  <SelectItem key={opt} value={opt} className="text-[11px]">{opt}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {type === "number" && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={hasOverride ? (currentValue === "-1" ? "" : currentValue!) : (planDefault === -1 ? "" : String(planDefault))}
                                onChange={(e) => setPermEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                disabled={currentValue === "-1"}
                                className="w-[80px] h-8 bg-slate-800 border-slate-700 text-[11px] text-slate-200"
                              />
                              <div className="flex items-center gap-1">
                                <Checkbox
                                  checked={currentValue === "-1"}
                                  onCheckedChange={(checked) => {
                                    setPermEdits((prev) => ({ ...prev, [key]: checked ? "-1" : String(planDefault) }));
                                  }}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="text-[10px] text-slate-400">∞</span>
                              </div>
                            </div>
                          )}

                          {hasOverride && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                              onClick={() => setPermEdits((prev) => {
                                const next = { ...prev };
                                next[key] = null;
                                return next;
                              })}
                              title="Reset to plan default"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button onClick={handleSavePermissions} disabled={savingPerms} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {savingPerms ? "Saving..." : "Save All Overrides"}
                </Button>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[13px] text-slate-200 font-medium">{value}</div>
    </div>
  );
}

export default AdminOrganisations;
