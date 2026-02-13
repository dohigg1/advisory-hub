import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { SECTION_TYPE_LABELS } from "@/types/landing-page";
import type { LandingPageSection } from "@/types/landing-page";

interface Props {
  section: LandingPageSection;
  onUpdate: (content: Record<string, any>) => void;
  onClose: () => void;
}

export function SectionEditor({ section, onUpdate, onClose }: Props) {
  const c = section.content_json;
  const set = (key: string, value: any) => onUpdate({ ...c, [key]: value });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="text-sm font-semibold">{SECTION_TYPE_LABELS[section.type]}</h3>
      </div>

      {section.type === "hero" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <Field label="Subheading" value={c.subheading} onChange={(v) => set("subheading", v)} />
          <FieldTextarea label="Description" value={c.description} onChange={(v) => set("description", v)} />
          <Field label="CTA Button Text" value={c.cta_text} onChange={(v) => set("cta_text", v)} />
          <FieldColour label="Background Colour" value={c.bg_colour} onChange={(v) => set("bg_colour", v)} />
        </>
      )}

      {section.type === "value_proposition" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <div className="space-y-3">
            <Label className="text-xs font-medium">Cards</Label>
            {(c.cards || []).map((card: any, i: number) => (
              <div key={i} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Card {i + 1}</span>
                  <button
                    onClick={() => set("cards", c.cards.filter((_: any, j: number) => j !== i))}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  placeholder="Title"
                  value={card.title}
                  onChange={(e) => {
                    const updated = [...c.cards];
                    updated[i] = { ...updated[i], title: e.target.value };
                    set("cards", updated);
                  }}
                />
                <Input
                  placeholder="Description"
                  value={card.description}
                  onChange={(e) => {
                    const updated = [...c.cards];
                    updated[i] = { ...updated[i], description: e.target.value };
                    set("cards", updated);
                  }}
                />
              </div>
            ))}
            {(c.cards || []).length < 4 && (
              <Button size="sm" variant="outline" onClick={() => set("cards", [...(c.cards || []), { icon: "star", title: "", description: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Card
              </Button>
            )}
          </div>
        </>
      )}

      {section.type === "social_proof" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <div className="space-y-3">
            <Label className="text-xs font-medium">Testimonials</Label>
            {(c.testimonials || []).map((t: any, i: number) => (
              <div key={i} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Testimonial {i + 1}</span>
                  <button onClick={() => set("testimonials", c.testimonials.filter((_: any, j: number) => j !== i))} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Textarea
                  placeholder="Quote"
                  value={t.quote}
                  onChange={(e) => {
                    const updated = [...c.testimonials];
                    updated[i] = { ...updated[i], quote: e.target.value };
                    set("testimonials", updated);
                  }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Author"
                    value={t.author}
                    onChange={(e) => {
                      const updated = [...c.testimonials];
                      updated[i] = { ...updated[i], author: e.target.value };
                      set("testimonials", updated);
                    }}
                  />
                  <Input
                    placeholder="Company"
                    value={t.company}
                    onChange={(e) => {
                      const updated = [...c.testimonials];
                      updated[i] = { ...updated[i], company: e.target.value };
                      set("testimonials", updated);
                    }}
                  />
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set("testimonials", [...(c.testimonials || []), { quote: "", author: "", company: "" }])}>
              <Plus className="mr-1 h-3 w-3" /> Add Testimonial
            </Button>
          </div>
        </>
      )}

      {section.type === "how_it_works" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <div className="space-y-3">
            <Label className="text-xs font-medium">Steps</Label>
            {(c.steps || []).map((step: any, i: number) => (
              <div key={i} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                  <button onClick={() => set("steps", c.steps.filter((_: any, j: number) => j !== i))} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  placeholder="Title"
                  value={step.title}
                  onChange={(e) => {
                    const updated = [...c.steps];
                    updated[i] = { ...updated[i], title: e.target.value };
                    set("steps", updated);
                  }}
                />
                <Textarea
                  placeholder="Description"
                  value={step.description}
                  onChange={(e) => {
                    const updated = [...c.steps];
                    updated[i] = { ...updated[i], description: e.target.value };
                    set("steps", updated);
                  }}
                />
              </div>
            ))}
            {(c.steps || []).length < 4 && (
              <Button size="sm" variant="outline" onClick={() => set("steps", [...(c.steps || []), { title: "", description: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Step
              </Button>
            )}
          </div>
        </>
      )}

      {section.type === "about" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <FieldTextarea label="Content" value={c.content} onChange={(v) => set("content", v)} rows={8} />
        </>
      )}

      {section.type === "faq" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <div className="space-y-3">
            <Label className="text-xs font-medium">Questions</Label>
            {(c.items || []).map((item: any, i: number) => (
              <div key={i} className="space-y-2 rounded border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                  <button onClick={() => set("items", c.items.filter((_: any, j: number) => j !== i))} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  placeholder="Question"
                  value={item.question}
                  onChange={(e) => {
                    const updated = [...c.items];
                    updated[i] = { ...updated[i], question: e.target.value };
                    set("items", updated);
                  }}
                />
                <Textarea
                  placeholder="Answer"
                  value={item.answer}
                  onChange={(e) => {
                    const updated = [...c.items];
                    updated[i] = { ...updated[i], answer: e.target.value };
                    set("items", updated);
                  }}
                />
              </div>
            ))}
            {(c.items || []).length < 8 && (
              <Button size="sm" variant="outline" onClick={() => set("items", [...(c.items || []), { question: "", answer: "" }])}>
                <Plus className="mr-1 h-3 w-3" /> Add Question
              </Button>
            )}
          </div>
        </>
      )}

      {section.type === "cta" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <Field label="Subheading" value={c.subheading} onChange={(v) => set("subheading", v)} />
          <Field label="Button Text" value={c.cta_text} onChange={(v) => set("cta_text", v)} />
        </>
      )}

      {section.type === "video" && (
        <>
          <Field label="Heading" value={c.heading} onChange={(v) => set("heading", v)} />
          <Field label="YouTube or Vimeo URL" value={c.url} onChange={(v) => set("url", v)} placeholder="https://www.youtube.com/watch?v=..." />
        </>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows} />
    </div>
  );
}

function FieldColour({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded border" style={{ backgroundColor: value }} />
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-32" />
      </div>
    </div>
  );
}
