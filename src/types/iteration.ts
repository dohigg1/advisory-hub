export interface AssessmentIteration {
  id: string;
  lead_email: string;
  assessment_id: string;
  iteration_number: number;
  lead_id: string;
  score_id: string | null;
  overall_percentage: number | null;
  category_scores_json: Record<string, {
    points: number;
    possible: number;
    percentage: number | null;
    tier_id?: string | null;
    tier_label?: string | null;
    tier_colour?: string | null;
  }>;
  completed_at: string;
  created_at: string;
}

export interface IterationHistory {
  iterations: AssessmentIteration[];
  currentIteration: AssessmentIteration | null;
  previousIteration: AssessmentIteration | null;
  isRetake: boolean;
}
