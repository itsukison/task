'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';
import { Task, TaskStatus, TaskVisibility, OwnerProfile, AssignmentStatus } from '@/lib/types';

// Database row types
type DbTask = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

// Type for task_owner join result with status
interface TaskOwnerJoin {
    id: string;
    status: AssignmentStatus;
    assigned_by: string | null;
    user_profiles: {
        id: string;
        display_name: string;
        email: string;
    };
}

// Transform database row to frontend Task
function dbToTask(row: DbTask & { task_owners?: TaskOwnerJoin[] }): Task {
    const owners: OwnerProfile[] = row.task_owners?.map(to => ({
        id: to.user_profiles.id,
        display_name: to.user_profiles.display_name,
        email: to.user_profiles.email,
        status: to.status,
        assignedBy: to.assigned_by ?? undefined,
    })) ?? [];
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
    acceptAssignment: (taskId: string) => Promise<void>;
    rejectAssignment: (taskId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
    const { user, currentOrg } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks with owner JOIN
    const fetchTasks = useCallback(async () => {
        if (!currentOrg || !user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            // Fetch tasks where user is creator OR is in task_owners (any status)
            const { data, error: fetchError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    task_owners (
                        id,
                        status,
                        assigned_by,
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

            // Filter to only include tasks where user is primary owner or in task_owners
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filteredData = (data || []).filter((task: any) => {
                // Include if user is the primary owner
                if (task.owner_id === user.id) return true;
                // Include if user is in task_owners (any status)
                return task.task_owners?.some((to: TaskOwnerJoin) => to.user_profiles.id === user.id) ?? false;
            });

            if (fetchError) throw fetchError;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedTasks = filteredData.map((row: any) =>
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
    }, [currentOrg, user]);

    // Initial fetch and real-time subscription
    useEffect(() => {
        if (!currentOrg || !user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        fetchTasks();

        // Subscribe to real-time changes on tasks
        const tasksChannel = supabase
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

        // Subscribe to real-time changes on task_owners (for assignment updates)
        const taskOwnersChannel = supabase
            .channel(`task_owners:${currentOrg.id}:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'task_owners',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                () => {
                    // Refetch when any task_owner changes in the org
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(taskOwnersChannel);
        };
    }, [currentOrg, user, fetchTasks]);

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

        // Add creator as initial owner in task_owners (self-assignment = confirmed)
        const { error: ownerError } = await supabase
            .from('task_owners')
            .insert({
                task_id: data.id,
                user_id: user.id,
                organization_id: currentOrg.id,
                status: 'confirmed',
                assigned_by: user.id,
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

        // Handle owner updates if provided - use smart logic to preserve confirmed status
        if (input.ownerIds !== undefined && user) {
            // Get existing owners with their status
            const { data: existingOwners } = await supabase
                .from('task_owners')
                .select('user_id, status')
                .eq('task_id', id);

            const existingUserIds = new Set(existingOwners?.map(o => o.user_id) || []);
            const newUserIds = new Set(input.ownerIds);

            // Remove owners not in new list
            const toRemove = [...existingUserIds].filter(uid => !newUserIds.has(uid));
            if (toRemove.length > 0) {
                await supabase
                    .from('task_owners')
                    .delete()
                    .eq('task_id', id)
                    .in('user_id', toRemove);
            }

            // Add new owners (pending unless self-assignment)
            const toAdd = [...newUserIds].filter(uid => !existingUserIds.has(uid));
            if (toAdd.length > 0) {
                const ownerInserts = toAdd.map(userId => ({
                    task_id: id,
                    user_id: userId,
                    organization_id: currentOrg.id,
                    assigned_by: user.id,
                    status: userId === user.id ? 'confirmed' as const : 'pending' as const,
                }));

                await supabase
                    .from('task_owners')
                    .insert(ownerInserts);
            }
        }

        // Refetch to get updated data including owners
        await fetchTasks();
    }, [currentOrg, user, fetchTasks]);

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

    // Accept a pending assignment
    const acceptAssignment = useCallback(async (taskId: string): Promise<void> => {
        if (!user || !currentOrg) throw new Error('Must be authenticated');

        // Optimistic update
        setTasks(prev => prev.map(task => {
            if (task.id !== taskId) return task;
            return {
                ...task,
                owners: task.owners.map(o =>
                    o.id === user.id ? { ...o, status: 'confirmed' as const } : o
                ),
            };
        }));

        const { error } = await supabase
            .from('task_owners')
            .update({ status: 'confirmed' })
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .eq('organization_id', currentOrg.id);

        if (error) {
            // Revert on error
            await fetchTasks();
            throw new Error(`Failed to accept assignment: ${error.message}`);
        }
    }, [user, currentOrg, fetchTasks]);

    // Reject a pending assignment
    const rejectAssignment = useCallback(async (taskId: string): Promise<void> => {
        if (!user || !currentOrg) throw new Error('Must be authenticated');

        // Delete any calendar blocks the user created for this task
        await supabase
            .from('calendar_blocks')
            .delete()
            .eq('task_id', taskId)
            .eq('owner_id', user.id);

        // Delete the task_owner record
        const { error } = await supabase
            .from('task_owners')
            .delete()
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .eq('organization_id', currentOrg.id);

        if (error) {
            throw new Error(`Failed to reject assignment: ${error.message}`);
        }

        // Refetch to update state
        await fetchTasks();
    }, [user, currentOrg, fetchTasks]);

    return {
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        deleteTask,
        acceptAssignment,
        rejectAssignment,
        refetch: fetchTasks,
    };
}
