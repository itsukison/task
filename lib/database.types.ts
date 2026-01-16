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
            organization_members: {
                Row: {
                    created_at: string
                    id: string
                    organization_id: string
                    role: Database["public"]["Enums"]["member_role"]
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    organization_id: string
                    role?: Database["public"]["Enums"]["member_role"]
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    organization_id?: string
                    role?: Database["public"]["Enums"]["member_role"]
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
                    status?: Database["public"]["Enums"]["task_status"]
                    title?: string
                    updated_at?: string
                    visibility?: Database["public"]["Enums"]["task_visibility"]
                }
                Relationships: [
                    {
                        foreignKeyName: "tasks_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            time_logs: {
                Row: {
                    created_at: string
                    duration_minutes: number
                    end_time: string
                    id: string
                    notes: string | null
                    organization_id: string
                    start_time: string
                    task_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    duration_minutes: number
                    end_time: string
                    id?: string
                    notes?: string | null
                    organization_id: string
                    start_time: string
                    task_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    duration_minutes?: number
                    end_time?: string
                    id?: string
                    notes?: string | null
                    organization_id?: string
                    start_time?: string
                    task_id?: string
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
                    created_at: string
                    default_schedule_visibility: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility: Database["public"]["Enums"]["task_visibility"]
                    id: string
                    organization_id: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
                    id?: string
                    organization_id: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
                    id?: string
                    organization_id?: string
                    updated_at?: string
                    user_id?: string
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
                    avatar_url: string | null
                    created_at: string
                    default_schedule_visibility: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility: Database["public"]["Enums"]["task_visibility"]
                    display_name: string
                    email: string
                    id: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
                    display_name: string
                    email: string
                    id: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
                    display_name?: string
                    email?: string
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            create_organization: {
                Args: { org_name: string }
                Returns: string
            }
            is_leader: {
                Args: { org_id: string; uid: string }
                Returns: boolean
            }
            is_org_member: {
                Args: { org_id: string; uid: string }
                Returns: boolean
            }
        }
        Enums: {
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

type DefaultSchema = Database[Exclude<keyof Database, "__InternalSupabase">]
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
            member_role: ["leader", "employee"],
            schedule_visibility: ["private", "team", "leaders_only"],
            task_status: ["planned", "in_progress", "overrun", "completed"],
            task_visibility: ["private", "team", "leaders_only"],
        },
    },
} as const
