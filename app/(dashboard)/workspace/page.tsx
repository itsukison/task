'use client';

import { useState } from 'react';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Task, CalendarBlock } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';

// Mock calendar blocks for now (will be converted in Phase 4)
const INITIAL_BLOCKS: CalendarBlock[] = [];

export default function WorkspacePage() {
    const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
    const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>(INITIAL_BLOCKS);

    const draggingTask = tasks.find(t => t.id === draggingTaskId) || null;

    const handleTaskUpdate = async (updatedTask: Task) => {
        try {
            await updateTask(updatedTask.id, {
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                expectedTime: updatedTask.expectedTime,
                actualTime: updatedTask.actualTime,
                visibility: updatedTask.visibility,
            });
            if (selectedTask?.id === updatedTask.id) setSelectedTask(updatedTask);
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTask(taskId);
            setCalendarBlocks(calendarBlocks.filter(b => b.taskId !== taskId));
            if (selectedTask?.id === taskId) setSelectedTask(null);
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    const handleAddTask = async () => {
        try {
            await createTask({
                title: 'Untitled',
                description: '',
                status: 'planned',
                expectedTime: 30,
            });
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-[#787774]">Loading tasks...</div>
            </div>
        );
    }

    // Error state
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
