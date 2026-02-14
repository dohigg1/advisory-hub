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
      admin_audit_log: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          target_org_id: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          target_org_id?: string | null
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          target_org_id?: string | null
          details?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_target_org_id_fkey"
            columns: ["target_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          org_id: string
          revoked_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          org_id: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          org_id?: string
          revoked_at?: string | null
          scopes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_iterations: {
        Row: {
          assessment_id: string
          category_scores_json: Json | null
          completed_at: string
          created_at: string
          id: string
          iteration_number: number
          lead_email: string
          lead_id: string
          overall_percentage: number | null
          score_id: string | null
        }
        Insert: {
          assessment_id: string
          category_scores_json?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          iteration_number?: number
          lead_email: string
          lead_id: string
          overall_percentage?: number | null
          score_id?: string | null
        }
        Update: {
          assessment_id?: string
          category_scores_json?: Json | null
          completed_at?: string
          created_at?: string
          id?: string
          iteration_number?: number
          lead_email?: string
          lead_id?: string
          overall_percentage?: number | null
          score_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_iterations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_iterations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "top_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_iterations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_iterations_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "scores"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          org_id: string
          portal_visible: boolean
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
          portal_visible?: boolean
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
          portal_visible?: boolean
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
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata_json: Json | null
          org_id: string
          target_id: string | null
          target_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata_json?: Json | null
          org_id: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata_json?: Json | null
          org_id?: string
          target_id?: string | null
          target_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      brand_themes: {
        Row: {
          accent_colour: string | null
          background_colour: string | null
          created_at: string
          custom_css: string | null
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          id: string
          logo_dark_url: string | null
          logo_url: string | null
          org_id: string
          primary_colour: string | null
          secondary_colour: string | null
          text_colour: string | null
          updated_at: string
        }
        Insert: {
          accent_colour?: string | null
          background_colour?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          org_id: string
          primary_colour?: string | null
          secondary_colour?: string | null
          text_colour?: string | null
          updated_at?: string
        }
        Update: {
          accent_colour?: string | null
          background_colour?: string | null
          created_at?: string
          custom_css?: string | null
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          id?: string
          logo_dark_url?: string | null
          logo_url?: string | null
          org_id?: string
          primary_colour?: string | null
          secondary_colour?: string | null
          text_colour?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_themes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
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
      data_retention_settings: {
        Row: {
          anonymize_after_days: number | null
          auto_delete_leads_days: number | null
          auto_delete_responses_days: number | null
          created_at: string
          id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          anonymize_after_days?: number | null
          auto_delete_leads_days?: number | null
          auto_delete_responses_days?: number | null
          created_at?: string
          id?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          anonymize_after_days?: number | null
          auto_delete_leads_days?: number | null
          auto_delete_responses_days?: number | null
          created_at?: string
          id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          id: string
          invoice_url: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_url?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_url?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
          admin_notes: string | null
          admin_override_at: string | null
          admin_override_by: string | null
          admin_plan_tier: string | null
          created_at: string
          current_period_end: string | null
          deleted_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          plan_tier: string
          primary_colour: string | null
          slug: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_status: string | null
        }
        Insert: {
          admin_notes?: string | null
          admin_override_at?: string | null
          admin_override_by?: string | null
          admin_plan_tier?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_tier?: string
          primary_colour?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
        }
        Update: {
          admin_notes?: string | null
          admin_override_at?: string | null
          admin_override_by?: string | null
          admin_plan_tier?: string | null
          created_at?: string
          current_period_end?: string | null
          deleted_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_tier?: string
          primary_colour?: string | null
          slug?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      plan_permission_overrides: {
        Row: {
          id: string
          org_id: string
          permission_key: string
          permission_value: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          org_id: string
          permission_key: string
          permission_value: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          permission_key?: string
          permission_value?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_permission_overrides_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_access_logs: {
        Row: {
          accessed_at: string
          action: string | null
          id: string
          lead_email: string
          org_id: string
        }
        Insert: {
          accessed_at?: string
          action?: string | null
          id?: string
          lead_email: string
          org_id: string
        }
        Update: {
          accessed_at?: string
          action?: string | null
          id?: string
          lead_email?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_access_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          lead_email: string
          org_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          lead_email: string
          org_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          lead_email?: string
          org_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_settings: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          org_id: string
          portal_description: string | null
          show_powered_by: boolean
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          org_id: string
          portal_description?: string | null
          show_powered_by?: boolean
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          org_id?: string
          portal_description?: string | null
          show_powered_by?: boolean
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_conversions: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code_id: string
          referred_email: string
          referred_user_id: string | null
          reward_granted: boolean
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code_id: string
          referred_email: string
          referred_user_id?: string | null
          reward_granted?: boolean
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_email?: string
          referred_user_id?: string | null
          reward_granted?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_conversions_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
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
          narrative_json: Json | null
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
          narrative_json?: Json | null
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
          narrative_json?: Json | null
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
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string | null
          org_id: string
          plan_tier: string
          price_id: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          org_id: string
          plan_tier?: string
          price_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string | null
          org_id?: string
          plan_tier?: string
          price_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
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
      templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          preview_image_url: string | null
          question_count: number
          template_data_json: Json
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          preview_image_url?: string | null
          question_count?: number
          template_data_json?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          preview_image_url?: string | null
          question_count?: number
          template_data_json?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      get_plan_limits: { Args: { tier: string }; Returns: Json }
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
