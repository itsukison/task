'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/hooks';
import { Database } from '@/lib/database.types';
import { CalendarBlock, Task } from '@/lib/types';

// Database row types
type DbCalendarBlock = Database['public']['Tables']['calendar_blocks']['Row'];
type CalendarBlockInsert = Database['public']['Tables']['calendar_blocks']['Insert'];
type CalendarBlockUpdate = Database['public']['Tables']['calendar_blocks']['Update'];

// Transform database row to frontend CalendarBlock
function dbToCalendarBlock(row: DbCalendarBlock & { task?: Task | null }): CalendarBlock {
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
    calendarBlocks: CalendarBlock[];
    loading: boolean;
    error: string | null;
    createCalendarBlock: (input: CreateCalendarBlockInput) => Promise<CalendarBlock>;
    updateCalendarBlock: (id: string, input: UpdateCalendarBlockInput) => Promise<void>;
    deleteCalendarBlock: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
    // Helper to get blocks for a specific date range
    getBlocksForDateRange: (start: Date, end: Date) => CalendarBlock[];
    // Helper to check if a task already has a block
    hasBlockForTask: (taskId: string) => boolean;
}

export function useCalendarBlocks(): UseCalendarBlocksReturn {
    const { user, currentOrg } = useAuth();
    const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch calendar blocks
    const fetchCalendarBlocks = useCallback(async () => {
        if (!currentOrg) {
            setCalendarBlocks([]);
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('calendar_blocks')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('start_time', { ascending: true });

            if (fetchError) throw fetchError;

            const transformedBlocks = (data || []).map((row) =>
                dbToCalendarBlock(row)
            );
            setCalendarBlocks(transformedBlocks);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to fetch calendar blocks';
            setError(message);
            console.error('Error fetching calendar blocks:', err);
        } finally {
            setLoading(false);
        }
    }, [currentOrg]);

    // Initial fetch and real-time subscription
    useEffect(() => {
        if (!currentOrg) {
            setCalendarBlocks([]);
            setLoading(false);
            return;
        }

        fetchCalendarBlocks();

        // Subscribe to real-time changes
        const channel = supabase
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

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, fetchCalendarBlocks]);

    // Create a new calendar block
    const createCalendarBlock = useCallback(async (input: CreateCalendarBlockInput): Promise<CalendarBlock> => {
        if (!user || !currentOrg) {
            throw new Error('Must be authenticated with an organization');
        }

        // Check if task already has a block (limit to one block per task)
        const existingBlock = calendarBlocks.find(b => b.taskId === input.taskId);
        if (existingBlock) {
            throw new Error('This task already has a scheduled time block. Please move or delete the existing block first.');
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

        // Optimistically add to state
        setCalendarBlocks(prev => [...prev, newBlock].sort((a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ));

        return newBlock;
    }, [user, currentOrg, calendarBlocks]);

    // Update a calendar block
    const updateCalendarBlock = useCallback(async (id: string, input: UpdateCalendarBlockInput): Promise<void> => {
        const updateData: CalendarBlockUpdate = {};

        if (input.startTime !== undefined) updateData.start_time = input.startTime.toISOString();
        if (input.endTime !== undefined) updateData.end_time = input.endTime.toISOString();

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
    }, []);

    // Delete a calendar block
    const deleteCalendarBlock = useCallback(async (id: string): Promise<void> => {
        const { error: deleteError } = await supabase
            .from('calendar_blocks')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw new Error(`Failed to delete calendar block: ${deleteError.message}`);
        }

        // Optimistically remove from state
        setCalendarBlocks(prev => prev.filter(block => block.id !== id));
    }, []);

    // Helper: Get blocks for a specific date range
    const getBlocksForDateRange = useCallback((start: Date, end: Date): CalendarBlock[] => {
        return calendarBlocks.filter(block => {
            const blockStart = new Date(block.startTime);
            return blockStart >= start && blockStart <= end;
        });
    }, [calendarBlocks]);

    // Helper: Check if a task already has a block
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
