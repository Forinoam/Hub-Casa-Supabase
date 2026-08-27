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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          earned_at: string
          home_id: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          home_id: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          home_id?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          created_at: string
          home_id: string
          id: string
          message: string
          priority: string
          resolved: boolean
          type: string
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          message: string
          priority?: string
          resolved?: boolean
          type: string
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          message?: string
          priority?: string
          resolved?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          created_at: string
          home_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          home_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          home_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          home_id: string
          id: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          home_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          home_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          default_points: number | null
          home_id: string
          icon: string
          id: string
          module: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          default_points?: number | null
          home_id: string
          icon?: string
          id?: string
          module?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          default_points?: number | null
          home_id?: string
          icon?: string
          id?: string
          module?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          home_id: string
          id: string
          priority: string
          recurrence: string | null
          reminder_minutes: number | null
          shared: boolean
          start_at: string
          status: string
          title: string
          visibility: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          home_id: string
          id?: string
          priority?: string
          recurrence?: string | null
          reminder_minutes?: number | null
          shared?: boolean
          start_at: string
          status?: string
          title: string
          visibility?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          home_id?: string
          id?: string
          priority?: string
          recurrence?: string | null
          reminder_minutes?: number | null
          shared?: boolean
          start_at?: string
          status?: string
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number | null
          assigned_to: string | null
          card_id: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          home_id: string
          id: string
          installment_group: string | null
          installment_no: number | null
          installment_total: number | null
          kind: string
          paid: boolean
          payment_method: string | null
          recurrence: string | null
          recurring: boolean
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          card_id?: string | null
          category?: string
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          home_id: string
          id?: string
          installment_group?: string | null
          installment_no?: number | null
          installment_total?: number | null
          kind?: string
          paid?: boolean
          payment_method?: string | null
          recurrence?: string | null
          recurring?: boolean
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          card_id?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          home_id?: string
          id?: string
          installment_group?: string | null
          installment_no?: number | null
          installment_total?: number | null
          kind?: string
          paid?: boolean
          payment_method?: string | null
          recurrence?: string | null
          recurring?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "expenses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "payment_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          code: string
          created_at: string
          email: string
          expires_at: string
          home_id: string
          id: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string
          created_at?: string
          email: string
          expires_at?: string
          home_id: string
          id?: string
          invited_by: string
          role?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          home_id?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_invites_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      home_members: {
        Row: {
          created_at: string
          home_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          home_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          home_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_members_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          home_id: string
          id: string
          owner_id: string | null
          received_on: string | null
          recurrence: string
          source: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          home_id: string
          id?: string
          owner_id?: string | null
          received_on?: string | null
          recurrence?: string
          source: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          home_id?: string
          id?: string
          owner_id?: string | null
          received_on?: string | null
          recurrence?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_items: {
        Row: {
          assignee: string | null
          category: string | null
          cost: number | null
          created_at: string
          home_id: string
          id: string
          interval_days: number | null
          last_done: string | null
          name: string
          next_due: string | null
          notes: string | null
        }
        Insert: {
          assignee?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          home_id: string
          id?: string
          interval_days?: number | null
          last_done?: string | null
          name: string
          next_due?: string | null
          notes?: string | null
        }
        Update: {
          assignee?: string | null
          category?: string | null
          cost?: number | null
          created_at?: string
          home_id?: string
          id?: string
          interval_days?: number | null
          last_done?: string | null
          name?: string
          next_due?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          date: string
          home_id: string
          id: string
          photo_url: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          date?: string
          home_id: string
          id?: string
          photo_url?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          date?: string
          home_id?: string
          id?: string
          photo_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempt_count: number
          created_at: string
          dedupe_key: string
          error: string | null
          home_id: string
          id: string
          payload: Json
          recipient_user_id: string
          scheduled_for: string
          sent_at: string | null
          source_id: string
          source_type: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          dedupe_key: string
          error?: string | null
          home_id: string
          id?: string
          payload?: Json
          recipient_user_id: string
          scheduled_for: string
          sent_at?: string | null
          source_id: string
          source_type: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          dedupe_key?: string
          error?: string | null
          home_id?: string
          id?: string
          payload?: Json
          recipient_user_id?: string
          scheduled_for?: string
          sent_at?: string | null
          source_id?: string
          source_type?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          bill_lead_days: number
          created_at: string
          daily_digest_time: string
          enabled_bills: boolean
          enabled_budget: boolean
          enabled_events: boolean
          enabled_maintenance: boolean
          enabled_shopping: boolean
          enabled_tasks: boolean
          home_id: string
          id: string
          maintenance_lead_days: number
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          shopping_weekday: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bill_lead_days?: number
          created_at?: string
          daily_digest_time?: string
          enabled_bills?: boolean
          enabled_budget?: boolean
          enabled_events?: boolean
          enabled_maintenance?: boolean
          enabled_shopping?: boolean
          enabled_tasks?: boolean
          home_id: string
          id?: string
          maintenance_lead_days?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          shopping_weekday?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bill_lead_days?: number
          created_at?: string
          daily_digest_time?: string
          enabled_bills?: boolean
          enabled_budget?: boolean
          enabled_events?: boolean
          enabled_maintenance?: boolean
          enabled_shopping?: boolean
          enabled_tasks?: boolean
          home_id?: string
          id?: string
          maintenance_lead_days?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          shopping_weekday?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_cards: {
        Row: {
          brand: string | null
          closing_day: number | null
          color: string
          created_at: string
          created_by: string | null
          due_day: number | null
          home_id: string
          id: string
          last4: string | null
          name: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          closing_day?: number | null
          color?: string
          created_at?: string
          created_by?: string | null
          due_day?: number | null
          home_id: string
          id?: string
          last4?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          closing_day?: number | null
          color?: string
          created_at?: string
          created_by?: string | null
          due_day?: number | null
          home_id?: string
          id?: string
          last4?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_cards_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_home_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          active_home_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          active_home_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_home_id_fkey"
            columns: ["active_home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_name: string | null
          endpoint: string
          home_id: string
          id: string
          last_seen_at: string
          p256dh: string
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_name?: string | null
          endpoint: string
          home_id: string
          id?: string
          last_seen_at?: string
          p256dh: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_name?: string | null
          endpoint?: string
          home_id?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          bought: boolean
          bought_at: string | null
          category: string
          created_at: string
          created_by: string
          home_id: string
          id: string
          name: string
          note: string | null
          priority: string
          quantity: number
          unit: string | null
        }
        Insert: {
          bought?: boolean
          bought_at?: string | null
          category?: string
          created_at?: string
          created_by: string
          home_id: string
          id?: string
          name: string
          note?: string | null
          priority?: string
          quantity?: number
          unit?: string | null
        }
        Update: {
          bought?: boolean
          bought_at?: string | null
          category?: string
          created_at?: string
          created_by?: string
          home_id?: string
          id?: string
          name?: string
          note?: string | null
          priority?: string
          quantity?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          completed_at: string
          completed_by: string
          home_id: string
          id: string
          notes: string | null
          points: number
          task_id: string
        }
        Insert: {
          completed_at?: string
          completed_by: string
          home_id: string
          id?: string
          notes?: string | null
          points?: number
          task_id: string
        }
        Update: {
          completed_at?: string
          completed_by?: string
          home_id?: string
          id?: string
          notes?: string | null
          points?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          category: string
          checklist: Json | null
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          due_time: string | null
          home_id: string
          id: string
          points: number
          priority: string
          recurrence: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          category?: string
          checklist?: Json | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          home_id: string
          id?: string
          points?: number
          priority?: string
          recurrence?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          category?: string
          checklist?: Json | null
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          home_id?: string
          id?: string
          points?: number
          priority?: string
          recurrence?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_home_invite: { Args: { _code: string }; Returns: string }
      is_home_member: {
        Args: { _home_id: string; _user_id: string }
        Returns: boolean
      }
      list_due_event_reminders: {
        Args: { _limit?: number }
        Returns: {
          body: string
          home_id: string
          payload: Json
          recipient_user_id: string
          scheduled_for: string
          source_id: string
          source_type: string
          title: string
        }[]
      }
      seed_default_categories: {
        Args: { _home_id: string }
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
