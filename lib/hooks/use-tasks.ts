'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';
import { Task, TaskStatus, TaskVisibility, OwnerProfile } from '@/lib/types';

// Database row types
type DbTask = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Transform database row to frontend Task
function dbToTask(row: DbTask & { owner?: OwnerProfile | null }): Task {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        expectedTime: row.expected_time_minutes,
        actualTime: row.actual_time_minutes,
        visibility: row.visibility,
        owner: row.owner ?? null,
        ownerId: row.owner_id,
        organizationId: row.organization_id,
        scheduledDate: row.scheduled_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

// Input for creating a task
export interface CreateTaskInput {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    expectedTime: number;
    visibility?: TaskVisibility;
    scheduledDate?: string | null;  // ISO date string (YYYY-MM-DD)
}

// Input for updating a task
export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    expectedTime?: number;
    actualTime?: number;
    visibility?: TaskVisibility;
    scheduledDate?: string | null;  // ISO date string (YYYY-MM-DD)
}

export interface UseTasksReturn {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    createTask: (input: CreateTaskInput) => Promise<Task>;
    updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
    const { user, currentOrg } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks with owner JOIN
    const fetchTasks = useCallback(async () => {
        if (!currentOrg) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    owner:user_profiles!tasks_owner_id_fkey (
                        id,
                        display_name,
                        email
                    )
                `)
                .eq('organization_id', currentOrg.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedTasks = (data || []).map((row: any) =>
                dbToTask(row)
            );
            setTasks(transformedTasks);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
            setError(message);
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg]);

    // Initial fetch and real-time subscription
    useEffect(() => {
        if (!currentOrg) {
            setTasks([]);
            setLoading(false);
            return;
        }

        fetchTasks();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`tasks:${currentOrg.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                () => {
                    // Refetch on any change to get the joined owner data
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, fetchTasks]);

    // Create a new task
    const createTask = useCallback(async (input: CreateTaskInput): Promise<Task> => {
        if (!user || !currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        const insertData: TaskInsert = {
            organization_id: currentOrg.id,
            owner_id: user.id,
            created_by: user.id,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? 'planned',
            expected_time_minutes: input.expectedTime,
            visibility: input.visibility ?? 'leaders_only',
            scheduled_date: input.scheduledDate ?? null,
        };

        const { data, error: insertError } = await supabase
            .from('tasks')
            .insert(insertData)
            .select(`
                *,
                owner:user_profiles!tasks_owner_id_fkey (
                    id,
                    display_name,
                    email
                )
            `)
            .single();

        if (insertError) {
            throw new Error(`Failed to create task: ${insertError.message}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTask = dbToTask(data as any);

        // Optimistically add to state
        setTasks(prev => [...prev, newTask]);

        return newTask;
    }, [user, currentOrg]);

    // Update a task
    const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<void> => {
        if (!currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // 🔍 DIAGNOSTIC LOGGING
        console.group('✏️ UPDATE TASK DEBUG');
        console.log('Task ID:', id);
        console.log('Current Org ID:', currentOrg.id);
        console.log('Update input:', input);
        console.groupEnd();

        const updateData: TaskUpdate = {};

        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.expectedTime !== undefined) updateData.expected_time_minutes = input.expectedTime;
        if (input.actualTime !== undefined) updateData.actual_time_minutes = input.actualTime;
        if (input.visibility !== undefined) updateData.visibility = input.visibility;
        if (input.scheduledDate !== undefined) updateData.scheduled_date = input.scheduledDate;

        const { error: updateError } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', currentOrg.id);

        if (updateError) {
            console.error('❌ UPDATE ERROR:', updateError);
            throw new Error(`Failed to update task: ${updateError.message}`);
        }

        // Optimistically update state
        setTasks(prev => prev.map(task => {
            if (task.id !== id) return task;
            return {
                ...task,
                title: input.title ?? task.title,
                description: input.description !== undefined ? input.description : task.description,
                status: input.status ?? task.status,
                expectedTime: input.expectedTime ?? task.expectedTime,
                actualTime: input.actualTime ?? task.actualTime,
                visibility: input.visibility ?? task.visibility,
                scheduledDate: input.scheduledDate !== undefined ? input.scheduledDate : task.scheduledDate,
            };
        }));
    }, [currentOrg]);

    // Soft delete a task using RPC function
    const deleteTask = useCallback(async (id: string): Promise<void> => {
        if (!currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // Use RPC function to perform soft delete (bypasses RLS with internal auth check)
        const { data: deleteResult, error: deleteError } = await supabase.rpc('soft_delete_task', {
            task_id: id
        });

        if (deleteError) {
            throw new Error(`Failed to delete task: ${deleteError.message}`);
        }

        // Check the result from the function
        if (deleteResult && !deleteResult.success) {
            throw new Error(`Failed to delete task: ${deleteResult.error}`);
        }

        // Optimistically remove from state
        setTasks(prev => prev.filter(task => task.id !== id));
    }, [currentOrg]);

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        refetch: fetchTasks,
    };
}
