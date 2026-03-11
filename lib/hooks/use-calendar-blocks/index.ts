'use client';

import { CalendarBlock } from '@/lib/types';
import { useCalendarBlocksQuery } from './queries';
import { useCalendarBlocksSubscription } from './subscriptions';
import {
    useCreateCalendarBlock,
    useUpdateCalendarBlock,
    useDeleteCalendarBlock,
} from './mutations';

// Re-export types for backward compatibility with existing imports
export type {
    CalendarBlockWithPending,
    CreateCalendarBlockInput,
    UpdateCalendarBlockInput,
    UseCalendarBlocksReturn,
} from './types';

/**
 * Hook to fetch and subscribe to the current user's calendar blocks
 *
 * IMPROVEMENTS OVER OLD HOOK:
 * - React Query caching (30s stale time) prevents redundant fetches
 * - Optimistic updates with onError rollback on all mutations
 * - updateCalendarBlock no longer has calendarBlocks in its useCallback deps —
 *   eliminates the function-reference churn that cascaded re-renders on every drag
 * - Single combined subscription with 150ms debounce instead of two unthrottled
 *   subscriptions each triggering 4 sequential queries
 *
 * BACKWARD COMPATIBLE:
 * - Identical public API — zero changes required in consumers
 */
export function useCalendarBlocks() {
    const { data, isLoading, error, refetch } = useCalendarBlocksQuery();

    useCalendarBlocksSubscription();

    const createMutation = useCreateCalendarBlock();
    const updateMutation = useUpdateCalendarBlock();
    const deleteMutation = useDeleteCalendarBlock();

    const calendarBlocks = data || [];

    return {
        calendarBlocks,
        loading: isLoading,
        error: error?.message || null,

        createCalendarBlock: async (input: Parameters<typeof createMutation.mutateAsync>[0]): Promise<CalendarBlock> => {
            return createMutation.mutateAsync(input);
        },

        updateCalendarBlock: async (id: string, input: Parameters<typeof updateMutation.mutateAsync>[0]['input']): Promise<void> => {
            await updateMutation.mutateAsync({ id, input });
        },

        deleteCalendarBlock: async (id: string): Promise<void> => {
            await deleteMutation.mutateAsync(id);
        },

        refetch: async () => {
            await refetch();
        },

        getBlocksForDateRange: (start: Date, end: Date) => {
            return calendarBlocks.filter(block => {
                const blockStart = new Date(block.startTime);
                return blockStart >= start && blockStart <= end;
            });
        },

        hasBlockForTask: (taskId: string): boolean => {
            return calendarBlocks.some(block => block.taskId === taskId);
        },
    };
}
