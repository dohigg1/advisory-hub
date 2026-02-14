import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Palette, Upload, Loader2, Lock } from "lucide-react";

const FONT_OPTIONS = ["Inter", "DM Sans", "Poppins", "Manrope", "Outfit", "Plus Jakarta Sans", "Space Grotesk", "Geist"];

interface BrandTheme {
  primary_colour: string;
  secondary_colour: string;
  accent_colour: string;
  background_colour: string;
  text_colour: string;
  font_heading: string;
  font_body: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
}

const defaults: BrandTheme = {
  primary_colour: "#1B3A5C",
  secondary_colour: "#4A90D9",
  accent_colour: "#6366F1",
  background_colour: "#FFFFFF",
  text_colour: "#1A1A2E",
  font_heading: "Inter",
  font_body: "Inter",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
};

export function BrandingSettings() {
  const { organisation } = useAuth();
  const { isFeatureEnabled } = usePlanLimits();
  const [theme, setTheme] = useState<BrandTheme>(defaults);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const canCustomize = isFeatureEnabled("remove_branding");

  useEffect(() => {
    if (!organisation) return;
    (async () => {
      const { data } = await supabase
        .from("brand_themes")
        .select("*")
        .eq("org_id", organisation.id)
        .single();
      if (data) {
        setTheme({
          primary_colour: data.primary_colour || defaults.primary_colour,
          secondary_colour: data.secondary_colour || defaults.secondary_colour,
          accent_colour: data.accent_colour || defaults.accent_colour,
          background_colour: data.background_colour || defaults.background_colour,
          text_colour: data.text_colour || defaults.text_colour,
          font_heading: data.font_heading || defaults.font_heading,
          font_body: data.font_body || defaults.font_body,
          logo_url: data.logo_url,
          logo_dark_url: data.logo_dark_url,
          favicon_url: data.favicon_url,
        });
      }
      setLoading(false);
    })();
  }, [organisation]);

  const update = (key: keyof BrandTheme, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!organisation) return;
    setSaving(true);
    const { error } = await supabase
      .from("brand_themes")
      .upsert({
        org_id: organisation.id,
        ...theme,
      }, { onConflict: "org_id" });

    if (error) toast.error(error.message);
    else toast.success("Brand theme saved");
    setSaving(false);
  };

  const handleFileUpload = async (field: "logo_url" | "logo_dark_url" | "favicon_url", file: File) => {
    if (!organisation) return;
    setUploading(field);
    const ext = file.name.split(".").pop();
    const path = `${organisation.id}/${field}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("org-logos")
      .upload(path, file, { upsert: true });

    if (upErr) {
      toast.error(upErr.message);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("org-logos").getPublicUrl(path);
    update(field, publicUrl);
    setUploading(null);
    toast.success("File uploaded");
  };

  if (loading) {
    return <div className="flex justify-center py-10"><div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {!canCustomize && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/60 text-[12px] text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0" />
            Custom branding requires a Professional plan or higher.
          </div>
        )}

        {/* Colors */}
        <Card className="shadow-soft-xs border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-accent" /> Brand Colours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                ["primary_colour", "Primary"],
                ["secondary_colour", "Secondary"],
                ["accent_colour", "Accent"],
                ["text_colour", "Text"],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">{label}</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme[key] as string}
                      onChange={e => update(key, e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                      disabled={!canCustomize}
                    />
                    <Input
                      value={theme[key] as string}
                      onChange={e => update(key, e.target.value)}
                      className="flex-1 text-[12px] font-mono"
                      disabled={!canCustomize}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fonts */}
        <Card className="shadow-soft-xs border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Typography</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {([["font_heading", "Heading Font"], ["font_body", "Body Font"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">{label}</Label>
                <Select value={theme[key] as string} onValueChange={v => update(key, v)} disabled={!canCustomize}>
                  <SelectTrigger className="text-[12px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logos */}
        <Card className="shadow-soft-xs border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Logos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([["logo_url", "Logo (light bg)"], ["logo_dark_url", "Logo (dark bg)"], ["favicon_url", "Favicon"]] as const).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground">{label}</Label>
                <div className="flex items-center gap-3">
                  {theme[key] && (
                    <img src={theme[key]!} alt={label} className="h-8 w-8 rounded object-contain bg-muted/40 p-0.5" />
                  )}
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border cursor-pointer hover:bg-muted/60 transition-colors ${!canCustomize ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(key, file);
                      }}
                      disabled={!canCustomize}
                    />
                  </label>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving || !canCustomize} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Save Brand Theme"}
        </Button>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block">
        <Card className="shadow-soft-xs border-border/60 sticky top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: theme.background_colour }}>
              <div className="p-3" style={{ backgroundColor: theme.primary_colour }}>
                <div className="flex items-center gap-2">
                  {theme.logo_url ? (
                    <img src={theme.logo_url} alt="Logo" className="h-5 w-5 object-contain" />
                  ) : (
                    <div className="h-5 w-5 rounded bg-white/20" />
                  )}
                  <span className="text-[11px] font-semibold text-white" style={{ fontFamily: theme.font_heading }}>Your Brand</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-[14px] font-bold" style={{ color: theme.text_colour, fontFamily: theme.font_heading }}>Assessment Title</h3>
                <p className="text-[11px] opacity-70" style={{ color: theme.text_colour, fontFamily: theme.font_body }}>
                  This is how your assessment pages will look with your brand theme applied.
                </p>
                <div className="h-8 rounded-md flex items-center justify-center text-[11px] text-white font-medium" style={{ backgroundColor: theme.accent_colour }}>
                  Start Assessment
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
