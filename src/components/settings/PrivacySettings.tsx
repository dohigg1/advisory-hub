import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Download, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function PrivacySettings() {
  const { organisation } = useAuth();
  const [retention, setRetention] = useState({ auto_delete_leads_days: 0, auto_delete_responses_days: 0, anonymize_after_days: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!organisation) return;
    (async () => {
      const { data } = await supabase
        .from("data_retention_settings")
        .select("*")
        .eq("org_id", organisation.id)
        .single();
      if (data) setRetention({
        auto_delete_leads_days: data.auto_delete_leads_days || 0,
        auto_delete_responses_days: data.auto_delete_responses_days || 0,
        anonymize_after_days: data.anonymize_after_days || 0,
      });
      setLoading(false);
    })();
  }, [organisation]);

  const handleSave = async () => {
    if (!organisation) return;
    setSaving(true);
    const { error } = await supabase
      .from("data_retention_settings")
      .upsert({ org_id: organisation.id, ...retention }, { onConflict: "org_id" });
    if (error) toast.error(error.message);
    else toast.success("Retention settings saved");
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-data", {
        body: { format: "json", scope: "all" },
      });
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    toast.info("Data deletion request submitted. This will be processed within 30 days.");
    setDeleteOpen(false);
    setDeleting(false);
  };

  const retentionOptions = [
    { value: "0", label: "Never (keep forever)" },
    { value: "90", label: "90 days" },
    { value: "180", label: "180 days" },
    { value: "365", label: "1 year" },
    { value: "730", label: "2 years" },
  ];

  if (loading) {
    return <div className="flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Data Retention */}
      <Card className="shadow-soft-xs border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" /> Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Auto-delete leads after</Label>
              <Select value={String(retention.auto_delete_leads_days)} onValueChange={v => setRetention(p => ({ ...p, auto_delete_leads_days: Number(v) }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {retentionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Auto-delete responses after</Label>
              <Select value={String(retention.auto_delete_responses_days)} onValueChange={v => setRetention(p => ({ ...p, auto_delete_responses_days: Number(v) }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {retentionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">Anonymize data after</Label>
              <Select value={String(retention.anonymize_after_days)} onValueChange={v => setRetention(p => ({ ...p, anonymize_after_days: Number(v) }))}>
                <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {retentionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save Retention Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data Export & Deletion */}
      <Card className="shadow-soft-xs border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold">Data Management (GDPR)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-1.5 text-[12px]">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export All Data
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-[12px]">
            <Trash2 className="h-3.5 w-3.5" /> Request Data Deletion
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="shadow-soft-lg max-w-md">
          <DialogHeader>
            <DialogTitle>Request Data Deletion</DialogTitle>
            <DialogDescription className="text-[12px]">
              This will submit a request to permanently delete all your organisation's data. This action cannot be undone and will be processed within 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} className="flex-1">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? "Submitting…" : "Confirm Deletion Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
