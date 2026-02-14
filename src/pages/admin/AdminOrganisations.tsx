import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Search,
  Eye,
  Shield,
  RotateCcw,
  Save,
  Users,
  FileText,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  PLAN_CONFIGS,
  FEATURE_LABELS,
  PLAN_TIERS,
  type PlanTier,
} from "@/config/plans";

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

interface EnrichedOrg {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  primary_colour: string | null;
  plan_tier: string;
  admin_plan_tier: string | null;
  admin_notes: string | null;
  admin_override_at: string | null;
  admin_override_by: string | null;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  created_at: string;
  effective_tier: string;
  member_count: number;
  assessment_count: number;
  completed_leads_count: number;
  permission_overrides: Array<{
    id: string;
    permission_key: string;
    permission_value: string;
  }>;
}

interface OrgDetail {
  org: EnrichedOrg;
  members: Array<{
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    created_at: string;
  }>;
  assessments: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
  }>;
  completed_leads_count: number;
  permission_overrides: Array<{
    id: string;
    permission_key: string;
    permission_value: string;
  }>;
}

// Permission metadata for rendering the correct controls
const PERMISSION_KEYS = Object.keys(FEATURE_LABELS);

const BOOLEAN_PERMISSIONS = [
  "custom_domain",
  "client_portal",
  "abandon_emails",
  "remove_branding",
  "ab_testing",
  "data_enrichment",
  "ai_narratives",
];

const ENUM_PERMISSIONS: Record<string, string[]> = {
  pdf_reports: ["none", "basic", "full", "full_benchmark"],
  webhooks: ["none", "zapier", "full", "full_api"],
};

const NUMERIC_PERMISSIONS = [
  "assessments",
  "responses_per_month",
  "team_members",
  "ai_generations_per_month",
];

async function invokeAdmin(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-manage-org", {
    body: { action, params },
  });
  if (error) throw error;
  return data;
}

const AdminOrganisations = () => {
  const [orgs, setOrgs] = useState<EnrichedOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Plan override state
  const [overrideTier, setOverrideTier] = useState<string>("none");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [savingTier, setSavingTier] = useState(false);

  // Permission overrides state
  const [permEdits, setPermEdits] = useState<Record<string, string | null>>({});
  const [savingPerms, setSavingPerms] = useState(false);

  const { toast } = useToast();

  const fetchOrganisations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_orgs", { search: search || undefined, limit: 200 });
      setOrgs(data.orgs ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchOrganisations, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchOrganisations]);

  const openOrgDetail = async (org: EnrichedOrg) => {
    setSheetOpen(true);
    setDetailLoading(true);
    setOrgDetail(null);
    setPermEdits({});

    try {
      const data = await invokeAdmin("get_org", { org_id: org.id });
      const detail: OrgDetail = {
        org: { ...data.org, effective_tier: data.org.admin_plan_tier || data.org.plan_tier || "free", member_count: (data.members ?? []).length, assessment_count: (data.assessments ?? []).length, completed_leads_count: data.completed_leads_count ?? 0, permission_overrides: data.permission_overrides ?? [] },
        members: data.members ?? [],
        assessments: data.assessments ?? [],
        completed_leads_count: data.completed_leads_count ?? 0,
        permission_overrides: data.permission_overrides ?? [],
      };
      setOrgDetail(detail);
      setOverrideTier(detail.org.admin_plan_tier || "none");
      setOverrideNotes(detail.org.admin_notes || "");

      // Init permission edits from existing overrides
      const existingOverrides: Record<string, string | null> = {};
      (data.permission_overrides ?? []).forEach((o: any) => {
        existingOverrides[o.permission_key] = o.permission_value;
      });
      setPermEdits(existingOverrides);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSavePlanTier = async () => {
    if (!orgDetail) return;
    setSavingTier(true);
    try {
      await invokeAdmin("set_plan_tier", {
        org_id: orgDetail.org.id,
        plan_tier: overrideTier === "none" ? null : overrideTier,
        notes: overrideNotes || undefined,
      });
      toast({ title: "Plan override saved" });
      fetchOrganisations();
      // Refresh detail
      openOrgDetail(orgDetail.org);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingTier(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!orgDetail) return;
    setSavingPerms(true);
    try {
      const overrides = Object.entries(permEdits).map(([key, value]) => ({
        key,
        value: value || null,
      }));
      await invokeAdmin("set_permissions", {
        org_id: orgDetail.org.id,
        overrides,
      });
      toast({ title: "Permission overrides saved" });
      openOrgDetail(orgDetail.org);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPerms(false);
    }
  };

  const resetPermission = (key: string) => {
    setPermEdits((prev) => {
      const next = { ...prev };
      next[key] = null;
      return next;
    });
  };

  const effectiveTier = orgDetail
    ? (overrideTier !== "none" ? overrideTier : orgDetail.org.plan_tier || "free") as PlanTier
    : "free";
  const effectiveLimits = PLAN_CONFIGS[effectiveTier as PlanTier]?.limits ?? PLAN_CONFIGS.free.limits;

  const planBadgeVariant = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "firm": return "default";
      case "professional": return "default";
      case "starter": return "outline";
      case "suspended": return "destructive";
      default: return "secondary";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Organisations</h1>
            <p className="text-sm text-slate-400 mt-1">
              {orgs.length} organisations &middot; Manage plans, permissions & overrides
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500 focus-visible:ring-amber-500/50"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Organisation</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Effective Plan</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Members</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Assessments</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Leads</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Created</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
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
                    <TableRow
                      key={org.id}
                      className="border-slate-700/30 hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => openOrgDetail(org)}
                    >
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
                          <Badge variant={planBadgeVariant(org.effective_tier)} className="text-[10px]">
                            {org.effective_tier}
                          </Badge>
                          {org.admin_plan_tier && (
                            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                              override
                            </Badge>
                          )}
                          {org.permission_overrides.length > 0 && (
                            <Badge variant="outline" className="text-[9px] border-violet-500/40 text-violet-400">
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          onClick={(e) => { e.stopPropagation(); openOrgDetail(org); }}
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1" />
                          <span className="text-[11px]">Manage</span>
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
              {orgDetail?.org.logo_url ? (
                <img src={orgDetail.org.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain ring-1 ring-slate-700" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
              )}
              {orgDetail?.org.name || "Loading..."}
            </SheetTitle>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : orgDetail ? (
            <div className="mt-6 space-y-8">
              {/* Section 1: Organisation Info */}
              <section>
                <h3 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  Organisation Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Name" value={orgDetail.org.name} />
                  <DetailField label="Slug" value={orgDetail.org.slug || "—"} />
                  <DetailField label="Created" value={format(new Date(orgDetail.org.created_at), "MMM d, yyyy")} />
                  <DetailField label="Stripe Plan" value={orgDetail.org.plan_tier || "free"} />
                  <DetailField label="Subscription Status" value={orgDetail.org.subscription_status || "None"} />
                  <DetailField label="Stripe Customer" value={orgDetail.org.stripe_customer_id || "None"} />
                </div>

                {/* Members */}
                {orgDetail.members.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="h-3 w-3" /> Members ({orgDetail.members.length})
                    </div>
                    <div className="space-y-1.5">
                      {orgDetail.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between rounded-md bg-slate-800/50 border border-slate-700/40 px-3 py-2">
                          <div>
                            <span className="text-[12px] text-slate-200 font-medium">{m.full_name || m.email}</span>
                            {m.full_name && <span className="text-[11px] text-slate-500 ml-2">{m.email}</span>}
                          </div>
                          <Badge variant="secondary" className="text-[9px]">{m.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 2: Plan Override */}
              <section className="border-t border-slate-700/50 pt-6">
                <h3 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Plan Override
                </h3>

                {orgDetail.org.admin_plan_tier && orgDetail.org.admin_override_at && (
                  <div className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <span className="text-[11px] text-amber-400">
                      Override active since {format(new Date(orgDetail.org.admin_override_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Plan Tier</Label>
                    <Select value={overrideTier} onValueChange={setOverrideTier}>
                      <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="none" className="text-slate-200">No override (use Stripe plan)</SelectItem>
                        {PLAN_TIERS.map((t) => (
                          <SelectItem key={t} value={t} className="text-slate-200 capitalize">{PLAN_CONFIGS[t].name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Admin Notes</Label>
                    <Textarea
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder="e.g. Beta tester - free firm access until March 2026"
                      className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-[60px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSavePlanTier}
                      disabled={savingTier}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {savingTier ? "Saving..." : "Save Plan Override"}
                    </Button>
                    {orgDetail.org.admin_plan_tier && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOverrideTier("none");
                          setOverrideNotes("");
                        }}
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        Remove Override
                      </Button>
                    )}
                  </div>
                </div>
              </section>

              {/* Section 3: Permission Overrides */}
              <section className="border-t border-slate-700/50 pt-6">
                <h3 className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Permission Overrides
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Override individual permissions for this org. Overridden values take precedence over the plan defaults.
                </p>

                <div className="space-y-2">
                  {PERMISSION_KEYS.map((key) => {
                    const hasOverride = permEdits[key] !== undefined && permEdits[key] !== null;
                    const planDefault = (effectiveLimits as any)[key];
                    const planDefaultStr = String(planDefault);

                    return (
                      <div
                        key={key}
                        className={`rounded-lg border px-3 py-2.5 transition-colors ${
                          hasOverride
                            ? "border-l-2 border-l-violet-500 border-slate-700/60 bg-violet-500/5"
                            : "border-slate-700/40 bg-slate-800/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-medium text-slate-200">
                              {FEATURE_LABELS[key] || key}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Plan default: <span className="text-slate-400">{planDefault === -1 ? "Unlimited" : planDefaultStr}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Render appropriate control */}
                            {BOOLEAN_PERMISSIONS.includes(key) && (
                              <Switch
                                checked={hasOverride ? permEdits[key] === "true" : !!planDefault}
                                onCheckedChange={(checked) => {
                                  setPermEdits((prev) => ({ ...prev, [key]: checked ? "true" : "false" }));
                                }}
                                className="data-[state=checked]:bg-violet-600"
                              />
                            )}

                            {ENUM_PERMISSIONS[key] && (
                              <Select
                                value={hasOverride ? (permEdits[key] ?? "") : planDefaultStr}
                                onValueChange={(val) => {
                                  setPermEdits((prev) => ({ ...prev, [key]: val }));
                                }}
                              >
                                <SelectTrigger className="w-[140px] h-8 text-[11px] bg-slate-800 border-slate-700 text-slate-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {ENUM_PERMISSIONS[key].map((v) => (
                                    <SelectItem key={v} value={v} className="text-slate-200 text-[11px]">{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {NUMERIC_PERMISSIONS.includes(key) && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={
                                    hasOverride
                                      ? (permEdits[key] === "-1" ? "" : permEdits[key] ?? "")
                                      : (planDefault === -1 ? "" : String(planDefault))
                                  }
                                  onChange={(e) => {
                                    setPermEdits((prev) => ({ ...prev, [key]: e.target.value || "0" }));
                                  }}
                                  disabled={hasOverride && permEdits[key] === "-1"}
                                  className="w-[80px] h-8 text-[11px] bg-slate-800 border-slate-700 text-slate-200"
                                  min={0}
                                />
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    checked={hasOverride ? permEdits[key] === "-1" : planDefault === -1}
                                    onCheckedChange={(checked) => {
                                      setPermEdits((prev) => ({
                                        ...prev,
                                        [key]: checked ? "-1" : String(planDefault === -1 ? 10 : planDefault),
                                      }));
                                    }}
                                    className="border-slate-600"
                                  />
                                  <span className="text-[10px] text-slate-500">Unlimited</span>
                                </div>
                              </div>
                            )}

                            {/* Reset button */}
                            {hasOverride && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300"
                                onClick={() => resetPermission(key)}
                                title="Reset to plan default"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                >
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
