import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LandingPageSettings } from "@/types/landing-page";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  settings: LandingPageSettings;
  slug: string;
  onChange: (settings: LandingPageSettings) => void;
  onSlugChange: (slug: string) => void;
  organisation: Tables<"organisations"> | null;
}

export function PageSettingsPanel({ settings, slug, onChange, onSlugChange, organisation }: Props) {
  const set = (key: keyof LandingPageSettings, value: string) => onChange({ ...settings, [key]: value });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">Page Settings</h3>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL</h4>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Slug</Label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">/a/</span>
            <Input
              value={slug}
              onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SEO</h4>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Page Title</Label>
          <Input value={settings.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} placeholder="Assessment title" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Meta Description</Label>
          <Textarea value={settings.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} rows={2} placeholder="Brief description for search engines" />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand Overrides</h4>
        <ColourField label="Background Colour" value={settings.background_colour} onChange={(v) => set("background_colour", v)} />
        <ColourField label="Heading Font Colour" value={settings.heading_font_colour} onChange={(v) => set("heading_font_colour", v)} />
        <ColourField label="Body Font Colour" value={settings.body_font_colour} onChange={(v) => set("body_font_colour", v)} />
        <ColourField label="Button Colour" value={settings.button_colour} onChange={(v) => set("button_colour", v)} />
        <ColourField label="Button Text Colour" value={settings.button_text_colour} onChange={(v) => set("button_text_colour", v)} />
      </div>

      {organisation && (
        <div className="rounded border p-3 text-xs text-muted-foreground">
          <p>Org brand colour: <span className="font-mono">{organisation.primary_colour}</span></p>
          {organisation.logo_url && <p className="mt-1">Logo configured ✓</p>}
        </div>
      )}
    </div>
  );
}

function ColourField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded border" style={{ backgroundColor: value || "#FFFFFF" }} />
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-28" placeholder="#FFFFFF" />
      </div>
    </div>
  );
}
