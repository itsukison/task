'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';
import { Task, OwnerProfile } from '@/lib/types';

// Database row types
type DbTask = Database['public']['Tables']['tasks']['Row'];

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
        ownerId: row.owner_id,
        organizationId: row.organization_id,
        scheduledDate: row.scheduled_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export interface UseTeamTasksInput {
    scheduledDate?: string; // YYYY-MM-DD filter (optional)
}

export interface UseTeamTasksReturn {
    teamTasks: Task[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook to fetch ALL organization tasks (not just current user's).
 * Applies visibility filtering based on current user's role.
 */
export function useTeamTasks({ scheduledDate }: UseTeamTasksInput = {}): UseTeamTasksReturn {
    const { user, currentOrg } = useAuth();
    const [teamTasks, setTeamTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<'leader' | 'employee' | null>(null);

    // Use stable primitive IDs as deps instead of object references
    const orgId = currentOrg?.id;
    const userId = user?.id;

    // Store currentUserRole in a ref so fetchTeamTasks doesn't need it as a dep
    const currentUserRoleRef = useRef<'leader' | 'employee' | null>(null);
    useEffect(() => {
        currentUserRoleRef.current = currentUserRole;
    }, [currentUserRole]);

    // Store fetchTeamTasks in a ref so the subscription doesn't re-create on every callback change
    const fetchTeamTasksRef = useRef<() => Promise<void>>(async () => {});

    // Fetch current user's role in the organization
    const fetchCurrentUserRole = useCallback(async () => {
        if (!orgId || !userId) return;

        try {
            const { data, error: roleError } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', orgId)
                .eq('user_id', userId)
                .single();

            if (roleError) throw roleError;
            setCurrentUserRole(data.role);
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    }, [orgId, userId]);

    // Fetch all organization tasks with visibility filtering
    const fetchTeamTasks = useCallback(async () => {
        if (!orgId || !userId) {
            setTeamTasks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);

            // Build query for all org tasks
            let query = supabase
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
                .eq('organization_id', orgId)
                .is('deleted_at', null)
                .order('created_at', { ascending: true });

            // Add date filter if provided
            if (scheduledDate) {
                query = query.eq('scheduled_date', scheduledDate);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Read role from ref (avoids having currentUserRole as a dep)
            const role = currentUserRoleRef.current;

            // Apply visibility filtering based on user role
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filteredData = (data || []).filter((task: any) => {
                // Always show own tasks
                if (task.owner_id === userId) return true;

                // Check visibility
                switch (task.visibility) {
                    case 'private':
                        return false;
                    case 'team':
                        return true;
                    case 'leaders_only':
                        return role === 'leader';
                    default:
                        return false;
                }
            });

            // Transform to frontend Task type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformedTasks = filteredData.map((row: any) => dbToTask(row));
            setTeamTasks(transformedTasks);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch team tasks';
            setError(message);
            console.error('Error fetching team tasks:', err);
        } finally {
            setLoading(false);
        }
    }, [orgId, userId, scheduledDate]);

    // Keep the ref in sync with the latest fetchTeamTasks callback
    useEffect(() => {
        fetchTeamTasksRef.current = fetchTeamTasks;
    }, [fetchTeamTasks]);

    // Initial fetch of user role
    useEffect(() => {
        fetchCurrentUserRole();
    }, [fetchCurrentUserRole]);

    // Fetch tasks once the role is loaded (and whenever stable deps change)
    useEffect(() => {
        if (currentUserRole !== null) {
            fetchTeamTasks();
        }
    }, [fetchTeamTasks, currentUserRole]);

    // Subscribe to real-time changes — depends only on orgId (stable string)
    useEffect(() => {
        if (!orgId) return;

        const channel = supabase
            .channel(`team_tasks:${orgId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'tasks',
                    filter: `organization_id=eq.${orgId}`,
                },
                () => {
                    // Use ref so the subscription never needs to be torn down
                    // just because the callback reference changed
                    fetchTeamTasksRef.current();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgId]);

    return {
        teamTasks,
        loading,
        error,
        refetch: fetchTeamTasks,
    };
}
