'use client';

import { useSupabaseQuery } from '@/lib/query/hooks/base';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';
import { supabase } from '@/lib/supabase';
import { AssignmentStatus } from '@/lib/types';
import { CalendarBlockWithPending, DbCalendarBlock, dbToCalendarBlock } from './types';

export function useCalendarBlocksQuery() {
    const { user, currentOrg } = useAuth();

    return useSupabaseQuery<CalendarBlockWithPending[]>(
        [...queryKeys.calendarBlocks.byOwner(currentOrg?.id || '', user?.id || '')],
        async () => {
            if (!currentOrg || !user) {
                return { data: [], error: null };
            }

            // Step 1: Fetch own blocks
            const { data: ownBlocks, error: ownError } = await supabase
                .from('calendar_blocks')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .eq('owner_id', user.id)
                .order('start_time', { ascending: true });

            if (ownError) return { data: null, error: ownError };

            // Step 2: Fetch task assignments for current user (to find pending blocks)
            const { data: taskAssignments, error: assignmentError } = await supabase
                .from('task_owners')
                .select('task_id, status')
                .eq('user_id', user.id)
                .eq('organization_id', currentOrg.id);

            if (assignmentError) return { data: null, error: assignmentError };

            const assignmentMap = new Map<string, AssignmentStatus>(
                (taskAssignments || []).map(a => [a.task_id, a.status as AssignmentStatus])
            );

            // Step 3: Fetch blocks from other users for tasks the current user is assigned to
            const assignedTaskIds = taskAssignments?.map(a => a.task_id) || [];
            let pendingBlocks: DbCalendarBlock[] = [];

            if (assignedTaskIds.length > 0) {
                // Chunk to avoid URL length limits in PostgREST (400 error with many IDs)
                const CHUNK_SIZE = 50;
                const chunks: string[][] = [];
                for (let i = 0; i < assignedTaskIds.length; i += CHUNK_SIZE) {
                    chunks.push(assignedTaskIds.slice(i, i + CHUNK_SIZE));
                }

                const chunkResults = await Promise.all(
                    chunks.map(chunk =>
                        supabase
                            .from('calendar_blocks')
                            .select('*')
                            .eq('organization_id', currentOrg.id)
                            .neq('owner_id', user.id)
                            .in('task_id', chunk)
                            .order('start_time', { ascending: true })
                    )
                );

                for (const { error: chunkError } of chunkResults) {
                    if (chunkError) return { data: null, error: chunkError };
                }

                pendingBlocks = chunkResults.flatMap(r => r.data || []) as DbCalendarBlock[];
            }

            // Step 4: Transform and combine (filter out stale blocks with optimistic task IDs)
            const ownTransformed = (ownBlocks as DbCalendarBlock[] || [])
                .filter(row => !row.task_id.startsWith('optimistic-'))
                .map(row => {
                    const status = assignmentMap.get(row.task_id);
                    return dbToCalendarBlock(row, { isPending: status === 'pending', status });
                });

            const pendingTransformed = pendingBlocks.map(row => {
                const status = assignmentMap.get(row.task_id);
                return dbToCalendarBlock(row, { isPending: status === 'pending', status });
            });

            const allBlocks = [...ownTransformed, ...pendingTransformed].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            return { data: allBlocks, error: null };
        },
        {
            enabled: !!currentOrg && !!user,
            staleTime: 30000,
        }
    );
}
