export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          analysis_id: string
          content: string
          created_at: string
          id: string
          role: string
          section: string | null
          suggestion: string | null
          thread_id: string | null
          timestamp: string
          updated_at: string
        }
        Insert: {
          analysis_id: string
          content: string
          created_at?: string
          id: string
          role: string
          section?: string | null
          suggestion?: string | null
          thread_id?: string | null
          timestamp?: string
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          section?: string | null
          suggestion?: string | null
          thread_id?: string | null
          timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_metadata: {
        Row: {
          analysis_id: string
          assistant_id: string
          created_at: string
          id: string
          run_id: string
          section: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          analysis_id: string
          assistant_id: string
          created_at?: string
          id?: string
          run_id: string
          section?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          assistant_id?: string
          created_at?: string
          id?: string
          run_id?: string
          section?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_metadata_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company_name: string | null
          company_url: string | null
          created_at: string | null
          id: string
          job_description: Json | null
          job_title: string | null
          job_url: string | null
          language: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          company_url?: string | null
          created_at?: string | null
          id?: string
          job_description?: Json | null
          job_title?: string | null
          job_url?: string | null
          language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          company_url?: string | null
          created_at?: string | null
          id?: string
          job_description?: Json | null
          job_title?: string | null
          job_url?: string | null
          language?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform: {
        Row: {
          archived: boolean | null
          attrs: Json | null
          content: Json | null
          created_time: string | null
          description: string | null
          id: string
          last_edited_time: string | null
          notion_url: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          archived?: boolean | null
          attrs?: Json | null
          content?: Json | null
          created_time?: string | null
          description?: string | null
          id: string
          last_edited_time?: string | null
          notion_url?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          archived?: boolean | null
          attrs?: Json | null
          content?: Json | null
          created_time?: string | null
          description?: string | null
          id?: string
          last_edited_time?: string | null
          notion_url?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          feedback_popup_count: number | null
          free_trial_limit: number
          full_name: string | null
          has_completed_survey: boolean | null
          id: string
          monthly_usage_count: number | null
          monthly_usage_reset_date: string | null
          payment_period:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          provider: string | null
          stripe_customer_id: string | null
          stripe_customer_id_production: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          feedback_popup_count?: number | null
          free_trial_limit?: number
          full_name?: string | null
          has_completed_survey?: boolean | null
          id: string
          monthly_usage_count?: number | null
          monthly_usage_reset_date?: string | null
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          provider?: string | null
          stripe_customer_id?: string | null
          stripe_customer_id_production?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          feedback_popup_count?: number | null
          free_trial_limit?: number
          full_name?: string | null
          has_completed_survey?: boolean | null
          id?: string
          monthly_usage_count?: number | null
          monthly_usage_reset_date?: string | null
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          provider?: string | null
          stripe_customer_id?: string | null
          stripe_customer_id_production?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      resume_analyses: {
        Row: {
          created_at: string
          error: string | null
          feedback: boolean | null
          formatted_golden_resume: Json | null
          google_doc_url: string | null
          id: string
          job_id: string | null
          match_score: number | null
          resume_id: string | null
          status: Database["public"]["Enums"]["analysis_status_type"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          feedback?: boolean | null
          formatted_golden_resume?: Json | null
          google_doc_url?: string | null
          id?: string
          job_id?: string | null
          match_score?: number | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status_type"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          feedback?: boolean | null
          formatted_golden_resume?: Json | null
          google_doc_url?: string | null
          id?: string
          job_id?: string | null
          match_score?: number | null
          resume_id?: string | null
          status?: Database["public"]["Enums"]["analysis_status_type"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_analyses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_editors: {
        Row: {
          analysis_id: string
          content: Json
          created_at: string | null
          id: string
          last_saved: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          content?: Json
          created_at?: string | null
          id?: string
          last_saved?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          last_saved?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_editors_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "resume_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          formatted_resume: Json | null
          id: string
          mime_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          formatted_resume?: Json | null
          id?: string
          mime_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          formatted_resume?: Json | null
          id?: string
          mime_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_period:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          payment_period:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status: string | null
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_period?:
            | Database["public"]["Enums"]["payment_period_type"]
            | null
          status?: string | null
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          user_id?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          id: string
          key: string
          language_code: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          language_code: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language_code?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          analysis_id: string
          created_at: string
          feedback_text: string | null
          id: string
          quick_feedback_option: string | null
          rating: number
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          quick_feedback_option?: string | null
          rating: number
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          quick_feedback_option?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "resume_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_monthly_usage_count: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_subscription_and_transaction: {
        Args: {
          p_user_id: string
          p_stripe_customer_id: string
          p_stripe_subscription_id: string
          p_status: string
          p_tier: string
          p_current_period_start: string
          p_current_period_end: string
          p_cancel_at_period_end: boolean
          p_stripe_session_id: string
          p_amount: number
          p_currency: string
          p_payment_status: string
        }
        Returns: undefined
      }
    }
    Enums: {
      analysis_status_type: "pending" | "error" | "timeout" | "success"
      payment_period_type: "monthly" | "annual"
      subscription_tier: "apprentice" | "alchemist" | "grandmaster"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status_type: ["pending", "error", "timeout", "success"],
      payment_period_type: ["monthly", "annual"],
      subscription_tier: ["apprentice", "alchemist", "grandmaster"],
    },
  },
} as const
