import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Hook to get the folder path from current folder to root
 * Returns an array of folders representing the breadcrumb path
 */
export function useFolderPath(currentFolderId: string | null) {
    const { currentOrg } = useAuth();
    const [allFolders, setAllFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all folders in the organization
    useEffect(() => {
        if (!currentOrg) return;

        const fetchAllFolders = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('folders')
                    .select('*')
                    .eq('organization_id', currentOrg.id)
                    .is('deleted_at', null);

                if (error) throw error;

                const folders: Folder[] = (data || []).map((dbFolder) => ({
                    id: dbFolder.id,
                    organizationId: dbFolder.organization_id,
                    createdBy: dbFolder.created_by,
                    name: dbFolder.name,
                    parentFolderId: dbFolder.parent_folder_id,
                    positionX: dbFolder.position_x,
                    positionY: dbFolder.position_y,
                    width: dbFolder.width ?? 200,
                    height: dbFolder.height ?? 150,
                    isOpen: dbFolder.is_open ?? false,
                    visibility: dbFolder.visibility,
                    deletedAt: dbFolder.deleted_at,
                    createdAt: dbFolder.created_at,
                    updatedAt: dbFolder.updated_at,
                }));

                setAllFolders(folders);
            } catch (err) {
                console.error('Error fetching folders for path:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllFolders();
    }, [currentOrg]);

    // Build path from current folder to root
    const folderPath = useMemo(() => {
        if (!currentFolderId) return [];

        const path: Folder[] = [];
        let currentId: string | null = currentFolderId;

        // Traverse up the folder tree
        while (currentId) {
            const folder = allFolders.find((f) => f.id === currentId);
            if (!folder) break;

            path.unshift(folder); // Add to beginning of array
            currentId = folder.parentFolderId;
        }

        return path;
    }, [currentFolderId, allFolders]);

    return {
        folderPath,
        loading,
    };
}
