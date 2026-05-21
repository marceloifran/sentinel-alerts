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
      accountant_clients: {
        Row: {
          accountant_id: string
          client_company_id: string
          created_at: string
          id: string
          nickname: string | null
        }
        Insert: {
          accountant_id: string
          client_company_id: string
          created_at?: string
          id?: string
          nickname?: string | null
        }
        Update: {
          accountant_id?: string
          client_company_id?: string
          created_at?: string
          id?: string
          nickname?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountant_clients_client_company_id_fkey"
            columns: ["client_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      afip_access_tickets: {
        Row: {
          afip_config_id: string | null
          created_at: string | null
          expiration: string
          id: string
          service: string
          sign: string
          token: string
        }
        Insert: {
          afip_config_id?: string | null
          created_at?: string | null
          expiration: string
          id?: string
          service: string
          sign: string
          token: string
        }
        Update: {
          afip_config_id?: string | null
          created_at?: string | null
          expiration?: string
          id?: string
          service?: string
          sign?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "afip_access_tickets_afip_config_id_fkey"
            columns: ["afip_config_id"]
            isOneToOne: false
            referencedRelation: "afip_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      afip_configs: {
        Row: {
          cert: string
          created_at: string | null
          cuit: number
          env: string
          id: string
          key: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cert: string
          created_at?: string | null
          cuit: number
          env?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cert?: string
          created_at?: string | null
          cuit?: number
          env?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          cuit: string | null
          id: string
          name: string
          plan: Database["public"]["Enums"]["user_plan"]
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuit?: string | null
          id?: string
          name: string
          plan?: Database["public"]["Enums"]["user_plan"]
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          cuit?: string | null
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["user_plan"]
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
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
        Relationships: []
      }
      employees: {
        Row: {
          company_id: string
          created_at: string
          dni_cuil: string
          file_number: string | null
          id: string
          job_description: string | null
          job_title: string | null
          name: string
          phone: string | null
          required_epps: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          dni_cuil: string
          file_number?: string | null
          id?: string
          job_description?: string | null
          job_title?: string | null
          name: string
          phone?: string | null
          required_epps?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dni_cuil?: string
          file_number?: string | null
          id?: string
          job_description?: string | null
          job_title?: string | null
          name?: string
          phone?: string | null
          required_epps?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      epp_deliveries: {
        Row: {
          company_id: string
          created_at: string
          delivery_date: string
          employee_id: string
          epp_item_id: string
          id: string
          notes: string | null
          quantity: number
          signature_path: string | null
          signed_at: string | null
          status: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delivery_date?: string
          employee_id: string
          epp_item_id: string
          id?: string
          notes?: string | null
          quantity?: number
          signature_path?: string | null
          signed_at?: string | null
          status?: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delivery_date?: string
          employee_id?: string
          epp_item_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          signature_path?: string | null
          signed_at?: string | null
          status?: string
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epp_deliveries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epp_deliveries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epp_deliveries_epp_item_id_fkey"
            columns: ["epp_item_id"]
            isOneToOne: false
            referencedRelation: "epp_items"
            referencedColumns: ["id"]
          },
        ]
      }
      epp_items: {
        Row: {
          brand: string | null
          category: string | null
          certified: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          stock: number
          type_model: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          certified?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          stock?: number
          type_model?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          certified?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          stock?: number
          type_model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epp_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      labor_documents: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          file_path: string
          id: string
          name: string
          signed_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          file_path: string
          id?: string
          name: string
          signed_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          file_path?: string
          id?: string
          name?: string
          signed_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labor_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          max_users: number
          mp_preapproval_plan_id: string | null
          mp_subscription_id: string | null
          name: string
          phone: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          plan_activated_at: string | null
          plan_expires_at: string | null
          sector: string | null
          updated_at: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          max_users?: number
          mp_preapproval_plan_id?: string | null
          mp_subscription_id?: string | null
          name: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          sector?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          max_users?: number
          mp_preapproval_plan_id?: string | null
          mp_subscription_id?: string | null
          name?: string
          phone?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          sector?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          company_id: string | null
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      test_signup: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "responsable" | "owner" | "operativo"
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
      app_role: ["admin", "responsable", "owner", "operativo"],
      obligation_category: ["legal", "fiscal", "seguridad", "operativa"],
      obligation_status: ["al_dia", "por_vencer", "vencida"],
      user_plan: ["starter", "professional", "enterprise"],
    },
  },
} as const
