export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      claims: {
        Row: {
          appeal_requested: boolean | null
          created_at: string | null
          event_id: string
          fraud_flags: Json | null
          fraud_score: number | null
          id: string
          initiated_at: string | null
          payout_amount: number
          payout_reference: string | null
          policy_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          appeal_requested?: boolean | null
          created_at?: string | null
          event_id: string
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          initiated_at?: string | null
          payout_amount: number
          payout_reference?: string | null
          policy_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          appeal_requested?: boolean | null
          created_at?: string | null
          event_id?: string
          fraud_flags?: Json | null
          fraud_score?: number | null
          id?: string
          initiated_at?: string | null
          payout_amount?: number
          payout_reference?: string | null
          policy_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "parametric_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claims_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      parametric_events: {
        Row: {
          api_source: string
          created_at: string | null
          duration_minutes: number | null
          event_type: Database["public"]["Enums"]["event_type"]
          expires_at: string | null
          fixed_payout: number
          id: string
          is_active: boolean | null
          raw_value: number | null
          triggered_at: string
          zone_code: string
        }
        Insert: {
          api_source: string
          created_at?: string | null
          duration_minutes?: number | null
          event_type: Database["public"]["Enums"]["event_type"]
          expires_at?: string | null
          fixed_payout: number
          id?: string
          is_active?: boolean | null
          raw_value?: number | null
          triggered_at?: string
          zone_code: string
        }
        Update: {
          api_source?: string
          created_at?: string | null
          duration_minutes?: number | null
          event_type?: Database["public"]["Enums"]["event_type"]
          expires_at?: string | null
          fixed_payout?: number
          id?: string
          is_active?: boolean | null
          raw_value?: number | null
          triggered_at?: string
          zone_code?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          consecutive_weeks: number
          coverage_end: string
          coverage_start: string
          created_at: string | null
          id: string
          is_claim_eligible: boolean | null
          max_weekly_payout: number
          status: Database["public"]["Enums"]["policy_status"]
          updated_at: string | null
          weekly_premium: number
          worker_id: string
        }
        Insert: {
          consecutive_weeks?: number
          coverage_end: string
          coverage_start: string
          created_at?: string | null
          id?: string
          is_claim_eligible?: boolean | null
          max_weekly_payout: number
          status?: Database["public"]["Enums"]["policy_status"]
          updated_at?: string | null
          weekly_premium: number
          worker_id: string
        }
        Update: {
          consecutive_weeks?: number
          coverage_end?: string
          coverage_start?: string
          created_at?: string | null
          id?: string
          is_claim_eligible?: boolean | null
          max_weekly_payout?: number
          status?: Database["public"]["Enums"]["policy_status"]
          updated_at?: string | null
          weekly_premium?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_calculations: {
        Row: {
          adjustment_factors: Json | null
          base_premium: number
          calculated_at: string | null
          final_premium: number
          id: string
          ml_multiplier: number | null
          week_start: string
          worker_id: string
        }
        Insert: {
          adjustment_factors?: Json | null
          base_premium: number
          calculated_at?: string | null
          final_premium: number
          id?: string
          ml_multiplier?: number | null
          week_start: string
          worker_id: string
        }
        Update: {
          adjustment_factors?: Json | null
          base_premium?: number
          calculated_at?: string | null
          final_premium?: number
          id?: string
          ml_multiplier?: number | null
          week_start?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_calculations_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          created_at: string | null
          enrolled_at: string | null
          id: string
          is_active: boolean | null
          partner_id: string
          phone: string
          platform: string
          updated_at: string | null
          upi_id: string
          user_id: string
          weekly_hours: number | null
          zone_code: string
          zone_risk: Database["public"]["Enums"]["risk_zone"]
          zone_risk_score: number | null
        }
        Insert: {
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id: string
          phone: string
          platform: string
          updated_at?: string | null
          upi_id: string
          user_id: string
          weekly_hours?: number | null
          zone_code: string
          zone_risk?: Database["public"]["Enums"]["risk_zone"]
          zone_risk_score?: number | null
        }
        Update: {
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          is_active?: boolean | null
          partner_id?: string
          phone?: string
          platform?: string
          updated_at?: string | null
          upi_id?: string
          user_id?: string
          weekly_hours?: number | null
          zone_code?: string
          zone_risk?: Database["public"]["Enums"]["risk_zone"]
          zone_risk_score?: number | null
        }
        Relationships: []
      }
      zone_risk_scores: {
        Row: {
          aqi_frequency: number | null
          city: string
          flood_frequency: number | null
          id: string
          last_updated: string | null
          rain_frequency: number | null
          risk_score: number
          zone_code: string
        }
        Insert: {
          aqi_frequency?: number | null
          city: string
          flood_frequency?: number | null
          id?: string
          last_updated?: string | null
          rain_frequency?: number | null
          risk_score: number
          zone_code: string
        }
        Update: {
          aqi_frequency?: number | null
          city?: string
          flood_frequency?: number | null
          id?: string
          last_updated?: string | null
          rain_frequency?: number | null
          risk_score?: number
          zone_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_worker_id: { Args: never; Returns: string }
    }
    Enums: {
      claim_status:
        | "auto_approved"
        | "flagged"
        | "approved"
        | "rejected"
        | "pending_review"
      event_type:
        | "heavy_rain_60"
        | "heavy_rain_90"
        | "extreme_heat"
        | "severe_aqi"
        | "flash_flood"
        | "curfew"
      policy_status: "active" | "inactive" | "expired"
      risk_zone: "low" | "medium" | "high"
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

export const Constants = {
  public: {
    Enums: {
      claim_status: ["auto_approved", "flagged", "approved", "rejected", "pending_review"],
      event_type: ["heavy_rain_60", "heavy_rain_90", "extreme_heat", "severe_aqi", "flash_flood", "curfew"],
      policy_status: ["active", "inactive", "expired"],
      risk_zone: ["low", "medium", "high"],
    },
  },
} as const
