import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, AlertTriangle, Download, Trash2 } from "lucide-react";

export function OrgSettings() {
  const { organisation, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(organisation?.name ?? "");
  const [primaryColour, setPrimaryColour] = useState(organisation?.primary_colour ?? "#1B3A5C");
  const [domain, setDomain] = useState((organisation as any)?.domain ?? "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSave = async () => {
    if (!organisation) return;
    setSaving(true);
    const { error } = await supabase
      .from("organisations")
      .update({ name, primary_colour: primaryColour, domain: domain || null } as any)
      .eq("id", organisation.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Organisation updated");

      // Audit log
      await supabase.from("audit_log").insert({
        org_id: organisation.id,
        action: "org_updated",
        target_type: "organisation",
        target_id: organisation.id,
        metadata_json: { name, primary_colour: primaryColour },
      } as any);

      await refreshProfile();
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!organisation) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${organisation.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      return;
    }

    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    await supabase.from("organisations").update({ logo_url: data.publicUrl }).eq("id", organisation.id);
    toast.success("Logo updated");
    await refreshProfile();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-data");
      if (error) throw error;

      // Download each CSV
      for (const [tableName, csvContent] of Object.entries(data as Record<string, string>)) {
        if (!csvContent) continue;
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!organisation || deleteConfirm !== organisation.name) return;
    setDeleting(true);
    try {
      // Soft delete - set deleted_at
      await supabase
        .from("organisations")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", organisation.id);

      await supabase.from("audit_log").insert({
        org_id: organisation.id,
        action: "account_deleted",
        target_type: "organisation",
        target_id: organisation.id,
      } as any);

      toast.success("Organisation scheduled for deletion. Data will be purged after 30 days.");
      await signOut();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete organisation");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <CardTitle className="text-[14px] font-semibold tracking-tight">Organisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">Logo</Label>
            <div className="flex items-center gap-4">
              {organisation?.logo_url ? (
                <img src={organisation.logo_url} alt="" className="h-12 w-12 object-contain rounded-lg border" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center border border-dashed rounded-lg text-muted-foreground">
                  <Upload className="h-4 w-4" />
                </div>
              )}
              <div>
                <Input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="text-[12px]" />
                <p className="text-[11px] text-muted-foreground mt-1">Max 2MB. PNG, JPG, or SVG.</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">Brand colour</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} className="h-8 w-8 rounded border cursor-pointer" />
              <Input value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} className="w-32 text-[13px]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-muted-foreground">Custom domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="assessments.yourfirm.com" className="text-[13px]" />
            {domain && (
              <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2 space-y-1">
                <p className="font-medium">DNS Setup Instructions:</p>
                <p>Add a CNAME record pointing <span className="font-mono text-foreground">{domain}</span> to your assessment URL.</p>
                <p>CNAME → <span className="font-mono text-foreground">assessments.advisoryscore.com</span></p>
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="h-9 text-[13px]">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-soft-sm border-destructive/30">
        <CardHeader>
          <CardTitle className="text-[14px] font-semibold tracking-tight text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-medium">Export all data</p>
              <p className="text-[11px] text-muted-foreground">Download all organisation data as CSV files</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] font-medium text-destructive">Delete organisation</p>
              <p className="text-[11px] text-muted-foreground">Permanently delete your organisation and all data. This action is irreversible after 30 days.</p>
            </div>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-8 text-[12px] gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </DialogTrigger>
              <DialogContent className="shadow-soft-lg">
                <DialogHeader>
                  <DialogTitle className="text-destructive">Delete Organisation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-[13px] text-muted-foreground">
                    This will permanently delete <strong>{organisation?.name}</strong> and all associated data including assessments, leads, and responses.
                    Your Stripe subscription will be cancelled. Data will be purged after 30 days.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">
                      Type <span className="font-mono text-foreground">{organisation?.name}</span> to confirm
                    </Label>
                    <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={organisation?.name} />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deleteConfirm !== organisation?.name || deleting}
                  >
                    {deleting ? "Deleting…" : "I understand, delete this organisation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
