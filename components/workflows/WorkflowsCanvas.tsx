'use client';

import { useRef, useState, useEffect } from 'react';
import { Workflow, WorkflowFolder } from '@/lib/types';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowFolderCard } from './WorkflowFolderCard';
import { Bot } from 'lucide-react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    useSensor,
    useSensors,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    DragOverlay,
} from '@dnd-kit/core';

const CARD_WIDTH = 130;
const CARD_HEIGHT = 190;
const FOLDER_WIDTH = 130;
const FOLDER_HEIGHT = 160;
const GRID_GAP = 32;
const CANVAS_PADDING = 32;

interface WorkflowsCanvasProps {
    workflows: Workflow[];
    folders: WorkflowFolder[];
    loading?: boolean;
    selectedWorkflowIds?: Set<string>;
    selectedFolderIds?: Set<string>;
    onWorkflowSelect: (workflow: Workflow, multiSelect: boolean) => void;
    onWorkflowOpen: (workflow: Workflow) => void;
    onFolderSelect: (folder: WorkflowFolder, multiSelect: boolean) => void;
    onFolderOpen: (folder: WorkflowFolder) => void;
    onWorkflowContextMenu: (workflow: Workflow, event: React.MouseEvent) => void;
    onFolderContextMenu: (folder: WorkflowFolder, event: React.MouseEvent) => void;
    onUpdateWorkflowPosition: (id: string, x: number, y: number) => void;
    onUpdateFolderPosition: (id: string, x: number, y: number) => void;
    onSelectMultiple?: (workflowIds: string[], folderIds: string[]) => void;
    onDeselectAll?: () => void;
}

// Lasso selection box
function SelectionBox({
    startX, startY, currentX, currentY,
}: {
    startX: number; startY: number; currentX: number; currentY: number;
}) {
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    return (
        <div
            className="absolute pointer-events-none border border-blue-400 bg-blue-100/20 z-10"
            style={{ left, top, width, height }}
        />
    );
}

export function WorkflowsCanvas({
    workflows,
    folders,
    loading = false,
    selectedWorkflowIds = new Set(),
    selectedFolderIds = new Set(),
    onWorkflowSelect,
    onWorkflowOpen,
    onFolderSelect,
    onFolderOpen,
    onWorkflowContextMenu,
    onFolderContextMenu,
    onUpdateWorkflowPosition,
    onUpdateFolderPosition,
    onSelectMultiple,
    onDeselectAll,
}: WorkflowsCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<'workflow' | 'folder' | null>(null);
    const [selectionBox, setSelectionBox] = useState<{
        startX: number; startY: number; currentX: number; currentY: number;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragSelectedItems, setDragSelectedItems] = useState<{ workflowIds: string[]; folderIds: string[] }>({
        workflowIds: [],
        folderIds: [],
    });
    const isDragSelectingRef = useRef(false);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const getFolderItemCount = (folderId: string) =>
        workflows.filter((w) => w.folderId === folderId).length +
        folders.filter((f) => f.parentFolderId === folderId).length;

    const getInitialPosition = (index: number, itemWidth: number) => {
        const containerWidth = containerRef.current?.clientWidth || 1200;
        const availableWidth = containerWidth - CANVAS_PADDING * 2;
        const itemsPerRow = Math.max(1, Math.floor((availableWidth + GRID_GAP) / (itemWidth + GRID_GAP)));
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        return {
            x: CANVAS_PADDING + col * (itemWidth + GRID_GAP),
            y: CANVAS_PADDING + row * (CARD_HEIGHT + GRID_GAP),
        };
    };

    const getFolderPosition = (folder: WorkflowFolder, index: number) => {
        if (folder.positionX !== null && folder.positionY !== null) {
            return { x: folder.positionX, y: folder.positionY };
        }
        return getInitialPosition(index, FOLDER_WIDTH);
    };

    const getWorkflowPosition = (workflow: Workflow, index: number) => {
        if (workflow.positionX !== null && workflow.positionY !== null) {
            return { x: workflow.positionX, y: workflow.positionY };
        }
        return getInitialPosition(folders.length + index, CARD_WIDTH);
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (isSelecting) return;
        const id = event.active.id as string;
        setActiveType(folders.some((f) => f.id === id) ? 'folder' : 'workflow');
        setActiveId(id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, delta } = event;
        const id = active.id as string;

        if (delta.x === 0 && delta.y === 0) {
            setActiveId(null);
            setActiveType(null);
            return;
        }

        const folder = folders.find((f) => f.id === id);
        if (folder) {
            const pos = getFolderPosition(folder, folders.indexOf(folder));
            onUpdateFolderPosition(id, Math.max(0, pos.x + delta.x), Math.max(0, pos.y + delta.y));
        } else {
            const workflow = workflows.find((w) => w.id === id);
            if (workflow) {
                const pos = getWorkflowPosition(workflow, workflows.indexOf(workflow));
                onUpdateWorkflowPosition(id, Math.max(0, pos.x + delta.x), Math.max(0, pos.y + delta.y));
            }
        }

        setActiveId(null);
        setActiveType(null);
    };

    const calculateCanvasSize = () => {
        let maxX = 800;
        let maxY = 600;
        folders.forEach((f, i) => {
            const pos = getFolderPosition(f, i);
            maxX = Math.max(maxX, pos.x + FOLDER_WIDTH + CANVAS_PADDING);
            maxY = Math.max(maxY, pos.y + FOLDER_HEIGHT + CANVAS_PADDING);
        });
        workflows.forEach((w, i) => {
            const pos = getWorkflowPosition(w, i);
            maxX = Math.max(maxX, pos.x + CARD_WIDTH + CANVAS_PADDING);
            maxY = Math.max(maxY, pos.y + CARD_HEIGHT + CANVAS_PADDING);
        });
        return { width: maxX, height: maxY };
    };

    const calculateSelectedItems = (
        box: { startX: number; startY: number; currentX: number; currentY: number }
    ) => {
        const left = Math.min(box.startX, box.currentX);
        const right = Math.max(box.startX, box.currentX);
        const top = Math.min(box.startY, box.currentY);
        const bottom = Math.max(box.startY, box.currentY);

        const workflowIds = workflows
            .filter((w, i) => {
                const pos = getWorkflowPosition(w, i);
                return !(pos.x + CARD_WIDTH < left || pos.x > right || pos.y + CARD_HEIGHT < top || pos.y > bottom);
            })
            .map((w) => w.id)
            .slice(0, 5);

        const folderIds = folders
            .filter((f, i) => {
                const pos = getFolderPosition(f, i);
                return !(pos.x + FOLDER_WIDTH < left || pos.x > right || pos.y + FOLDER_HEIGHT < top || pos.y > bottom);
            })
            .map((f) => f.id);

        return { workflowIds, folderIds };
    };

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-item="true"]')) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setSelectionBox({
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            currentX: e.clientX - rect.left,
            currentY: e.clientY - rect.top,
        });
        setDragSelectedItems({ workflowIds: [], folderIds: [] });
        setIsSelecting(true);
        isDragSelectingRef.current = true;
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectionBox || !isSelecting) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const newBox = {
            ...selectionBox,
            currentX: e.clientX - rect.left,
            currentY: e.clientY - rect.top,
        };
        setSelectionBox(newBox);
        setDragSelectedItems(calculateSelectedItems(newBox));
    };

    const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectionBox || !isSelecting) return;
        const selected = calculateSelectedItems(selectionBox);
        onSelectMultiple?.(selected.workflowIds, selected.folderIds);
        setSelectionBox(null);
        setIsSelecting(false);
        setDragSelectedItems({ workflowIds: [], folderIds: [] });
        setTimeout(() => { isDragSelectingRef.current = false; }, 0);
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragSelectingRef.current) {
            isDragSelectingRef.current = false;
            return;
        }
        if (e.target === e.currentTarget && !isSelecting && !selectionBox) {
            onDeselectAll?.();
        }
    };

    const canvasSize = calculateCanvasSize();
    const activeFolder = activeId ? folders.find((f) => f.id === activeId) : null;
    const activeWorkflow = activeId ? workflows.find((w) => w.id === activeId) : null;

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#787774] text-sm">Loading...</div>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div ref={containerRef} className="w-full h-full overflow-auto custom-scrollbar">
                <div
                    className="relative select-none"
                    style={{ minWidth: canvasSize.width, minHeight: canvasSize.height }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onClick={handleCanvasClick}
                >
                    {selectionBox && (
                        <SelectionBox
                            startX={selectionBox.startX}
                            startY={selectionBox.startY}
                            currentX={selectionBox.currentX}
                            currentY={selectionBox.currentY}
                        />
                    )}

                    {/* Folders */}
                    {folders.map((folder, index) => {
                        const pos = getFolderPosition(folder, index);
                        return (
                            <div
                                key={folder.id}
                                data-item="true"
                                className="absolute transition-shadow"
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: FOLDER_WIDTH,
                                    opacity: activeId === folder.id ? 0.5 : 1,
                                    cursor: 'grab',
                                }}
                            >
                                <WorkflowFolderCard
                                    folder={folder}
                                    itemCount={getFolderItemCount(folder.id)}
                                    isSelected={
                                        selectedFolderIds.has(folder.id) ||
                                        dragSelectedItems.folderIds.includes(folder.id)
                                    }
                                    onSelect={(e) => onFolderSelect(folder, e.altKey)}
                                    onOpen={() => onFolderOpen(folder)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onFolderContextMenu(folder, e);
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Workflows */}
                    {workflows.map((workflow, index) => {
                        const pos = getWorkflowPosition(workflow, index);
                        return (
                            <div
                                key={workflow.id}
                                data-item="true"
                                className="absolute"
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: CARD_WIDTH,
                                    opacity: activeId === workflow.id ? 0.5 : 1,
                                    cursor: 'grab',
                                }}
                            >
                                <WorkflowCard
                                    workflow={workflow}
                                    isSelected={
                                        selectedWorkflowIds.has(workflow.id) ||
                                        dragSelectedItems.workflowIds.includes(workflow.id)
                                    }
                                    onSelect={(e) => onWorkflowSelect(workflow, e.altKey)}
                                    onOpen={() => onWorkflowOpen(workflow)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onWorkflowContextMenu(workflow, e);
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {folders.length === 0 && workflows.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-[#F7F7F5] rounded-full flex items-center justify-center mb-4">
                                <Bot className="w-8 h-8 text-[#9B9A97]" />
                            </div>
                            <h3 className="text-lg font-medium text-[#37352F] mb-2">No workflows yet</h3>
                            <p className="text-sm text-[#9B9A97] max-w-sm">
                                Create a workflow to automate browser tasks. Write your steps, then use AI Refine to clean them up.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <DragOverlay>
                {activeFolder && (
                    <div style={{ width: FOLDER_WIDTH, opacity: 0.9 }}>
                        <WorkflowFolderCard
                            folder={activeFolder}
                            itemCount={getFolderItemCount(activeFolder.id)}
                            onSelect={() => {}}
                            onOpen={() => {}}
                            onContextMenu={() => {}}
                        />
                    </div>
                )}
                {activeWorkflow && (
                    <div style={{ width: CARD_WIDTH, opacity: 0.9 }}>
                        <WorkflowCard
                            workflow={activeWorkflow}
                            onSelect={() => {}}
                            onOpen={() => {}}
                            onContextMenu={() => {}}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
