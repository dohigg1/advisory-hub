import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import {
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  Star,
  Lock,
  Upload,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { TEMPLATE_FIXTURES, TEMPLATE_CATEGORY_LABELS } from "@/data/templates";
import { PLAN_CONFIGS, PLAN_TIERS } from "@/config/plans";

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

interface TemplateRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  preview_image_url: string | null;
  question_count: number;
  template_data_json: any;
  is_active: boolean;
  min_plan_tier: string | null;
  sort_order: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = Object.keys(TEMPLATE_CATEGORY_LABELS);

async function invokeAdmin(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-manage-org", {
    body: { action, params },
  });
  if (error) throw error;
  return data;
}

const tierBadgeColor = (tier: string | null) => {
  if (!tier) return "";
  switch (tier) {
    case "starter": return "border-blue-500/40 text-blue-400";
    case "professional": return "border-violet-500/40 text-violet-400";
    case "firm": return "border-amber-500/40 text-amber-400";
    default: return "border-slate-600 text-slate-400";
  }
};

const AdminTemplates = () => {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("consulting");
  const [formMinTier, setFormMinTier] = useState<string>("none");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formActive, setFormActive] = useState(true);

  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeAdmin("list_templates", { include_inactive: true });
      setTemplates(data.templates ?? []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditing(null);
    setFormTitle("");
    setFormDescription("");
    setFormCategory("consulting");
    setFormMinTier("none");
    setFormSortOrder(0);
    setFormFeatured(false);
    setFormActive(true);
    setSheetOpen(true);
  };

  const openEdit = (t: TemplateRow) => {
    setEditing(t);
    setFormTitle(t.title);
    setFormDescription(t.description || "");
    setFormCategory(t.category);
    setFormMinTier(t.min_plan_tier || "none");
    setFormSortOrder(t.sort_order);
    setFormFeatured(t.featured);
    setFormActive(t.is_active);
    setSheetOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formTitle,
        description: formDescription || null,
        category: formCategory,
        min_plan_tier: formMinTier === "none" ? null : formMinTier,
        sort_order: formSortOrder,
        featured: formFeatured,
        is_active: formActive,
      };

      if (editing) {
        await invokeAdmin("update_template", { id: editing.id, ...payload });
        toast({ title: "Template updated" });
      } else {
        await invokeAdmin("create_template", payload);
        toast({ title: "Template created" });
      }

      setSheetOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await invokeAdmin("delete_template", { id });
      toast({ title: "Template deleted" });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (t: TemplateRow) => {
    try {
      await invokeAdmin("update_template", { id: t.id, is_active: !t.is_active });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (t: TemplateRow) => {
    try {
      await invokeAdmin("update_template", { id: t.id, featured: !t.featured });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSeedFixtures = async () => {
    setSeeding(true);
    try {
      const seedData = TEMPLATE_FIXTURES.map((t, idx) => ({
        title: t.title,
        description: t.description,
        category: t.category,
        question_count: t.question_count,
        template_data_json: t.template_data_json,
        sort_order: idx,
      }));

      await invokeAdmin("seed_templates", { templates: seedData });
      toast({ title: `${seedData.length} templates seeded from fixtures` });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleSetTierInline = async (t: TemplateRow, tier: string) => {
    try {
      await invokeAdmin("update_template", {
        id: t.id,
        min_plan_tier: tier === "none" ? null : tier,
      });
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Templates</h1>
            <p className="text-sm text-slate-400 mt-1">
              {templates.length} templates &middot; Manage marketplace content and premium access
            </p>
          </div>
          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button
                onClick={handleSeedFixtures}
                disabled={seeding}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {seeding ? "Seeding..." : "Seed from Fixtures"}
              </Button>
            )}
            <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Template
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Seed prompt when empty */}
      {templates.length === 0 && (
        <motion.div variants={item}>
          <Card className="bg-slate-900/80 border-slate-700/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <LayoutTemplate className="h-10 w-10 text-slate-600 mb-3" />
              <p className="text-[14px] font-medium text-slate-300 mb-1">No templates in database</p>
              <p className="text-[12px] text-slate-500 mb-4 max-w-sm">
                Seed the 15 pre-built template fixtures to populate the marketplace, then manage them here.
              </p>
              <Button
                onClick={handleSeedFixtures}
                disabled={seeding}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                {seeding ? "Seeding..." : `Seed ${TEMPLATE_FIXTURES.length} Templates`}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Table */}
      {templates.length > 0 && (
        <motion.div variants={item}>
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Template</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Category</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Min Tier</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Questions</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id} className="border-slate-700/30 hover:bg-slate-800/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-[13px] font-medium text-slate-200 flex items-center gap-1.5">
                              {t.title}
                              {t.featured && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[300px]">
                              {t.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {TEMPLATE_CATEGORY_LABELS[t.category as keyof typeof TEMPLATE_CATEGORY_LABELS] || t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={t.min_plan_tier || "none"}
                          onValueChange={(val) => handleSetTierInline(t, val)}
                        >
                          <SelectTrigger className="w-[120px] h-7 text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="none" className="text-slate-300 text-[11px]">
                              Free (all)
                            </SelectItem>
                            {PLAN_TIERS.filter(pt => pt !== "free").map((pt) => (
                              <SelectItem key={pt} value={pt} className="text-slate-300 text-[11px] capitalize">
                                {PLAN_CONFIGS[pt].name}+
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center text-[13px] text-slate-300 tabular-nums">
                        {t.question_count}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleActive(t)}
                            title={t.is_active ? "Active" : "Inactive"}
                            className="transition-colors"
                          >
                            {t.is_active ? (
                              <Eye className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-slate-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(t)}
                            title={t.featured ? "Featured" : "Not featured"}
                            className="transition-colors"
                          >
                            <Star className={`h-4 w-4 ${t.featured ? "text-amber-400 fill-amber-400" : "text-slate-600"}`} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200"
                            onClick={() => openEdit(t)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-slate-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-slate-200">Delete "{t.title}"?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                  This will permanently remove this template from the marketplace.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(t.id)} className="bg-red-600 text-white hover:bg-red-700">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Edit / Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="bg-slate-900 border-slate-700 text-slate-200 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-slate-100">
              {editing ? "Edit Template" : "New Template"}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <div>
              <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200"
                placeholder="e.g. Digital Maturity Assessment"
              />
            </div>

            <div>
              <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200 min-h-[80px]"
                placeholder="Brief description of what this template assesses..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-slate-200 capitalize">
                        {TEMPLATE_CATEGORY_LABELS[c as keyof typeof TEMPLATE_CATEGORY_LABELS] || c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-slate-400 uppercase tracking-wider">Sort Order</Label>
                <Input
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-slate-400 uppercase tracking-wider">
                Minimum Plan Tier
              </Label>
              <p className="text-[10px] text-slate-500 mt-0.5 mb-1.5">
                Users below this tier will see a lock icon and upgrade prompt.
              </p>
              <Select value={formMinTier} onValueChange={setFormMinTier}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none" className="text-slate-200">Free (available to all)</SelectItem>
                  {PLAN_TIERS.filter(pt => pt !== "free").map((pt) => (
                    <SelectItem key={pt} value={pt} className="text-slate-200 capitalize">
                      {PLAN_CONFIGS[pt].name}+ only
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-slate-200">Featured</div>
                <div className="text-[10px] text-slate-500">Highlight in the marketplace</div>
              </div>
              <Switch checked={formFeatured} onCheckedChange={setFormFeatured} className="data-[state=checked]:bg-amber-600" />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 border border-slate-700/40 px-3 py-2.5">
              <div>
                <div className="text-[12px] font-medium text-slate-200">Active</div>
                <div className="text-[10px] text-slate-500">Visible in the marketplace</div>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} className="data-[state=checked]:bg-emerald-600" />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !formTitle.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saving ? "Saving..." : editing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default AdminTemplates;
