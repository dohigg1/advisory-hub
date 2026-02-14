import { useState } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
import { toast } from "sonner";
import {
  Shield,
  Search,
  Download,
  Trash2,
  Clock,
  Cookie,
  FileText,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { PlanTier } from "@/config/plans";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RetentionPeriod = "6mo" | "1yr" | "2yr" | "5yr" | "indefinite";

interface DataSubjectResult {
  email: string;
  found: boolean;
  assessments: number;
  responses: number;
  leadRecords: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const RETENTION_OPTIONS: { value: RetentionPeriod; label: string }[] = [
  { value: "6mo", label: "6 months" },
  { value: "1yr", label: "1 year" },
  { value: "2yr", label: "2 years" },
  { value: "5yr", label: "5 years" },
  { value: "indefinite", label: "Indefinite" },
];

/* ------------------------------------------------------------------ */
/*  Upgrade prompt                                                     */
/* ------------------------------------------------------------------ */

function UpgradePrompt({ currentTier }: { currentTier: PlanTier }) {
  return (
    <Card className="shadow-soft-sm border-accent/30 bg-accent/5">
      <CardContent className="flex items-center gap-3 py-6">
        <Shield className="h-8 w-8 text-accent shrink-0" />
        <div className="flex-1">
          <p className="text-[14px] font-semibold">Privacy tools require Professional or Firm</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            GDPR compliance tools and data management features are available on Professional and Firm plans. Your
            current plan is{" "}
            <span className="font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</span>.
          </p>
        </div>
        <Button size="sm" className="h-9 text-[12px] gap-1.5 shrink-0">
          <ArrowUpRight className="h-3.5 w-3.5" /> Upgrade
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PrivacySettings() {
  const planLimits = usePlanLimits();
  const isProfessionalPlus = planLimits.tier === "professional" || planLimits.tier === "firm";

  /* Data Subject Request */
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [subjectResult, setSubjectResult] = useState<DataSubjectResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* Data Retention */
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>("2yr");
  const [autoDelete, setAutoDelete] = useState(false);
  const [affectedRecords, setAffectedRecords] = useState(142);

  /* Cookie Consent */
  const [cookieConsentEnabled, setCookieConsentEnabled] = useState(true);
  const [cookieConsentText, setCookieConsentText] = useState(
    "We use cookies to improve your experience and analyse traffic. By continuing to use this site, you agree to our use of cookies."
  );
  const [privacyPolicyLink, setPrivacyPolicyLink] = useState("");

  /* DPA */
  const [dpaSigned, setDpaSigned] = useState(false);

  /* Saving */
  const [saving, setSaving] = useState(false);

  /* If not Professional+ tier, show upgrade prompt */
  if (!isProfessionalPlus) {
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

  /* handlers */
  const handleSearchSubject = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setSearching(true);
    setSubjectResult(null);
    // Simulated search
    await new Promise((r) => setTimeout(r, 1000));
    setSubjectResult({
      email: searchEmail,
      found: true,
      assessments: 3,
      responses: 12,
      leadRecords: 1,
    });
    setSearching(false);
  };

  const handleExportData = async () => {
    if (!subjectResult) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(`Data export for ${subjectResult.email} downloaded`);
    setExporting(false);
  };

  const handleDeleteData = async () => {
    if (!subjectResult) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(`All data for ${subjectResult.email} has been deleted`);
    setSubjectResult(null);
    setSearchEmail("");
    setDeleting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    toast.success("Privacy settings saved");
    setSaving(false);
  };

  const handleRetentionChange = (value: RetentionPeriod) => {
    setRetentionPeriod(value);
    // Simulate affected records count change
    const counts: Record<RetentionPeriod, number> = {
      "6mo": 847,
      "1yr": 412,
      "2yr": 142,
      "5yr": 23,
      indefinite: 0,
    };
    setAffectedRecords(counts[value]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Data Subject Request */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <Search className="h-4 w-4" /> Data Subject Request
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">
            Search for and manage personal data associated with a specific email address (GDPR Article 15-17).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">Email address</Label>
              <Input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="user@example.com"
                className="text-[13px]"
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubject()}
              />
            </div>
            <Button
              size="sm"
              className="h-9 text-[12px] gap-1.5 shrink-0"
              onClick={handleSearchSubject}
              disabled={searching}
            >
              <Search className="h-3.5 w-3.5" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {subjectResult && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Separator />

              {subjectResult.found ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <p className="text-[13px] font-medium">
                      Data found for <span className="font-mono">{subjectResult.email}</span>
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/60 p-3 text-center">
                      <p className="text-[18px] font-bold">{subjectResult.assessments}</p>
                      <p className="text-[11px] text-muted-foreground">Assessments</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3 text-center">
                      <p className="text-[18px] font-bold">{subjectResult.responses}</p>
                      <p className="text-[11px] text-muted-foreground">Responses</p>
                    </div>
                    <div className="rounded-xl border border-border/60 p-3 text-center">
                      <p className="text-[18px] font-bold">{subjectResult.leadRecords}</p>
                      <p className="text-[11px] text-muted-foreground">Lead Records</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[12px] gap-1.5"
                      onClick={handleExportData}
                      disabled={exporting}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {exporting ? "Exporting..." : "Export Data"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-[12px] gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Data
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-destructive">Delete All Personal Data</AlertDialogTitle>
                          <AlertDialogDescription className="text-[13px]">
                            This will permanently delete all data associated with{" "}
                            <strong>{subjectResult.email}</strong>, including {subjectResult.assessments} assessment
                            records, {subjectResult.responses} responses, and {subjectResult.leadRecords} lead record(s).
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteData}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px]"
                          >
                            {deleting ? "Deleting..." : "Delete All Data"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-[13px] text-muted-foreground">
                    No data found for <span className="font-mono">{subjectResult.email}</span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <Clock className="h-4 w-4" /> Data Retention
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">
            Configure how long response data is retained before automatic deletion.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">Retention period</Label>
              <Select value={retentionPeriod} onValueChange={(v) => handleRetentionChange(v as RetentionPeriod)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-muted-foreground">Records outside retention</Label>
              <div className="flex items-center h-9 px-3 rounded-md border bg-muted/50">
                <span className="text-[13px] font-mono font-medium">
                  {affectedRecords > 0 ? affectedRecords.toLocaleString() : "None"}
                </span>
                {affectedRecords > 0 && (
                  <span className="text-[11px] text-muted-foreground ml-2">records to be removed</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div>
              <p className="text-[13px] font-medium">Auto-delete expired data</p>
              <p className="text-[11px] text-muted-foreground">
                Automatically purge data that exceeds the retention period on a weekly schedule.
              </p>
            </div>
            <Switch checked={autoDelete} onCheckedChange={setAutoDelete} />
          </div>

          {autoDelete && affectedRecords > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-700">
                {affectedRecords} record(s) will be automatically deleted within the next 7 days.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cookie Consent */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <Cookie className="h-4 w-4" /> Cookie Consent
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">
            Configure the cookie consent banner shown on your assessment pages.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium">Enable cookie consent banner</p>
              <p className="text-[11px] text-muted-foreground">
                Show a GDPR-compliant cookie consent banner to respondents.
              </p>
            </div>
            <Switch checked={cookieConsentEnabled} onCheckedChange={setCookieConsentEnabled} />
          </div>

          {cookieConsentEnabled && (
            <>
              <Separator />

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Consent message</Label>
                <Textarea
                  value={cookieConsentText}
                  onChange={(e) => setCookieConsentText(e.target.value)}
                  rows={3}
                  className="text-[13px]"
                />
                <p className="text-[11px] text-muted-foreground">
                  This message appears in the consent banner on all assessment landing pages.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-muted-foreground">Privacy policy URL</Label>
                <Input
                  value={privacyPolicyLink}
                  onChange={(e) => setPrivacyPolicyLink(e.target.value)}
                  placeholder="https://yourfirm.com/privacy"
                  className="text-[13px]"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data Processing Agreement */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4" /> Data Processing Agreement (DPA)
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">
            Review and sign the Data Processing Agreement as required under GDPR Article 28.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-[13px] font-medium">AdvisoryScore DPA v2.1</p>
                <p className="text-[11px] text-muted-foreground">Last updated: January 2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium">DPA signed</p>
              <p className="text-[11px] text-muted-foreground">
                {dpaSigned
                  ? "You have agreed to the Data Processing Agreement."
                  : "Toggle to indicate you have reviewed and signed the DPA."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {dpaSigned && (
                <Badge className="bg-emerald-500 text-white text-[10px]">Signed</Badge>
              )}
              <Switch checked={dpaSigned} onCheckedChange={setDpaSigned} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="h-9 text-[13px]">
        {saving ? "Saving..." : "Save privacy settings"}
      </Button>
    </motion.div>
  );
}
