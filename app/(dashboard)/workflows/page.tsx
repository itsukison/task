'use client';

import { useState } from 'react';
import { Workflow, WorkflowFolder } from '@/lib/types';
import { useWorkflows } from '@/lib/hooks/use-workflows';
import { useWorkflowFolders } from '@/lib/hooks/use-workflow-folders';
import { useWorkflowFolderPath } from '@/lib/hooks/use-workflow-folder-path';
import { WorkflowsCanvas } from '@/components/workflows/WorkflowsCanvas';
import { WorkflowsHeader, SortOption } from '@/components/workflows/WorkflowsHeader';
import { WorkflowEditor } from '@/components/workflows/WorkflowEditor';
import { WorkflowContextMenu } from '@/components/workflows/WorkflowContextMenu';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

const CARD_WIDTH = 130;
const CARD_HEIGHT = 190;
const FOLDER_WIDTH = 130;
const FOLDER_HEIGHT = 160;
const GRID_GAP = 32;
const CANVAS_PADDING = 32;

export default function WorkflowsPage() {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<Set<string>>(new Set());
    const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{
        item: Workflow | WorkflowFolder;
        type: 'workflow' | 'folder';
        position: { x: number; y: number };
    } | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        item: Workflow | WorkflowFolder;
        type: 'workflow' | 'folder';
    } | null>(null);

    const { workflows, loading: wfLoading, createWorkflow, updateWorkflow, deleteWorkflow } =
        useWorkflows(currentFolderId);
    const { folders, loading: folderLoading, createFolder, updateFolder, deleteFolder } =
        useWorkflowFolders(currentFolderId);
    const { folderPath } = useWorkflowFolderPath(currentFolderId);

    const loading = wfLoading || folderLoading;

    // --- New items ---
    const handleNewWorkflow = async () => {
        try {
            const newWf = await createWorkflow({ name: 'Untitled Workflow', folderId: currentFolderId });
            setSelectedWorkflow(newWf);
        } catch (err) {
            console.error('Failed to create workflow:', err);
        }
    };

    const handleNewFolder = async () => {
        try {
            await createFolder({ name: 'New Folder', parentFolderId: currentFolderId });
        } catch (err) {
            console.error('Failed to create folder:', err);
        }
    };

    // --- Update ---
    const handleWorkflowUpdate = async (
        id: string,
        updates: Partial<{ name: string; description: string; site: string; content: any }>
    ) => {
        await updateWorkflow(id, updates);
    };

    // --- Position updates ---
    const handleUpdateWorkflowPosition = async (id: string, x: number, y: number) => {
        try {
            await updateWorkflow(id, { positionX: x, positionY: y });
        } catch (err) {
            console.error('Failed to update position:', err);
        }
    };

    const handleUpdateFolderPosition = async (id: string, x: number, y: number) => {
        try {
            await updateFolder(id, { positionX: x, positionY: y });
        } catch (err) {
            console.error('Failed to update position:', err);
        }
    };

    // --- Organize ---
    const handleOrganize = async () => {
        const COLUMNS = 8;
        const totalGridWidth = COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GRID_GAP;
        const canvasElement = document.querySelector('.w-full.h-full.overflow-auto');
        const actualWidth = canvasElement?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 300 : 1200);
        const gridStartX = (actualWidth - totalGridWidth) / 2;

        const allItems: Array<{ id: string; type: 'folder' | 'workflow' }> = [
            ...folders.map((f) => ({ id: f.id, type: 'folder' as const })),
            ...workflows.map((w) => ({ id: w.id, type: 'workflow' as const })),
        ];

        for (let i = 0; i < allItems.length; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;
            const baseX = gridStartX + col * (CARD_WIDTH + GRID_GAP);
            const baseY = CANVAS_PADDING + row * (CARD_HEIGHT + GRID_GAP);
            const { type, id } = allItems[i];

            if (type === 'folder') {
                const x = baseX + (CARD_WIDTH - FOLDER_WIDTH) / 2;
                const y = baseY + (CARD_HEIGHT - FOLDER_HEIGHT) / 2;
                await updateFolder(id, { positionX: x, positionY: y });
            } else {
                await updateWorkflow(id, { positionX: baseX, positionY: baseY });
            }
        }
    };

    const handleSort = async (sortBy: SortOption) => {
        const COLUMNS = 8;
        const totalGridWidth = COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GRID_GAP;
        const canvasElement = document.querySelector('.w-full.h-full.overflow-auto');
        const actualWidth = canvasElement?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth - 300 : 1200);
        const gridStartX = (actualWidth - totalGridWidth) / 2;

        const allItems = [
            ...folders.map((f) => ({
                id: f.id,
                type: 'folder' as const,
                sortKey: sortBy === 'name' ? f.name : sortBy === 'created'
                    ? new Date(f.createdAt).getTime()
                    : new Date(f.updatedAt).getTime(),
            })),
            ...workflows.map((w) => ({
                id: w.id,
                type: 'workflow' as const,
                sortKey: sortBy === 'name' ? w.name : sortBy === 'created'
                    ? new Date(w.createdAt).getTime()
                    : new Date(w.updatedAt).getTime(),
            })),
        ].sort((a, b) => {
            if (typeof a.sortKey === 'string' && typeof b.sortKey === 'string') {
                return a.sortKey.localeCompare(b.sortKey);
            }
            return (a.sortKey as number) - (b.sortKey as number);
        });

        for (let i = 0; i < allItems.length; i++) {
            const row = Math.floor(i / COLUMNS);
            const col = i % COLUMNS;
            const baseX = gridStartX + col * (CARD_WIDTH + GRID_GAP);
            const baseY = CANVAS_PADDING + row * (CARD_HEIGHT + GRID_GAP);
            const { type, id } = allItems[i];

            if (type === 'folder') {
                await updateFolder(id, {
                    positionX: baseX + (CARD_WIDTH - FOLDER_WIDTH) / 2,
                    positionY: baseY + (CARD_HEIGHT - FOLDER_HEIGHT) / 2,
                });
            } else {
                await updateWorkflow(id, { positionX: baseX, positionY: baseY });
            }
        }
    };

    // --- Context menu actions ---
    const handleRename = async () => {
        if (!contextMenu) return;

        const currentName = contextMenu.type === 'folder'
            ? (contextMenu.item as WorkflowFolder).name
            : (contextMenu.item as Workflow).name;

        const newName = prompt('Rename:', currentName);
        if (!newName) return;

        try {
            if (contextMenu.type === 'folder') {
                await updateFolder(contextMenu.item.id, { name: newName });
            } else {
                await updateWorkflow(contextMenu.item.id, { name: newName });
            }
        } catch (err) {
            console.error('Failed to rename:', err);
        }
    };

    const handleDelete = () => {
        if (!contextMenu) return;
        setDeleteConfirmation({ item: contextMenu.item, type: contextMenu.type });
        setContextMenu(null);
    };

    const executeDelete = async () => {
        if (!deleteConfirmation) return;
        try {
            if (deleteConfirmation.type === 'folder') {
                await deleteFolder(deleteConfirmation.item.id);
            } else {
                await deleteWorkflow(deleteConfirmation.item.id);
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        } finally {
            setDeleteConfirmation(null);
        }
    };

    const handleChangeVisibility = async (visibility: 'private' | 'team') => {
        if (!contextMenu) return;
        try {
            if (contextMenu.type === 'folder') {
                await updateFolder(contextMenu.item.id, { visibility });
            } else {
                await updateWorkflow(contextMenu.item.id, { visibility });
            }
        } catch (err) {
            console.error('Failed to change visibility:', err);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-white">
                <WorkflowsHeader
                    folderPath={folderPath}
                    onNavigate={setCurrentFolderId}
                    onNewWorkflow={handleNewWorkflow}
                    onNewFolder={handleNewFolder}
                    onOrganize={handleOrganize}
                    onSort={handleSort}
                />

                <WorkflowsCanvas
                    loading={loading}
                    workflows={workflows}
                    folders={folders}
                    selectedWorkflowIds={selectedWorkflowIds}
                    selectedFolderIds={selectedFolderIds}
                    onWorkflowSelect={(wf, multiSelect) => {
                        if (multiSelect) {
                            setSelectedWorkflowIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(wf.id)) next.delete(wf.id);
                                else next.add(wf.id);
                                return next;
                            });
                        } else {
                            setSelectedWorkflowIds(new Set([wf.id]));
                            setSelectedFolderIds(new Set());
                        }
                    }}
                    onWorkflowOpen={(wf) => setSelectedWorkflow(wf)}
                    onFolderSelect={(folder, multiSelect) => {
                        if (multiSelect) {
                            setSelectedFolderIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(folder.id)) next.delete(folder.id);
                                else next.add(folder.id);
                                return next;
                            });
                        } else {
                            setSelectedFolderIds(new Set([folder.id]));
                            setSelectedWorkflowIds(new Set());
                        }
                    }}
                    onFolderOpen={(folder) => setCurrentFolderId(folder.id)}
                    onWorkflowContextMenu={(wf, e) =>
                        setContextMenu({ item: wf, type: 'workflow', position: { x: e.clientX, y: e.clientY } })
                    }
                    onFolderContextMenu={(folder, e) =>
                        setContextMenu({ item: folder, type: 'folder', position: { x: e.clientX, y: e.clientY } })
                    }
                    onUpdateWorkflowPosition={handleUpdateWorkflowPosition}
                    onUpdateFolderPosition={handleUpdateFolderPosition}
                    onSelectMultiple={(wfIds, folderIds) => {
                        setSelectedWorkflowIds(new Set(wfIds));
                        setSelectedFolderIds(new Set(folderIds));
                    }}
                    onDeselectAll={() => {
                        setSelectedWorkflowIds(new Set());
                        setSelectedFolderIds(new Set());
                    }}
                />
            </div>

            {/* Workflow Editor Modal */}
            {selectedWorkflow && (
                <WorkflowEditor
                    workflow={selectedWorkflow}
                    onClose={() => setSelectedWorkflow(null)}
                    onUpdate={handleWorkflowUpdate}
                />
            )}

            {/* Context Menu */}
            {contextMenu && (
                <WorkflowContextMenu
                    item={contextMenu.item}
                    type={contextMenu.type}
                    position={contextMenu.position}
                    onClose={() => setContextMenu(null)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onChangeVisibility={handleChangeVisibility}
                />
            )}

            {/* Delete Confirmation */}
            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                title={deleteConfirmation?.type === 'folder' ? 'Delete Folder' : 'Delete Workflow'}
                description={
                    deleteConfirmation?.type === 'folder'
                        ? 'Are you sure you want to delete this folder and all its contents?'
                        : 'Are you sure you want to delete this workflow?'
                }
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isDangerous={true}
                onConfirm={executeDelete}
                onCancel={() => setDeleteConfirmation(null)}
            />
        </>
    );
}
