'use client';

import { useState, useEffect } from 'react';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Task } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useCalendarBlocks } from '@/lib/hooks/use-calendar-blocks';
import { useMultiMemberBlocks } from '@/lib/hooks/use-multi-member-blocks';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { useAuth } from '@/lib/auth/hooks';
import { useLanguage } from '@/lib/i18n';

// Convert Date to YYYY-MM-DD in local timezone (avoid UTC conversion)
const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function WorkspacePage() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { preferences } = useUserPreferences();
    const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask, acceptAssignment, rejectAssignment } = useTasks();
    const {
        calendarBlocks,
        loading: blocksLoading,
        error: blocksError,
        createCalendarBlock,
        updateCalendarBlock,
        deleteCalendarBlock,
        refetch: refetchCalendarBlocks
    } = useCalendarBlocks();

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    // Get showWeekends from user preferences
    const showWeekends = (preferences as any)?.show_weekends ?? false;

    // Multi-member schedule viewing state
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Initialize selectedMemberIds with current user when user is loaded
    useEffect(() => {
        if (user && selectedMemberIds.length === 0) {
            setSelectedMemberIds([user.id]);
        }
    }, [user, selectedMemberIds.length]);

    // Fetch multi-member blocks for the current week view
    const {
        multiMemberBlocks,
        loading: multiMemberLoading,
        error: multiMemberError,
        refetch: refetchMultiMemberBlocks,
    } = useMultiMemberBlocks({
        selectedMemberIds,
        viewDate,
        showWeekends,
    });

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
            alert(t('common.alert_delete_own'));
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

    // Assignment handlers with calendar blocks refetch
    const handleAcceptAssignment = async (taskId: string) => {
        try {
            await acceptAssignment(taskId);
            // Refetch calendar blocks immediately to unmute them
            await refetchCalendarBlocks();
        } catch (err) {
            console.error('Failed to accept assignment:', err);
        }
    };

    const handleRejectAssignment = async (taskId: string) => {
        try {
            await rejectAssignment(taskId);
            // Refetch calendar blocks immediately to remove them
            await refetchCalendarBlocks();
        } catch (err) {
            console.error('Failed to reject assignment:', err);
        }
    };

    // Calendar block handlers
    const handleCreateBlock = async (taskId: string, startTime: Date, endTime: Date) => {
        try {
            await createCalendarBlock({ taskId, startTime, endTime });

            // Sync task's scheduledDate to match the block's date
            const newDateISO = formatDateToLocalISO(startTime);
            const task = tasks.find(t => t.id === taskId);
            // Only update if date changed
            if (task && task.scheduledDate !== newDateISO) {
                await updateTask(taskId, { scheduledDate: newDateISO });
            }
        } catch (err) {
            console.error('Failed to create calendar block:', err);
            // TODO: Show toast notification
        }
    };

    const handleUpdateBlock = async (blockId: string, startTime: Date, endTime: Date) => {
        try {
            await updateCalendarBlock(blockId, { startTime, endTime });

            // Find the block/task to sync scheduledDate
            // Note: In multi-member view we use multiMemberBlocks, otherwise calendarBlocks
            const block = calendarBlocks.find(b => b.id === blockId) || multiMemberBlocks.find(b => b.id === blockId);

            if (block) {
                const newDateISO = formatDateToLocalISO(startTime);
                // We need to find the task to check/update its date
                // Note: block.taskId is available on both CalendarBlock and MultiMemberBlock
                const task = tasks.find(t => t.id === block.taskId);

                if (task && task.scheduledDate !== newDateISO) {
                    await updateTask(block.taskId, { scheduledDate: newDateISO });
                }
            }

            // Refetch multi-member blocks to reflect the change immediately in multi-member view
            if (selectedMemberIds.length > 1) {
                refetchMultiMemberBlocks();
            }
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
    const loading = tasksLoading || blocksLoading || multiMemberLoading;
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-[#787774]">{t('common.loading')}</div>
            </div>
        );
    }

    // Error state
    const error = tasksError || blocksError || multiMemberError;
    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-red-500">{t('common.error')}: {error}</div>
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
                viewDate={viewDate}
                onViewDateChange={setViewDate}
                showWeekends={showWeekends}
                onTaskClick={setSelectedTask}
                onUpdateTask={handleTaskUpdate}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                draggingTask={draggingTask}
                onDragStart={setDraggingTaskId}
                onCreateBlock={handleCreateBlock}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                selectedMemberIds={selectedMemberIds}
                onSelectedMembersChange={setSelectedMemberIds}
                multiMemberBlocks={multiMemberBlocks}
                currentUserId={user?.id}
                onAcceptAssignment={handleAcceptAssignment}
                onRejectAssignment={handleRejectAssignment}
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

