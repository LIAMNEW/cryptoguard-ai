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
