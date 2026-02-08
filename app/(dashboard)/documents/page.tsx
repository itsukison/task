'use client';

import { useState, useEffect } from 'react';
import { Document as DocumentType, Folder } from '@/lib/types';
import { useDocuments } from '@/lib/hooks/use-documents';
import { useFolders } from '@/lib/hooks/use-folders';
import { useFolderPath } from '@/lib/hooks/use-folder-path';
import { useLinkPreview } from '@/lib/hooks/use-link-preview';
import { DocumentsCanvas } from '@/components/documents/DocumentsCanvas';
import { DocumentsHeader, SortOption } from '@/components/documents/DocumentsHeader';
import { DocumentEditor } from '@/components/documents/DocumentEditor';
import { DocumentContextMenu } from '@/components/documents/DocumentContextMenu';
import { UploadModal } from '@/components/documents/UploadModal';
import { useLanguage } from '@/lib/i18n';
import { useAI } from '@/lib/ai/AIContextProvider';

// Layout constants (must match DocumentsCanvas)
const CARD_WIDTH = 130;
const CARD_HEIGHT = 190;
const FOLDER_WIDTH = 130;
const FOLDER_HEIGHT = 160;
const GRID_GAP = 32;
const CANVAS_PADDING = 32;

export default function DocumentsPage() {
    const { t } = useLanguage();
    const { setSelectedDocuments } = useAI();

    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{
        item: DocumentType | Folder;
        type: 'document' | 'folder';
        position: { x: number; y: number };
    } | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');

    // Fetch documents and folders for current folder
    const { documents, loading: docsLoading, createDocument, updateDocument, deleteDocument } = useDocuments(currentFolderId);
    const { folders, loading: foldersLoading, createFolder, updateFolder, deleteFolder } = useFolders(currentFolderId);
    const { folderPath } = useFolderPath(currentFolderId);
    const { fetchPreview } = useLinkPreview();

    const loading = docsLoading || foldersLoading;

    // Update AI context when document selection changes
    useEffect(() => {
        const selected = documents.filter(doc => selectedDocIds.has(doc.id));
        setSelectedDocuments(selected);
    }, [selectedDocIds, documents, setSelectedDocuments]);

    // Handle document selection toggle
    const toggleDocumentSelection = (docId: string) => {
        setSelectedDocIds(prev => {
            const next = new Set(prev);
            if (next.has(docId)) {
                next.delete(docId);
            } else {
                // Limit to 5 documents
                if (next.size < 5) {
                    next.add(docId);
                }
            }
            return next;
        });
    };

    // Handle deselect all
    const handleDeselectAll = () => {
        setSelectedDocIds(new Set());
        setSelectedFolderIds(new Set());
    };

    // Handle multi-select from lasso
    const handleSelectMultiple = (docIds: string[], folderIds: string[]) => {
        // Limit documents to 5
        const limitedDocIds = docIds.slice(0, 5);
        setSelectedDocIds(new Set(limitedDocIds));
        setSelectedFolderIds(new Set(folderIds));

        if (docIds.length > 5) {
            console.warn('Maximum 5 documents can be selected');
        }
    };

    // Handle new document
    const handleNewDocument = async () => {
        try {
            const newDoc = await createDocument({
                title: t('documents.untitled_document'),
                folderId: currentFolderId,
            });
            setSelectedDocument(newDoc);
        } catch (error) {
            console.error('Failed to create document:', error);
        }
    };

    // Handle new folder
    const handleNewFolder = async () => {
        try {
            await createFolder({
                name: t('documents.new_folder_name'),
                parentFolderId: currentFolderId,
            });
        } catch (error) {
            console.error('Failed to create folder:', error);
        }
    };

    // Handle file upload complete
    const handleUploadComplete = async (data: {
        type: 'uploaded_file' | 'link';
        title: string;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        fileType?: string;
        linkUrl?: string;
    }) => {
        try {
            let previewData = {};

            // Fetch link preview if it's a link
            if (data.type === 'link' && data.linkUrl) {
                try {
                    const preview = await fetchPreview(data.linkUrl);
                    previewData = {
                        previewImageUrl: preview.image,
                        previewMetadata: {
                            title: preview.title,
                            description: preview.description,
                            siteName: preview.siteName,
                            favicon: preview.favicon,
                        },
                    };
                } catch (err) {
                    console.warn('Failed to fetch preview:', err);
                }
            }

            await createDocument({
                ...data,
                ...previewData,
                folderId: currentFolderId,
            });
        } catch (error) {
            console.error('Failed to create document:', error);
            throw error;
        }
    };

    // Handle document update
    const handleDocumentUpdate = async (id: string, updates: { title?: string; content?: any }) => {
        try {
            await updateDocument(id, updates);
        } catch (error) {
            console.error('Failed to update document:', error);
        }
    };

    // Handle position updates for free-form dragging
    const handleUpdateDocumentPosition = async (id: string, x: number, y: number) => {
        try {
            await updateDocument(id, { positionX: x, positionY: y });
        } catch (error) {
            console.error('Failed to update document position:', error);
        }
    };

    const handleUpdateFolderPosition = async (id: string, x: number, y: number) => {
        try {
            await updateFolder(id, { positionX: x, positionY: y });
        } catch (error) {
            console.error('Failed to update folder position:', error);
        }
    };

    // Handle folder click (navigate into folder)
    const handleFolderClick = (folder: Folder) => {
        setCurrentFolderId(folder.id);
    };

    // Handle Organize - reset all items to unified 8-column grid layout
    const handleOrganize = async () => {
        const COLUMNS = 8;
        const GAP_BETWEEN_ITEMS = 32;
        const MAX_ITEM_WIDTH = CARD_WIDTH; // 130px

        // Calculate total grid width with explicit gaps
        const totalGridWidth = (COLUMNS * MAX_ITEM_WIDTH) + ((COLUMNS - 1) * GAP_BETWEEN_ITEMS);

        // Get actual container width from DOM
        const canvasElement = document.querySelector('.w-full.h-full.overflow-auto');
        const actualWidth = canvasElement?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 300 : 1200);

        // Center the grid within the container
        const gridStartX = (actualWidth - totalGridWidth) / 2;

        // Combine all items into a single array with type info
        const allItems: Array<{ id: string; type: 'folder' | 'document'; item: Folder | DocumentType }> = [
            ...folders.map(f => ({ id: f.id, type: 'folder' as const, item: f })),
            ...documents.map(d => ({ id: d.id, type: 'document' as const, item: d })),
        ];

        // Position each item in the centered grid
        for (let i = 0; i < allItems.length; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;

            // Calculate position with explicit gaps
            const baseX = gridStartX + col * (MAX_ITEM_WIDTH + GAP_BETWEEN_ITEMS);
            const baseY = CANVAS_PADDING + row * (CARD_HEIGHT + GAP_BETWEEN_ITEMS);

            const { type, id } = allItems[i];

            if (type === 'folder') {
                // Center folder within its column slot
                const x = baseX + (MAX_ITEM_WIDTH - FOLDER_WIDTH) / 2;
                const y = baseY + (CARD_HEIGHT - FOLDER_HEIGHT) / 2;
                await updateFolder(id, { positionX: x, positionY: y });
            } else {
                // Documents use full column width
                await updateDocument(id, { positionX: baseX, positionY: baseY });
            }
        }
    };

    // Handle Sort - sort items and reorganize in unified 8-column grid
    const handleSort = async (sortBy: SortOption) => {
        const COLUMNS = 8;
        const GAP_BETWEEN_ITEMS = 32;
        const MAX_ITEM_WIDTH = CARD_WIDTH; // 130px

        // Calculate total grid width with explicit gaps
        const totalGridWidth = (COLUMNS * MAX_ITEM_WIDTH) + ((COLUMNS - 1) * GAP_BETWEEN_ITEMS);

        // Get actual container width from DOM
        const canvasElement = document.querySelector('.w-full.h-full.overflow-auto');
        const actualWidth = canvasElement?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 300 : 1200);

        // Center the grid within the container
        const gridStartX = (actualWidth - totalGridWidth) / 2;

        // Combine and sort all items together
        const allItems: Array<{ id: string; type: 'folder' | 'document'; item: Folder | DocumentType; sortKey: string | number }> = [
            ...folders.map(f => ({
                id: f.id,
                type: 'folder' as const,
                item: f,
                sortKey: sortBy === 'name' ? f.name : sortBy === 'created' ? new Date(f.createdAt).getTime() : new Date(f.updatedAt).getTime()
            })),
            ...documents.map(d => ({
                id: d.id,
                type: 'document' as const,
                item: d,
                sortKey: sortBy === 'name' ? d.title : sortBy === 'created' ? new Date(d.createdAt).getTime() : new Date(d.updatedAt).getTime()
            })),
        ];

        // Sort the combined array
        allItems.sort((a, b) => {
            if (typeof a.sortKey === 'string' && typeof b.sortKey === 'string') {
                return a.sortKey.localeCompare(b.sortKey);
            }
            return (a.sortKey as number) - (b.sortKey as number);
        });

        // Position each sorted item in the centered grid
        for (let i = 0; i < allItems.length; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;

            // Calculate position with explicit gaps
            const baseX = gridStartX + col * (MAX_ITEM_WIDTH + GAP_BETWEEN_ITEMS);
            const baseY = CANVAS_PADDING + row * (CARD_HEIGHT + GAP_BETWEEN_ITEMS);

            const { type, id } = allItems[i];

            if (type === 'folder') {
                // Center folder within its column slot
                const x = baseX + (MAX_ITEM_WIDTH - FOLDER_WIDTH) / 2;
                const y = baseY + (CARD_HEIGHT - FOLDER_HEIGHT) / 2;
                await updateFolder(id, { positionX: x, positionY: y });
            } else {
                // Documents use full column width
                await updateDocument(id, { positionX: baseX, positionY: baseY });
            }
        }
    };

    // Handle context menu actions
    const handleRename = async () => {
        if (!contextMenu) return;

        const newName = prompt(
            t('documents.rename_item', { type: contextMenu.type === 'folder' ? t('documents.folder') : t('documents.document') }),
            contextMenu.type === 'folder'
                ? (contextMenu.item as Folder).name
                : (contextMenu.item as DocumentType).title
        );

        if (!newName) return;

        try {
            if (contextMenu.type === 'folder') {
                await updateFolder(contextMenu.item.id, { name: newName });
            } else {
                await updateDocument(contextMenu.item.id, { title: newName });
            }
        } catch (error) {
            console.error('Failed to rename:', error);
        }
    };

    const handleDelete = async () => {
        if (!contextMenu) return;

        const confirmMessage = contextMenu.type === 'folder'
            ? t('documents.confirm_delete_folder')
            : t('documents.confirm_delete_document');
        if (!confirm(confirmMessage)) return;

        try {
            if (contextMenu.type === 'folder') {
                await deleteFolder(contextMenu.item.id);
            } else {
                await deleteDocument(contextMenu.item.id);
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        }
    };

    const handleChangeVisibility = async (visibility: 'private' | 'team' | 'leaders_only') => {
        if (!contextMenu) return;

        try {
            if (contextMenu.type === 'folder') {
                await updateFolder(contextMenu.item.id, { visibility });
            } else {
                await updateDocument(contextMenu.item.id, { visibility });
            }
        } catch (error) {
            console.error('Failed to change visibility:', error);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-white">
                {/* Header */}
                <DocumentsHeader
                    folderPath={folderPath}
                    onNavigate={setCurrentFolderId}
                    onNewDocument={handleNewDocument}
                    onNewFolder={handleNewFolder}
                    onUploadFile={() => {
                        setUploadMode('file');
                        setUploadModalOpen(true);
                    }}
                    onAddLink={() => {
                        setUploadMode('link');
                        setUploadModalOpen(true);
                    }}
                    onOrganize={handleOrganize}
                    onSort={handleSort}
                />

                {/* Canvas */}
                <DocumentsCanvas
                    loading={loading}
                    documents={documents}
                    folders={folders}
                    selectedDocIds={selectedDocIds}
                    selectedFolderIds={selectedFolderIds}
                    onDocumentSelect={(doc, multiSelect) => {
                        if (multiSelect) {
                            // Option+click: toggle selection
                            toggleDocumentSelection(doc.id);
                        } else {
                            // Regular click: select only this document (clear others)
                            setSelectedDocIds(new Set([doc.id]));
                            setSelectedFolderIds(new Set());
                        }
                    }}
                    onDocumentOpen={(doc) => {
                        // Double-click: open editor or link
                        if (doc.type === 'link' && doc.linkUrl) {
                            window.open(doc.linkUrl, '_blank');
                        } else {
                            setSelectedDocument(doc);
                        }
                    }}
                    onFolderSelect={(folder, multiSelect) => {
                        if (multiSelect) {
                            // Option+click: toggle folder selection
                            setSelectedFolderIds(prev => {
                                const next = new Set(prev);
                                if (next.has(folder.id)) {
                                    next.delete(folder.id);
                                } else {
                                    next.add(folder.id);
                                }
                                return next;
                            });
                        } else {
                            // Regular click: select only this folder (clear others)
                            setSelectedFolderIds(new Set([folder.id]));
                            setSelectedDocIds(new Set());
                        }
                    }}
                    onFolderOpen={(folder) => {
                        // Double-click: navigate into folder
                        setCurrentFolderId(folder.id);
                    }}
                    onDocumentContextMenu={(doc, e) => {
                        setContextMenu({
                            item: doc,
                            type: 'document',
                            position: { x: e.clientX, y: e.clientY },
                        });
                    }}
                    onFolderContextMenu={(folder, e) => {
                        setContextMenu({
                            item: folder,
                            type: 'folder',
                            position: { x: e.clientX, y: e.clientY },
                        });
                    }}
                    onUpdateDocumentPosition={handleUpdateDocumentPosition}
                    onUpdateFolderPosition={handleUpdateFolderPosition}
                    onSelectMultiple={handleSelectMultiple}
                    onDeselectAll={handleDeselectAll}
                />
            </div>

            {/* Document Editor Modal */}
            {selectedDocument && (
                <DocumentEditor
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    onUpdate={handleDocumentUpdate}
                />
            )}

            {/* Upload Modal */}
            <UploadModal
                isOpen={uploadModalOpen}
                mode={uploadMode}
                onClose={() => setUploadModalOpen(false)}
                onUploadComplete={handleUploadComplete}
            />

            {/* Context Menu */}
            {contextMenu && (
                <DocumentContextMenu
                    item={contextMenu.item}
                    type={contextMenu.type}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onChangeVisibility={handleChangeVisibility}
                />
            )}
        </>
    );
}
