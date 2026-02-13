import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        <p className="text-sm text-muted-foreground">Configure assessment behaviour and lead capture</p>
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
