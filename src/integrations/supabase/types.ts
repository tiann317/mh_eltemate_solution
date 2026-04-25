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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_completions: {
        Row: {
          action_key: string
          action_label: string
          completed_at: string
          completed_by: string | null
          created_at: string
          id: string
          incident_id: string
          legal_basis: string | null
          note: string | null
        }
        Insert: {
          action_key: string
          action_label: string
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          incident_id: string
          legal_basis?: string | null
          note?: string | null
        }
        Update: {
          action_key?: string
          action_label?: string
          completed_at?: string
          completed_by?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          legal_basis?: string | null
          note?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_roles: {
        Row: {
          assigned_at: string
          id: string
          incident_id: string
          role: string
          staff_email: string | null
          staff_id: string | null
          staff_name: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          incident_id: string
          role: string
          staff_email?: string | null
          staff_id?: string | null
          staff_name: string
        }
        Update: {
          assigned_at?: string
          id?: string
          incident_id?: string
          role?: string
          staff_email?: string | null
          staff_id?: string | null
          staff_name?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          ai_assessment: Json | null
          created_at: string
          discovery_time: string | null
          fired_alerts: Json
          form_data: Json
          id: string
          incident_type: string | null
          iso_reference: string | null
          jurisdiction: string | null
          lda_dora: Json | null
          lda_gdpr: Json | null
          lda_nis2: Json | null
          legal_escalation_state: string | null
          num_affected: string | null
          outstanding_actions_count: number
          reporter_literacy: string | null
          reporter_pre_intake_id: string | null
          risk_rating: string | null
          sector: string | null
          severity_classification: string | null
          status: string
          tech_escalation_state: string | null
          updated_at: string
        }
        Insert: {
          ai_assessment?: Json | null
          created_at?: string
          discovery_time?: string | null
          fired_alerts?: Json
          form_data?: Json
          id?: string
          incident_type?: string | null
          iso_reference?: string | null
          jurisdiction?: string | null
          lda_dora?: Json | null
          lda_gdpr?: Json | null
          lda_nis2?: Json | null
          legal_escalation_state?: string | null
          num_affected?: string | null
          outstanding_actions_count?: number
          reporter_literacy?: string | null
          reporter_pre_intake_id?: string | null
          risk_rating?: string | null
          sector?: string | null
          severity_classification?: string | null
          status?: string
          tech_escalation_state?: string | null
          updated_at?: string
        }
        Update: {
          ai_assessment?: Json | null
          created_at?: string
          discovery_time?: string | null
          fired_alerts?: Json
          form_data?: Json
          id?: string
          incident_type?: string | null
          iso_reference?: string | null
          jurisdiction?: string | null
          lda_dora?: Json | null
          lda_gdpr?: Json | null
          lda_nis2?: Json | null
          legal_escalation_state?: string | null
          num_affected?: string | null
          outstanding_actions_count?: number
          reporter_literacy?: string | null
          reporter_pre_intake_id?: string | null
          risk_rating?: string | null
          sector?: string | null
          severity_classification?: string | null
          status?: string
          tech_escalation_state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          authority: string | null
          body: string
          created_at: string
          delivery_method: string | null
          framework: string
          id: string
          incident_id: string
          recipient_email: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          authority?: string | null
          body: string
          created_at?: string
          delivery_method?: string | null
          framework: string
          id?: string
          incident_id: string
          recipient_email?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          authority?: string | null
          body?: string
          created_at?: string
          delivery_method?: string | null
          framework?: string
          id?: string
          incident_id?: string
          recipient_email?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      oversight_requests: {
        Row: {
          action_key: string
          action_label: string
          created_at: string
          id: string
          incident_id: string
          reason: string | null
          requested_by: string | null
          resolution_note: string | null
          resolved_at: string | null
          reviewer_role: string
          status: string
          updated_at: string
        }
        Insert: {
          action_key: string
          action_label: string
          created_at?: string
          id?: string
          incident_id: string
          reason?: string | null
          requested_by?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          reviewer_role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          action_label?: string
          created_at?: string
          id?: string
          incident_id?: string
          reason?: string | null
          requested_by?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          reviewer_role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pre_intakes: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          escalated: boolean
          escalated_to_staff_id: string | null
          id: string
          incident_id: string | null
          literacy: string
          reporter_department: string | null
          reporter_name: string
          reporter_role: string | null
          reporter_title: string | null
          self_check_1: string | null
          self_check_2: string | null
          self_check_3: string | null
          severity_classification: string | null
          story: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          escalated?: boolean
          escalated_to_staff_id?: string | null
          id?: string
          incident_id?: string | null
          literacy?: string
          reporter_department?: string | null
          reporter_name: string
          reporter_role?: string | null
          reporter_title?: string | null
          self_check_1?: string | null
          self_check_2?: string | null
          self_check_3?: string | null
          severity_classification?: string | null
          story?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          escalated?: boolean
          escalated_to_staff_id?: string | null
          id?: string
          incident_id?: string | null
          literacy?: string
          reporter_department?: string | null
          reporter_name?: string
          reporter_role?: string | null
          reporter_title?: string | null
          self_check_1?: string | null
          self_check_2?: string | null
          self_check_3?: string | null
          severity_classification?: string | null
          story?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          available: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organisation: string | null
          role: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organisation?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organisation?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      sub_incidents: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          ai_compliance_measures: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          escalation_level: string
          id: string
          legal_basis: string | null
          parent_incident_id: string
          raised_by_name: string | null
          raised_by_role: string
          rationale: string | null
          recommended_action: string
          risk_adjustment_direction: string
          risk_from: string | null
          risk_to: string | null
          status: string
          tech_response: string | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_compliance_measures?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          escalation_level?: string
          id?: string
          legal_basis?: string | null
          parent_incident_id: string
          raised_by_name?: string | null
          raised_by_role?: string
          rationale?: string | null
          recommended_action: string
          risk_adjustment_direction?: string
          risk_from?: string | null
          risk_to?: string | null
          status?: string
          tech_response?: string | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          ai_compliance_measures?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          escalation_level?: string
          id?: string
          legal_basis?: string | null
          parent_incident_id?: string
          raised_by_name?: string | null
          raised_by_role?: string
          rationale?: string | null
          recommended_action?: string
          risk_adjustment_direction?: string
          risk_from?: string | null
          risk_to?: string | null
          status?: string
          tech_response?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
