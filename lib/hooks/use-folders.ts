import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Transform database folder to frontend format (snake_case to camelCase)
 */
function transformFolder(dbFolder: any): Folder {
    return {
        id: dbFolder.id,
        organizationId: dbFolder.organization_id,
        createdBy: dbFolder.created_by,
        name: dbFolder.name,
        parentFolderId: dbFolder.parent_folder_id,
        positionX: dbFolder.position_x,
        positionY: dbFolder.position_y,
        width: dbFolder.width,
        height: dbFolder.height,
        isOpen: dbFolder.is_open,
        visibility: dbFolder.visibility,
        deletedAt: dbFolder.deleted_at,
        createdAt: dbFolder.created_at,
        updatedAt: dbFolder.updated_at,
    };
}

export function useFolders(parentFolderId?: string | null) {
    const { user, currentOrg } = useAuth();
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listens for ID changes to trigger loading state
    useEffect(() => {
        setLoading(true);
    }, [currentOrg?.id, parentFolderId]);

    // Fetch folders
    const fetchFolders = useCallback(async () => {
        if (!currentOrg) return;

        try {
            let query = supabase
                .from('folders')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            // Filter by parent folder if specified (null means root level)
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
            console.error('Error fetching folders:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch folders');
        } finally {
            setLoading(false);
        }
    }, [currentOrg, parentFolderId]);

    // Fetch on mount or when dependencies change
    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    // Real-time subscriptions
    useEffect(() => {
        if (!currentOrg) return;

        const channel = supabase
            .channel('folders-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'folders',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newFolder = transformFolder(payload.new);
                        // Only add if it matches the current parent filter
                        if (parentFolderId === undefined || newFolder.parentFolderId === parentFolderId) {
                            setFolders((prev) => [newFolder, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedFolder = transformFolder(payload.new);
                        setFolders((prev) =>
                            prev.map((folder) => (folder.id === updatedFolder.id ? updatedFolder : folder))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setFolders((prev) => prev.filter((folder) => folder.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, parentFolderId]);

    // Create folder
    const createFolder = useCallback(
        async (data: {
            name?: string;
            parentFolderId?: string | null;
            positionX?: number;
            positionY?: number;
            visibility?: 'private' | 'team' | 'leaders_only';
        }) => {
            if (!user || !currentOrg) throw new Error('No organization selected');

            const { data: newFolder, error } = await supabase
                .from('folders')
                .insert({
                    organization_id: currentOrg.id,
                    created_by: user.id,
                    name: data.name || 'New Folder',
                    parent_folder_id: data.parentFolderId ?? null,
                    position_x: data.positionX || null,
                    position_y: data.positionY || null,
                    visibility: data.visibility || 'team',
                })
                .select()
                .single();

            if (error) throw error;

            const newFolderTransformed = transformFolder(newFolder);

            // Optimistically update UI - add folder immediately
            setFolders((prev) => [newFolderTransformed, ...prev]);

            return newFolderTransformed;
        },
        [user, currentOrg]
    );

    // Update folder
    const updateFolder = useCallback(
        async (
            id: string,
            updates: Partial<{
                name: string;
                parentFolderId: string | null;
                positionX: number;
                positionY: number;
                width: number;
                height: number;
                isOpen: boolean;
                visibility: 'private' | 'team' | 'leaders_only';
            }>
        ) => {
            // Optimistic UI update - immediately update local state
            setFolders((prev) =>
                prev.map((folder) =>
                    folder.id === id
                        ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
                        : folder
                )
            );

            const dbUpdates: any = {};
            if (updates.name !== undefined) dbUpdates.name = updates.name;
            if (updates.parentFolderId !== undefined) dbUpdates.parent_folder_id = updates.parentFolderId;
            if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
            if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
            if (updates.width !== undefined) dbUpdates.width = updates.width;
            if (updates.height !== undefined) dbUpdates.height = updates.height;
            if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;
            if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

            const { error } = await supabase
                .from('folders')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        },
        []
    );

    // Delete folder (soft delete)
    const deleteFolder = useCallback(async (id: string) => {
        console.log('[useFolders] Attempting to delete folder:', id);

        const { data, error } = await supabase
            .from('folders')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        console.log('[useFolders] Delete response:', { data, error });

        if (error) {
            console.error('[useFolders] Delete error details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
            throw new Error(`Failed to delete folder: ${error.message}`);
        }

        // Optimistically update UI - remove folder immediately
        setFolders((prev) => prev.filter((folder) => folder.id !== id));

        console.log('[useFolders] Folder deleted successfully');
    }, []);

    // Refetch folders
    const refetch = useCallback(() => {
        fetchFolders();
    }, [fetchFolders]);

    return {
        folders,
        loading,
        error,
        createFolder,
        updateFolder,
        deleteFolder,
        refetch,
    };
}
