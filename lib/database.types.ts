export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
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
                    id: string
                    organization_id: string
                    tasks_collapsed: boolean | null
                    updated_at: string
                    user_id: string
                    work_end_time: string | null
                    work_start_time: string | null
                }
                Insert: {
                    calendar_collapsed?: boolean | null
                    calendar_tasks_split_ratio?: number | null
                    created_at?: string
                    id?: string
                    organization_id: string
                    tasks_collapsed?: boolean | null
                    updated_at?: string
                    user_id: string
                    work_end_time?: string | null
                    work_start_time?: string | null
                }
                Update: {
                    calendar_collapsed?: boolean | null
                    calendar_tasks_split_ratio?: number | null
                    created_at?: string
                    id?: string
                    organization_id?: string
                    tasks_collapsed?: boolean | null
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
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    default_schedule_visibility?: Database["public"]["Enums"]["schedule_visibility"]
                    default_task_visibility?: Database["public"]["Enums"]["task_visibility"]
                    display_name: string
                    email: string
                    id: string
                    updated_at?: string
                }
                Update: {
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
            get_user_role: {
                Args: {
                    org_id: string
                    uid: string
                }
                Returns: Database["public"]["Enums"]["member_role"]
            }
            is_leader: {
                Args: {
                    org_id: string
                    uid: string
                }
                Returns: boolean
            }
            is_org_member: {
                Args: {
                    org_id: string
                    uid: string
                }
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

type PublicSchema = Database[keyof Database]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
