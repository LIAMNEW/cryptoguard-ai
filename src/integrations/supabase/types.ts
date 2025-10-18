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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          anomaly_detected: boolean
          anomaly_type: string | null
          austrac_score: number | null
          created_at: string
          general_risk_score: number | null
          id: string
          network_cluster: string | null
          risk_level: string | null
          risk_score: number
          transaction_id: string
        }
        Insert: {
          anomaly_detected?: boolean
          anomaly_type?: string | null
          austrac_score?: number | null
          created_at?: string
          general_risk_score?: number | null
          id?: string
          network_cluster?: string | null
          risk_level?: string | null
          risk_score: number
          transaction_id: string
        }
        Update: {
          anomaly_detected?: boolean
          anomaly_type?: string | null
          austrac_score?: number | null
          created_at?: string
          general_risk_score?: number | null
          id?: string
          network_cluster?: string | null
          risk_level?: string | null
          risk_score?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_profiles: {
        Row: {
          addresses: Json | null
          created_at: string
          customer_identifier: string
          emails: Json | null
          id: string
          income_bracket: string | null
          kyc_data: Json | null
          last_kyc_update: string | null
          occupation: string | null
          phones: Json | null
          prior_alerts_count: number | null
          risk_profile: Json | null
          risk_rating: string | null
          updated_at: string
        }
        Insert: {
          addresses?: Json | null
          created_at?: string
          customer_identifier: string
          emails?: Json | null
          id?: string
          income_bracket?: string | null
          kyc_data?: Json | null
          last_kyc_update?: string | null
          occupation?: string | null
          phones?: Json | null
          prior_alerts_count?: number | null
          risk_profile?: Json | null
          risk_rating?: string | null
          updated_at?: string
        }
        Update: {
          addresses?: Json | null
          created_at?: string
          customer_identifier?: string
          emails?: Json | null
          id?: string
          income_bracket?: string | null
          kyc_data?: Json | null
          last_kyc_update?: string | null
          occupation?: string | null
          phones?: Json | null
          prior_alerts_count?: number | null
          risk_profile?: Json | null
          risk_rating?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      high_risk_jurisdictions: {
        Row: {
          active: boolean
          country_code: string
          country_name: string
          created_at: string
          id: string
          notes: string | null
          risk_category: string
        }
        Insert: {
          active?: boolean
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          notes?: string | null
          risk_category: string
        }
        Update: {
          active?: boolean
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          risk_category?: string
        }
        Relationships: []
      }
      network_edges: {
        Row: {
          created_at: string
          first_transaction: string | null
          from_address: string
          id: string
          last_transaction: string | null
          to_address: string
          total_amount: number
          transaction_count: number
        }
        Insert: {
          created_at?: string
          first_transaction?: string | null
          from_address: string
          id?: string
          last_transaction?: string | null
          to_address: string
          total_amount?: number
          transaction_count?: number
        }
        Update: {
          created_at?: string
          first_transaction?: string | null
          from_address?: string
          id?: string
          last_transaction?: string | null
          to_address?: string
          total_amount?: number
          transaction_count?: number
        }
        Relationships: []
      }
      network_nodes: {
        Row: {
          address: string
          created_at: string
          first_seen: string | null
          id: string
          last_seen: string | null
          risk_level: string
          total_volume: number
          transaction_count: number
        }
        Insert: {
          address: string
          created_at?: string
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          risk_level?: string
          total_volume?: number
          transaction_count?: number
        }
        Update: {
          address?: string
          created_at?: string
          first_seen?: string | null
          id?: string
          last_seen?: string | null
          risk_level?: string
          total_volume?: number
          transaction_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          email_notifications: boolean
          full_name: string | null
          high_risk_alerts: boolean
          id: string
          updated_at: string
          user_tier: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          email_notifications?: boolean
          full_name?: string | null
          high_risk_alerts?: boolean
          id: string
          updated_at?: string
          user_tier?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          email_notifications?: boolean
          full_name?: string | null
          high_risk_alerts?: boolean
          id?: string
          updated_at?: string
          user_tier?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      rule_catalog: {
        Row: {
          austrac_indicator: string | null
          created_at: string
          description: string
          enabled: boolean
          id: string
          must_report: boolean
          name: string
          rule_id: string
          severity: string
          updated_at: string
          weight: number
        }
        Insert: {
          austrac_indicator?: string | null
          created_at?: string
          description: string
          enabled?: boolean
          id?: string
          must_report?: boolean
          name: string
          rule_id: string
          severity: string
          updated_at?: string
          weight: number
        }
        Update: {
          austrac_indicator?: string | null
          created_at?: string
          description?: string
          enabled?: boolean
          id?: string
          must_report?: boolean
          name?: string
          rule_id?: string
          severity?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      saved_analyses: {
        Row: {
          analysis_date: string
          anomalies_count: number
          average_risk_score: number | null
          created_at: string
          description: string | null
          high_risk_count: number
          id: string
          name: string
          snapshot_data: Json
          total_transactions: number
          updated_at: string
        }
        Insert: {
          analysis_date?: string
          anomalies_count?: number
          average_risk_score?: number | null
          created_at?: string
          description?: string | null
          high_risk_count?: number
          id?: string
          name: string
          snapshot_data: Json
          total_transactions?: number
          updated_at?: string
        }
        Update: {
          analysis_date?: string
          anomalies_count?: number
          average_risk_score?: number | null
          created_at?: string
          description?: string | null
          high_risk_count?: number
          id?: string
          name?: string
          snapshot_data?: Json
          total_transactions?: number
          updated_at?: string
        }
        Relationships: []
      }
      smr_drafts: {
        Row: {
          analysis_conclusion: string | null
          created_at: string
          crime_type: string | null
          customer_profile: string | null
          due_by_ts: string | null
          id: string
          payload: Json
          scorecard_id: string | null
          status: string
          submitted_at: string | null
          suspicion_description: string | null
          transaction_id: string
          unusual_activity: string | null
          updated_at: string
        }
        Insert: {
          analysis_conclusion?: string | null
          created_at?: string
          crime_type?: string | null
          customer_profile?: string | null
          due_by_ts?: string | null
          id?: string
          payload: Json
          scorecard_id?: string | null
          status?: string
          submitted_at?: string | null
          suspicion_description?: string | null
          transaction_id: string
          unusual_activity?: string | null
          updated_at?: string
        }
        Update: {
          analysis_conclusion?: string | null
          created_at?: string
          crime_type?: string | null
          customer_profile?: string | null
          due_by_ts?: string | null
          id?: string
          payload?: Json
          scorecard_id?: string | null
          status?: string
          submitted_at?: string | null
          suspicion_description?: string | null
          transaction_id?: string
          unusual_activity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smr_drafts_scorecard_id_fkey"
            columns: ["scorecard_id"]
            isOneToOne: false
            referencedRelation: "transaction_scorecards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smr_drafts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_scorecards: {
        Row: {
          austrac_compliance: Json | null
          created_at: string
          due_by_ts: string | null
          final_score: number
          id: string
          indicators: Json | null
          mandatory_flags: Json | null
          ml_score: number | null
          policy_score: number
          rationale: string | null
          risk_level: string
          rules_triggered: Json | null
          transaction_id: string
        }
        Insert: {
          austrac_compliance?: Json | null
          created_at?: string
          due_by_ts?: string | null
          final_score: number
          id?: string
          indicators?: Json | null
          mandatory_flags?: Json | null
          ml_score?: number | null
          policy_score?: number
          rationale?: string | null
          risk_level: string
          rules_triggered?: Json | null
          transaction_id: string
        }
        Update: {
          austrac_compliance?: Json | null
          created_at?: string
          due_by_ts?: string | null
          final_score?: number
          id?: string
          indicators?: Json | null
          mandatory_flags?: Json | null
          ml_score?: number | null
          policy_score?: number
          rationale?: string | null
          risk_level?: string
          rules_triggered?: Json | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_scorecards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          block_number: number | null
          created_at: string
          from_address: string
          gas_fee: number | null
          id: string
          timestamp: string
          to_address: string
          transaction_hash: string | null
          transaction_id: string
          transaction_type: string | null
        }
        Insert: {
          amount: number
          block_number?: number | null
          created_at?: string
          from_address: string
          gas_fee?: number | null
          id?: string
          timestamp: string
          to_address: string
          transaction_hash?: string | null
          transaction_id: string
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          block_number?: number | null
          created_at?: string
          from_address?: string
          gas_fee?: number | null
          id?: string
          timestamp?: string
          to_address?: string
          transaction_hash?: string | null
          transaction_id?: string
          transaction_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_risk_levels: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
