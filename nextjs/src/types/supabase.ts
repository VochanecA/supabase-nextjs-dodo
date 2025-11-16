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
      ai_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string
          customer_id: string
          id: string
          input_text: string | null
          model: string
          prompt_tokens: number | null
          response_text: string | null
          total_tokens: number | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          customer_id: string
          id?: string
          input_text?: string | null
          model: string
          prompt_tokens?: number | null
          response_text?: string | null
          total_tokens?: number | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          input_text?: string | null
          model?: string
          prompt_tokens?: number | null
          response_text?: string | null
          total_tokens?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          customer_id: string
          email: string
          name: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          customer_id: string
          email: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          customer_id?: string
          email?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          dispute_id: string
          dispute_stage: string | null
          dispute_status: string | null
          remarks: string | null
          transaction_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          dispute_id: string
          dispute_stage?: string | null
          dispute_status?: string | null
          remarks?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          dispute_id?: string
          dispute_stage?: string | null
          dispute_status?: string | null
          remarks?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          customer_id: string
          is_partial: boolean | null
          reason: string | null
          refund_id: string
          status: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          customer_id: string
          is_partial?: boolean | null
          reason?: string | null
          refund_id: string
          status?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_id?: string
          is_partial?: boolean | null
          reason?: string | null
          refund_id?: string
          status?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string
          metadata: Json | null
          next_billing_date: string | null
          product_id: string | null
          quantity: number | null
          start_date: string
          subscription_id: string
          subscription_status: string
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id: string
          metadata?: Json | null
          next_billing_date?: string | null
          product_id?: string | null
          quantity?: number | null
          start_date: string
          subscription_id: string
          subscription_status: string
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          product_id?: string | null
          quantity?: number | null
          start_date?: string
          subscription_id?: string
          subscription_status?: string
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          billed_at: string
          card_last_four: string | null
          card_network: string | null
          card_type: string | null
          created_at: string
          currency: string
          customer_id: string
          metadata: Json | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          billed_at: string
          card_last_four?: string | null
          card_network?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          metadata?: Json | null
          payment_method?: string | null
          status: string
          subscription_id?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billed_at?: string
          card_last_four?: string | null
          card_network?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["subscription_id"]
          },
        ]
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
