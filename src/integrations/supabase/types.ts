export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answer_options: {
        Row: {
          id: string
          image_url: string | null
          points: number
          question_id: string
          sort_order: number
          text: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          points?: number
          question_id: string
          sort_order?: number
          text?: string
        }
        Update: {
          id?: string
          image_url?: string | null
          points?: number
          question_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "dropoff_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "response_patterns"
            referencedColumns: ["question_id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          org_id: string
          settings_json: Json | null
          status: Database["public"]["Enums"]["assessment_status"]
          title: string
          type: Database["public"]["Enums"]["assessment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          org_id: string
          settings_json?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          settings_json?: Json | null
          status?: Database["public"]["Enums"]["assessment_status"]
          title?: string
          type?: Database["public"]["Enums"]["assessment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          assessment_id: string
          avg_score: number
          category_id: string | null
          id: string
          median_score: number
          percentile_25: number
          percentile_75: number
          sample_size: number
          updated_at: string
        }
        Insert: {
          assessment_id: string
          avg_score?: number
          category_id?: string | null
          id?: string
          median_score?: number
          percentile_25?: number
          percentile_75?: number
          sample_size?: number
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          avg_score?: number
          category_id?: string | null
          id?: string
          median_score?: number
          percentile_25?: number
          percentile_75?: number
          sample_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "benchmarks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_averages"
            referencedColumns: ["category_id"]
          },
        ]
      }
      categories: {
        Row: {
          assessment_id: string
          colour: string | null
          description: string | null
          icon: string | null
          id: string
          include_in_total: boolean
          name: string
          sort_order: number
        }
        Insert: {
          assessment_id: string
          colour?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          include_in_total?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          assessment_id?: string
          colour?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          include_in_total?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          is_published: boolean
          sections_json: Json
          settings_json: Json
          slug: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          is_published?: boolean
          sections_json?: Json
          settings_json?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          is_published?: boolean
          sections_json?: Json
          settings_json?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_pages_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          abandon_email_sent: boolean
          assessment_id: string
          company: string | null
          completed_at: string | null
          created_at: string
          custom_fields_json: Json | null
          email: string
          first_name: string | null
          id: string
          ip_address: string | null
          last_name: string | null
          org_id: string
          phone: string | null
          score_id: string | null
          source: string
          started_at: string
          status: string
          utm_json: Json | null
        }
        Insert: {
          abandon_email_sent?: boolean
          assessment_id: string
          company?: string | null
          completed_at?: string | null
          created_at?: string
          custom_fields_json?: Json | null
          email: string
          first_name?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          org_id: string
          phone?: string | null
          score_id?: string | null
          source?: string
          started_at?: string
          status?: string
          utm_json?: Json | null
        }
        Update: {
          abandon_email_sent?: boolean
          assessment_id?: string
          company?: string | null
          completed_at?: string | null
          created_at?: string
          custom_fields_json?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          ip_address?: string | null
          last_name?: string | null
          org_id?: string
          phone?: string | null
          score_id?: string | null
          source?: string
          started_at?: string
          status?: string
          utm_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "scores"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan_tier: string
          primary_colour: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan_tier?: string
          primary_colour?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan_tier?: string
          primary_colour?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          assessment_id: string
          category_id: string
          help_text: string | null
          id: string
          is_required: boolean
          settings_json: Json | null
          sort_order: number
          text: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          assessment_id: string
          category_id: string
          help_text?: string | null
          id?: string
          is_required?: boolean
          settings_json?: Json | null
          sort_order?: number
          text: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          assessment_id?: string
          category_id?: string
          help_text?: string | null
          id?: string
          is_required?: boolean
          settings_json?: Json | null
          sort_order?: number
          text?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category_averages"
            referencedColumns: ["category_id"]
          },
        ]
      }
      responses: {
        Row: {
          id: string
          lead_id: string
          open_text_value: string | null
          points_awarded: number
          question_id: string
          responded_at: string
          selected_option_ids: string[] | null
        }
        Insert: {
          id?: string
          lead_id: string
          open_text_value?: string | null
          points_awarded?: number
          question_id: string
          responded_at?: string
          selected_option_ids?: string[] | null
        }
        Update: {
          id?: string
          lead_id?: string
          open_text_value?: string | null
          points_awarded?: number
          question_id?: string
          responded_at?: string
          selected_option_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "dropoff_analysis"
            referencedColumns: ["question_id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "response_patterns"
            referencedColumns: ["question_id"]
          },
        ]
      }
      results_pages: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          sections_json: Json
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          sections_json?: Json
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          sections_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_pages_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_pages_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      score_tiers: {
        Row: {
          assessment_id: string
          colour: string
          description: string | null
          id: string
          label: string
          max_pct: number
          min_pct: number
          sort_order: number
        }
        Insert: {
          assessment_id: string
          colour?: string
          description?: string | null
          id?: string
          label: string
          max_pct?: number
          min_pct?: number
          sort_order?: number
        }
        Update: {
          assessment_id?: string
          colour?: string
          description?: string | null
          id?: string
          label?: string
          max_pct?: number
          min_pct?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "score_tiers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_tiers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          assessment_id: string
          calculated_at: string
          category_scores_json: Json
          id: string
          lead_id: string
          percentage: number | null
          tier_id: string | null
          total_points: number
          total_possible: number
        }
        Insert: {
          assessment_id: string
          calculated_at?: string
          category_scores_json?: Json
          id?: string
          lead_id: string
          percentage?: number | null
          tier_id?: string | null
          total_points?: number
          total_possible?: number
        }
        Update: {
          assessment_id?: string
          calculated_at?: string
          category_scores_json?: Json
          id?: string
          lead_id?: string
          percentage?: number | null
          tier_id?: string | null
          total_points?: number
          total_possible?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "score_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_errors: {
        Row: {
          created_at: string
          error_details: Json | null
          error_message: string
          id: string
          lead_id: string | null
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_message: string
          id?: string
          lead_id?: string | null
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_message?: string
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scoring_errors_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          assessment_id: string
          attempt: number
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          request_payload: Json
          response_body: string | null
          status_code: number | null
          success: boolean
          webhook_url: string
        }
        Insert: {
          assessment_id: string
          attempt?: number
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          request_payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean
          webhook_url: string
        }
        Update: {
          assessment_id?: string
          attempt?: number
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          request_payload?: Json
          response_body?: string | null
          status_code?: number | null
          success?: boolean
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      assessment_analytics: {
        Row: {
          assessment_id: string | null
          avg_score: number | null
          avg_time_minutes: number | null
          completion_rate: number | null
          total_completions: number | null
          total_starts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      category_averages: {
        Row: {
          assessment_id: string | null
          avg_percentage: number | null
          category_colour: string | null
          category_id: string | null
          category_name: string | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      completions_timeline: {
        Row: {
          assessment_id: string | null
          completions: number | null
          day: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      dropoff_analysis: {
        Row: {
          assessment_id: string | null
          question_id: string | null
          question_text: string | null
          respondents: number | null
          sort_order: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      org_dashboard_stats: {
        Row: {
          completions_last_month: number | null
          completions_this_month: number | null
          leads_last_month: number | null
          leads_this_month: number | null
          org_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      response_patterns: {
        Row: {
          assessment_id: string | null
          option_id: string | null
          option_sort_order: number | null
          option_text: string | null
          question_id: string | null
          question_text: string | null
          sort_order: number | null
          times_selected: number | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      score_distribution: {
        Row: {
          assessment_id: string | null
          bucket_max: number | null
          bucket_min: number | null
          count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_distribution: {
        Row: {
          assessment_id: string | null
          count: number | null
          tier_colour: string | null
          tier_label: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      top_assessments: {
        Row: {
          completion_rate: number | null
          id: string | null
          org_id: string | null
          title: string | null
          total_completions: number | null
          total_starts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assessment_org_id: { Args: { _assessment_id: string }; Returns: string }
      create_organisation_for_user: {
        Args: { _name: string; _primary_colour?: string }
        Returns: string
      }
      get_user_org_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_org_admin: { Args: { _org_id: string }; Returns: boolean }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      question_org_id: { Args: { _question_id: string }; Returns: string }
      recalculate_benchmarks: {
        Args: { _assessment_id: string }
        Returns: undefined
      }
      user_has_no_org: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "viewer"
      assessment_status: "draft" | "published" | "archived"
      assessment_type:
        | "scorecard"
        | "diagnostic"
        | "readiness_check"
        | "maturity_model"
      question_type:
        | "yes_no"
        | "multiple_choice"
        | "sliding_scale"
        | "rating_scale"
        | "open_text"
        | "checkbox_select"
        | "image_select"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "viewer"],
      assessment_status: ["draft", "published", "archived"],
      assessment_type: [
        "scorecard",
        "diagnostic",
        "readiness_check",
        "maturity_model",
      ],
      question_type: [
        "yes_no",
        "multiple_choice",
        "sliding_scale",
        "rating_scale",
        "open_text",
        "checkbox_select",
        "image_select",
      ],
    },
  },
} as const
