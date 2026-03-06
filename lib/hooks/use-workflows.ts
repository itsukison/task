import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Workflow } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

function transformWorkflow(db: any): Workflow {
    return {
        id: db.id,
        organizationId: db.workspace_id,
        createdBy: db.user_id ?? '',
        folderId: db.folder_id,
        name: db.name,
        description: db.description,
        site: db.site,
        content: db.content,
        positionX: db.position_x,
        positionY: db.position_y,
        visibility: db.visibility ?? 'team',
        createdAt: db.created_at ?? '',
        updatedAt: db.updated_at ?? '',
    };
}

export function useWorkflows(folderId?: string | null) {
    const { user, currentOrg } = useAuth();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
    }, [currentOrg?.id, folderId]);

    const fetchWorkflows = useCallback(async () => {
        if (!currentOrg) return;

        try {
            let query = supabase
                .from('workflows')
                .select('*')
                .eq('workspace_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (folderId !== undefined) {
                if (folderId === null) {
                    query = query.is('folder_id', null);
                } else {
                    query = query.eq('folder_id', folderId);
                }
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            setWorkflows((data || []).map(transformWorkflow));
            setError(null);
        } catch (err) {
            console.error('Error fetching workflows:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
        } finally {
            setLoading(false);
        }
    }, [currentOrg, folderId]);

    useEffect(() => {
        fetchWorkflows();
    }, [fetchWorkflows]);

    useEffect(() => {
        if (!currentOrg) return;

        const channel = supabase
            .channel('workflows-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workflows',
                    filter: `workspace_id=eq.${currentOrg.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newWf = transformWorkflow(payload.new);
                        if (folderId === undefined || newWf.folderId === folderId) {
                            setWorkflows((prev) => [newWf, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = transformWorkflow(payload.new);
                        setWorkflows((prev) =>
                            prev.map((w) => (w.id === updated.id ? updated : w))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setWorkflows((prev) => prev.filter((w) => w.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, folderId]);

    const createWorkflow = useCallback(
        async (data: {
            name?: string;
            folderId?: string | null;
            positionX?: number;
            positionY?: number;
        }) => {
            if (!user || !currentOrg) throw new Error('No organization selected');

            const { data: newWf, error } = await supabase
                .from('workflows')
                .insert({
                    workspace_id: currentOrg.id,
                    folder_id: data.folderId ?? null,
                    name: data.name || 'Untitled Workflow',
                    position_x: data.positionX ?? null,
                    position_y: data.positionY ?? null,
                    visibility: 'team',
                })
                .select()
                .single();

            if (error) throw error;

            const transformed = transformWorkflow(newWf);
            setWorkflows((prev) => [transformed, ...prev]);
            return transformed;
        },
        [user, currentOrg]
    );

    const updateWorkflow = useCallback(
        async (
            id: string,
            updates: Partial<{
                name: string;
                description: string;
                site: string;
                content: any;
                folderId: string | null;
                positionX: number;
                positionY: number;
                visibility: string;
            }>
        ) => {
            setWorkflows((prev) =>
                prev.map((w) =>
                    w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
                )
            );

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.description !== undefined) dbUpdates.description = updates.description;
            if (updates.site !== undefined) dbUpdates.site = updates.site;
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
            if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
            if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
            if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

            const { error } = await supabase.from('workflows').update(dbUpdates).eq('id', id);
            if (error) throw error;
        },
        []
    );

    const deleteWorkflow = useCallback(async (id: string) => {
        const { error } = await supabase.from('workflows').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete workflow: ${error.message}`);
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
    }, []);

    return { workflows, loading, error, createWorkflow, updateWorkflow, deleteWorkflow };
}
