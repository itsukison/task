import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Document, DocumentType } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

/**
 * Transform database document to frontend format (snake_case to camelCase)
 */
function transformDocument(dbDoc: any): Document {
    return {
        id: dbDoc.id,
        organizationId: dbDoc.organization_id,
        createdBy: dbDoc.created_by,
        folderId: dbDoc.folder_id,
        title: dbDoc.title,
        content: dbDoc.content,
        type: dbDoc.type as DocumentType,
        fileUrl: dbDoc.file_url,
        fileName: dbDoc.file_name,
        fileSize: dbDoc.file_size,
        fileType: dbDoc.file_type,
        linkUrl: dbDoc.link_url,
        previewImageUrl: dbDoc.preview_image_url,
        previewMetadata: dbDoc.preview_metadata,
        positionX: dbDoc.position_x,
        positionY: dbDoc.position_y,
        width: dbDoc.width,
        height: dbDoc.height,
        visibility: dbDoc.visibility,
        deletedAt: dbDoc.deleted_at,
        createdAt: dbDoc.created_at,
        updatedAt: dbDoc.updated_at,
    };
}

export function useDocuments(folderId?: string | null) {
    const { user, currentOrg } = useAuth();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Listens for ID changes to trigger loading state
    useEffect(() => {
        setLoading(true);
    }, [currentOrg?.id, folderId]);

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        if (!currentOrg) return;

        try {
            let query = supabase
                .from('documents')
                .select('*')
                .eq('organization_id', currentOrg.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            // Filter by folder if specified (null means root level)
            if (folderId !== undefined) {
                if (folderId === null) {
                    query = query.is('folder_id', null);
                } else {
                    query = query.eq('folder_id', folderId);
                }
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setDocuments((data || []).map(transformDocument));
            setError(null);
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    }, [currentOrg, folderId]);

    // Fetch on mount or when dependencies change
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Real-time subscriptions
    useEffect(() => {
        if (!currentOrg) return;

        const channel = supabase
            .channel('documents-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'documents',
                    filter: `organization_id=eq.${currentOrg.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newDoc = transformDocument(payload.new);
                        // Only add if it matches the current folder filter
                        if (folderId === undefined || newDoc.folderId === folderId) {
                            setDocuments((prev) => [newDoc, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedDoc = transformDocument(payload.new);
                        setDocuments((prev) =>
                            prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc))
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg, folderId]);

    // Create document
    const createDocument = useCallback(
        async (data: {
            title?: string;
            content?: any;
            type?: DocumentType;
            folderId?: string | null;
            fileUrl?: string;
            fileName?: string;
            fileSize?: number;
            fileType?: string;
            linkUrl?: string;
            previewImageUrl?: string;
            previewMetadata?: any;
            positionX?: number;
            positionY?: number;
            visibility?: 'private' | 'team' | 'leaders_only';
        }) => {
            if (!user || !currentOrg) throw new Error('No organization selected');

            const { data: newDoc, error } = await supabase
                .from('documents')
                .insert({
                    organization_id: currentOrg.id,
                    created_by: user.id,
                    folder_id: data.folderId ?? null,
                    title: data.title || 'Untitled',
                    content: data.content || null,
                    type: data.type || 'document',
                    file_url: data.fileUrl || null,
                    file_name: data.fileName || null,
                    file_size: data.fileSize || null,
                    file_type: data.fileType || null,
                    link_url: data.linkUrl || null,
                    preview_image_url: data.previewImageUrl || null,
                    preview_metadata: data.previewMetadata || null,
                    position_x: data.positionX || null,
                    position_y: data.positionY || null,
                    visibility: data.visibility || 'team',
                })
                .select()
                .single();

            if (error) throw error;

            const newDocument = transformDocument(newDoc);

            // Optimistically update UI - add document immediately
            setDocuments((prev) => [newDocument, ...prev]);

            return newDocument;
        },
        [user, currentOrg]
    );

    // Update document
    const updateDocument = useCallback(
        async (
            id: string,
            updates: Partial<{
                title: string;
                content: any;
                folderId: string | null;
                positionX: number;
                positionY: number;
                width: number;
                height: number;
                visibility: 'private' | 'team' | 'leaders_only';
                previewImageUrl: string;
                previewMetadata: any;
            }>
        ) => {
            // Optimistic UI update
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === id
                        ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
                        : doc
                )
            );

            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;
            if (updates.positionX !== undefined) dbUpdates.position_x = updates.positionX;
            if (updates.positionY !== undefined) dbUpdates.position_y = updates.positionY;
            if (updates.width !== undefined) dbUpdates.width = updates.width;
            if (updates.height !== undefined) dbUpdates.height = updates.height;
            if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
            if (updates.previewImageUrl !== undefined) dbUpdates.preview_image_url = updates.previewImageUrl;
            if (updates.previewMetadata !== undefined) dbUpdates.preview_metadata = updates.previewMetadata;

            const { error } = await supabase
                .from('documents')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;
        },
        []
    );

    // Delete document (soft delete)
    const deleteDocument = useCallback(async (id: string) => {
        if (process.env.NODE_ENV === 'development') {
            console.group('[useDocuments] DELETE OPERATION DIAGNOSTICS');

            // 1. Log current auth context
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            console.log('1. Current User Context:', {
                userId: currentUser?.id,
                email: currentUser?.email,
                hasUser: !!currentUser,
            });

            console.log('2. Organization Context:', {
                orgId: currentOrg?.id,
                orgName: currentOrg?.name,
                hasOrg: !!currentOrg,
            });

            // 2. Get document details BEFORE deletion attempt
            const { data: docBeforeDelete, error: fetchError } = await supabase
                .from('documents')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('3. FAILED to fetch document before deletion:', fetchError);
            } else {
                console.log('3. Document to Delete:', {
                    id: docBeforeDelete?.id,
                    title: docBeforeDelete?.title,
                    createdBy: docBeforeDelete?.created_by,
                    organizationId: docBeforeDelete?.organization_id,
                    visibility: docBeforeDelete?.visibility,
                    isCurrentUserCreator: docBeforeDelete?.created_by === currentUser?.id,
                    isCorrectOrg: docBeforeDelete?.organization_id === currentOrg?.id,
                });
            }

            // 3. Test helper functions directly
            if (docBeforeDelete && currentUser && currentOrg) {
                const { data: memberCheck } = await supabase.rpc('is_org_member', {
                    org_id: currentOrg.id,
                    uid: currentUser.id,
                });

                const { data: leaderCheck } = await supabase.rpc('is_leader', {
                    org_id: currentOrg.id,
                    uid: currentUser.id,
                });

                console.log('4. RLS Helper Function Checks:', {
                    isOrgMember: memberCheck,
                    isLeader: leaderCheck,
                });
            }

            // 4. Attempt the deletion
            console.log('5. Attempting DELETE operation...');
            console.warn('⚠️ Using HARD DELETE (not soft delete) due to RLS WITH CHECK issue');
            console.groupEnd();
        }

        // Production path - minimal logging
        const { data, error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .select();

        if (error) {
            if (process.env.NODE_ENV === 'development') {
                console.log('6. Delete Response:', {
                    success: false,
                    data,
                    error: {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint,
                    },
                });
            } else {
                console.error('Delete failed:', error.message);
            }
            throw new Error(`Failed to delete document: ${error.message}`);
        }

        // Optimistically update UI - remove document immediately
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));

        if (process.env.NODE_ENV === 'development') {
            console.log('7. Optimistically removed document from UI');
        }
    }, [currentOrg, user]);

    // Refetch documents
    const refetch = useCallback(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    return {
        documents,
        loading,
        error,
        createDocument,
        updateDocument,
        deleteDocument,
        refetch,
    };
}
