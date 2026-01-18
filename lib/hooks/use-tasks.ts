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
function dbToTask(row: DbTask & { task_owners?: Array<{ user_profiles: OwnerProfile }> }): Task {
    const owners = row.task_owners?.map(to => to.user_profiles) ?? [];
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        expectedTime: row.expected_time_minutes,
        actualTime: row.actual_time_minutes,
        visibility: row.visibility,
        owners,
        ownerId: row.owner_id, // Deprecated but kept for backward compatibility
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
    ownerIds?: string[];  // Array of user IDs for multi-owner support
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
                    task_owners (
                        user_profiles!task_owners_user_profiles_fkey (
                            id,
                            display_name,
                            email
                        )
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
            console.error('Full tasks error:', JSON.stringify(err, null, 2));
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
                task_owners (
                    user_profiles!task_owners_user_profiles_fkey (
                        id,
                        display_name,
                        email
                    )
                )
            `)
            .single();

        if (insertError) {
            throw new Error(`Failed to create task: ${insertError.message}`);
        }

        // Add creator as initial owner in task_owners
        const { error: ownerError } = await supabase
            .from('task_owners')
            .insert({
                task_id: data.id,
                user_id: user.id,
                organization_id: currentOrg.id,
            });

        if (ownerError) {
            console.error('Failed to add initial owner:', ownerError);
        }

        // Refetch to get the updated owners
        await fetchTasks();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTask = dbToTask(data as any);
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

        // Handle owner updates if provided
        if (input.ownerIds !== undefined) {
            // Delete existing owners
            await supabase
                .from('task_owners')
                .delete()
                .eq('task_id', id);

            // Insert new owners
            if (input.ownerIds.length > 0) {
                const ownerInserts = input.ownerIds.map(userId => ({
                    task_id: id,
                    user_id: userId,
                    organization_id: currentOrg.id,
                }));

                await supabase
                    .from('task_owners')
                    .insert(ownerInserts);
            }
        }

        // Refetch to get updated data including owners
        await fetchTasks();
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
