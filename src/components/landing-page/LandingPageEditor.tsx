import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Monitor, Tablet, Smartphone, Eye, Settings2, Save } from "lucide-react";
import type { Assessment } from "@/types/assessment";
import type { LandingPage, LandingPageSection, LandingPageSettings, SectionType } from "@/types/landing-page";
import { createDefaultSection, SECTION_TYPE_LABELS } from "@/types/landing-page";
import { SectionEditor } from "./SectionEditor";
import { LandingPagePreview } from "./LandingPagePreview";
import { PageSettingsPanel } from "./PageSettingsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type DeviceView = "desktop" | "tablet" | "mobile";

interface Props {
  landingPage: LandingPage;
  assessment: Assessment;
  onSave: (sections: LandingPageSection[], settings: LandingPageSettings, slug: string, isPublished: boolean) => Promise<void>;
}

export function LandingPageEditor({ landingPage, assessment, onSave }: Props) {
  const { organisation } = useAuth();
  const [sections, setSections] = useState<LandingPageSection[]>(landingPage.sections_json);
  const [settings, setSettings] = useState<LandingPageSettings>(landingPage.settings_json);
  const [slug, setSlug] = useState(landingPage.slug);
  const [isPublished, setIsPublished] = useState(landingPage.is_published);
  const [device, setDevice] = useState<DeviceView>("desktop");
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const autosave = useCallback(
    (newSections: LandingPageSection[], newSettings: LandingPageSettings, newSlug: string, newPublished: boolean) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        await onSave(newSections, newSettings, newSlug, newPublished);
        setSaving(false);
      }, 1200);
    },
    [onSave]
  );

  const addSection = (type: SectionType) => {
    const newSection = createDefaultSection(type, sections.length);
    const updated = [...sections, newSection];
    setSections(updated);
    setSelectedSectionId(newSection.id);
    setShowSettings(false);
    autosave(updated, settings, slug, isPublished);
  };

  const updateSection = (id: string, content: Record<string, any>) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, content_json: content } : s));
    setSections(updated);
    autosave(updated, settings, slug, isPublished);
  };

  const toggleVisibility = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, is_visible: !s.is_visible } : s));
    setSections(updated);
    autosave(updated, settings, slug, isPublished);
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === sections.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...sections];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    autosave(updated, settings, slug, isPublished);
  };

  const deleteSection = (id: string) => {
    const updated = sections.filter((s) => s.id !== id);
    updated.forEach((s, i) => (s.sort_order = i));
    setSections(updated);
    if (selectedSectionId === id) setSelectedSectionId(null);
    autosave(updated, settings, slug, isPublished);
  };

  const handleSettingsChange = (newSettings: LandingPageSettings) => {
    setSettings(newSettings);
    autosave(sections, newSettings, slug, isPublished);
  };

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    autosave(sections, settings, newSlug, isPublished);
  };

  const handlePublish = async () => {
    const newPublished = !isPublished;
    setIsPublished(newPublished);
    setSaving(true);
    await onSave(sections, settings, slug, newPublished);
    setSaving(false);
    toast.success(newPublished ? "Landing page published!" : "Landing page unpublished");
  };

  const previewWidth = device === "desktop" ? "100%" : device === "tablet" ? "768px" : "375px";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {(Object.keys(SECTION_TYPE_LABELS) as SectionType[]).map((type) => (
                <DropdownMenuItem key={type} onClick={() => addSection(type)}>
                  {SECTION_TYPE_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-4 flex items-center gap-1 rounded-md border p-0.5">
            <button
              onClick={() => setDevice("desktop")}
              className={`rounded p-1.5 ${device === "desktop" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDevice("tablet")}
              className={`rounded p-1.5 ${device === "tablet" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`rounded p-1.5 ${device === "mobile" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
          <Button size="sm" variant="outline" onClick={() => { setShowSettings(!showSettings); setSelectedSectionId(null); }}>
            <Settings2 className="mr-1 h-3.5 w-3.5" /> Page Settings
          </Button>
          <Button size="sm" variant={isPublished ? "outline" : "default"} onClick={handlePublish}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="w-[40%] min-w-[320px] overflow-y-auto border-r bg-background p-4">
          {showSettings ? (
            <PageSettingsPanel
              settings={settings}
              slug={slug}
              onChange={handleSettingsChange}
              onSlugChange={handleSlugChange}
              organisation={organisation}
            />
          ) : selectedSectionId ? (
            <SectionEditor
              section={sections.find((s) => s.id === selectedSectionId)!}
              onUpdate={(content) => updateSection(selectedSectionId, content)}
              onClose={() => setSelectedSectionId(null)}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                {sections.length === 0
                  ? 'Click "Add Section" to start building your landing page.'
                  : "Click a section to edit it."}
              </p>
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  className={`flex items-center justify-between rounded border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    !section.is_visible ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-sm font-medium">{SECTION_TYPE_LABELS[section.type]}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(section.id, "up"); }}
                      disabled={idx === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveSection(section.id, "down"); }}
                      disabled={idx === sections.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(section.id); }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {section.is_visible ? "👁" : "👁‍🗨"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this section?")) deleteSection(section.id);
                      }}
                      className="p-1 text-destructive hover:text-destructive/80"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 flex justify-center p-4">
          <div
            className="bg-white shadow-lg overflow-y-auto transition-all duration-300"
            style={{ width: previewWidth, maxWidth: "100%" }}
          >
            <LandingPagePreview
              sections={sections.filter((s) => s.is_visible)}
              settings={settings}
              organisation={organisation}
              assessmentTitle={assessment.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
