import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { AssessmentData } from "@/pages/PublicAssessment";

interface Props {
  data: AssessmentData;
  utmParams: Record<string, string | undefined>;
  brandColour: string;
  onSubmitted: (leadId: string) => void;
  onAlreadyCompleted: () => void;
}

export function LeadCaptureForm({ data, utmParams, brandColour, onSubmitted, onAlreadyCompleted }: Props) {
  const { assessment, settings } = data;
  const leadFields = settings.lead_fields || {};
  const [form, setForm] = useState<Record<string, string>>({ email: "", first_name: "", last_name: "", company: "", phone: "" });
  const [gdprConsent, setGdprConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const FIELDS = [
    { key: "first_name", label: "First Name", type: "text" },
    { key: "last_name", label: "Last Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "company", label: "Company", type: "text" },
    { key: "phone", label: "Phone", type: "tel" },
  ];

  const visibleFields = FIELDS.filter(f => {
    if (f.key === "email") return true; // always show email
    const config = leadFields[f.key];
    return config?.enabled;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required
    for (const f of visibleFields) {
      const config = leadFields[f.key] || {};
      const isRequired = f.key === "email" ? true : config.required;
      if (isRequired && !form[f.key]?.trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }

    if (!gdprConsent) {
      setError("Please accept the privacy consent to continue");
      return;
    }

    setSubmitting(true);

    // Check for existing completed submission
    const { data: existing } = await supabase
      .from("leads")
      .select("id, status")
      .eq("email", form.email.trim())
      .eq("assessment_id", assessment.id)
      .eq("status", "completed")
      .maybeSingle();

    if (existing && !settings.allow_retakes) {
      onAlreadyCompleted();
      setSubmitting(false);
      return;
    }

    // Clean UTM
    const cleanUtm: Record<string, string> = {};
    Object.entries(utmParams).forEach(([k, v]) => { if (v) cleanUtm[k] = v; });

    const { data: lead, error: insertErr } = await supabase
      .from("leads")
      .insert({
        assessment_id: assessment.id,
        org_id: assessment.org_id,
        email: form.email.trim(),
        first_name: form.first_name?.trim() || null,
        last_name: form.last_name?.trim() || null,
        company: form.company?.trim() || null,
        phone: form.phone?.trim() || null,
        source: "direct",
        utm_json: cleanUtm,
        status: "started",
      })
      .select("id")
      .single();

    if (insertErr) {
      // Might be a duplicate — try to find existing started lead
      if (insertErr.code === "23505") {
        // Unique constraint violation — retake scenario
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("email", form.email.trim())
          .eq("assessment_id", assessment.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (existingLead) {
          onSubmitted(existingLead.id);
          return;
        }
      }
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    onSubmitted(lead.id);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Before we begin</h2>
        <p className="text-muted-foreground text-sm">Please provide your details to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {visibleFields.map(f => {
          const config = leadFields[f.key] || {};
          const isRequired = f.key === "email" ? true : config.required;
          return (
            <div key={f.key} className="space-y-1.5">
              <Label className="text-sm">
                {f.label} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type={f.type}
                value={form[f.key] || ""}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                required={isRequired}
                className="h-11"
              />
            </div>
          );
        })}

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="gdpr"
            checked={gdprConsent}
            onCheckedChange={v => setGdprConsent(v === true)}
            className="mt-0.5"
          />
          <label htmlFor="gdpr" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I consent to my data being collected and processed in accordance with the privacy policy. My responses will be shared with the assessment creator.
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-md text-white font-medium text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: brandColour }}
        >
          {submitting ? "Submitting..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
