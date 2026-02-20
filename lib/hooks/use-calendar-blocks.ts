'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';
import { CalendarBlock, Task, AssignmentStatus } from '@/lib/types';

// Database row types
type DbCalendarBlock = Database['public']['Tables']['calendar_blocks']['Row'];
type CalendarBlockInsert = Database['public']['Tables']['calendar_blocks']['Insert'];
type CalendarBlockUpdate = Database['public']['Tables']['calendar_blocks']['Update'];

// Extended CalendarBlock with pending assignment info
export interface CalendarBlockWithPending extends CalendarBlock {
    isPendingAssignment?: boolean;  // True if this block is from a pending task assignment
    assignmentStatus?: AssignmentStatus;  // The user's assignment status for the task
}

// Transform database row to frontend CalendarBlock
function dbToCalendarBlock(
    row: DbCalendarBlock & { task?: Task | null },
    pendingInfo?: { isPending: boolean; status?: AssignmentStatus }
): CalendarBlockWithPending {
    return {
        id: row.id,
        taskId: row.task_id,
        startTime: row.start_time,
        endTime: row.end_time,
        ownerId: row.owner_id,
        organizationId: row.organization_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        task: row.task ?? undefined,
        isPendingAssignment: pendingInfo?.isPending ?? false,
        assignmentStatus: pendingInfo?.status,
    };
}

// Input for creating a calendar block
export interface CreateCalendarBlockInput {
    taskId: string;
    startTime: Date;
    endTime: Date;
}

// Input for updating a calendar block
export interface UpdateCalendarBlockInput {
    startTime?: Date;
    endTime?: Date;
}

export interface UseCalendarBlocksReturn {
    calendarBlocks: CalendarBlockWithPending[];
    loading: boolean;
    error: string | null;
    createCalendarBlock: (input: CreateCalendarBlockInput) => Promise<CalendarBlock>;
    updateCalendarBlock: (id: string, input: UpdateCalendarBlockInput) => Promise<void>;
    deleteCalendarBlock: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
    // Helper to get blocks for a specific date range
    getBlocksForDateRange: (start: Date, end: Date) => CalendarBlockWithPending[];
    // Helper to check if a task already has a block
    hasBlockForTask: (taskId: string) => boolean;
}

export function useCalendarBlocks(): UseCalendarBlocksReturn {
    const { user, currentOrg } = useAuth();
    const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlockWithPending[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch calendar blocks (own blocks + blocks from pending task assignments)
    const fetchCalendarBlocks = useCallback(async () => {
        if (!currentOrg || !user) {
            setCalendarBlocks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);

            // Step 1: Fetch own blocks
            const { data: ownBlocks, error: ownError } = await supabase
                .from('calendar_blocks')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .eq('owner_id', user.id)
                .order('start_time', { ascending: true });

            if (ownError) throw ownError;

            // Step 2: Fetch task assignments for current user (to find pending blocks)
            const { data: taskAssignments, error: assignmentError } = await supabase
                .from('task_owners')
                .select('task_id, status')
                .eq('user_id', user.id)
                .eq('organization_id', currentOrg.id);

            if (assignmentError) throw assignmentError;

            // Create a map of task_id -> assignment status
            const assignmentMap = new Map<string, AssignmentStatus>(
                (taskAssignments || []).map(a => [a.task_id, a.status])
            );

            // Step 3: Fetch blocks from other users for tasks where current user is assigned
            const assignedTaskIds = taskAssignments?.map(a => a.task_id) || [];
            let pendingBlocks: DbCalendarBlock[] = [];

            if (assignedTaskIds.length > 0) {
                const { data: otherBlocks, error: otherError } = await supabase
                    .from('calendar_blocks')
                    .select('*')
                    .eq('organization_id', currentOrg.id)
                    .neq('owner_id', user.id)  // Blocks from other users
                    .in('task_id', assignedTaskIds)
                    .order('start_time', { ascending: true });

                if (otherError) throw otherError;
                pendingBlocks = otherBlocks || [];
            }

            // Step 4: Transform and combine blocks
            const ownTransformed = (ownBlocks || []).map((row) => {
                const status = assignmentMap.get(row.task_id);
                return dbToCalendarBlock(row, {
                    isPending: status === 'pending',
                    status,
                });
            });

            const pendingTransformed = pendingBlocks.map((row) => {
                const status = assignmentMap.get(row.task_id);
                return dbToCalendarBlock(row, {
                    isPending: status === 'pending',  // Only pending if user hasn't accepted yet
                    status,
                });
            });

            // Combine and sort by start time
            const allBlocks = [...ownTransformed, ...pendingTransformed].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            setCalendarBlocks(allBlocks);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch calendar blocks';
            setError(message);
            console.error('Error fetching calendar blocks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg, user]);

    // Initial fetch and real-time subscription
    useEffect(() => {
        if (!currentOrg || !user) {
            setCalendarBlocks([]);
            setLoading(false);
            return;
        }

        fetchCalendarBlocks();

        // Subscribe to real-time changes on calendar_blocks
        const blocksChannel = supabase
            .channel(`calendar_blocks:${currentOrg.id}`)
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
                    fetchCalendarBlocks();
                }
            )
            .subscribe();

        // Subscribe to task_owners changes (for assignment status updates)
        const taskOwnersChannel = supabase
            .channel(`calendar_task_owners:${currentOrg.id}:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'task_owners',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                () => {
                    // Refetch when task_owners change (assignment accepted/rejected)
                    fetchCalendarBlocks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(blocksChannel);
            supabase.removeChannel(taskOwnersChannel);
        };
    }, [currentOrg, user, fetchCalendarBlocks]);

    // Create a new calendar block
    const createCalendarBlock = useCallback(async (input: CreateCalendarBlockInput): Promise<CalendarBlock> => {
        if (!user || !currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // Delete existing blocks for this task owned by current user
        // This ensures only one block per task per user (prevents duplicates when dragging to multiple locations)
        const { error: deleteError } = await supabase
            .from('calendar_blocks')
            .delete()
            .eq('organization_id', currentOrg.id)
            .eq('owner_id', user.id)
            .eq('task_id', input.taskId);

        if (deleteError) {
            // Throw error to prevent duplicate creation when deletion fails
            throw new Error(`Failed to delete existing blocks: ${deleteError.message}`);
        }

        const insertData: CalendarBlockInsert = {
            organization_id: currentOrg.id,
            owner_id: user.id,
            task_id: input.taskId,
            start_time: input.startTime.toISOString(),
            end_time: input.endTime.toISOString(),
        };

        console.log('Creating calendar block with data:', insertData);

        const { data, error: insertError } = await supabase
            .from('calendar_blocks')
            .insert(insertData)
            .select('*')
            .single();

        console.log('Calendar block insert result:', { data, error: insertError });

        if (insertError) {
            throw new Error(`Failed to create calendar block: ${insertError.message}`);
        }

        const newBlock = dbToCalendarBlock(data);

        // Optimistically update state: remove old blocks for this task and add the new one
        setCalendarBlocks(prev => {
            const filteredBlocks = prev.filter(
                block => !(block.taskId === input.taskId && block.ownerId === user.id)
            );
            return [...filteredBlocks, newBlock].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );
        });

        return newBlock;
    }, [user, currentOrg]);

    // Update a calendar block
    const updateCalendarBlock = useCallback(async (id: string, input: UpdateCalendarBlockInput): Promise<void> => {
        if (!user) {
            throw new Error('Must be authenticated to update calendar blocks');
        }

        // Find block for optimistic update (no ownership check - RLS handles permissions)
        const blockToUpdate = calendarBlocks.find(b => b.id === id);
        if (!blockToUpdate) {
            throw new Error('Calendar block not found');
        }

        const updateData: CalendarBlockUpdate = {};

        if (input.startTime !== undefined) updateData.start_time = input.startTime.toISOString();
        if (input.endTime !== undefined) updateData.end_time = input.endTime.toISOString();

        // RLS policies enforce that only confirmed task owners can update blocks
        const { error: updateError } = await supabase
            .from('calendar_blocks')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            throw new Error(`Failed to update calendar block: ${updateError.message}`);
        }

        // Optimistically update state
        setCalendarBlocks(prev => prev.map(block => {
            if (block.id !== id) return block;
            return {
                ...block,
                startTime: input.startTime?.toISOString() ?? block.startTime,
                endTime: input.endTime?.toISOString() ?? block.endTime,
            };
        }).sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));
    }, [user, calendarBlocks]);

    // Delete a calendar block
    const deleteCalendarBlock = useCallback(async (id: string): Promise<void> => {
        if (!user) {
            throw new Error('Must be authenticated to delete calendar blocks');
        }

        // Find block for optimistic update (no ownership check - RLS handles permissions)
        const blockToDelete = calendarBlocks.find(b => b.id === id);
        if (!blockToDelete) {
            throw new Error('Calendar block not found');
        }

        // RLS policies enforce that only confirmed task owners can delete blocks
        const { error: deleteError } = await supabase
            .from('calendar_blocks')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw new Error(`Failed to delete calendar block: ${deleteError.message}`);
        }

        // Optimistically remove from state
        setCalendarBlocks(prev => prev.filter(block => block.id !== id));
    }, [user, calendarBlocks]);

    // Helper: Get blocks for a specific date range
    const getBlocksForDateRange = useCallback((start: Date, end: Date): CalendarBlock[] => {
        return calendarBlocks.filter(block => {
            const blockStart = new Date(block.startTime);
            return blockStart >= start && blockStart <= end;
        });
    }, [calendarBlocks]);

    // Helper: Check if a task has at least one block scheduled
    const hasBlockForTask = useCallback((taskId: string): boolean => {
        return calendarBlocks.some(block => block.taskId === taskId);
    }, [calendarBlocks]);

    return {
        calendarBlocks,
        loading,
        error,
        createCalendarBlock,
        updateCalendarBlock,
        deleteCalendarBlock,
        refetch: fetchCalendarBlocks,
        getBlocksForDateRange,
        hasBlockForTask,
    };
}
