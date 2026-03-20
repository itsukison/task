import { useCallback, useRef } from 'react';
import { Task } from '@/lib/types';
import { transparentDragImage } from './constants';
import { DragPreview, DragSource } from './useCalendarState';

export interface UseCalendarDragParams {
  draggingTask: Task | null;
  hourHeight: number;
  snapInterval: number;
  tasks: Task[];
  dragPreview: DragPreview | null;
  dragSource: DragSource;
  setDragPreview: (preview: DragPreview | null) => void;
  setDragSource: (source: DragSource) => void;
  onDragStart: (taskId: string | null) => void;
  onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
  onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
  selectedBlockIds?: Set<string>;
  onUpdateMultipleBlocks?: (deltaMinutes: number, blockIds: string[]) => void;
  startHour?: number;
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
  snapInterval,
  tasks,
  dragPreview,
  dragSource,
  setDragPreview,
  setDragSource,
  onDragStart,
  onCreateBlock,
  onUpdateBlock,
  selectedBlockIds,
  onUpdateMultipleBlocks,
  startHour = 0,
}: UseCalendarDragParams) {
  const dragStartDataRef = useRef<{ blockId: string, startTime: Date, isMultiDrag: boolean } | null>(null);

  // Use a ref so handleDragOverDay always reads the latest value
  // instead of relying on a potentially stale useCallback closure
  const draggingTaskRef = useRef(draggingTask);
  draggingTaskRef.current = draggingTask;

  // When a drag ends (draggingTask becomes null), clear stale drag-start data.
  // This prevents the next task-list drag from inheriting a blockId that pointed
  // to a now-deleted calendar block (e.g. after dropping a block onto the task list,
  // the source element is removed before dragend fires on window, so the global
  // dragend listener never resets this ref).
  if (!draggingTask) {
    dragStartDataRef.current = null;
  }

  const handleDragOverDay = useCallback(
    (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      if (!draggingTaskRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const minutes = startHour * 60 + Math.floor((offsetY / hourHeight) * 60);
      const snapped = Math.max(startHour * 60, Math.min(1440 - snapInterval, Math.round(minutes / snapInterval) * snapInterval));

      let deltaMinutes = 0;
      let isMultiDrag = false;
      if (dragStartDataRef.current) {
        const newStartDate = new Date(dateStr);
        newStartDate.setHours(0, 0, 0, 0);
        newStartDate.setMinutes(snapped);
        deltaMinutes = (newStartDate.getTime() - dragStartDataRef.current.startTime.getTime()) / 60000;
        isMultiDrag = dragStartDataRef.current.isMultiDrag;
      }

      setDragPreview({
        dateStr,
        minutes: snapped,
        deltaMinutes,
        isMultiDrag,
        blockId: dragStartDataRef.current?.blockId,
      });
      e.dataTransfer.dropEffect = 'move';
    },
    [hourHeight, snapInterval, setDragPreview, startHour]
  );

  const handleDragStartInternal = useCallback(
    (e: React.DragEvent, task: Task, blockId?: string, startTimeStr?: string) => {
      onDragStart(task.id);
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.setData('duration', task.expectedTime.toString());
      if (blockId) {
        e.dataTransfer.setData('blockId', blockId);
        e.dataTransfer.setData('calendar-block', '1');
        if (startTimeStr) {
          e.dataTransfer.setData('startTime', startTimeStr);
          dragStartDataRef.current = {
            blockId,
            startTime: new Date(startTimeStr),
            isMultiDrag: !!(selectedBlockIds && selectedBlockIds.has(blockId) && selectedBlockIds.size > 1)
          };
        } else {
          dragStartDataRef.current = null;
        }
        setDragSource('calendar');
      } else {
        dragStartDataRef.current = null;
        setDragSource('task-list');
      }
      e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
      e.dataTransfer.effectAllowed = 'move';
    },
    [onDragStart, setDragSource, selectedBlockIds]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      setDragPreview(null);
      onDragStart(null);

      const taskId = e.dataTransfer.getData('taskId') || e.dataTransfer.getData('rowId');
      const blockId = e.dataTransfer.getData('blockId');
      const durationStr = e.dataTransfer.getData('duration');
      const startTimeStr = e.dataTransfer.getData('startTime');
      const source = dragSource;
      setDragSource(null);

      console.log('handleDrop:', { taskId, blockId, source, dragPreview: !!dragPreview, dateStr });

      if (taskId && dragPreview) {
        let task = tasks.find((t) => t.id === taskId);

        // Fallback for optimistic tasks (not in main list yet)
        if (!task && taskId.startsWith('optimistic-')) {
          const duration = durationStr ? parseInt(durationStr, 10) : 30;
          task = { id: taskId, expectedTime: duration } as Task;
        }

        if (task) {
          // Calculate start/end times
          const startDate = new Date(dateStr);
          startDate.setHours(0, 0, 0, 0);
          startDate.setMinutes(dragPreview.minutes);

          const endDate = new Date(startDate);
          // For optimistic tasks, we want to update the quick add duration if we can
          // But actually handleUpdateBlockInternal calculates duration from start/end
          // So passing the correct end time (based on duration) maintains size
          endDate.setMinutes(startDate.getMinutes() + task.expectedTime);

          if (source === 'calendar' && blockId && onUpdateBlock) {
            // Multi drag check
            if (selectedBlockIds && selectedBlockIds.has(blockId) && selectedBlockIds.size > 1 && onUpdateMultipleBlocks && startTimeStr) {
              const oldStart = new Date(startTimeStr);
              const deltaMinutes = (startDate.getTime() - oldStart.getTime()) / 60000;
              if (deltaMinutes !== 0) {
                onUpdateMultipleBlocks(deltaMinutes, Array.from(selectedBlockIds));
              }
            } else {
              // Moving existing block
              onUpdateBlock(blockId, startDate, endDate);
            }
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
      selectedBlockIds,
      onUpdateMultipleBlocks,
    ]
  );

  return {
    handleDragOverDay,
    handleDragStartInternal,
    handleDrop,
  };
}
