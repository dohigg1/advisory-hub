import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export function OrgSettings() {
  const { organisation, refreshProfile } = useAuth();
  const [name, setName] = useState(organisation?.name ?? "");
  const [primaryColour, setPrimaryColour] = useState(organisation?.primary_colour ?? "#1B3A5C");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!organisation) return;
    setSaving(true);
    const { error } = await supabase
      .from("organisations")
      .update({ name, primary_colour: primaryColour })
      .eq("id", organisation.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Organisation updated");
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!organisation) return;
    const file = e.target.files?.[0];
    if (!file) return;

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

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Organisation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Logo</Label>
          <div className="flex items-center gap-4">
            {organisation?.logo_url ? (
              <img src={organisation.logo_url} alt="" className="h-12 w-12 object-contain border" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center border border-dashed text-muted-foreground">
                <Upload className="h-4 w-4" />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleLogoUpload} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Brand colour</Label>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 border" style={{ backgroundColor: primaryColour }} />
            <Input value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} className="w-32" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
