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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id: string
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_blocks: {
        Row: {
          created_at: string
          end_time: string
          id: string
          organization_id: string
          owner_id: string
          start_time: string
          task_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          organization_id: string
          owner_id: string
          start_time: string
          task_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          organization_id?: string
          owner_id?: string
          start_time?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_blocks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_blocks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string
          deleted_at: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          folder_id: string | null
          height: number | null
          id: string
          link_url: string | null
          organization_id: string
          position_x: number | null
          position_y: number | null
          preview_image_url: string | null
          preview_metadata: Json | null
          title: string
          type: string
          updated_at: string
          visibility: Database["public"]["Enums"]["task_visibility"]
          width: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          link_url?: string | null
          organization_id: string
          position_x?: number | null
          position_y?: number | null
          preview_image_url?: string | null
          preview_metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
          width?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          link_url?: string | null
          organization_id?: string
          position_x?: number | null
          position_y?: number | null
          preview_image_url?: string | null
          preview_metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          height: number | null
          id: string
          is_open: boolean | null
          name: string
          organization_id: string
          parent_folder_id: string | null
          position_x: number | null
          position_y: number | null
          updated_at: string
          visibility: Database["public"]["Enums"]["task_visibility"]
          width: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          is_open?: boolean | null
          name?: string
          organization_id: string
          parent_folder_id?: string | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
          width?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          height?: number | null
          id?: string
          is_open?: boolean | null
          name?: string
          organization_id?: string
          parent_folder_id?: string | null
          position_x?: number | null
          position_y?: number | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          max_uses: number | null
          organization_id: string
          used_count: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          max_uses?: number | null
          organization_id: string
          used_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          max_uses?: number | null
          organization_id?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_join_requests: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_join_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_join_requests_user_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_owners: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          task_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_owners_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_owners_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_owners_user_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time_minutes: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          expected_time_minutes: number
          id: string
          organization_id: string
          owner_id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["task_visibility"]
        }
        Insert: {
          actual_time_minutes?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_time_minutes: number
          id?: string
          organization_id: string
          owner_id: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Update: {
          actual_time_minutes?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          expected_time_minutes?: number
          id?: string
          organization_id?: string
          owner_id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["task_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          organization_id: string
          started_at: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          organization_id: string
          started_at: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          organization_id?: string
          started_at?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          calendar_collapsed: boolean | null
          calendar_tasks_split_ratio: number | null
          created_at: string
          custom_columns: Json | null
          id: string
          organization_id: string
          show_weekends: boolean | null
          tasks_collapsed: boolean | null
          theme: string | null
          updated_at: string
          user_id: string
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          calendar_collapsed?: boolean | null
          calendar_tasks_split_ratio?: number | null
          created_at?: string
          custom_columns?: Json | null
          id?: string
          organization_id: string
          show_weekends?: boolean | null
          tasks_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          calendar_collapsed?: boolean | null
          calendar_tasks_split_ratio?: number | null
          created_at?: string
          custom_columns?: Json | null
          id?: string
          organization_id?: string
          show_weekends?: boolean | null
          tasks_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          default_schedule_visibility: Database["public"]["Enums"]["schedule_visibility"]
          default_task_visibility: Database["public"]["Enums"]["task_visibility"]
          display_name: string
          email: string
          id: string
          language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
          default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
          display_name: string
          email: string
          id: string
          language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
          default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
          display_name?: string
          email?: string
          id?: string
          language?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: { Args: { org_name: string }; Returns: string }
      create_task_with_owner: {
        Args: {
          p_description: string
          p_expected_time_minutes: number
          p_org_id: string
          p_scheduled_date: string
          p_status: string
          p_title: string
          p_user_id: string
          p_visibility: string
        }
        Returns: {
          actual_time_minutes: number
          created_at: string
          created_by: string
          deleted_at: string
          description: string
          expected_time_minutes: number
          id: string
          organization_id: string
          owner_id: string
          scheduled_date: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }[]
      }
      get_multi_member_blocks: {
        Args: {
          p_end_time: string
          p_member_ids: string[]
          p_org_id: string
          p_start_time: string
          p_user_id: string
          p_user_role: string
        }
        Returns: {
          created_at: string
          end_time: string
          id: string
          organization_id: string
          owner_display_name: string
          owner_email: string
          owner_id: string
          owner_schedule_visibility: string
          start_time: string
          task_expected_time_minutes: number
          task_id: string
          task_owners: Json
          task_status: string
          task_title: string
          task_visibility: string
          updated_at: string
        }[]
      }
      get_user_role: {
        Args: { org_id: string; uid: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      get_user_tasks: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: {
          actual_time_minutes: number
          created_at: string
          created_by: string
          deleted_at: string
          description: string
          expected_time_minutes: number
          id: string
          organization_id: string
          owner_id: string
          scheduled_date: string
          status: string
          task_owners: Json
          title: string
          updated_at: string
          visibility: string
        }[]
      }
      is_leader: { Args: { org_id: string; uid: string }; Returns: boolean }
      is_org_member: { Args: { org_id: string; uid: string }; Returns: boolean }
      soft_delete_task: { Args: { task_id: string }; Returns: Json }
    }
    Enums: {
      assignment_status: "pending" | "confirmed"
      member_role: "leader" | "employee"
      schedule_visibility: "private" | "team" | "leaders_only"
      task_status: "planned" | "in_progress" | "overrun" | "completed"
      task_visibility: "private" | "team" | "leaders_only"
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
      assignment_status: ["pending", "confirmed"],
      member_role: ["leader", "employee"],
      schedule_visibility: ["private", "team", "leaders_only"],
      task_status: ["planned", "in_progress", "overrun", "completed"],
      task_visibility: ["private", "team", "leaders_only"],
    },
  },
} as const
