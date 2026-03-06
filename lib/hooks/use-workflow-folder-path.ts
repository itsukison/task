import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkflowFolder } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

export function useWorkflowFolderPath(currentFolderId: string | null) {
    const { currentOrg } = useAuth();
    const [allFolders, setAllFolders] = useState<WorkflowFolder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentOrg) return;

        const fetchAll = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('workflow_folders')
                    .select('*')
                    .eq('organization_id', currentOrg.id);

                if (error) throw error;

                setAllFolders(
                    (data || []).map((db) => ({
                        id: db.id,
                        organizationId: db.organization_id,
                        name: db.name,
                        parentFolderId: db.parent_folder_id,
                        positionX: db.position_x,
                        positionY: db.position_y,
                        visibility: db.visibility ?? 'team',
                        createdAt: db.created_at ?? '',
                        updatedAt: db.updated_at ?? '',
                    }))
                );
            } catch (err) {
                console.error('Error fetching workflow folder path:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [currentOrg]);

    const folderPath = useMemo(() => {
        if (!currentFolderId) return [];

        const path: WorkflowFolder[] = [];
        let currentId: string | null = currentFolderId;

        while (currentId) {
            const folder = allFolders.find((f) => f.id === currentId);
            if (!folder) break;
            path.unshift(folder);
            currentId = folder.parentFolderId;
        }

        return path;
    }, [currentFolderId, allFolders]);

    return { folderPath, loading };
}
