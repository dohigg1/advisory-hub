import type { Database } from "@/integrations/supabase/types";

// Re-export the generated types when available, or define manually
export type Assessment = {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  type: AssessmentType;
  status: AssessmentStatus;
  settings_json: any;
  portal_visible: boolean;
  created_at: string;
  updated_at: string;
};

export type AssessmentType = 'scorecard' | 'diagnostic' | 'readiness_check' | 'maturity_model';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'yes_no' | 'multiple_choice' | 'sliding_scale' | 'rating_scale' | 'open_text' | 'checkbox_select' | 'image_select';

export type Category = {
  id: string;
  assessment_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  colour: string | null;
  sort_order: number;
  include_in_total: boolean;
};

export type Question = {
  id: string;
  category_id: string;
  assessment_id: string;
  type: QuestionType;
  text: string;
  help_text: string | null;
  is_required: boolean;
  sort_order: number;
  settings_json: any;
};

export type AnswerOption = {
  id: string;
  question_id: string;
  text: string;
  points: number;
  image_url: string | null;
  sort_order: number;
};

export type ScoreTier = {
  id: string;
  assessment_id: string;
  label: string;
  min_pct: number;
  max_pct: number;
  colour: string;
  description: string | null;
  sort_order: number;
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  scorecard: 'Scorecard',
  diagnostic: 'Diagnostic',
  readiness_check: 'Readiness Check',
  maturity_model: 'Maturity Model',
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  yes_no: 'Yes / No',
  multiple_choice: 'Multiple Choice',
  sliding_scale: 'Sliding Scale',
  rating_scale: 'Rating Scale',
  open_text: 'Open Text',
  checkbox_select: 'Checkbox Select',
  image_select: 'Image Select',
};

export const DEFAULT_SCORE_TIERS = [
  { label: 'Low', min_pct: 0, max_pct: 39, colour: '#EF4444', description: 'Significant improvement needed', sort_order: 0 },
  { label: 'Medium', min_pct: 40, max_pct: 69, colour: '#F59E0B', description: 'Some areas need attention', sort_order: 1 },
  { label: 'High', min_pct: 70, max_pct: 89, colour: '#22C55E', description: 'Performing well', sort_order: 2 },
  { label: 'Excellent', min_pct: 90, max_pct: 100, colour: '#15803D', description: 'Outstanding performance', sort_order: 3 },
];
