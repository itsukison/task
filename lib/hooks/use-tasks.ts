'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
        parentTaskId: (row as any).parent_task_id ?? null,
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
    parentTaskId?: string | null;
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
    createTask: (input: CreateTaskInput) => Task;
    updateTask: (id: string, input: UpdateTaskInput) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    acceptAssignment: (taskId: string) => Promise<void>;
    rejectAssignment: (taskId: string) => Promise<void>;
    resolveApiId: (id: string) => string | null;
    /** Resolve an optimistic ID to the current canonical ID (real if swapped, else passthrough). */
    resolveId: (id: string) => string;
    /** Await the real server ID for an optimistic task. Resolves null on timeout or insert failure. */
    waitForPersist: (optimisticId: string, timeoutMs?: number) => Promise<string | null>;
    refetch: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
    const { user, currentOrg, profile } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Keep a ref in sync with tasks so callbacks can read the latest snapshot
    const tasksRef = useRef<Task[]>(tasks);
    tasksRef.current = tasks;

    // Flag to suppress realtime refetches during our own mutations
    const isMutatingRef = useRef(false);
    // Debounce timer for realtime refetches
    const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Track optimistic IDs cancelled before insert resolves
    const cancelledOptimisticIdsRef = useRef<Set<string>>(new Set());
    // Maps optimistic ID → real server ID after persist completes
    const optimisticToRealRef = useRef<Map<string, string>>(new Map());
    // Maps optimistic ID → array of resolve callbacks waiting for persist
    const persistResolversRef = useRef<Map<string, Array<(realId: string) => void>>>(new Map());

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

            // Merge: keep optimistic rows that haven't persisted yet
            setTasks(prev => {
                const serverIds = new Set(transformedTasks.map((t: Task) => t.id));
                const pendingOptimistic = prev.filter(
                    t => t.id.startsWith('optimistic-') && !serverIds.has(t.id)
                );
                return [...transformedTasks, ...pendingOptimistic];
            });
        } catch (err: unknown) {
            console.error('Full tasks error:', JSON.stringify(err, null, 2));
            const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
            setError(message);
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg, user]);

    // Debounced refetch for realtime — skips if we're currently mutating
    const debouncedRealtimeFetch = useCallback(() => {
        if (isMutatingRef.current) return;
        if (realtimeDebounceRef.current) {
            clearTimeout(realtimeDebounceRef.current);
        }
        realtimeDebounceRef.current = setTimeout(() => {
            realtimeDebounceRef.current = null;
            fetchTasks();
        }, 800);
    }, [fetchTasks]);

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
                    debouncedRealtimeFetch();
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
                    debouncedRealtimeFetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(tasksChannel);
            supabase.removeChannel(taskOwnersChannel);
            if (realtimeDebounceRef.current) {
                clearTimeout(realtimeDebounceRef.current);
            }
        };
    }, [currentOrg, user, fetchTasks, debouncedRealtimeFetch]);

    // Queue of pending updates for tasks that haven't persisted yet.
    // Maps optimistic ID -> array of UpdateTaskInput patches.
    const pendingUpdatesRef = useRef<Map<string, UpdateTaskInput[]>>(new Map());

    // Persist a task to Supabase in the background (does NOT block the caller)
    const persistTaskInBackground = useCallback(async (optimisticId: string, input: CreateTaskInput) => {
        if (!user || !currentOrg) return;

        isMutatingRef.current = true;

        try {
            const insertData: TaskInsert = {
                organization_id: currentOrg.id,
                owner_id: user.id,
                created_by: user.id,
                title: input.title,
                description: input.description ?? null,
                status: input.status ?? 'planned',
                expected_time_minutes: input.expectedTime,
                visibility: input.visibility ?? profile?.default_task_visibility ?? 'team',
                scheduled_date: input.scheduledDate ?? null,
                ...(input.parentTaskId ? { parent_task_id: input.parentTaskId } : {}),
            } as TaskInsert;

            const { data, error: insertError } = await supabase
                .from('tasks')
                .insert(insertData)
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
                .single();

            if (insertError) {
                // Mark the optimistic row with persistError instead of removing it
                setTasks(prev => prev.map(t =>
                    t.id === optimisticId ? { ...t, persistError: true } : t
                ));
                console.error(`Failed to create task: ${insertError.message}`);
                // Unblock any waitForPersist callers with empty string (signals failure)
                const failResolvers = persistResolversRef.current.get(optimisticId);
                if (failResolvers) {
                    failResolvers.forEach(fn => fn(''));
                    persistResolversRef.current.delete(optimisticId);
                }
                return;
            }

            // Handle deletion that happened before persist completed
            if (cancelledOptimisticIdsRef.current.has(optimisticId)) {
                cancelledOptimisticIdsRef.current.delete(optimisticId);
                // Unblock any waitForPersist callers (task was cancelled — signal failure)
                const cancelResolvers = persistResolversRef.current.get(optimisticId);
                if (cancelResolvers) {
                    cancelResolvers.forEach(fn => fn(''));
                    persistResolversRef.current.delete(optimisticId);
                }
                try {
                    await supabase
                        .from('calendar_blocks')
                        .delete()
                        .eq('task_id', data.id);
                    await supabase
                        .from('task_owners')
                        .delete()
                        .eq('task_id', data.id);
                    await supabase
                        .from('tasks')
                        .delete()
                        .eq('id', data.id);
                } catch (cleanupError) {
                    console.error('Failed to clean up cancelled task:', cleanupError);
                }
                return;
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

            // Re-check cancellation — deleteTask may have set the flag during the
            // task_owners insert above (race window between the first check and the
            // optimisticToRealRef mapping below).
            if (cancelledOptimisticIdsRef.current.has(optimisticId)) {
                cancelledOptimisticIdsRef.current.delete(optimisticId);
                const cancelResolvers = persistResolversRef.current.get(optimisticId);
                if (cancelResolvers) {
                    cancelResolvers.forEach(fn => fn(''));
                    persistResolversRef.current.delete(optimisticId);
                }
                try {
                    await supabase
                        .from('calendar_blocks')
                        .delete()
                        .eq('task_id', data.id);
                    await supabase
                        .from('task_owners')
                        .delete()
                        .eq('task_id', data.id);
                    await supabase
                        .from('tasks')
                        .delete()
                        .eq('id', data.id);
                } catch (cleanupError) {
                    console.error('Failed to clean up cancelled task:', cleanupError);
                }
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const serverTask = dbToTask(data as any);

            // Swap optimistic ID → real server ID.
            // Record the mapping so in-flight references (drag data, editing state)
            // can resolve the stale optimistic ID to the canonical one.
            optimisticToRealRef.current.set(optimisticId, serverTask.id);

            // Notify any waitForPersist callers that the real ID is available
            const successResolvers = persistResolversRef.current.get(optimisticId);
            if (successResolvers) {
                successResolvers.forEach(fn => fn(serverTask.id));
                persistResolversRef.current.delete(optimisticId);
            }

            // Replace optimistic task with server data using the real ID.
            // Preserve the optimistic ID as _reactKey so React doesn't unmount/remount the row.
            // If the server row hasn't populated owners yet, preserve the optimistic owners.
            setTasks(prev => prev.map(t => {
                if (t.id !== optimisticId) return t;
                const owners = serverTask.owners.length > 0 ? serverTask.owners : t.owners;
                return { ...serverTask, owners, _reactKey: optimisticId };
            }));

            // Flush any updates that were queued while the task was still optimistic
            const queued = pendingUpdatesRef.current.get(optimisticId);
            if (queued && queued.length > 0) {
                pendingUpdatesRef.current.delete(optimisticId);
                const merged: UpdateTaskInput = {};
                for (const patch of queued) Object.assign(merged, patch);
                // Fire the real update against the server ID
                const updateData: TaskUpdate = {};
                if (merged.title !== undefined) updateData.title = merged.title;
                if (merged.description !== undefined) updateData.description = merged.description;
                if (merged.status !== undefined) updateData.status = merged.status;
                if (merged.expectedTime !== undefined) updateData.expected_time_minutes = merged.expectedTime;
                if (merged.actualTime !== undefined) updateData.actual_time_minutes = merged.actualTime;
                if (merged.visibility !== undefined) updateData.visibility = merged.visibility;
                if (merged.scheduledDate !== undefined) updateData.scheduled_date = merged.scheduledDate;
                if (Object.keys(updateData).length > 0) {
                    await supabase
                        .from('tasks')
                        .update(updateData)
                        .eq('id', serverTask.id)
                        .eq('organization_id', currentOrg.id);
                }
            }
        } finally {
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 500);
        }
    }, [user, currentOrg, profile]);

    // Create a new task — returns immediately with optimistic data
    const createTask = useCallback((input: CreateTaskInput): Task => {
        if (!user || !currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        const optimisticId = `optimistic-${crypto.randomUUID()}`;
        const now = new Date().toISOString();
        const optimisticTask: Task = {
            id: optimisticId,
            title: input.title,
            description: input.description ?? null,
            status: input.status ?? 'planned',
            expectedTime: input.expectedTime,
            actualTime: 0,
            visibility: input.visibility ?? profile?.default_task_visibility ?? 'team',
            owners: [{
                id: user.id,
                display_name: profile?.display_name ?? '',
                email: user.email ?? '',
                status: 'confirmed',
                assignedBy: user.id,
            }],
            ownerId: user.id,
            organizationId: currentOrg.id,
            scheduledDate: input.scheduledDate ?? null,
            parentTaskId: input.parentTaskId ?? null,
            createdAt: now,
            updatedAt: now,
        };

        // Insert into state immediately
        setTasks(prev => [...prev, optimisticTask]);

        // Persist in background — does NOT block the return
        persistTaskInBackground(optimisticId, input);

        return optimisticTask;
    }, [user, currentOrg, profile, persistTaskInBackground]);

    // Resolve an optimistic ID to the real server ID, or null if not yet persisted.
    // After swap-on-persist, non-optimistic IDs are always real — return as-is.
    const resolveApiId = useCallback((id: string): string | null => {
        if (id.startsWith('optimistic-')) {
            return optimisticToRealRef.current.get(id) ?? null;
        }
        return id;
    }, []);

    // Resolve an optimistic ID to the current canonical ID (real if swapped, else passthrough).
    // Never returns null — safe for UI lookups and prop plumbing.
    const resolveId = useCallback((id: string): string => {
        if (id.startsWith('optimistic-')) {
            return optimisticToRealRef.current.get(id) ?? id;
        }
        return id;
    }, []);

    // Update a task
    const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<void> => {
        if (!currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // Resolve to the canonical ID — handles stale optimistic IDs from closures
        const canonicalId = resolveId(id);

        // Optimistic update so UI responds immediately
        setTasks(prev => prev.map(t => {
            if (t.id !== canonicalId) return t;
            return {
                ...t,
                ...(input.title !== undefined && { title: input.title }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.expectedTime !== undefined && { expectedTime: input.expectedTime }),
                ...(input.scheduledDate !== undefined && { scheduledDate: input.scheduledDate }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.actualTime !== undefined && { actualTime: input.actualTime }),
                ...(input.visibility !== undefined && { visibility: input.visibility }),
            };
        }));

        // If the task hasn't persisted yet, queue updates for later
        const apiId = resolveApiId(id);
        if (apiId === null) {
            const existing = pendingUpdatesRef.current.get(id) ?? [];
            existing.push(input);
            pendingUpdatesRef.current.set(id, existing);
            return;
        }

        // Suppress realtime refetches during our mutation
        isMutatingRef.current = true;

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
            .eq('id', apiId)
            .eq('organization_id', currentOrg.id);

        if (updateError) {
            throw new Error(`Failed to update task: ${updateError.message}`);
        }

        // Handle owner updates if provided - use smart logic to preserve confirmed status
        if (input.ownerIds !== undefined && user) {
            // Get existing owners with their status
            const { data: existingOwners } = await supabase
                .from('task_owners')
                .select('user_id, status')
                .eq('task_id', apiId);

            const existingUserIds = new Set(existingOwners?.map(o => o.user_id) || []);
            const newUserIds = new Set(input.ownerIds);

            // Remove owners not in new list
            const toRemove = [...existingUserIds].filter(uid => !newUserIds.has(uid));
            if (toRemove.length > 0) {
                await supabase
                    .from('task_owners')
                    .delete()
                    .eq('task_id', apiId)
                    .in('user_id', toRemove);
            }

            // Add new owners (pending unless self-assignment)
            const toAdd = [...newUserIds].filter(uid => !existingUserIds.has(uid));
            if (toAdd.length > 0) {
                const ownerInserts = toAdd.map(userId => ({
                    task_id: apiId,
                    user_id: userId,
                    organization_id: currentOrg.id,
                    assigned_by: user.id,
                    status: userId === user.id ? 'confirmed' as const : 'pending' as const,
                }));

                const { error: insertError } = await supabase
                    .from('task_owners')
                    .insert(ownerInserts)
                    .select();

                if (insertError) {
                    console.error('Failed to insert owners:', insertError);
                }
            }
        }

        // For owner changes, do a deferred refetch to pick up the new JOIN data
        if (input.ownerIds !== undefined) {
            setTimeout(() => {
                isMutatingRef.current = false;
                fetchTasks();
            }, 200);
        } else {
            // Re-enable realtime refetches after a short delay
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 500);
        }
    }, [currentOrg, user, fetchTasks, resolveApiId, resolveId]);

    // Await the real server ID for an optimistic task.
    // Resolves the server ID when persist completes, or null on timeout/failure.
    const waitForPersist = useCallback(
        (optimisticId: string, timeoutMs = 5000): Promise<string | null> => {
            // Already resolved — return immediately
            const existing = optimisticToRealRef.current.get(optimisticId);
            if (existing) return Promise.resolve(existing);
            // Non-optimistic ID — pass through as-is
            if (!optimisticId.startsWith('optimistic-')) return Promise.resolve(optimisticId);

            return new Promise<string | null>((resolve) => {
                let resolver: (realId: string) => void;

                const timer = setTimeout(() => {
                    // Timed out — clean up and resolve null
                    const pending = persistResolversRef.current.get(optimisticId);
                    if (pending) {
                        const idx = pending.indexOf(resolver);
                        if (idx >= 0) pending.splice(idx, 1);
                        if (pending.length === 0) persistResolversRef.current.delete(optimisticId);
                    }
                    resolve(null);
                }, timeoutMs);

                resolver = (realId: string) => {
                    clearTimeout(timer);
                    resolve(realId || null); // empty string signals failure → null
                };

                // Double-check in case it resolved between the top check and now
                const check = optimisticToRealRef.current.get(optimisticId);
                if (check) { clearTimeout(timer); resolve(check); return; }

                const list = persistResolversRef.current.get(optimisticId) ?? [];
                list.push(resolver);
                persistResolversRef.current.set(optimisticId, list);
            });
        },
        [] // reads refs only — stable reference forever
    );

    // Soft delete a task using RPC function — optimistic removal first
    const deleteTask = useCallback(async (id: string): Promise<void> => {
        if (!currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // Resolve stale optimistic IDs that have already been swapped to real IDs.
        const canonicalId = resolveId(id);

        // If the ID is still optimistic (persist hasn't completed yet),
        // cancel it so persistTaskInBackground cleans up on completion.
        if (canonicalId.startsWith('optimistic-')) {
            cancelledOptimisticIdsRef.current.add(canonicalId);
            pendingUpdatesRef.current.delete(canonicalId);
            setTasks(prev => prev.filter(task => task.id !== canonicalId));

            // Fallback: if persistTaskInBackground already passed its cancellation
            // check, it won't see the flag. Wait for the real ID and hard delete directly.
            waitForPersist(canonicalId).then(async (realId) => {
                if (realId) {
                    try {
                        await supabase.from('calendar_blocks').delete().eq('task_id', realId);
                        await supabase.from('task_owners').delete().eq('task_id', realId);
                        await supabase.from('tasks').delete().eq('id', realId);
                    } catch (err) {
                        console.error('Fallback cleanup failed:', err);
                    }
                }
            });

            return;
        }

        const taskToDelete = tasks.find(t => t.id === canonicalId);

        // The ID is a real server UUID (post-swap or never-optimistic)
        const apiId = canonicalId;

        // Optimistically remove from state BEFORE async operations
        const previousTasks = tasks;
        setTasks(prev => prev.filter(task => task.id !== canonicalId));

        // Suppress realtime refetches during deletion
        isMutatingRef.current = true;

        try {
            // CRITICAL: Delete associated calendar blocks BEFORE soft-deleting the task
            const { error: blocksDeleteError } = await supabase
                .from('calendar_blocks')
                .delete()
                .eq('task_id', apiId);

            if (blocksDeleteError) {
                // Revert optimistic removal
                setTasks(previousTasks);
                throw new Error(`Failed to delete calendar blocks: ${blocksDeleteError.message}`);
            }

            // Use RPC function to perform soft delete (bypasses RLS with internal auth check)
            const { data: deleteResult, error: deleteError } = await supabase.rpc('soft_delete_task', {
                task_id: apiId
            });

            if (deleteError) {
                setTasks(previousTasks);
                throw new Error(`Failed to delete task: ${deleteError.message}`);
            }

            // Check the result from the function
            const result = deleteResult as { success: boolean; error?: string } | null;
            if (result && !result.success) {
                setTasks(previousTasks);
                throw new Error(`Failed to delete task: ${result.error}`);
            }
        } finally {
            setTimeout(() => {
                isMutatingRef.current = false;
            }, 500);
        }
    }, [currentOrg, tasks, resolveId, waitForPersist]);

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

        const { data, error } = await supabase
            .from('task_owners')
            .update({ status: 'confirmed' })
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .eq('organization_id', currentOrg.id)
            .select();

        if (error) {
            // Revert on error
            await fetchTasks();
            throw new Error(`Failed to accept assignment: ${error.message}`);
        }

        // Refetch to ensure consistency
        await fetchTasks();
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
        resolveApiId,
        resolveId,
        waitForPersist,
        refetch: fetchTasks,
    };
}
