import { useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Palette, Type, Globe, Mail, Upload, ArrowUpRight, Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanTier } from "@/config/plans";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ColourPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

interface Typography {
  heading: string;
  body: string;
}

interface CustomElements {
  footerText: string;
  privacyUrl: string;
  termsUrl: string;
}

interface BrandingState {
  logoFile: File | null;
  logoPreview: string;
  faviconFile: File | null;
  faviconPreview: string;
  colours: ColourPalette;
  typography: Typography;
  custom: CustomElements;
}

interface PresetTheme {
  label: string;
  colours: ColourPalette;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Plus Jakarta Sans",
  "DM Sans",
  "Outfit",
  "Manrope",
] as const;

const PRESET_THEMES: PresetTheme[] = [
  {
    label: "Professional Blue",
    colours: { primary: "#1B3A5C", secondary: "#4A90D9", background: "#F8FAFC", text: "#1E293B" },
  },
  {
    label: "Modern Green",
    colours: { primary: "#166534", secondary: "#4ADE80", background: "#F0FDF4", text: "#14532D" },
  },
  {
    label: "Warm Orange",
    colours: { primary: "#9A3412", secondary: "#FB923C", background: "#FFF7ED", text: "#431407" },
  },
  {
    label: "Corporate Grey",
    colours: { primary: "#334155", secondary: "#94A3B8", background: "#F8FAFC", text: "#0F172A" },
  },
];

const INITIAL_STATE: BrandingState = {
  logoFile: null,
  logoPreview: "",
  faviconFile: null,
  faviconPreview: "",
  colours: { primary: "#1B3A5C", secondary: "#4A90D9", background: "#F8FAFC", text: "#1E293B" },
  typography: { heading: "Inter", body: "Inter" },
  custom: { footerText: "", privacyUrl: "", termsUrl: "" },
};

/* ------------------------------------------------------------------ */
/*  Upgrade prompt                                                     */
/* ------------------------------------------------------------------ */

function UpgradePrompt({ requiredTier, currentTier }: { requiredTier: PlanTier; currentTier: PlanTier }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
      <ArrowUpRight className="h-4 w-4 text-accent shrink-0" />
      <div className="flex-1">
        <p className="text-[13px] font-medium">
          Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} to unlock this feature
        </p>
        <p className="text-[11px] text-muted-foreground">
          Your current plan is <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>.
        </p>
      </div>
      <Button size="sm" className="h-8 text-[12px] gap-1.5">
        <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Colour input                                                       */
/* ------------------------------------------------------------------ */

function ColourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 rounded border cursor-pointer shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-28 text-[13px] font-mono"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BrandingSettings() {
  const planLimits = usePlanLimits();
  const [state, setState] = useState<BrandingState>(INITIAL_STATE);
  const [saving, setSaving] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainStatus, setDomainStatus] = useState<"idle" | "pending" | "verified" | "error">("idle");
  const [senderEmail, setSenderEmail] = useState("");

  const isFirm = planLimits.tier === "firm";
  const isProfessionalPlus = planLimits.tier === "professional" || isFirm;

  /* helpers */
  const setColour = (key: keyof ColourPalette, value: string) =>
    setState((s) => ({ ...s, colours: { ...s.colours, [key]: value } }));

  const setTypography = (key: keyof Typography, value: string) =>
    setState((s) => ({ ...s, typography: { ...s.typography, [key]: value } }));

  const setCustom = (key: keyof CustomElements, value: string) =>
    setState((s) => ({ ...s, custom: { ...s.custom, [key]: value } }));

  const applyPreset = (preset: PresetTheme) => {
    setState((s) => ({ ...s, colours: { ...preset.colours } }));
    toast.success(`Applied "${preset.label}" theme`);
  };

  const handleFileUpload = (field: "logoFile" | "faviconFile", previewField: "logoPreview" | "faviconPreview") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setState((s) => ({ ...s, [field]: file, [previewField]: url }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulated save
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Branding settings saved");
    setSaving(false);
  };

  const handleVerifyDomain = async () => {
    if (!customDomain) return;
    setDomainVerifying(true);
    setDomainStatus("pending");
    await new Promise((r) => setTimeout(r, 1500));
    setDomainStatus("verified");
    setDomainVerifying(false);
    toast.success("Domain verified successfully");
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Plan gate for free / starter */}
      {!isProfessionalPlus && (
        <UpgradePrompt requiredTier="professional" currentTier={planLimits.tier} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ---- Left panel: settings form ---- */}
        <div className="space-y-6">
          {/* Logo & Identity */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                <Upload className="h-4 w-4" /> Logo &amp; Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main logo */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Main logo</Label>
                <div className="flex items-center gap-4">
                  {state.logoPreview ? (
                    <img
                      src={state.logoPreview}
                      alt="Logo preview"
                      className="h-12 w-12 object-contain rounded-lg border"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center border border-dashed rounded-lg text-muted-foreground">
                      <Upload className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleFileUpload("logoFile", "logoPreview")}
                      className="text-[12px]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Max 2 MB. PNG, JPG, or SVG.</p>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Favicon</Label>
                <div className="flex items-center gap-4">
                  {state.faviconPreview ? (
                    <img
                      src={state.faviconPreview}
                      alt="Favicon preview"
                      className="h-8 w-8 object-contain rounded border"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center border border-dashed rounded text-muted-foreground">
                      <Upload className="h-3 w-3" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/png,image/x-icon,image/svg+xml"
                      onChange={handleFileUpload("faviconFile", "faviconPreview")}
                      className="text-[12px]"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">32x32 recommended. PNG, ICO, or SVG.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colour Palette */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                <Palette className="h-4 w-4" /> Colour Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Presets */}
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Preset themes</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_THEMES.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px] gap-2"
                      onClick={() => applyPreset(preset)}
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full border"
                        style={{ backgroundColor: preset.colours.primary }}
                      />
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <ColourField label="Primary" value={state.colours.primary} onChange={(v) => setColour("primary", v)} />
                <ColourField label="Secondary" value={state.colours.secondary} onChange={(v) => setColour("secondary", v)} />
                <ColourField label="Background" value={state.colours.background} onChange={(v) => setColour("background", v)} />
                <ColourField label="Text" value={state.colours.text} onChange={(v) => setColour("text", v)} />
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                <Type className="h-4 w-4" /> Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Heading font</Label>
                  <Select value={state.typography.heading} onValueChange={(v) => setTypography("heading", v)}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Body font</Label>
                  <Select value={state.typography.body} onValueChange={(v) => setTypography("body", v)}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Elements */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-tight">Custom Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Footer text</Label>
                <Input
                  value={state.custom.footerText}
                  onChange={(e) => setCustom("footerText", e.target.value)}
                  placeholder="&copy; 2026 Your Company. All rights reserved."
                  className="text-[13px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Privacy policy URL</Label>
                  <Input
                    value={state.custom.privacyUrl}
                    onChange={(e) => setCustom("privacyUrl", e.target.value)}
                    placeholder="https://yourfirm.com/privacy"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Terms of service URL</Label>
                  <Input
                    value={state.custom.termsUrl}
                    onChange={(e) => setCustom("termsUrl", e.target.value)}
                    placeholder="https://yourfirm.com/terms"
                    className="text-[13px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Domain - Firm tier only */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Custom Domain
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">Firm</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFirm ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">Domain</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={customDomain}
                        onChange={(e) => setCustomDomain(e.target.value)}
                        placeholder="assessments.yourfirm.com"
                        className="text-[13px]"
                      />
                      <Button
                        size="sm"
                        className="h-9 text-[12px] shrink-0"
                        onClick={handleVerifyDomain}
                        disabled={domainVerifying || !customDomain}
                      >
                        {domainVerifying ? "Verifying..." : "Verify Domain"}
                      </Button>
                    </div>
                  </div>

                  {/* Status indicator */}
                  {domainStatus !== "idle" && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          domainStatus === "verified"
                            ? "bg-emerald-500"
                            : domainStatus === "pending"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-destructive"
                        }`}
                      />
                      <span className="text-[12px] text-muted-foreground capitalize">{domainStatus}</span>
                    </div>
                  )}

                  {/* CNAME instructions */}
                  {customDomain && (
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-muted-foreground">DNS configuration</Label>
                      <pre className="rounded-xl bg-muted/60 p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
{`Type:  CNAME
Name:  ${customDomain}
Value: assessments.advisoryscore.com
TTL:   3600`}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <UpgradePrompt requiredTier="firm" currentTier={planLimits.tier} />
              )}
            </CardContent>
          </Card>

          {/* Email Domain - Firm tier only */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Domain
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">Firm</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFirm ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[12px] font-medium text-muted-foreground">Sender email address</Label>
                    <Input
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="assessments@yourfirm.com"
                      className="text-[13px]"
                    />
                  </div>

                  {senderEmail && (
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium text-muted-foreground">Required DNS records</Label>
                      <div className="rounded-xl border overflow-hidden">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Name</th>
                              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            <tr>
                              <td className="px-3 py-2 font-mono">TXT</td>
                              <td className="px-3 py-2 font-mono">_dmarc</td>
                              <td className="px-3 py-2 font-mono truncate max-w-[200px]">v=DMARC1; p=none;</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 font-mono">CNAME</td>
                              <td className="px-3 py-2 font-mono">em._domainkey</td>
                              <td className="px-3 py-2 font-mono truncate max-w-[200px]">dkim.advisoryscore.com</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 font-mono">TXT</td>
                              <td className="px-3 py-2 font-mono">@</td>
                              <td className="px-3 py-2 font-mono truncate max-w-[200px]">v=spf1 include:advisoryscore.com ~all</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
                    <p className="text-[11px] text-muted-foreground">
                      Custom email sending is in development and will be available soon.
                    </p>
                  </div>
                </>
              ) : (
                <UpgradePrompt requiredTier="firm" currentTier={planLimits.tier} />
              )}
            </CardContent>
          </Card>

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="h-9 text-[13px]">
            {saving ? "Saving..." : "Save branding settings"}
          </Button>
        </div>

        {/* ---- Right panel: live preview ---- */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card className="shadow-soft-sm border-border/60 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] font-semibold tracking-tight">Live Preview</CardTitle>
                <p className="text-[11px] text-muted-foreground">Assessment landing page mockup</p>
              </CardHeader>
              <CardContent className="p-0">
                <motion.div
                  key={JSON.stringify(state.colours)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-b-xl overflow-hidden"
                  style={{ backgroundColor: state.colours.background }}
                >
                  {/* Mini header */}
                  <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: state.colours.primary }}
                  >
                    {state.logoPreview ? (
                      <img src={state.logoPreview} alt="" className="h-5 object-contain" />
                    ) : (
                      <div className="h-5 w-20 rounded bg-white/20" />
                    )}
                    <div className="flex gap-1.5">
                      <div className="h-2 w-10 rounded bg-white/20" />
                      <div className="h-2 w-10 rounded bg-white/20" />
                    </div>
                  </div>

                  {/* Hero */}
                  <div className="px-4 py-6 space-y-3">
                    <h3
                      className="text-[14px] font-bold leading-tight"
                      style={{ color: state.colours.text, fontFamily: state.typography.heading }}
                    >
                      Financial Health Assessment
                    </h3>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: state.colours.text, opacity: 0.7, fontFamily: state.typography.body }}
                    >
                      Discover where you stand with a personalised financial health score. Takes just 5 minutes.
                    </p>
                    <button
                      className="h-8 px-4 rounded-lg text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: state.colours.primary }}
                    >
                      Start Assessment
                    </button>
                  </div>

                  {/* Score card mockup */}
                  <div className="px-4 pb-4">
                    <div
                      className="rounded-xl border p-3 space-y-2"
                      style={{ borderColor: state.colours.secondary + "40" }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: state.colours.text, fontFamily: state.typography.body }}
                        >
                          Your Score
                        </span>
                        <span
                          className="text-[16px] font-bold"
                          style={{ color: state.colours.primary }}
                        >
                          78
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: "78%", backgroundColor: state.colours.secondary }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="px-4 py-2 text-center border-t"
                    style={{ borderColor: state.colours.text + "10" }}
                  >
                    <p
                      className="text-[9px]"
                      style={{ color: state.colours.text, opacity: 0.4, fontFamily: state.typography.body }}
                    >
                      {state.custom.footerText || "\u00A9 2026 Your Company"}
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
