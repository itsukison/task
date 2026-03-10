'use client';

import { addWeeks, subWeeks, addDays, format, addMinutes } from 'date-fns';
import { useState, useEffect, useMemo, useRef } from 'react';
import WorkspaceView from '@/components/workspace-view';
import TaskModal from '@/components/task-modal';
import { Task } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useCalendarBlocks } from '@/lib/hooks/use-calendar-blocks';
import { useMultiMemberBlocks } from '@/lib/hooks/use-multi-member-blocks';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { useAuth } from '@/lib/auth/hooks';
import { useLanguage } from '@/lib/i18n';
import { useAI } from '@/lib/ai/AIContextProvider';
import { createPreviewTask, createPreviewCalendarBlock } from '@/lib/ai/preview-task-generator';

// Convert Date to YYYY-MM-DD in local timezone (avoid UTC conversion)
const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function WorkspacePage() {
    const { t } = useLanguage();
    const { user, currentOrg } = useAuth();
    const { preferences, loading: preferencesLoading } = useUserPreferences();
    const { setSelectedDate: setAISelectedDate, pendingAction } = useAI();
    const { tasks, loading: tasksLoading, error: tasksError, createTask, updateTask, deleteTask, acceptAssignment, rejectAssignment, refetch: refetchTasks } = useTasks();
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
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());

    // Compute startHour/endHour from user preferences (default full day)
    const workStartTime: string = (preferences as any)?.work_start_time ?? '00:00';
    const startHour = parseInt(workStartTime.split(':')[0], 10);
    const workEndRaw: string | null = (preferences as any)?.work_end_time ?? null;
    const endHour = workEndRaw
        ? (() => { const [h, m] = workEndRaw.split(':').map(Number); return m > 0 ? h + 1 : h; })()
        : 24;

    // Multi-member schedule viewing state
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

    // Initialize selectedMemberIds with current user when user is loaded
    useEffect(() => {
        if (user && selectedMemberIds.length === 0) {
            setSelectedMemberIds([user.id]);
        }
    }, [user, selectedMemberIds.length]);

    // Sync selectedDate to AI context
    useEffect(() => {
        if (setAISelectedDate) {
            setAISelectedDate(selectedDate);
        }
    }, [selectedDate, setAISelectedDate]);

    // Listen for AI-triggered data changes
    useEffect(() => {
        const handleTasksChanged = () => {
            refetchTasks();
        };

        const handleCalendarChanged = () => {
            refetchCalendarBlocks();
        };

        window.addEventListener('ai-tasks-changed', handleTasksChanged);
        window.addEventListener('ai-calendar-changed', handleCalendarChanged);

        return () => {
            window.removeEventListener('ai-tasks-changed', handleTasksChanged);
            window.removeEventListener('ai-calendar-changed', handleCalendarChanged);
        };
    }, [refetchTasks, refetchCalendarBlocks]);

    // Fetch multi-member blocks for the current week view
    const {
        multiMemberBlocks,
        loading: multiMemberLoading,
        error: multiMemberError,
        refetch: refetchMultiMemberBlocks,
    } = useMultiMemberBlocks({
        selectedMemberIds,
        viewDate,
        daysToShow: 7,
    });

    // Generate preview objects from pending AI action
    const previewTask = useMemo(() => {
        if (!pendingAction || !user || !currentOrg) return null;
        // Only create preview for task actions
        if (pendingAction.type !== 'create_task' && pendingAction.type !== 'update_task' && pendingAction.type !== 'delete_task') {
            return null;
        }

        // Use selected date as fallback (same logic as confirmAction)
        const fallbackDate = selectedDate ? formatDateToLocalISO(selectedDate) : null;
        return createPreviewTask(pendingAction, user.id, currentOrg.id, fallbackDate);
    }, [pendingAction, user, currentOrg, selectedDate]);

    const previewBlock = useMemo(() => {
        if (!pendingAction || !user || !currentOrg) return null;
        // Only create preview for task actions with scheduling
        if (pendingAction.type !== 'create_task' && pendingAction.type !== 'update_task' && pendingAction.type !== 'delete_task') {
            return null;
        }

        // Use selected date as fallback
        const fallbackDate = selectedDate ? formatDateToLocalISO(selectedDate) : null;
        return createPreviewCalendarBlock(pendingAction, user.id, currentOrg.id, fallbackDate);
    }, [pendingAction, user, currentOrg, selectedDate]);

    const draggingTask = tasks.find(t => t.id === draggingTaskId) || null;

    const handleTaskUpdate = async (updatedTask: Task & { ownerIds?: string[] }) => {
        try {
            const previousTask = tasks.find(task => task.id === updatedTask.id);
            const expectedTimeChanged = previousTask?.expectedTime !== updatedTask.expectedTime;

            await updateTask(updatedTask.id, {
                title: updatedTask.title,
                description: updatedTask.description,
                status: updatedTask.status,
                expectedTime: updatedTask.expectedTime,
                actualTime: updatedTask.actualTime,
                visibility: updatedTask.visibility,
                ownerIds: updatedTask.ownerIds,
            });

            if (expectedTimeChanged && user) {
                const blocksToSync = calendarBlocks.filter(block => {
                    if (block.taskId !== updatedTask.id) return false;
                    if (block.ownerId !== user.id) return false;
                    if (block.id.startsWith('optimistic-') || block.id === 'preview-block-temp') return false;
                    // Only sync blocks the current user can modify.
                    return block.assignmentStatus !== 'pending';
                });

                if (blocksToSync.length > 0) {
                    await Promise.all(
                        blocksToSync.map(async (block) => {
                            const startTime = new Date(block.startTime);
                            const currentDurationMinutes = Math.round(
                                (new Date(block.endTime).getTime() - startTime.getTime()) / 60000
                            );

                            if (currentDurationMinutes === updatedTask.expectedTime) {
                                return;
                            }

                            const endTime = addMinutes(startTime, updatedTask.expectedTime);
                            await updateCalendarBlock(block.id, { startTime, endTime });
                        })
                    );
                }
            }

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

    const handleAddTask = async (initialData?: { scheduledDate?: string | Date, expectedTime?: number, title?: string, shouldOpenModal?: boolean }) => {
        try {
            // Create task with scheduled_date set to the selected date or provided initial date
            const newTask = await createTask({
                title: initialData?.title ?? '',
                description: '',
                status: 'planned',
                expectedTime: initialData?.expectedTime ?? 30,
                scheduledDate: initialData?.scheduledDate
                    ? (initialData.scheduledDate instanceof Date
                        ? formatDateToLocalISO(initialData.scheduledDate)
                        : initialData.scheduledDate)
                    : formatDateToLocalISO(selectedDate),
            });

            // If created from calendar context menu (Date object provided), create a time block immediately
            if (initialData?.scheduledDate instanceof Date) {
                const startTime = initialData.scheduledDate;
                const duration = initialData.expectedTime ?? 30;
                const endTime = addMinutes(startTime, duration);

                // Create the block linked to the new task
                await createCalendarBlock({
                    taskId: newTask.id,
                    startTime,
                    endTime
                });
            }

            // Open modal logic:
            // 1. If explicit shouldOpenModal is true, open (e.g. Header button)
            // 2. If created via Table (no args), shouldOpenModal is undefined -> false (inline edit)
            // 3. If created via Quick Add (title provided), shouldOpenModal is undefined -> false
            const shouldOpen = initialData?.shouldOpenModal ?? false;

            if (shouldOpen) {
                setSelectedTask(newTask);
            }

            // Return new task for EditableTable focus
            return newTask;
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    // Create a subtask with title and link to parent task (legacy, used by subtask column cell)
    const handleCreateSubtask = async (parentTaskId: string, title: string) => {
        try {
            await createTask({
                title,
                description: '',
                status: 'planned',
                expectedTime: 30,
                scheduledDate: formatDateToLocalISO(selectedDate),
                parentTaskId,
            });
        } catch (err) {
            console.error('Failed to create subtask:', err);
        }
    };

    // Create an inline subtask row from the + button — returns the new task for focus
    const handleAddSubtask = async (parentTaskId: string, scheduledDate: string) => {
        try {
            const result = await createTask({
                title: '',
                description: '',
                status: 'planned',
                expectedTime: 30,
                scheduledDate,
                parentTaskId,
            });
            // result is the raw RPC response array; extract first row for focus tracking
            const created = Array.isArray(result) ? result[0] : result;
            return created ?? undefined;
        } catch (err) {
            console.error('Failed to create subtask:', err);
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

    const handleUpdateMultipleBlocks = async (deltaMinutes: number, blockIds: string[]) => {
        try {
            const updates = blockIds.map(async (blockId) => {
                const block = calendarBlocks.find(b => b.id === blockId) || multiMemberBlocks.find(b => b.id === blockId);
                if (!block) return;

                const newStartTime = addMinutes(new Date(block.startTime), deltaMinutes);
                const newEndTime = addMinutes(new Date(block.endTime), deltaMinutes);

                await updateCalendarBlock(blockId, { startTime: newStartTime, endTime: newEndTime });

                const newDateISO = formatDateToLocalISO(newStartTime);
                const task = tasks.find(t => t.id === block.taskId);
                if (task && task.scheduledDate !== newDateISO) {
                    await updateTask(block.taskId, { scheduledDate: newDateISO });
                }
            });

            await Promise.all(updates);

            if (selectedMemberIds.length > 1) {
                refetchMultiMemberBlocks();
            }
        } catch (err) {
            console.error('Failed to update multiple calendar blocks:', err);
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        try {
            await deleteCalendarBlock(blockId);
        } catch (err) {
            console.error('Failed to delete calendar block:', err);
            // Show user-visible error notification
            alert(t('common.error_delete_block') || 'Failed to delete calendar block. Please try again.');
        }
    };

    // Loading state
    const loading = tasksLoading || blocksLoading || preferencesLoading;
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
                startHour={startHour}
                endHour={endHour}
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
                previewTask={previewTask}
                previewBlock={previewBlock}
                onCreateSubtask={handleCreateSubtask}
                onAddSubtask={handleAddSubtask}
                selectedBlockIds={selectedBlockIds}
                onSelectBlocks={setSelectedBlockIds}
                onUpdateMultipleBlocks={handleUpdateMultipleBlocks}
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
