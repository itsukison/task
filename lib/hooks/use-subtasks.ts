import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface Subtask {
    id: string;
    title: string;
}

export function useSubtasks(parentTaskId: string) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const queryKey = ['subtasks', parentTaskId];

    const { data: subtasks = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('tasks')
                .select('id, title')
                .eq('parent_task_id', parentTaskId);
            return (data as Subtask[]) || [];
        },
        enabled: !!parentTaskId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const createSubtask = useMutation({
        mutationFn: async (title: string) => {
            // We assume the parent component handles the actual creation loop if it needs to go through creating a task with parent_id
            // But actually, for the cell, we just want to link or create.
            // If we use the callback from the cell, we might not need this mutation for creation IF the callback handles it.
            // However, the cell also has "Link existing task".
            // Let's implement link/unlink here.
            return null;
        }
    });

    const linkSubtask = useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await (supabase as any)
                .from('tasks')
                .update({ parent_task_id: parentTaskId })
                .eq('id', taskId);
            if (error) throw error;
            return taskId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            // Also invalidate available tasks query if we had one
            queryClient.invalidateQueries({ queryKey: ['available-subtasks'] });
        }
    });

    const unlinkSubtask = useMutation({
        mutationFn: async (taskId: string) => {
            const { error } = await (supabase as any)
                .from('tasks')
                .update({ parent_task_id: null })
                .eq('id', taskId);
            if (error) throw error;
            return taskId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            // Also invalidate available tasks query
            queryClient.invalidateQueries({ queryKey: ['available-subtasks'] });
        }
    });

    return {
        subtasks,
        isLoading,
        linkSubtask,
        unlinkSubtask
    };
}

export function useAvailableSubtasks(rowId: string, isOpen: boolean) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['available-subtasks', rowId],
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('tasks')
                .select('id, title')
                .is('parent_task_id', null)
                .neq('id', rowId)
                .limit(10);
            return (data as Subtask[]) || [];
        },
        enabled: isOpen && !!rowId,
        staleTime: 1000 * 60, // 1 minute
    });
}
