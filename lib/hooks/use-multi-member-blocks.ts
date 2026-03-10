'use client';

import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { MultiMemberBlock } from '@/lib/types';
import { Database } from '@/lib/database.types';

// Database row types
type DbCalendarBlock = Database['public']['Tables']['calendar_blocks']['Row'];

// Color palette for different users (Notion-style subtle colors)
const USER_COLORS = [
    '#FF5500', // Orange (primary)
    '#0066FF', // Blue
    '#00AA66', // Green
    '#AA00FF', // Purple
    '#FF0066', // Pink
    '#00AAFF', // Cyan
    '#FFAA00', // Amber
    '#66AA00', // Lime
];

// Transform database row to MultiMemberBlock
function dbToMultiMemberBlock(
    row: DbCalendarBlock & {
        user_profiles?: { display_name: string; default_schedule_visibility: string; email: string } | null;
    },
    colorIndex: number,
    taskOwnersMap: Map<string, Array<{ id: string; display_name: string; email: string; status: 'pending' | 'confirmed' }>>,
    tasksMap: Map<string, { id: string; title: string; status: string; expected_time_minutes: number | null; visibility: string }>
): MultiMemberBlock {
    const taskData = tasksMap.get(row.task_id);

    return {
        id: row.id,
        taskId: row.task_id,
        startTime: row.start_time,
        endTime: row.end_time,
        ownerId: row.owner_id,
        organizationId: row.organization_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ownerName: row.user_profiles?.display_name || 'Unknown',
        ownerColor: USER_COLORS[colorIndex % USER_COLORS.length],
        // Manually construct task from tasksMap and taskOwnersMap
        task: taskData ? {
            id: taskData.id,
            title: taskData.title || '',
            description: null,
            status: (taskData.status as 'planned' | 'in_progress' | 'overrun' | 'completed') || 'planned',
            expectedTime: taskData.expected_time_minutes ?? 30,
            actualTime: 0,
            visibility: 'team' as const,
            owners: taskOwnersMap.get(row.task_id) || [],
            ownerId: row.owner_id,
            organizationId: row.organization_id,
            scheduledDate: null,
            parentTaskId: null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        } : undefined,
    };
}

export interface UseMultiMemberBlocksInput {
    selectedMemberIds: string[];
    viewDate: Date;           // The center date for the week view
    daysToShow?: number;      // Number of days shown (default: 5)
}

export interface UseMultiMemberBlocksReturn {
    multiMemberBlocks: MultiMemberBlock[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useMultiMemberBlocks({
    selectedMemberIds,
    viewDate,
    daysToShow = 5,
}: UseMultiMemberBlocksInput): UseMultiMemberBlocksReturn {
    const { user, currentOrg } = useAuth();
    const [multiMemberBlocks, setMultiMemberBlocks] = useState<MultiMemberBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch calendar blocks for selected members
    const fetchMultiMemberBlocks = useCallback(async () => {
        if (!currentOrg || !user || selectedMemberIds.length === 0) {
            setMultiMemberBlocks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);

            // Calculate 3-week range (prev + current + next) to match calendar's allDisplayedDays
            const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
            const fetchStart = subWeeks(currentWeekStart, 1); // Mon of previous week
            const fetchEnd = addDays(addWeeks(currentWeekStart, 1), 6); // Sun of next week

            fetchStart.setHours(0, 0, 0, 0);
            fetchEnd.setHours(23, 59, 59, 999);

            // Step 1: Fetch blocks owned by selected members
            const { data: ownedBlocks, error: ownedError } = await supabase
                .from('calendar_blocks')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .in('owner_id', selectedMemberIds)
                .gte('start_time', fetchStart.toISOString())
                .lte('start_time', fetchEnd.toISOString())
                .order('start_time', { ascending: true });

            if (ownedError) throw ownedError;

            // Step 2: Fetch task assignments for selected members
            const { data: taskAssignments, error: assignmentError } = await supabase
                .from('task_owners')
                .select('task_id, user_id, status')
                .in('user_id', selectedMemberIds)
                .eq('organization_id', currentOrg.id);

            if (assignmentError) throw assignmentError;

            // Step 3: Fetch blocks from OTHER users for tasks where selected members are assigned
            const assignedTaskIds = [...new Set((taskAssignments || []).map(a => a.task_id))];
            let assignedBlocks: typeof ownedBlocks = [];

            if (assignedTaskIds.length > 0) {
                const { data: otherBlocks, error: otherError } = await supabase
                    .from('calendar_blocks')
                    .select('*')
                    .eq('organization_id', currentOrg.id)
                    .not('owner_id', 'in', `(${selectedMemberIds.join(',')})`)
                    .in('task_id', assignedTaskIds)
                    .gte('start_time', fetchStart.toISOString())
                    .lte('start_time', fetchEnd.toISOString())
                    .order('start_time', { ascending: true });

                if (otherError) throw otherError;
                assignedBlocks = otherBlocks || [];
            }

            // Combine owned and assigned blocks
            // DB RLS already enforces visibility — no client-side filter needed
            const allBlocks = [...(ownedBlocks || []), ...assignedBlocks];

            // Step 3.5: Fetch tasks for all blocks
            const blockTaskIds = [...new Set(allBlocks.map(b => b.task_id))];
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, status, expected_time_minutes, visibility')
                .in('id', blockTaskIds);

            if (tasksError) throw tasksError;

            const tasksMap = new Map(
                (tasksData || []).map(task => [task.id, task])
            );

            // Step 4: Fetch user profiles for block owners
            const allOwnerIds = [...new Set(allBlocks.map(b => b.owner_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, display_name, email, default_schedule_visibility')
                .in('id', allOwnerIds);

            if (profilesError) throw profilesError;

            // Step 5: Fetch all task owners for the tasks in blocks
            const allTaskIds = [...new Set(allBlocks.map(b => b.task_id))];
            const { data: taskOwnersData, error: taskOwnersError } = await supabase
                .from('task_owners')
                .select(`
                    task_id,
                    user_id,
                    status,
                    user_profiles!task_owners_user_profiles_fkey (
                        id,
                        display_name,
                        email
                    )
                `)
                .in('task_id', allTaskIds);

            if (taskOwnersError) throw taskOwnersError;

            // Create lookup maps
            const profilesMap = new Map(
                (profilesData || []).map(profile => [profile.id, profile])
            );

            const taskOwnersMap = new Map<string, Array<{ id: string; display_name: string; email: string; status: 'pending' | 'confirmed' }>>();
            (taskOwnersData || []).forEach((to: any) => {
                if (!taskOwnersMap.has(to.task_id)) {
                    taskOwnersMap.set(to.task_id, []);
                }
                if (to.user_profiles) {
                    taskOwnersMap.get(to.task_id)!.push({
                        id: to.user_profiles.id,
                        display_name: to.user_profiles.display_name,
                        email: to.user_profiles.email,
                        status: to.status as 'pending' | 'confirmed',
                    });
                }
            });

            // Build color map: selectedMemberIds get priority order, then any other owners
            const allOwnerIdsSorted = [...new Set(allBlocks.map(b => b.owner_id))];
            const colorOrderIds = [
                ...selectedMemberIds,
                ...allOwnerIdsSorted.filter(id => !selectedMemberIds.includes(id)),
            ];
            const userColorMap = new Map<string, number>();
            colorOrderIds.forEach((id, index) => userColorMap.set(id, index));

            // Transform to MultiMemberBlock
            const transformedBlocks = allBlocks.map((row) => {
                const colorIndex = userColorMap.get(row.owner_id) ?? 0;
                const profile = profilesMap.get(row.owner_id);

                const rowWithProfile = {
                    ...row,
                    user_profiles: profile ? {
                        display_name: profile.display_name,
                        default_schedule_visibility: profile.default_schedule_visibility,
                        email: (profile as any).email,
                    } : null,
                };

                return dbToMultiMemberBlock(rowWithProfile, colorIndex, taskOwnersMap, tasksMap);
            });

            setMultiMemberBlocks(transformedBlocks);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch multi-member blocks';
            setError(message);
            console.error('Error fetching multi-member blocks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg, user, selectedMemberIds, viewDate, daysToShow]);

    // Fetch blocks when dependencies change
    useEffect(() => {
        fetchMultiMemberBlocks();
    }, [fetchMultiMemberBlocks]);

    // Subscribe to real-time changes
    useEffect(() => {
        if (!currentOrg || selectedMemberIds.length === 0) {
            return;
        }

        const channel = supabase
            .channel(`multi_member_blocks:${currentOrg.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'calendar_blocks',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                () => {
                    // Refetch on any change
                    fetchMultiMemberBlocks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, selectedMemberIds, fetchMultiMemberBlocks]);

    return {
        multiMemberBlocks,
        loading,
        error,
        refetch: fetchMultiMemberBlocks,
    };
}
