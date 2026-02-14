import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Search, Ban, RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

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

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_colour: string | null;
  plan_tier: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: string | null;
  current_period_end: string | null;
  created_at: string;
  grace_period_ends_at: string | null;
  memberCount: number;
  assessmentCount: number;
}

const AdminOrganisations = () => {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<OrgRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    setLoading(true);

    const { data: rawOrgs } = await supabase
      .from("organisations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!rawOrgs) {
      setOrgs([]);
      setLoading(false);
      return;
    }

    // Get member counts
    const { data: memberCounts } = await supabase
      .from("profiles")
      .select("org_id");

    // Get assessment counts
    const { data: assessmentCounts } = await supabase
      .from("assessments")
      .select("id, org_id");

    const memberMap: Record<string, number> = {};
    (memberCounts ?? []).forEach((p: any) => {
      if (p.org_id) {
        memberMap[p.org_id] = (memberMap[p.org_id] || 0) + 1;
      }
    });

    const assessmentMap: Record<string, number> = {};
    (assessmentCounts ?? []).forEach((a: any) => {
      if (a.org_id) {
        assessmentMap[a.org_id] = (assessmentMap[a.org_id] || 0) + 1;
      }
    });

    const enriched: OrgRow[] = rawOrgs.map((org: any) => ({
      ...org,
      memberCount: memberMap[org.id] || 0,
      assessmentCount: assessmentMap[org.id] || 0,
    }));

    setOrgs(enriched);
    setLoading(false);
  };

  const filteredOrgs = useMemo(
    () =>
      orgs.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
      ),
    [orgs, search]
  );

  const handleSuspend = async (org: OrgRow) => {
    const { error } = await supabase
      .from("organisations")
      .update({ plan_tier: "suspended" })
      .eq("id", org.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Organisation suspended", description: `${org.name} has been suspended.` });
    fetchOrganisations();
  };

  const handleRestore = async (org: OrgRow) => {
    const { error } = await supabase
      .from("organisations")
      .update({ plan_tier: "free" })
      .eq("id", org.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Organisation restored", description: `${org.name} has been restored to free plan.` });
    fetchOrganisations();
  };

  const openOrgDetail = (org: OrgRow) => {
    setSelectedOrg(org);
    setSheetOpen(true);
  };

  const planBadgeVariant = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "suspended":
        return "destructive";
      case "free":
        return "secondary";
      case "enterprise":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
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
              {orgs.length} total organisations on the platform.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
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

      {/* Table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Organisation
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Plan
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Members
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Assessments
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Created
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrgs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-slate-500"
                    >
                      {search
                        ? "No organisations match your search."
                        : "No organisations found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrgs.map((org) => (
                    <TableRow
                      key={org.id}
                      className="border-slate-700/30 hover:bg-slate-800/40 cursor-pointer"
                      onClick={() => openOrgDetail(org)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt=""
                              className="h-8 w-8 rounded-lg object-contain ring-1 ring-slate-700"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                              <Building2 className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-[13px] font-medium text-slate-200">
                              {org.name}
                            </div>
                            <div className="text-[11px] text-slate-500">{org.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planBadgeVariant(org.plan_tier)} className="text-[10px]">
                          {org.plan_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[13px] text-slate-300 tabular-nums">
                        {org.memberCount}
                      </TableCell>
                      <TableCell className="text-right text-[13px] text-slate-300 tabular-nums">
                        {org.assessmentCount}
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-slate-500">
                        {format(new Date(org.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            onClick={() => openOrgDetail(org)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {org.plan_tier === "suspended" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => handleRestore(org)}
                              title="Restore"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Suspend"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-900 border-slate-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-slate-200">
                                    Suspend {org.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    This will set the organisation's plan to "suspended" and
                                    restrict their access. You can restore them later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleSuspend(org)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Suspend
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Org Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-700 text-slate-200 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100 flex items-center gap-3">
              {selectedOrg?.logo_url ? (
                <img
                  src={selectedOrg.logo_url}
                  alt=""
                  className="h-10 w-10 rounded-lg object-contain ring-1 ring-slate-700"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
              )}
              {selectedOrg?.name}
            </SheetTitle>
          </SheetHeader>

          {selectedOrg && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Slug" value={selectedOrg.slug} />
                <DetailField label="Plan" value={selectedOrg.plan_tier} />
                <DetailField label="Members" value={String(selectedOrg.memberCount)} />
                <DetailField label="Assessments" value={String(selectedOrg.assessmentCount)} />
                <DetailField
                  label="Created"
                  value={format(new Date(selectedOrg.created_at), "MMM d, yyyy")}
                />
                <DetailField
                  label="Subscription Status"
                  value={selectedOrg.subscription_status || "None"}
                />
                <DetailField
                  label="Stripe Customer"
                  value={selectedOrg.stripe_customer_id || "None"}
                />
                <DetailField
                  label="Current Period End"
                  value={
                    selectedOrg.current_period_end
                      ? format(new Date(selectedOrg.current_period_end), "MMM d, yyyy")
                      : "N/A"
                  }
                />
                {selectedOrg.primary_colour && (
                  <DetailField label="Primary Colour" value={selectedOrg.primary_colour} />
                )}
                {selectedOrg.grace_period_ends_at && (
                  <DetailField
                    label="Grace Period Ends"
                    value={format(
                      new Date(selectedOrg.grace_period_ends_at),
                      "MMM d, yyyy"
                    )}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                {selectedOrg.plan_tier === "suspended" ? (
                  <Button
                    onClick={() => {
                      handleRestore(selectedOrg);
                      setSheetOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore Organisation
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleSuspend(selectedOrg);
                      setSheetOpen(false);
                    }}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend Organisation
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[13px] text-slate-200 font-medium">{value}</div>
    </div>
  );
}

export default AdminOrganisations;
