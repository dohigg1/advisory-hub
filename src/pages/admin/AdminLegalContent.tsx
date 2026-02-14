import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Check, Eye } from "lucide-react";
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

const DOCUMENT_TYPES = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "acceptable_use", label: "Acceptable Use" },
  { key: "cookie", label: "Cookie Policy" },
];

interface LegalDocument {
  id: string;
  type: string;
  version: number;
  title: string;
  content_md: string;
  effective_date: string;
  is_current: boolean;
  created_at: string;
  created_by: string | null;
}

const AdminLegalContent = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("terms");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<LegalDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formEffectiveDate, setFormEffectiveDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [formIsCurrent, setFormIsCurrent] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("legal_documents")
      .select("*")
      .order("version", { ascending: false });
    setDocuments((data as LegalDocument[]) ?? []);
    setLoading(false);
  };

  const docsForType = (type: string) =>
    documents.filter((d) => d.type === type);

  const currentDoc = (type: string) =>
    documents.find((d) => d.type === type && d.is_current);

  const openCreateDialog = () => {
    const existing = docsForType(activeTab);
    const nextVersion = existing.length > 0 ? Math.max(...existing.map((d) => d.version)) + 1 : 1;
    const typeLabel = DOCUMENT_TYPES.find((t) => t.key === activeTab)?.label ?? activeTab;

    setFormTitle(`${typeLabel} v${nextVersion}`);
    setFormContent("");
    setFormEffectiveDate(format(new Date(), "yyyy-MM-dd"));
    setFormIsCurrent(true);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    const existing = docsForType(activeTab);
    const nextVersion =
      existing.length > 0 ? Math.max(...existing.map((d) => d.version)) + 1 : 1;

    // If marking as current, unmark old current first
    if (formIsCurrent) {
      const currentDoc = existing.find((d) => d.is_current);
      if (currentDoc) {
        await (supabase as any)
          .from("legal_documents")
          .update({ is_current: false })
          .eq("id", currentDoc.id);
      }
    }

    const { error } = await (supabase as any).from("legal_documents").insert({
      type: activeTab,
      version: nextVersion,
      title: formTitle.trim(),
      content_md: formContent.trim(),
      effective_date: formEffectiveDate,
      is_current: formIsCurrent,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Document created", description: `${formTitle} has been published.` });
    setDialogOpen(false);
    fetchDocuments();
  };

  const handleToggleCurrent = async (doc: LegalDocument) => {
    if (doc.is_current) {
      // Unmark
      await (supabase as any)
        .from("legal_documents")
        .update({ is_current: false })
        .eq("id", doc.id);
    } else {
      // Unmark the current one for this type, then mark this one
      const existing = docsForType(doc.type).find((d) => d.is_current);
      if (existing) {
        await (supabase as any)
          .from("legal_documents")
          .update({ is_current: false })
          .eq("id", existing.id);
      }
      await (supabase as any)
        .from("legal_documents")
        .update({ is_current: true })
        .eq("id", doc.id);
    }

    fetchDocuments();
  };

  const openPreview = (doc: LegalDocument) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Loading legal documents...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Legal Content</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage versioned legal documents for the platform.
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Version
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-slate-800/60 border border-slate-700/50">
            {DOCUMENT_TYPES.map((dt) => (
              <TabsTrigger
                key={dt.key}
                value={dt.key}
                className="text-slate-400 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-xs"
              >
                {dt.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DOCUMENT_TYPES.map((dt) => {
            const docs = docsForType(dt.key);
            const current = currentDoc(dt.key);

            return (
              <TabsContent key={dt.key} value={dt.key} className="mt-4 space-y-4">
                {/* Current version card */}
                {current && (
                  <Card className="bg-slate-900/80 border-amber-500/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-[13px] font-semibold text-slate-200 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          Current Version
                        </CardTitle>
                        <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px]">
                          v{current.version}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-[13px] font-medium text-slate-200">
                          {current.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Effective: {format(new Date(current.effective_date), "MMM d, yyyy")} |
                          Created: {format(new Date(current.created_at), "MMM d, yyyy HH:mm")}
                        </div>
                        <div className="text-[12px] text-slate-400 bg-slate-800/60 rounded-md px-3 py-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {current.content_md.slice(0, 500)}
                          {current.content_md.length > 500 ? "..." : ""}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-slate-200 text-xs"
                          onClick={() => openPreview(current)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          View Full Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Version history */}
                <Card className="bg-slate-900/80 border-slate-700/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[13px] font-semibold text-slate-200 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                      Version History ({docs.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-transparent">
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Version
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Title
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Effective Date
                          </TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                            Current
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
                        {docs.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-slate-500"
                            >
                              No versions yet. Click "New Version" to create one.
                            </TableCell>
                          </TableRow>
                        ) : (
                          docs.map((doc) => (
                            <TableRow
                              key={doc.id}
                              className="border-slate-700/30 hover:bg-slate-800/40"
                            >
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-slate-600 text-slate-300 tabular-nums"
                                >
                                  v{doc.version}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-[13px] font-medium text-slate-200">
                                {doc.title}
                              </TableCell>
                              <TableCell className="text-[12px] text-slate-400">
                                {format(new Date(doc.effective_date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={doc.is_current}
                                  onCheckedChange={() => handleToggleCurrent(doc)}
                                  className="data-[state=checked]:bg-amber-500"
                                />
                              </TableCell>
                              <TableCell className="text-right text-[11px] text-slate-500">
                                {format(new Date(doc.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                  onClick={() => openPreview(doc)}
                                  title="View"
                                >
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
              </TabsContent>
            );
          })}
        </Tabs>
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Create New Version -{" "}
              {DOCUMENT_TYPES.find((t) => t.key === activeTab)?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Title</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-xs">Effective Date</Label>
                <Input
                  type="date"
                  value={formEffectiveDate}
                  onChange={(e) => setFormEffectiveDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200"
                />
              </div>
              <div className="flex items-end pb-1">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formIsCurrent}
                    onCheckedChange={setFormIsCurrent}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <Label className="text-slate-300 text-xs">Set as current version</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-xs">Content (Markdown)</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Enter legal document content in Markdown format..."
                rows={12}
                className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 resize-none font-mono text-xs"
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
              onClick={handleCreate}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
            >
              Publish Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              {previewDoc?.title}
              {previewDoc?.is_current && (
                <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[10px] ml-2">
                  Current
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="text-[11px] text-slate-500 -mt-2">
            Version {previewDoc?.version} | Effective:{" "}
            {previewDoc
              ? format(new Date(previewDoc.effective_date), "MMM d, yyyy")
              : ""}
          </div>
          <div className="mt-2 bg-slate-800/60 rounded-lg p-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-[13px] text-slate-300 leading-relaxed font-mono">
            {previewDoc?.content_md}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminLegalContent;
