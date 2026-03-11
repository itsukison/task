'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import { useAuth } from '@/lib/auth/hooks';
import { supabase } from '@/lib/supabase';
import {
    CalendarBlockWithPending,
    CreateCalendarBlockInput,
    UpdateCalendarBlockInput,
    DbCalendarBlock,
    dbToCalendarBlock,
} from './types';

export function useCreateCalendarBlock() {
    const { user, currentOrg } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = [...queryKeys.calendarBlocks.byOwner(currentOrg?.id || '', user?.id || '')];

    return useMutation({
        mutationFn: async (input: CreateCalendarBlockInput): Promise<CalendarBlockWithPending> => {
            if (!user || !currentOrg) throw new Error('Must be authenticated with an organization');

            // Delete existing blocks for this task owned by current user
            // (ensures one block per task per user — same logic as old hook)
            const { error: deleteError } = await supabase
                .from('calendar_blocks')
                .delete()
                .eq('organization_id', currentOrg.id)
                .eq('owner_id', user.id)
                .eq('task_id', input.taskId);

            if (deleteError) throw new Error(`Failed to delete existing blocks: ${deleteError.message}`);

            const { data, error: insertError } = await supabase
                .from('calendar_blocks')
                .insert({
                    organization_id: currentOrg.id,
                    owner_id: user.id,
                    task_id: input.taskId,
                    start_time: input.startTime.toISOString(),
                    end_time: input.endTime.toISOString(),
                })
                .select('*')
                .single();

            if (insertError) throw new Error(`Failed to create calendar block: ${insertError.message}`);
            return dbToCalendarBlock(data as DbCalendarBlock);
        },
        onMutate: async (input: CreateCalendarBlockInput) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<CalendarBlockWithPending[]>(queryKey);

            // Remove old blocks for this task+owner, add optimistic placeholder
            queryClient.setQueryData<CalendarBlockWithPending[]>(queryKey, (old) => {
                const filtered = (old || []).filter(
                    b => !(b.taskId === input.taskId && b.ownerId === user?.id)
                );
                const optimistic: CalendarBlockWithPending = {
                    id: `optimistic-${Date.now()}`,
                    taskId: input.taskId,
                    startTime: input.startTime.toISOString(),
                    endTime: input.endTime.toISOString(),
                    ownerId: user?.id || '',
                    organizationId: currentOrg?.id || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    isPendingAssignment: false,
                };
                return [...filtered, optimistic].sort((a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                );
            });

            return { previous };
        },
        onError: (_err: unknown, _vars: CreateCalendarBlockInput, context: any) => {
            if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useUpdateCalendarBlock() {
    const { user, currentOrg } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = [...queryKeys.calendarBlocks.byOwner(currentOrg?.id || '', user?.id || '')];

    return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: UpdateCalendarBlockInput }): Promise<void> => {
            if (!user) throw new Error('Must be authenticated');

            const updateData: Record<string, string> = {};
            if (input.startTime !== undefined) updateData.start_time = input.startTime.toISOString();
            if (input.endTime !== undefined) updateData.end_time = input.endTime.toISOString();

            const { error } = await supabase
                .from('calendar_blocks')
                .update(updateData)
                .eq('id', id);

            if (error) throw new Error(`Failed to update calendar block: ${error.message}`);
        },
        onMutate: async ({ id, input }: { id: string; input: UpdateCalendarBlockInput }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<CalendarBlockWithPending[]>(queryKey);

            queryClient.setQueryData<CalendarBlockWithPending[]>(queryKey, (old) =>
                (old || []).map(b =>
                    b.id !== id ? b : {
                        ...b,
                        startTime: input.startTime?.toISOString() ?? b.startTime,
                        endTime: input.endTime?.toISOString() ?? b.endTime,
                    }
                )
            );

            return { previous };
        },
        onError: (_err: unknown, _vars: { id: string; input: UpdateCalendarBlockInput }, context: any) => {
            if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useDeleteCalendarBlock() {
    const { user, currentOrg } = useAuth();
    const queryClient = useQueryClient();
    const queryKey = [...queryKeys.calendarBlocks.byOwner(currentOrg?.id || '', user?.id || '')];

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            if (!user) throw new Error('Must be authenticated');

            const { error } = await supabase
                .from('calendar_blocks')
                .delete()
                .eq('id', id);

            if (error) throw new Error(`Failed to delete calendar block: ${error.message}`);
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData<CalendarBlockWithPending[]>(queryKey);

            queryClient.setQueryData<CalendarBlockWithPending[]>(queryKey, (old) =>
                (old || []).filter(b => b.id !== id)
            );

            return { previous };
        },
        onError: (_err: unknown, _vars: string, context: any) => {
            if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}
