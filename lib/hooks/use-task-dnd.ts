import { useState, useCallback } from 'react';
import { Task } from '@/lib/types';

interface UseTaskDndProps {
    tasks: Task[];
    onUpdateTask: (task: Task) => void;
    onDragStart: (taskId: string | null) => void;
    onDropCalendarBlock?: (blockId: string, dateKey: string) => void;
}

export function useTaskDnd({
    tasks,
    onUpdateTask,
    onDragStart,
    onDropCalendarBlock,
}: UseTaskDndProps) {
    const [isDraggingTaskRow, setIsDraggingTaskRow] = useState(false);
    const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);

    const handleDragStart = useCallback((rowId: string) => {
        onDragStart(rowId);
        setIsDraggingTaskRow(true);
    }, [onDragStart]);

    const handleDragEnd = useCallback(() => {
        onDragStart(null);
        setIsDraggingTaskRow(false);
    }, [onDragStart]);

    const handleSectionDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
        const isCalendarBlock = e.dataTransfer.types.includes('calendar-block');
        const isTaskRow = e.dataTransfer.types.includes('task-row');
        if (!isCalendarBlock && !isTaskRow) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverDateKey(dateKey);
    }, []);

    const handleSectionDragLeave = useCallback((e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverDateKey(null);
        }
    }, []);

    const handleSectionDrop = useCallback((e: React.DragEvent, dateKey: string) => {
        setDragOverDateKey(null);
        const isCalendarBlock = e.dataTransfer.types.includes('calendar-block');
        const isTaskRow = e.dataTransfer.types.includes('task-row');
        if (!isCalendarBlock && !isTaskRow) return;
        e.preventDefault();

        if (isCalendarBlock) {
            const blockId = e.dataTransfer.getData('blockId');
            if (blockId && onDropCalendarBlock) {
                onDropCalendarBlock(blockId, dateKey);
            }
        } else if (isTaskRow) {
            setIsDraggingTaskRow(false);
            const rowId = e.dataTransfer.getData('rowId');
            if (rowId) {
                const task = tasks.find(t => t.id === rowId);
                if (task && task.scheduledDate !== dateKey) {
                    onUpdateTask({ ...task, scheduledDate: dateKey });
                }
            }
        }
    }, [onDropCalendarBlock, onUpdateTask, tasks]);

    return {
        isDraggingTaskRow,
        dragOverDateKey,
        handleDragStart,
        handleDragEnd,
        handleSectionDragOver,
        handleSectionDragLeave,
        handleSectionDrop,
    };
}
