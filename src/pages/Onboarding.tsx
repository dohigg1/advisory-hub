import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart3, Upload } from "lucide-react";

const BRAND_COLOURS = [
  "#1B3A5C", "#2C5282", "#1A365D", "#2B6CB0",
  "#234E6F", "#3182CE", "#1E3A5F", "#4A90D9",
];

const Onboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [primaryColour, setPrimaryColour] = useState("#1B3A5C");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Create organisation
      const { data: org, error: orgError } = await supabase
        .from("organisations")
        .insert({ name: orgName, primary_colour: primaryColour })
        .select()
        .single();

      if (orgError) throw orgError;

      // Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile && org) {
        const ext = logoFile.name.split(".").pop();
        const path = `${org.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("org-logos")
          .upload(path, logoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("org-logos").getPublicUrl(path);
          logoUrl = urlData.publicUrl;
          await supabase.from("organisations").update({ logo_url: logoUrl }).eq("id", org.id);
        }
      }

      // Link profile to organisation with admin role
      await supabase
        .from("profiles")
        .update({ org_id: org.id, role: "admin" })
        .eq("auth_user_id", user.id);

      await refreshProfile();
      toast.success("Organisation created!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organisation");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center bg-primary">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Set up your organisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure your firm's workspace</p>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Organisation details</CardTitle>
            <CardDescription>This can be changed later in Settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="orgName" className="text-xs font-medium">Organisation name</Label>
                <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Consulting" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Logo (optional)</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain border" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border border-dashed text-muted-foreground">
                      <Upload className="h-4 w-4" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleLogoChange} className="flex-1" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Brand colour</Label>
                <div className="flex gap-2">
                  {BRAND_COLOURS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColour(c)}
                      className={`h-8 w-8 border-2 transition-all ${primaryColour === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Input type="text" value={primaryColour} onChange={(e) => setPrimaryColour(e.target.value)} placeholder="#1B3A5C" className="mt-2" />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create organisation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
