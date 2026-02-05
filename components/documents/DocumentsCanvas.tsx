'use client';

import { useRef, useState, useEffect } from 'react';
import { Document as DocumentType, Folder } from '@/lib/types';
import { DocumentCard } from './DocumentCard';
import { FolderCard } from './FolderCard';
import { SelectionBox } from './SelectionBox';
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

// Constants for layout
const CARD_WIDTH = 130;
const CARD_HEIGHT = 190;
const FOLDER_WIDTH = 130;
const FOLDER_HEIGHT = 160;
const GRID_GAP = 32;
const CANVAS_PADDING = 32;

interface DocumentsCanvasProps {
    documents: DocumentType[];
    folders: Folder[];
    loading?: boolean;
    selectedDocIds?: Set<string>;
    selectedFolderIds?: Set<string>;
    onDocumentSelect: (document: DocumentType, multiSelect: boolean) => void;
    onDocumentOpen: (document: DocumentType) => void;
    onFolderSelect: (folder: Folder, multiSelect: boolean) => void;
    onFolderOpen: (folder: Folder) => void;
    onDocumentContextMenu: (document: DocumentType, event: React.MouseEvent) => void;
    onFolderContextMenu: (folder: Folder, event: React.MouseEvent) => void;
    onUpdateDocumentPosition: (id: string, x: number, y: number) => void;
    onUpdateFolderPosition: (id: string, x: number, y: number) => void;
    onSelectMultiple?: (docIds: string[], folderIds: string[]) => void;
    onDeselectAll?: () => void;
}

export function DocumentsCanvas({
    documents,
    folders,
    loading = false,
    selectedDocIds = new Set(),
    selectedFolderIds = new Set(),
    onDocumentSelect,
    onDocumentOpen,
    onFolderSelect,
    onFolderOpen,
    onDocumentContextMenu,
    onFolderContextMenu,
    onUpdateDocumentPosition,
    onUpdateFolderPosition,
    onSelectMultiple,
    onDeselectAll,
}: DocumentsCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<'document' | 'folder' | null>(null);
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        currentX: number;
        currentY: number;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragSelectedItems, setDragSelectedItems] = useState<{ documentIds: string[]; folderIds: string[] }>({ documentIds: [], folderIds: [] });
    const isDragSelectingRef = useRef(false);

    // Configure sensors to distinguish clicks from drags
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Count items in each folder
    const getFolderItemCount = (folderId: string) => {
        return documents.filter((d) => d.folderId === folderId).length +
            folders.filter((f) => f.parentFolderId === folderId).length;
    };

    // Calculate initial grid position for items without saved positions
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

    // Get position for a folder
    const getFolderPosition = (folder: Folder, index: number) => {
        if (folder.positionX !== null && folder.positionY !== null) {
            return { x: folder.positionX, y: folder.positionY };
        }
        return getInitialPosition(index, FOLDER_WIDTH);
    };

    // Get position for a document
    const getDocumentPosition = (document: DocumentType, index: number) => {
        if (document.positionX !== null && document.positionY !== null) {
            return { x: document.positionX, y: document.positionY };
        }
        // Documents come after folders in layout
        return getInitialPosition(folders.length + index, CARD_WIDTH);
    };

    const handleDragStart = (event: DragStartEvent) => {
        // Don't start card drag if we're lasso selecting
        if (isSelecting) {
            return;
        }

        const { active } = event;
        const id = active.id as string;

        // Determine if it's a document or folder
        if (folders.some(f => f.id === id)) {
            setActiveType('folder');
        } else {
            setActiveType('document');
        }
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

        // Find the item and calculate new position
        const folder = folders.find(f => f.id === id);
        if (folder) {
            const currentPos = getFolderPosition(folder, folders.indexOf(folder));
            const newX = Math.max(0, currentPos.x + delta.x);
            const newY = Math.max(0, currentPos.y + delta.y);
            onUpdateFolderPosition(id, newX, newY);
        } else {
            const document = documents.find(d => d.id === id);
            if (document) {
                const currentPos = getDocumentPosition(document, documents.indexOf(document));
                const newX = Math.max(0, currentPos.x + delta.x);
                const newY = Math.max(0, currentPos.y + delta.y);
                onUpdateDocumentPosition(id, newX, newY);
            }
        }

        setActiveId(null);
        setActiveType(null);
    };

    // Get active item for drag overlay
    const activeFolder = activeId ? folders.find(f => f.id === activeId) : null;
    const activeDocument = activeId ? documents.find(d => d.id === activeId) : null;

    // Calculate canvas min dimensions based on item positions
    const calculateCanvasSize = () => {
        let maxX = 800;
        let maxY = 600;

        folders.forEach((folder, idx) => {
            const pos = getFolderPosition(folder, idx);
            maxX = Math.max(maxX, pos.x + FOLDER_WIDTH + CANVAS_PADDING);
            maxY = Math.max(maxY, pos.y + FOLDER_HEIGHT + CANVAS_PADDING);
        });

        documents.forEach((doc, idx) => {
            const pos = getDocumentPosition(doc, idx);
            maxX = Math.max(maxX, pos.x + CARD_WIDTH + CANVAS_PADDING);
            maxY = Math.max(maxY, pos.y + CARD_HEIGHT + CANVAS_PADDING);
        });

        return { width: maxX, height: maxY };
    };

    // Calculate which items intersect with selection box
    const calculateSelectedItems = (
        box: { startX: number; startY: number; currentX: number; currentY: number },
        docs: DocumentType[],
        fldrs: Folder[]
    ): { documentIds: string[]; folderIds: string[] } => {
        const left = Math.min(box.startX, box.currentX);
        const right = Math.max(box.startX, box.currentX);
        const top = Math.min(box.startY, box.currentY);
        const bottom = Math.max(box.startY, box.currentY);

        const selectedDocIds = docs
            .filter((doc, idx) => {
                const pos = getDocumentPosition(doc, idx);
                const docLeft = pos.x;
                const docRight = pos.x + CARD_WIDTH;
                const docTop = pos.y;
                const docBottom = pos.y + CARD_HEIGHT;

                // Check rectangle overlap
                return !(docRight < left || docLeft > right || docBottom < top || docTop > bottom);
            })
            .map(doc => doc.id)
            .slice(0, 5);  // Limit to 5

        const selectedFolderIds = fldrs
            .filter((folder, idx) => {
                const pos = getFolderPosition(folder, idx);
                const folderLeft = pos.x;
                const folderRight = pos.x + FOLDER_WIDTH;
                const folderTop = pos.y;
                const folderBottom = pos.y + FOLDER_HEIGHT;

                return !(folderRight < left || folderLeft > right || folderBottom < top || folderTop > bottom);
            })
            .map(f => f.id);

        return { documentIds: selectedDocIds, folderIds: selectedFolderIds };
    };

    // Lasso selection handlers
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only start lasso if clicking canvas background (not on an item wrapper)
        const target = e.target as HTMLElement;
        const isItemWrapper = !!target.closest('[data-item="true"]');

        if (!isItemWrapper) {
            e.preventDefault(); // Prevent text selection during drag
            const container = containerRef.current;
            if (!container) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;

            setSelectionBox({
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                currentX: e.clientX - rect.left,
                currentY: e.clientY - rect.top,
            });
            setDragSelectedItems({ documentIds: [], folderIds: [] });
            setIsSelecting(true);
            isDragSelectingRef.current = true;
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectionBox && isSelecting) {
            const container = containerRef.current;
            if (!container) return;

            const rect = e.currentTarget.getBoundingClientRect();

            const newBox = {
                ...selectionBox,
                currentX: e.clientX - rect.left,
                currentY: e.clientY - rect.top,
            };

            setSelectionBox(newBox);

            // Calculate live selection
            const selected = calculateSelectedItems(newBox, documents, folders);
            setDragSelectedItems(selected);
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectionBox && isSelecting) {
            const selectedItems = calculateSelectedItems(selectionBox, documents, folders);

            if (onSelectMultiple) {
                onSelectMultiple(selectedItems.documentIds, selectedItems.folderIds);
            }

            setSelectionBox(null);
            setIsSelecting(false);
            setDragSelectedItems({ documentIds: [], folderIds: [] });

            // Keep ref true briefly to verify it blocks the click event 
            // (The click event fires immediately after mouseup in the same event loop tick usually, 
            // or slightly after. We reset it in the click handler or with a timeout if needed, 
            // but the click handler checks it.)
            setTimeout(() => {
                isDragSelectingRef.current = false;
            }, 0);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // If we just finished a drag selection, don't deselect
        if (isDragSelectingRef.current) {
            isDragSelectingRef.current = false;
            return;
        }

        // Deselect all when clicking canvas background (not during lasso)
        if (e.target === e.currentTarget && !isSelecting && !selectionBox) {
            onDeselectAll?.();
        }
    };


    const canvasSize = calculateCanvasSize();

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#787774] text-sm">Loading documents...</div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                ref={containerRef}
                className="w-full h-full overflow-auto custom-scrollbar"
            >
                {/* Freeboard Canvas */}
                <div
                    className="relative select-none"
                    style={{
                        minWidth: canvasSize.width,
                        minHeight: canvasSize.height,
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onClick={handleCanvasClick}
                >
                    {/* Render SelectionBox if active */}
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
                        const isActive = activeId === folder.id;

                        return (
                            <div
                                key={folder.id}
                                data-draggable-id={folder.id}
                                data-item="true"
                                className="absolute transition-shadow"
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: FOLDER_WIDTH,
                                    opacity: isActive ? 0.5 : 1,
                                    cursor: 'grab',
                                }}
                            >
                                <FolderCard
                                    folder={folder}
                                    itemCount={getFolderItemCount(folder.id)}
                                    isSelected={selectedFolderIds.has(folder.id) || dragSelectedItems.folderIds.includes(folder.id)}
                                    onSelect={(e) => {
                                        const multiSelect = e.altKey;
                                        onFolderSelect(folder, multiSelect);
                                    }}
                                    onOpen={(e) => {
                                        onFolderOpen(folder);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onFolderContextMenu(folder, e);
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Documents */}
                    {documents.map((document, index) => {
                        const pos = getDocumentPosition(document, index);
                        const isActive = activeId === document.id;

                        return (
                            <div
                                key={document.id}
                                data-draggable-id={document.id}
                                data-item="true"
                                className="absolute"
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: CARD_WIDTH,
                                    opacity: isActive ? 0.5 : 1,
                                    cursor: 'grab',
                                }}
                            >
                                <DocumentCard
                                    document={document}
                                    isSelected={selectedDocIds.has(document.id) || dragSelectedItems.documentIds.includes(document.id)}
                                    onSelect={(e) => {
                                        const multiSelect = e.altKey;
                                        onDocumentSelect(document, multiSelect);
                                    }}
                                    onOpen={(e) => {
                                        onDocumentOpen(document);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onDocumentContextMenu(document, e);
                                    }}
                                />
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {folders.length === 0 && documents.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-[#F7F7F5] rounded-full flex items-center justify-center mb-4">
                                <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="text-[#9B9A97]"
                                >
                                    <path
                                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-[#37352F] mb-2">
                                No documents yet
                            </h3>
                            <p className="text-sm text-[#9B9A97] max-w-sm">
                                Create a new document, add a folder, upload a file, or save a link to get started.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeFolder && (
                    <div style={{ width: FOLDER_WIDTH, opacity: 0.9 }}>
                        <FolderCard
                            folder={activeFolder}
                            itemCount={getFolderItemCount(activeFolder.id)}
                            onSelect={() => { }}
                            onOpen={() => { }}
                            onContextMenu={() => { }}
                        />
                    </div>
                )}
                {activeDocument && (
                    <div style={{ width: CARD_WIDTH, opacity: 0.9 }}>
                        <DocumentCard
                            document={activeDocument}
                            onSelect={() => { }}
                            onOpen={() => { }}
                            onContextMenu={() => { }}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
