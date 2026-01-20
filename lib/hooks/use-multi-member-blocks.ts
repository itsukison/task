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
        user_profiles?: { display_name: string; default_schedule_visibility: string } | null;
        tasks?: any;
    },
    colorIndex: number
): MultiMemberBlock {
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
        // Include task data from the query
        task: row.tasks ? {
            id: row.tasks.id,
            title: row.tasks.title || '',
            description: null,
            status: row.tasks.status || 'planned',
            expectedTime: row.tasks.expected_time_minutes ?? 30, // Use actual value from DB
            actualTime: 0,
            visibility: 'team' as const,
            owners: [],
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

            // Fetch calendar blocks (without user_profiles join since no FK exists)
            console.log('🔄 Step 1: Fetching calendar blocks...');
            const { data: blocksData, error: blocksError } = await supabase
                .from('calendar_blocks')
                .select(`
                    *,
                    tasks (
                        id,
                        title,
                        status,
                        expected_time_minutes
                    )
                `)
                .eq('organization_id', currentOrg.id)
                .in('owner_id', selectedMemberIds)
                .gte('start_time', weekStart.toISOString())
                .lte('start_time', weekEnd.toISOString())
                .order('start_time', { ascending: true });

            if (blocksError) {
                console.error('❌ Error fetching calendar blocks:', blocksError);
                throw blocksError;
            }

            console.log('✅ Step 1 complete:', { blocksCount: blocksData?.length });

            // Fetch user profiles for the selected members
            console.log('🔄 Step 2: Fetching user profiles...');
            const { data: profilesData, error: profilesError } = await supabase
                .from('user_profiles')
                .select('id, display_name, default_schedule_visibility')
                .in('id', selectedMemberIds);

            if (profilesError) {
                console.error('❌ Error fetching user profiles:', profilesError);
                throw profilesError;
            }

            console.log('✅ Step 2 complete:', { profilesCount: profilesData?.length });

            // Create a map of user profiles for quick lookup
            const profilesMap = new Map(
                (profilesData || []).map(profile => [profile.id, profile])
            );

            console.log('📦 Query results:', {
                blocksCount: blocksData?.length,
                profilesCount: profilesData?.length,
            });

            // Filter blocks based on visibility rules
            console.log('🔍 Filtering blocks with currentUserRole:', currentUserRole);
            const filteredData = (blocksData || []).filter((block) => {
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
                    } : null,
                };
                
                return dbToMultiMemberBlock(rowWithProfile, colorIndex);
            });

            console.log('✅ Successfully transformed blocks:', {
                totalBlocks: transformedBlocks.length,
                blocks: transformedBlocks.map(b => ({
                    id: b.id,
                    ownerName: b.ownerName,
                    ownerColor: b.ownerColor,
                    startTime: b.startTime,
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
