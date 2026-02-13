import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Assessment } from "@/types/assessment";

interface Props {
  assessment: Assessment;
  onUpdate: (updates: Partial<Assessment>) => void;
}

export function SettingsTab({ assessment, onUpdate }: Props) {
  const settings = assessment.settings_json || {};
  const leadFields = settings.lead_fields || {};

  const updateSettings = (newSettings: any) => {
    onUpdate({ settings_json: { ...settings, ...newSettings } });
  };

  const updateLeadField = (field: string, updates: any) => {
    updateSettings({
      lead_fields: { ...leadFields, [field]: { ...(leadFields[field] || {}), ...updates } },
    });
  };

  const LEAD_FIELDS = [
    { key: "first_name", label: "First Name", defaultRequired: true },
    { key: "last_name", label: "Last Name", defaultRequired: false },
    { key: "email", label: "Email", defaultRequired: true },
    { key: "company", label: "Company Name", defaultRequired: false },
    { key: "phone", label: "Phone", defaultRequired: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure assessment behaviour, emails, and webhooks</p>
      </div>

      {/* Lead Form */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Lead Capture Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Form position</Label>
            <Select
              value={settings.lead_form_position ?? "before"}
              onValueChange={v => updateSettings({ lead_form_position: v })}
            >
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="before">Before questions</SelectItem>
                <SelectItem value="after">After questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Fields</Label>
            {LEAD_FIELDS.map(f => {
              const fieldConfig = leadFields[f.key] || { enabled: f.defaultRequired, required: f.defaultRequired };
              return (
                <div key={f.key} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <span className="text-sm">{f.label}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={fieldConfig.enabled ?? true}
                        onCheckedChange={v => updateLeadField(f.key, { enabled: v })}
                      />
                      <span className="text-xs text-muted-foreground">Show</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={fieldConfig.required ?? false}
                        onCheckedChange={v => updateLeadField(f.key, { required: v })}
                        disabled={!fieldConfig.enabled}
                      />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Results Email */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Results Email</CardTitle>
            <Switch
              checked={settings.results_email_enabled ?? true}
              onCheckedChange={v => updateSettings({ results_email_enabled: v })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Send an email with score summary when assessment is completed</p>
        </CardHeader>
        {(settings.results_email_enabled ?? true) && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subject line</Label>
              <Input
                value={settings.results_email_subject ?? "Your {assessment_title} Results"}
                onChange={e => updateSettings({ results_email_subject: e.target.value })}
                placeholder="Your {assessment_title} Results"
              />
              <p className="text-xs text-muted-foreground">
                Merge fields: {"{first_name}"}, {"{assessment_title}"}, {"{score_percentage}"}, {"{tier_label}"}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Abandon Email */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Abandon Email</CardTitle>
            <Switch
              checked={settings.abandon_email_enabled ?? true}
              onCheckedChange={v => updateSettings({ abandon_email_enabled: v })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Send a reminder if someone starts but doesn't finish (after 1 hour)</p>
        </CardHeader>
        {(settings.abandon_email_enabled ?? true) && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subject line</Label>
              <Input
                value={settings.abandon_email_subject ?? "Don't forget to finish your {assessment_title}"}
                onChange={e => updateSettings({ abandon_email_subject: e.target.value })}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Email Sender */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Email Sender</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">From name</Label>
            <Input
              value={settings.email_from_name ?? ""}
              onChange={e => updateSettings({ email_from_name: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">From address</Label>
            <Input
              value={settings.email_from_address ?? ""}
              onChange={e => updateSettings({ email_from_address: e.target.value })}
              placeholder="noreply@advisoryscore.com"
            />
            <p className="text-xs text-muted-foreground">Requires domain verification in your email provider</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reply-to address</Label>
            <Input
              value={settings.email_reply_to ?? ""}
              onChange={e => updateSettings({ email_reply_to: e.target.value })}
              placeholder="hello@yourcompany.com"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Webhook */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Webhook</CardTitle>
          <p className="text-xs text-muted-foreground">Send assessment data to an external URL on completion</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Webhook URL</Label>
            <Input
              value={settings.webhook_url ?? ""}
              onChange={e => updateSettings({ webhook_url: e.target.value })}
              placeholder="https://your-crm.com/webhook"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Secret key (for HMAC signature)</Label>
            <Input
              type="password"
              value={settings.webhook_secret ?? ""}
              onChange={e => updateSettings({ webhook_secret: e.target.value })}
              placeholder="whsec_..."
            />
            <p className="text-xs text-muted-foreground">
              Used to sign payloads with HMAC SHA-256 in the X-Webhook-Signature header
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Completion */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Completion message</Label>
            <Textarea
              value={settings.completion_message ?? "Thank you for completing this assessment!"}
              onChange={e => updateSettings({ completion_message: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Redirect URL (optional)</Label>
            <Input
              value={settings.redirect_url ?? ""}
              onChange={e => updateSettings({ redirect_url: e.target.value })}
              placeholder="https://yoursite.com/thank-you"
            />
          </div>
        </CardContent>
      </Card>

      {/* Benchmarking */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Benchmarking</CardTitle>
          <p className="text-xs text-muted-foreground">Show industry benchmarks on results pages</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Enable benchmarking</p>
              <p className="text-xs text-muted-foreground">Aggregate anonymised scores to show industry comparisons</p>
            </div>
            <Switch
              checked={settings.benchmarking_enabled ?? true}
              onCheckedChange={v => updateSettings({ benchmarking_enabled: v })}
            />
          </div>
          {(settings.benchmarking_enabled ?? true) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Minimum sample size</Label>
              <Input
                type="number"
                min={1}
                value={settings.benchmark_min_sample ?? 10}
                onChange={e => updateSettings({ benchmark_min_sample: parseInt(e.target.value) || 10 })}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">Benchmarks won't display until this many completions are reached</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Behaviour */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Behaviour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Allow retakes</p>
              <p className="text-xs text-muted-foreground">Let respondents complete the assessment multiple times</p>
            </div>
            <Switch
              checked={settings.allow_retakes ?? false}
              onCheckedChange={v => updateSettings({ allow_retakes: v })}
            />
          </div>
          {(settings.allow_retakes ?? false) && (
            <>
              <div className="space-y-1.5 ml-4 pl-4 border-l-2 border-border/50">
                <Label className="text-xs font-medium">Minimum days between retakes</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.retake_min_days ?? 0}
                  onChange={e => updateSettings({ retake_min_days: parseInt(e.target.value) || 0 })}
                  className="w-24"
                />
                <p className="text-xs text-muted-foreground">Set to 0 for no limit. Prevents gaming the assessment.</p>
              </div>
              <div className="flex items-center justify-between ml-4 pl-4 border-l-2 border-border/50">
                <div>
                  <p className="text-sm">Show previous results on retake</p>
                  <p className="text-xs text-muted-foreground">Let respondents see their past scores when retaking</p>
                </div>
                <Switch
                  checked={settings.show_previous_on_retake ?? true}
                  onCheckedChange={v => updateSettings({ show_previous_on_retake: v })}
                />
              </div>
            </>
          )}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">Show progress bar</p>
              <p className="text-xs text-muted-foreground">Display completion progress during the assessment</p>
            </div>
            <Switch
              checked={settings.show_progress_bar ?? true}
              onCheckedChange={v => updateSettings({ show_progress_bar: v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
