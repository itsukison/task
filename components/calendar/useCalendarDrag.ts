import { useCallback } from 'react';
import { Task } from '@/lib/types';
import { transparentDragImage } from './constants';
import { DragPreview, DragSource } from './useCalendarState';

export interface UseCalendarDragParams {
  draggingTask: Task | null;
  hourHeight: number;
  tasks: Task[];
  dragPreview: DragPreview | null;
  dragSource: DragSource;
  setDragPreview: (preview: DragPreview | null) => void;
  setDragSource: (source: DragSource) => void;
  onDragStart: (taskId: string | null) => void;
  onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
  onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
}

/**
 * Hook for managing calendar drag and drop operations
 *
 * Handles:
 * - Drag start from task list or calendar
 * - Drag over (preview positioning)
 * - Drop (create or update block)
 */
export function useCalendarDrag({
  draggingTask,
  hourHeight,
  tasks,
  dragPreview,
  dragSource,
  setDragPreview,
  setDragSource,
  onDragStart,
  onCreateBlock,
  onUpdateBlock,
}: UseCalendarDragParams) {
  const handleDragOverDay = useCallback(
    (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      if (!draggingTask) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const minutes = Math.floor((offsetY / hourHeight) * 60);
      const snapped = Math.max(0, Math.min(1440 - 15, Math.round(minutes / 15) * 15));

      setDragPreview({ dateStr, minutes: snapped });
    },
    [draggingTask, hourHeight, setDragPreview]
  );

  const handleDragStartInternal = useCallback(
    (e: React.DragEvent, task: Task, blockId?: string) => {
      onDragStart(task.id);
      e.dataTransfer.setData('taskId', task.id);
      if (blockId) {
        e.dataTransfer.setData('blockId', blockId);
        setDragSource('calendar');
      } else {
        setDragSource('task-list');
      }
      e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
    },
    [onDragStart, setDragSource]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      setDragPreview(null);
      onDragStart(null);

      // Check both 'taskId' (from calendar drag) and 'rowId' (from table drag)
      const taskId = e.dataTransfer.getData('taskId') || e.dataTransfer.getData('rowId');
      const blockId = e.dataTransfer.getData('blockId');
      const source = dragSource;
      setDragSource(null);

      console.log('handleDrop:', { taskId, blockId, source, dragPreview: !!dragPreview, dateStr });

      if (taskId && dragPreview) {
        const task = tasks.find((t) => t.id === taskId);

        if (task) {
          // Calculate start/end times
          const startDate = new Date(dateStr);
          startDate.setHours(0, 0, 0, 0);
          startDate.setMinutes(dragPreview.minutes);

          const endDate = new Date(startDate);
          endDate.setMinutes(startDate.getMinutes() + task.expectedTime);

          if (source === 'calendar' && blockId && onUpdateBlock) {
            // Moving existing block
            onUpdateBlock(blockId, startDate, endDate);
          } else if (onCreateBlock) {
            // Creating new block from task list
            onCreateBlock(taskId, startDate, endDate);
          }
        }
      }
    },
    [
      dragPreview,
      dragSource,
      tasks,
      onUpdateBlock,
      onCreateBlock,
      onDragStart,
      setDragPreview,
      setDragSource,
    ]
  );

  const formatMinutesToTime = useCallback((totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, []);

  return {
    handleDragOverDay,
    handleDragStartInternal,
    handleDrop,
    formatMinutesToTime,
  };
}
