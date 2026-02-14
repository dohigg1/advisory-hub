import { useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, Upload, ArrowUpRight, Check, AlertTriangle, Copy } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanTier } from "@/config/plans";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SSOProvider = "okta" | "azure_ad" | "google_workspace" | "custom_saml";
type ConnectionStatus = "not_configured" | "pending" | "active" | "error";

interface ProviderOption {
  id: SSOProvider;
  label: string;
  description: string;
  icon: string;
}

interface SSOConfig {
  metadataUrl: string;
  entityId: string;
  acsUrl: string;
  certificateFile: File | null;
  certificateFileName: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROVIDERS: ProviderOption[] = [
  { id: "okta", label: "Okta", description: "Enterprise identity management", icon: "O" },
  { id: "azure_ad", label: "Azure AD", description: "Microsoft Entra ID", icon: "A" },
  { id: "google_workspace", label: "Google Workspace", description: "Google Cloud Identity", icon: "G" },
  { id: "custom_saml", label: "Custom SAML", description: "Any SAML 2.0 provider", icon: "S" },
];

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  not_configured: { label: "Not Configured", variant: "secondary" },
  pending: { label: "Pending", variant: "outline", className: "border-amber-500/50 text-amber-600 bg-amber-50" },
  active: { label: "Active", variant: "default", className: "bg-emerald-500 text-white" },
  error: { label: "Error", variant: "destructive" },
};

const MOCK_ENTITY_ID = "https://app.advisoryscore.com/saml/metadata";
const MOCK_ACS_URL = "https://app.advisoryscore.com/saml/acs";

/* ------------------------------------------------------------------ */
/*  Upgrade prompt                                                     */
/* ------------------------------------------------------------------ */

function UpgradePrompt({ currentTier }: { currentTier: PlanTier }) {
  return (
    <Card className="shadow-soft-sm border-accent/30 bg-accent/5">
      <CardContent className="flex items-center gap-3 py-6">
        <Shield className="h-8 w-8 text-accent shrink-0" />
        <div className="flex-1">
          <p className="text-[14px] font-semibold">SSO requires the Firm plan</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Single Sign-On with SAML 2.0 is available on the Firm plan. Your current plan is{" "}
            <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>.
          </p>
        </div>
        <Button size="sm" className="h-9 text-[12px] gap-1.5 shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade to Firm
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SSOSettings() {
  const planLimits = usePlanLimits();
  const isFirm = planLimits.tier === "firm";

  const [enabled, setEnabled] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [config, setConfig] = useState<SSOConfig>({
    metadataUrl: "",
    entityId: MOCK_ENTITY_ID,
    acsUrl: MOCK_ACS_URL,
    certificateFile: null,
    certificateFileName: "",
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("not_configured");
  const [testing, setTesting] = useState(false);
  const [enforceSSO, setEnforceSSO] = useState(false);
  const [saving, setSaving] = useState(false);

  /* handlers */
  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfig((s) => ({ ...s, certificateFile: file, certificateFileName: file.name }));
    toast.success("Certificate uploaded");
  };

  const handleTestConnection = async () => {
    if (!config.metadataUrl) {
      toast.error("Please enter a SAML Metadata URL first");
      return;
    }
    setTesting(true);
    setConnectionStatus("pending");
    // Simulated test
    await new Promise((r) => setTimeout(r, 2000));
    setConnectionStatus("active");
    setTesting(false);
    toast.success("SSO connection test successful");
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("SSO settings saved");
    setSaving(false);
  };

  /* If not Firm tier, show upgrade prompt */
  if (!isFirm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <UpgradePrompt currentTier={planLimits.tier} />
      </motion.div>
    );
  }

  const statusConfig = STATUS_CONFIG[connectionStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Enable SSO */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <CardTitle className="text-[14px] font-semibold tracking-tight">Single Sign-On (SSO)</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={statusConfig.className ?? ""} variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Allow your team to sign in with your organisation's identity provider using SAML 2.0.
          </p>
        </CardHeader>
      </Card>

      {enabled && (
        <>
          {/* Provider selector */}
          <Card className="shadow-soft-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-tight">Identity Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROVIDERS.map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                          : "border-border/60 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-[13px] font-bold ${
                          isSelected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium">{provider.label}</p>
                        <p className="text-[11px] text-muted-foreground">{provider.description}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-accent shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          {selectedProvider && (
            <Card className="shadow-soft-sm border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-[14px] font-semibold tracking-tight">SAML Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Metadata URL */}
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">SAML Metadata URL</Label>
                  <Input
                    value={config.metadataUrl}
                    onChange={(e) => setConfig((s) => ({ ...s, metadataUrl: e.target.value }))}
                    placeholder={
                      selectedProvider === "okta"
                        ? "https://your-org.okta.com/app/xxxxx/sso/saml/metadata"
                        : selectedProvider === "azure_ad"
                        ? "https://login.microsoftonline.com/{tenant}/federationmetadata/2007-06/federationmetadata.xml"
                        : selectedProvider === "google_workspace"
                        ? "https://accounts.google.com/o/saml2?idpid=xxxxx"
                        : "https://idp.example.com/saml/metadata"
                    }
                    className="text-[13px]"
                  />
                </div>

                {/* Entity ID (read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">Entity ID (SP)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={config.entityId}
                      readOnly
                      className="text-[13px] bg-muted/50 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleCopy(config.entityId, "Entity ID")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ACS URL (read-only) */}
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">ACS URL (Assertion Consumer Service)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={config.acsUrl}
                      readOnly
                      className="text-[13px] bg-muted/50 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleCopy(config.acsUrl, "ACS URL")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Certificate upload */}
                <div className="space-y-1.5">
                  <Label className="text-[12px] font-medium text-muted-foreground">IdP Certificate (.pem or .crt)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept=".pem,.crt,.cer"
                      onChange={handleCertificateUpload}
                      className="text-[12px]"
                    />
                    {config.certificateFileName && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        <Check className="h-3 w-3 mr-1" />
                        {config.certificateFileName}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 text-[12px] gap-1.5"
                      onClick={handleTestConnection}
                      disabled={testing || !config.metadataUrl}
                    >
                      {testing ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 text-[12px]"
                      onClick={handleSave}
                      disabled={saving || !config.metadataUrl}
                    >
                      {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Enforce SSO */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">Enforce SSO</p>
                    <p className="text-[11px] text-muted-foreground">
                      Require all team members to sign in via SSO. Password login will be disabled.
                    </p>
                  </div>
                  <Switch
                    checked={enforceSSO}
                    onCheckedChange={setEnforceSSO}
                    disabled={connectionStatus !== "active"}
                  />
                </div>

                {enforceSSO && connectionStatus !== "active" && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700">
                      SSO must be active and tested before it can be enforced.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
