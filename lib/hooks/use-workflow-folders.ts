import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkflowFolder } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

function transformFolder(db: any): WorkflowFolder {
    return {
        id: db.id,
        organizationId: db.organization_id,
        name: db.name,
        parentFolderId: db.parent_folder_id,
        positionX: db.position_x,
        positionY: db.position_y,
        visibility: db.visibility ?? 'team',
        createdAt: db.created_at ?? '',
        updatedAt: db.updated_at ?? '',
    };
}

export function useWorkflowFolders(parentFolderId?: string | null) {
    const { user, currentOrg } = useAuth();
    const [folders, setFolders] = useState<WorkflowFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
    }, [currentOrg?.id, parentFolderId]);

    const fetchFolders = useCallback(async () => {
        if (!currentOrg) return;

        try {
            let query = supabase
                .from('workflow_folders')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .order('created_at', { ascending: false });

            if (parentFolderId !== undefined) {
                if (parentFolderId === null) {
                    query = query.is('parent_folder_id', null);
                } else {
                    query = query.eq('parent_folder_id', parentFolderId);
                }
            }

            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            setFolders((data || []).map(transformFolder));
            setError(null);
        } catch (err) {
            console.error('Error fetching workflow folders:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch folders');
        } finally {
            setLoading(false);
        }
    }, [currentOrg, parentFolderId]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    useEffect(() => {
        if (!currentOrg) return;

        const channel = supabase
            .channel('workflow-folders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workflow_folders',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newFolder = transformFolder(payload.new);
                        if (parentFolderId === undefined || newFolder.parentFolderId === parentFolderId) {
                            setFolders((prev) => [newFolder, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = transformFolder(payload.new);
                        setFolders((prev) =>
                            prev.map((f) => (f.id === updated.id ? updated : f))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setFolders((prev) => prev.filter((f) => f.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, parentFolderId]);

    const createFolder = useCallback(
        async (data: {
            name?: string;
            parentFolderId?: string | null;
            positionX?: number;
            positionY?: number;
        }) => {
            if (!user || !currentOrg) throw new Error('No organization selected');

            const { data: newFolder, error } = await supabase
                .from('workflow_folders')
                .insert({
                    organization_id: currentOrg.id,
                    name: data.name || 'New Folder',
                    parent_folder_id: data.parentFolderId ?? null,
                    position_x: data.positionX ?? null,
                    position_y: data.positionY ?? null,
                    visibility: 'team',
                })
                .select()
                .single();

            if (error) throw error;

            const transformed = transformFolder(newFolder);
            setFolders((prev) => [transformed, ...prev]);
            return transformed;
        },
        [user, currentOrg]
    );

    const updateFolder = useCallback(
        async (
            id: string,
            updates: Partial<{
                name: string;
                parentFolderId: string | null;
                positionX: number;
                positionY: number;
                visibility: string;
            }>
        ) => {
            setFolders((prev) =>
                prev.map((f) =>
                    f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
                )
            );

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.parentFolderId !== undefined) dbUpdates.parent_folder_id = updates.parentFolderId;
            if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
            if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
            if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

            const { error } = await supabase.from('workflow_folders').update(dbUpdates).eq('id', id);
            if (error) throw error;
        },
        []
    );

    const deleteFolder = useCallback(async (id: string) => {
        const { error } = await supabase.from('workflow_folders').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete folder: ${error.message}`);
        setFolders((prev) => prev.filter((f) => f.id !== id));
    }, []);

    return { folders, loading, error, createFolder, updateFolder, deleteFolder };
}
