'use client';

import { useState, useEffect, useCallback } from 'react';
import { startOfWeek, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { MultiMemberBlock, CalendarBlock } from '@/lib/types';
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
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        } : undefined,
    };
}

export interface UseMultiMemberBlocksInput {
    selectedMemberIds: string[];
    viewDate: Date;           // The center date for the week view
    showWeekends?: boolean;   // Whether weekends are shown (default: false)
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
    showWeekends = false,
}: UseMultiMemberBlocksInput): UseMultiMemberBlocksReturn {
    const { user, currentOrg } = useAuth();
    const [multiMemberBlocks, setMultiMemberBlocks] = useState<MultiMemberBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<'leader' | 'employee' | null>(null);

    // Fetch current user's role
    const fetchCurrentUserRole = useCallback(async () => {
        if (!user || !currentOrg) return;

        try {
            const { data, error: roleError } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_id', currentOrg.id)
                .eq('user_id', user.id)
                .single();

            if (roleError) throw roleError;
            setCurrentUserRole(data.role);
        } catch (err) {
            console.error('Error fetching user role:', err);
        }
    }, [user, currentOrg]);

    // Fetch calendar blocks for selected members
    const fetchMultiMemberBlocks = useCallback(async () => {
        console.log('🔍 fetchMultiMemberBlocks called with:', {
            currentOrg: currentOrg?.id,
            user: user?.id,
            selectedMemberIds,
            viewDate: viewDate.toISOString(),
            showWeekends,
        });

        if (!currentOrg || !user || selectedMemberIds.length === 0) {
            console.log('⚠️ Early return - missing required data');
            setMultiMemberBlocks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);

            // Calculate week range based on viewDate
            const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = showWeekends
                ? addDays(weekStart, 6)  // Sunday
                : addDays(weekStart, 4); // Friday

            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(23, 59, 59, 999);

            console.log('📅 Week range:', {
                weekStart: weekStart.toISOString(),
                weekEnd: weekEnd.toISOString(),
                showWeekends,
            });

            // Step 1: Fetch blocks owned by selected members (without task join to avoid RLS issues)
            console.log('🔄 Step 1: Fetching owned calendar blocks...');
            const { data: ownedBlocks, error: ownedError } = await supabase
                .from('calendar_blocks')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .in('owner_id', selectedMemberIds)
                .gte('start_time', weekStart.toISOString())
                .lte('start_time', weekEnd.toISOString())
                .order('start_time', { ascending: true });

            if (ownedError) {
                console.error('❌ Error fetching owned blocks:', ownedError);
                throw ownedError;
            }

            console.log('✅ Step 1 complete:', { ownedBlocksCount: ownedBlocks?.length });

            // Step 2: Fetch task assignments for selected members
            console.log('🔄 Step 2: Fetching task assignments...');
            const { data: taskAssignments, error: assignmentError } = await supabase
                .from('task_owners')
                .select('task_id, user_id, status')
                .in('user_id', selectedMemberIds)
                .eq('organization_id', currentOrg.id);

            if (assignmentError) {
                console.error('❌ Error fetching assignments:', assignmentError);
                throw assignmentError;
            }

            console.log('✅ Step 2 complete:', { assignmentsCount: taskAssignments?.length });

            // Step 3: Fetch blocks from OTHER users for tasks where selected members are assigned
            const assignedTaskIds = [...new Set((taskAssignments || []).map(a => a.task_id))];
            let assignedBlocks: typeof ownedBlocks = [];

            if (assignedTaskIds.length > 0) {
                console.log('🔄 Step 3: Fetching blocks for assigned tasks...');
                const { data: otherBlocks, error: otherError } = await supabase
                    .from('calendar_blocks')
                    .select('*')
                    .eq('organization_id', currentOrg.id)
                    .not('owner_id', 'in', `(${selectedMemberIds.join(',')})`)  // NOT owned by selected members
                    .in('task_id', assignedTaskIds)  // But for tasks they're assigned to
                    .gte('start_time', weekStart.toISOString())
                    .lte('start_time', weekEnd.toISOString())
                    .order('start_time', { ascending: true });

                if (otherError) {
                    console.error('❌ Error fetching assigned blocks:', otherError);
                    throw otherError;
                }

                assignedBlocks = otherBlocks || [];
                console.log('✅ Step 3 complete:', { assignedBlocksCount: assignedBlocks.length });
            }

            // Combine owned and assigned blocks
            const allBlocks = [...(ownedBlocks || []), ...assignedBlocks];
            console.log('📦 Combined blocks:', { totalCount: allBlocks.length });

            // Step 3.5: Fetch tasks for all blocks separately (bypasses RLS issues with joins)
            const blockTaskIds = [...new Set(allBlocks.map(b => b.task_id))];
            console.log('🔄 Step 3.5: Fetching tasks for blocks...');
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('id, title, status, expected_time_minutes, visibility')
                .in('id', blockTaskIds);

            if (tasksError) {
                console.error('❌ Error fetching tasks:', tasksError);
                throw tasksError;
            }

            console.log('✅ Step 3.5 complete:', { tasksCount: tasksData?.length });

            // Create tasks map for quick lookup
            const tasksMap = new Map(
                (tasksData || []).map(task => [task.id, task])
            );

            // Step 4: Fetch user profiles for block owners
            const allOwnerIds = [...new Set(allBlocks.map(b => b.owner_id))];
            console.log('🔄 Step 4: Fetching user profiles...');
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, display_name, email, default_schedule_visibility')
                .in('id', allOwnerIds);

            if (profilesError) {
                console.error('❌ Error fetching user profiles:', profilesError);
                throw profilesError;
            }

            console.log('✅ Step 4 complete:', { profilesCount: profilesData?.length });

            // Step 5: Fetch all task owners for the tasks in blocks
            const allTaskIds = [...new Set(allBlocks.map(b => b.task_id))];
            console.log('🔄 Step 5: Fetching task owners...');
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

            if (taskOwnersError) {
                console.error('❌ Error fetching task owners:', taskOwnersError);
                throw taskOwnersError;
            }

            console.log('✅ Step 5 complete:', { taskOwnersCount: taskOwnersData?.length });

            // Create lookup maps
            const profilesMap = new Map(
                (profilesData || []).map(profile => [profile.id, profile])
            );

            // Create task owners map: taskId -> array of owners
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

            // Filter blocks based on visibility rules
            console.log('🔍 Filtering blocks with currentUserRole:', currentUserRole);
            const filteredData = allBlocks.filter((block) => {
                const profile = profilesMap.get(block.owner_id);
                const visibility = profile?.default_schedule_visibility;
                const isOwner = block.owner_id === user.id;

                console.log('📋 Filtering block:', {
                    blockId: block.id,
                    ownerId: block.owner_id,
                    isOwner,
                    profileFound: !!profile,
                    visibility,
                    currentUserRole,
                });

                // Always show own blocks
                if (isOwner) {
                    console.log('✅ Passed: Own block');
                    return true;
                }

                // Check visibility rules
                if (visibility === 'private') {
                    console.log('❌ Rejected: Private');
                    return false;
                }
                if (visibility === 'team') {
                    console.log('✅ Passed: Team visible');
                    return true;
                }
                if (visibility === 'leaders_only') {
                    const canSee = currentUserRole === 'leader';
                    console.log(canSee ? '✅ Passed: Leaders only, user is leader' : '❌ Rejected: Leaders only, user is not leader');
                    return canSee;
                }

                console.log('❌ Rejected: No visibility match (visibility:', visibility, ')');
                return false;
            });
            console.log('🎯 Filtered results:', filteredData.length, 'blocks');

            // Create a color map for users
            const userColorMap = new Map<string, number>();
            selectedMemberIds.forEach((id, index) => {
                userColorMap.set(id, index);
            });

            // Transform to MultiMemberBlock
            const transformedBlocks = filteredData.map((row) => {
                const colorIndex = userColorMap.get(row.owner_id) || 0;
                const profile = profilesMap.get(row.owner_id);

                // Manually attach the user profile data for the transform function
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

            console.log('✅ Successfully transformed blocks:', {
                totalBlocks: transformedBlocks.length,
                blocks: transformedBlocks.map(b => ({
                    id: b.id,
                    ownerName: b.ownerName,
                    ownerColor: b.ownerColor,
                    startTime: b.startTime,
                    taskOwners: b.task?.owners?.map(o => o.display_name),
                })),
            });

            setMultiMemberBlocks(transformedBlocks);
        } catch (err: unknown) {
            console.error('❌ Catch block - Error type:', typeof err);
            console.error('❌ Catch block - Error instanceof Error:', err instanceof Error);
            console.error('❌ Catch block - Error:', err);
            console.error('❌ Catch block - Error stringified:', JSON.stringify(err, null, 2));

            if (err instanceof Error) {
                console.error('❌ Error message:', err.message);
                console.error('❌ Error stack:', err.stack);
            }

            const message = err instanceof Error ? err.message : 'Failed to fetch multi-member blocks';
            setError(message);
            console.error('Error fetching multi-member blocks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg, user, selectedMemberIds, viewDate, showWeekends, currentUserRole]);

    // Initial fetch of user role
    useEffect(() => {
        fetchCurrentUserRole();
    }, [fetchCurrentUserRole]);

    // Fetch blocks when dependencies change
    useEffect(() => {
        if (currentUserRole !== null) {
            fetchMultiMemberBlocks();
        }
    }, [fetchMultiMemberBlocks, currentUserRole]);

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
