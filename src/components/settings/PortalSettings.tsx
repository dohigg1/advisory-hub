import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Copy, Users } from "lucide-react";
import { format } from "date-fns";

export function PortalSettings() {
  const { organisation, refreshProfile } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to your assessment portal");
  const [portalDescription, setPortalDescription] = useState("");
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  const [orgSlug, setOrgSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [portalAssessments, setPortalAssessments] = useState<any[]>([]);

  const fetchSettings = useCallback(async () => {
    if (!organisation) return;

    // Fetch portal settings
    const { data: settings } = await supabase
      .from("portal_settings" as any)
      .select("*")
      .eq("org_id", organisation.id)
      .single();

    if (settings) {
      setEnabled((settings as any).enabled);
      setWelcomeMessage((settings as any).welcome_message || "");
      setPortalDescription((settings as any).portal_description || "");
      setShowPoweredBy((settings as any).show_powered_by);
    }

    // Fetch org slug
    const { data: org } = await supabase
      .from("organisations")
      .select("slug")
      .eq("id", organisation.id)
      .single();
    setOrgSlug((org as any)?.slug || "");

    // Fetch assessments with portal_visible status
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, title, status, portal_visible")
      .eq("org_id", organisation.id)
      .order("title");
    setPortalAssessments(assessments || []);

    // Fetch recent access logs
    const { data: logs } = await supabase
      .from("portal_access_logs" as any)
      .select("*")
      .eq("org_id", organisation.id)
      .order("accessed_at", { ascending: false })
      .limit(50);
    setAccessLogs(logs || []);

    setLoading(false);
  }, [organisation]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!organisation) return;
    setSaving(true);

    // Upsert portal settings
    const { error: settingsErr } = await supabase
      .from("portal_settings" as any)
      .upsert({
        org_id: organisation.id,
        enabled,
        welcome_message: welcomeMessage,
        portal_description: portalDescription,
        show_powered_by: showPoweredBy,
      } as any, { onConflict: "org_id" });

    if (settingsErr) {
      toast.error(settingsErr.message);
      setSaving(false);
      return;
    }

    // Save slug
    if (orgSlug) {
      const { error: slugErr } = await supabase
        .from("organisations")
        .update({ slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-") } as any)
        .eq("id", organisation.id);
      if (slugErr) {
        toast.error(`Slug error: ${slugErr.message}`);
        setSaving(false);
        return;
      }
    }

    toast.success("Portal settings saved");
    await refreshProfile();
    setSaving(false);
  };

  const toggleAssessmentVisibility = async (assessmentId: string, visible: boolean) => {
    await supabase
      .from("assessments")
      .update({ portal_visible: visible } as any)
      .eq("id", assessmentId);
    setPortalAssessments(prev =>
      prev.map(a => a.id === assessmentId ? { ...a, portal_visible: visible } : a)
    );
    toast.success(visible ? "Assessment added to portal" : "Assessment removed from portal");
  };

  const portalUrl = orgSlug ? `${window.location.origin}/portal/${orgSlug}` : "";

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success("Portal URL copied!");
  };

  // Unique clients from access logs
  const uniqueClients = [...new Set(accessLogs.filter(l => l.action === "login").map(l => l.lead_email))];

  if (loading) {
    return (
      <Card className="shadow-soft-sm border-border/60">
        <CardContent className="py-12 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main toggle */}
      <Card className="shadow-soft-sm border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm font-semibold">Client Portal</CardTitle>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <p className="text-xs text-muted-foreground">
            Enable a branded portal where your clients can log in to view their assessment results and track progress.
          </p>
        </CardHeader>
        {enabled && (
          <CardContent className="space-y-5">
            {/* Slug */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Portal slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{window.location.origin}/portal/</span>
                <Input
                  value={orgSlug}
                  onChange={e => setOrgSlug(e.target.value)}
                  placeholder="your-company"
                  className="w-40 h-8 text-xs"
                />
              </div>
              {portalUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-[11px] bg-muted px-2 py-1 rounded">{portalUrl}</code>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={copyPortalUrl}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Welcome message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Welcome message</Label>
              <Textarea
                value={welcomeMessage}
                onChange={e => setWelcomeMessage(e.target.value)}
                placeholder="Welcome to your assessment portal"
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Portal description (optional)</Label>
              <Textarea
                value={portalDescription}
                onChange={e => setPortalDescription(e.target.value)}
                placeholder="Access your assessment results and track your progress..."
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Powered by */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Show "Powered by AdvisoryScore"</p>
                <p className="text-[10px] text-muted-foreground">Removable on paid plans</p>
              </div>
              <Switch checked={showPoweredBy} onCheckedChange={setShowPoweredBy} />
            </div>

            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving…" : "Save portal settings"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Assessment visibility */}
      {enabled && portalAssessments.length > 0 && (
        <Card className="shadow-soft-sm border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Portal Assessments</CardTitle>
            <p className="text-xs text-muted-foreground">Choose which assessments are visible in the client portal</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {portalAssessments.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{a.title}</span>
                    <Badge variant="secondary" className="text-[9px]">{a.status}</Badge>
                  </div>
                  <Switch
                    checked={a.portal_visible}
                    onCheckedChange={v => toggleAssessmentVisibility(a.id, v)}
                    disabled={a.status !== "published"}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client access logs */}
      {enabled && uniqueClients.length > 0 && (
        <Card className="shadow-soft-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Portal Clients</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">{uniqueClients.length} client(s) have accessed the portal</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Email</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueClients.map(email => {
                  const lastLog = accessLogs.find(l => l.lead_email === email && l.action === "login");
                  return (
                    <TableRow key={email} className="border-border/30">
                      <TableCell className="text-xs">{email}</TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right">
                        {lastLog ? format(new Date(lastLog.accessed_at), "MMM d, yyyy 'at' HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
