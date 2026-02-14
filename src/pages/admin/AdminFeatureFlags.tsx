import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, ToggleRight, Building2 } from "lucide-react";
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

interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  global_enabled: boolean;
  rollout_percentage: number;
  created_at: string;
  updated_at: string;
}

interface FlagOverride {
  id: string;
  flag_id: string;
  org_id: string;
  enabled: boolean;
  created_at: string;
  org_name?: string;
}

interface OrgOption {
  id: string;
  name: string;
}

const AdminFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEnabled, setFormEnabled] = useState(false);
  const [formRollout, setFormRollout] = useState("0");

  // Overrides
  const [overridesSheetOpen, setOverridesSheetOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [overrides, setOverrides] = useState<FlagOverride[]>([]);
  const [allOrgs, setAllOrgs] = useState<OrgOption[]>([]);
  const [newOverrideOrgId, setNewOverrideOrgId] = useState("");
  const [newOverrideEnabled, setNewOverrideEnabled] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchFlags();
    fetchOrgs();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });
    setFlags((data as FeatureFlag[]) ?? []);
    setLoading(false);
  };

  const fetchOrgs = async () => {
    const { data } = await supabase
      .from("organisations")
      .select("id, name")
      .order("name", { ascending: true });
    setAllOrgs((data as OrgOption[]) ?? []);
  };

  const openCreateDialog = () => {
    setEditingFlag(null);
    setFormName("");
    setFormDescription("");
    setFormEnabled(false);
    setFormRollout("0");
    setDialogOpen(true);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormName(flag.name);
    setFormDescription(flag.description ?? "");
    setFormEnabled(flag.global_enabled);
    setFormRollout(String(flag.rollout_percentage));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "Error", description: "Flag name is required.", variant: "destructive" });
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      global_enabled: formEnabled,
      rollout_percentage: Math.min(100, Math.max(0, parseInt(formRollout) || 0)),
    };

    if (editingFlag) {
      const { error } = await supabase
        .from("feature_flags")
        .update(payload)
        .eq("id", editingFlag.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Flag updated", description: `${payload.name} has been updated.` });
    } else {
      const { error } = await supabase.from("feature_flags").insert(payload);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Flag created", description: `${payload.name} has been created.` });
    }

    setDialogOpen(false);
    fetchFlags();
  };

  const handleDelete = async (flag: FeatureFlag) => {
    const { error } = await supabase.from("feature_flags").delete().eq("id", flag.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Flag deleted", description: `${flag.name} has been deleted.` });
    fetchFlags();
  };

  const handleToggleEnabled = async (flag: FeatureFlag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ global_enabled: !flag.global_enabled })
      .eq("id", flag.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchFlags();
  };

  // Overrides
  const openOverrides = async (flag: FeatureFlag) => {
    setSelectedFlag(flag);
    setOverridesSheetOpen(true);
    setNewOverrideOrgId("");
    setNewOverrideEnabled(true);
    await fetchOverrides(flag.id);
  };

  const fetchOverrides = async (flagId: string) => {
    const { data } = await supabase
      .from("feature_flag_overrides")
      .select("*")
      .eq("flag_id", flagId)
      .order("created_at", { ascending: false });

    const enriched: FlagOverride[] = (data ?? []).map((o: any) => ({
      ...o,
      org_name: allOrgs.find((org) => org.id === o.org_id)?.name ?? "Unknown",
    }));

    setOverrides(enriched);
  };

  const handleAddOverride = async () => {
    if (!selectedFlag || !newOverrideOrgId) return;

    const { error } = await supabase.from("feature_flag_overrides").insert({
      flag_id: selectedFlag.id,
      org_id: newOverrideOrgId,
      enabled: newOverrideEnabled,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Override added" });
    setNewOverrideOrgId("");
    fetchOverrides(selectedFlag.id);
  };

  const handleDeleteOverride = async (overrideId: string) => {
    if (!selectedFlag) return;
    const { error } = await supabase
      .from("feature_flag_overrides")
      .delete()
      .eq("id", overrideId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Override removed" });
    fetchOverrides(selectedFlag.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading feature flags...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Feature Flags</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage platform-wide feature toggles and per-org overrides.
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Flag
          </Button>
        </div>
      </motion.div>

      {/* Flags table */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Name
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                    Enabled
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Rollout %
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Updated
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No feature flags yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  flags.map((flag) => (
                    <TableRow key={flag.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="text-[13px] font-medium text-slate-200">{flag.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[12px] text-slate-400 max-w-xs truncate">
                          {flag.description || "--"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={flag.global_enabled}
                          onCheckedChange={() => handleToggleEnabled(flag)}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-slate-600 text-slate-300 tabular-nums"
                        >
                          {flag.rollout_percentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-slate-500">
                        {format(new Date(flag.updated_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            onClick={() => openOverrides(flag)}
                            title="Org Overrides"
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                            onClick={() => openEditDialog(flag)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-200">
                                  Delete "{flag.name}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  This will permanently delete this feature flag and all its
                                  per-org overrides. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(flag)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editingFlag ? "Edit Feature Flag" : "Create Feature Flag"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. enable_ai_scoring"
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What does this flag control?"
                rows={3}
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300 text-xs">Globally Enabled</Label>
              <Switch
                checked={formEnabled}
                onCheckedChange={setFormEnabled}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Rollout Percentage</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={formRollout}
                onChange={(e) => setFormRollout(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-200 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              {editingFlag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overrides Sheet */}
      <Sheet open={overridesSheetOpen} onOpenChange={setOverridesSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-700 text-slate-200 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100">
              Overrides for "{selectedFlag?.name}"
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="text-xs text-slate-400">
              Per-org overrides take precedence over the global flag setting.
            </div>

            {/* Add override */}
            <Card className="bg-slate-800/60 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-[13px] font-semibold text-slate-200">
                  Add Override
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Organisation</Label>
                  <select
                    value={newOverrideOrgId}
                    onChange={(e) => setNewOverrideOrgId(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">Select organisation...</option>
                    {allOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400 text-xs">Enabled for this org</Label>
                  <Switch
                    checked={newOverrideEnabled}
                    onCheckedChange={setNewOverrideEnabled}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                <Button
                  onClick={handleAddOverride}
                  disabled={!newOverrideOrgId}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add Override
                </Button>
              </CardContent>
            </Card>

            {/* Existing overrides */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Current Overrides ({overrides.length})
              </div>
              {overrides.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">
                  No org-specific overrides for this flag.
                </div>
              ) : (
                <div className="space-y-2">
                  {overrides.map((override) => (
                    <div
                      key={override.id}
                      className="flex items-center justify-between rounded-lg bg-slate-800/60 border border-slate-700/40 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-700/60">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-slate-200">
                            {override.org_name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {override.enabled ? "Enabled" : "Disabled"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={override.enabled ? "default" : "secondary"}
                          className={
                            override.enabled
                              ? "bg-emerald-500/15 text-emerald-400 border-0 text-[10px]"
                              : "bg-slate-700 text-slate-400 border-0 text-[10px]"
                          }
                        >
                          {override.enabled ? "ON" : "OFF"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleDeleteOverride(override.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default AdminFeatureFlags;
