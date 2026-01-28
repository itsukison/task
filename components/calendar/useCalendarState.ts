import { useState, useEffect } from 'react';

export interface DragPreview {
  dateStr: string;
  minutes: number;
}

export interface ContextMenu {
  x: number;
  y: number;
  taskId: string;
  blockId?: string;
}

export type DragSource = 'task-list' | 'calendar' | null;

/**
 * Hook for managing calendar UI state
 *
 * Manages:
 * - Drag preview (visual feedback during drag)
 * - Context menu (right-click menu)
 * - Drag source tracking (task-list vs calendar)
 */
export function useCalendarState() {
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [dragSource, setDragSource] = useState<DragSource>(null);

  // Global click listener to close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return {
    dragPreview,
    setDragPreview,
    contextMenu,
    setContextMenu,
    dragSource,
    setDragSource,
  };
}
