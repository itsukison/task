import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface LinkedDocument {
    id: string;
    document_id: string;
    title: string;
}

export interface AvailableDocument {
    id: string;
    title: string;
}

export function useTaskDocuments(taskId: string) {
    const supabase = createClient();
    const queryClient = useQueryClient();
    const queryKey = ['task-documents', taskId];

    const { data: linkedDocs = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const { data } = await (supabase as any)
                .from('task_documents')
                .select(`
                    id,
                    document_id,
                    documents:document_id (title)
                `)
                .eq('task_id', taskId);

            return data?.map((d: any) => ({
                id: d.id,
                document_id: d.document_id,
                title: d.documents?.title || 'Untitled'
            })) as LinkedDocument[] || [];
        },
        enabled: !!taskId,
        staleTime: 1000 * 60 * 5,
    });

    const linkDocument = useMutation({
        mutationFn: async ({ docId, docTitle }: { docId: string, docTitle: string }) => {
            const { data: task } = await supabase
                .from('tasks')
                .select('organization_id')
                .eq('id', taskId)
                .single();

            if (!task) throw new Error('Task not found');

            const { data, error } = await (supabase as any)
                .from('task_documents')
                .insert({
                    task_id: taskId,
                    document_id: docId,
                    organization_id: task.organization_id,
                })
                .select('id')
                .single();

            if (error) throw error;
            return { id: data.id, docId, docTitle };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['available-documents'] });
        }
    });

    const unlinkDocument = useMutation({
        mutationFn: async (linkId: string) => {
            const { error } = await (supabase as any)
                .from('task_documents')
                .delete()
                .eq('id', linkId);
            if (error) throw error;
            return linkId;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['available-documents'] });
        }
    });

    return {
        linkedDocs,
        isLoading,
        linkDocument,
        unlinkDocument
    };
}

export function useAvailableDocuments(isOpen: boolean, linkedDocs: LinkedDocument[]) {
    const supabase = createClient();

    return useQuery({
        queryKey: ['available-documents'],
        queryFn: async () => {
            const { data } = await supabase
                .from('documents')
                .select('id, title')
                .limit(20);
            return (data as AvailableDocument[]) || [];
        },
        select: (data) => {
            const linkedIds = linkedDocs.map(d => d.document_id);
            return data.filter(d => !linkedIds.includes(d.id));
        },
        enabled: isOpen,
        staleTime: 1000 * 60,
    });
}
