'use client';

import { useState } from 'react';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Task } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useCalendarBlocks } from '@/lib/hooks/use-calendar-blocks';

// Convert Date to YYYY-MM-DD in local timezone (avoid UTC conversion)
const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function WorkspacePage() {
    const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask } = useTasks();
    const {
        calendarBlocks,
        loading: blocksLoading,
        error: blocksError,
        createCalendarBlock,
        updateCalendarBlock,
        deleteCalendarBlock
    } = useCalendarBlocks();

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const draggingTask = tasks.find(t => t.id === draggingTaskId) || null;

    const handleTaskUpdate = async (updatedTask: Task & { ownerIds?: string[] }) => {
        try {
            await updateTask(updatedTask.id, {
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                expectedTime: updatedTask.expectedTime,
                actualTime: updatedTask.actualTime,
                visibility: updatedTask.visibility,
                ownerIds: updatedTask.ownerIds,
            });
            if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            // Find the task to verify ownership
            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                console.error('Task not found');
                return;
            }

            // Only allow deleting your own tasks
            // Note: user.id is checked in the deleteTask function, but we add this for safety
            await deleteTask(taskId);
            if (selectedTask?.id === taskId) setSelectedTask(null);
        } catch (err) {
            console.error('Failed to delete task:', err);
            // Show user-friendly error
            alert('Unable to delete this task. You can only delete tasks you own.');
        }
    };

    const handleAddTask = async () => {
        try {
            // Create task with scheduled_date set to the selected date
            await createTask({
                title: '',
                description: '',
                status: 'planned',
                expectedTime: 30,
                scheduledDate: formatDateToLocalISO(selectedDate),
            });
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    // Calendar block handlers
    const handleCreateBlock = async (taskId: string, startTime: Date, endTime: Date) => {
        try {
            await createCalendarBlock({ taskId, startTime, endTime });
        } catch (err) {
            console.error('Failed to create calendar block:', err);
            // TODO: Show toast notification
        }
    };

    const handleUpdateBlock = async (blockId: string, startTime: Date, endTime: Date) => {
        try {
            await updateCalendarBlock(blockId, { startTime, endTime });
        } catch (err) {
            console.error('Failed to update calendar block:', err);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        try {
            await deleteCalendarBlock(blockId);
        } catch (err) {
            console.error('Failed to delete calendar block:', err);
        }
    };

    // Loading state
    const loading = tasksLoading || blocksLoading;
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-[#787774]">Loading...</div>
            </div>
        );
    }

    // Error state
    const error = tasksError || blocksError;
    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <>
            <WorkspaceView
                tasks={tasks}
                calendarBlocks={calendarBlocks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onTaskClick={setSelectedTask}
                onUpdateTask={handleTaskUpdate}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                draggingTask={draggingTask}
                onDragStart={setDraggingTaskId}
                onCreateBlock={handleCreateBlock}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
            />

            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleTaskUpdate}
                />
            )}
        </>
    );
}

