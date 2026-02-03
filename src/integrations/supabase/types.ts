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
      email_notifications: {
        Row: {
          created_at: string
          email_to: string
          error_message: string | null
          id: string
          notification_type: string
          obligation_id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_to: string
          error_message?: string | null
          id?: string
          notification_type: string
          obligation_id: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_to?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          obligation_id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_integrations: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          refresh_token: string
          selected_calendar_id: string | null
          sync_enabled: boolean | null
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          refresh_token: string
          selected_calendar_id?: string | null
          sync_enabled?: boolean | null
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          refresh_token?: string
          selected_calendar_id?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      obligation_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          obligation_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          obligation_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          obligation_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_files_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligation_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["obligation_status"]
          note: string | null
          obligation_id: string
          previous_status:
            | Database["public"]["Enums"]["obligation_status"]
            | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["obligation_status"]
          note?: string | null
          obligation_id: string
          previous_status?:
            | Database["public"]["Enums"]["obligation_status"]
            | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["obligation_status"]
          note?: string | null
          obligation_id?: string
          previous_status?:
            | Database["public"]["Enums"]["obligation_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "obligation_history_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      obligations: {
        Row: {
          category: Database["public"]["Enums"]["obligation_category"]
          created_at: string
          created_by: string
          due_date: string
          google_event_id: string | null
          id: string
          name: string
          notes: string | null
          recurrence: string | null
          responsible_id: string
          status: Database["public"]["Enums"]["obligation_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["obligation_category"]
          created_at?: string
          created_by: string
          due_date: string
          google_event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          recurrence?: string | null
          responsible_id: string
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["obligation_category"]
          created_at?: string
          created_by?: string
          due_date?: string
          google_event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          recurrence?: string | null
          responsible_id?: string
          status?: Database["public"]["Enums"]["obligation_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          max_obligations: number
          max_users: number
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          sector: string | null
          updated_at: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          max_obligations?: number
          max_users?: number
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          sector?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          max_obligations?: number
          max_users?: number
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          sector?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mercadopago_preapproval_id: string | null
          mercadopago_subscription_id: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          price_monthly: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          mercadopago_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          price_monthly: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercadopago_preapproval_id?: string | null
          mercadopago_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          price_monthly?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "responsable"
      obligation_category: "legal" | "fiscal" | "seguridad" | "operativa"
      obligation_status: "al_dia" | "por_vencer" | "vencida"
      user_plan: "starter" | "professional" | "enterprise"
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
      app_role: ["admin", "responsable"],
      obligation_category: ["legal", "fiscal", "seguridad", "operativa"],
      obligation_status: ["al_dia", "por_vencer", "vencida"],
      user_plan: ["starter", "professional", "enterprise"],
    },
  },
} as const
