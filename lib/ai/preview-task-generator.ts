import { Task, CalendarBlock } from '@/lib/types';
import { PendingTaskAction, PendingAction } from './types';

export function createPreviewTask(
    pendingAction: PendingTaskAction,
    userId: string,
    organizationId: string,
    fallbackScheduledDate?: string | null
): Task | null {
    if (pendingAction.type !== 'create_task') return null;

    return {
        id: 'preview-task-temp',
        title: pendingAction.data.title || 'New Task',
        description: pendingAction.data.description || null,
        status: (pendingAction.data.status as any) || 'planned',
        expectedTime: pendingAction.data.expectedTime ||
                     pendingAction.data.durationMinutes ||
                     30,
        actualTime: 0,
        visibility: 'team',
        owners: [{
            id: userId,
            display_name: 'You',
            email: '',
            status: 'confirmed' as const,
        }],
        ownerId: userId,
        organizationId,
        scheduledDate: pendingAction.data.scheduledDate || fallbackScheduledDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export function createPreviewCalendarBlock(
    pendingAction: PendingAction,
    userId: string,
    organizationId: string,
    fallbackScheduledDate?: string | null
): CalendarBlock | null {
    // Handle reschedule actions
    if (pendingAction.type === 'reschedule_calendar') {
        const { preview } = pendingAction;
        if (!preview?.suggestedBlock) return null;

        // Extract task title from the original block
        const taskTitle = preview.originalBlock?.task?.title ||
                         'Untitled Task';

        return {
            id: 'preview-block-temp',
            taskId: preview.originalBlock?.taskId || 'preview-task-temp',
            ownerId: userId,
            organizationId: organizationId,
            startTime: preview.suggestedBlock.startTime,
            endTime: preview.suggestedBlock.endTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            task: {
                id: preview.originalBlock?.taskId || 'preview-task-temp',
                title: taskTitle,
                description: null,
                status: preview.originalBlock?.task?.status || 'planned',
                expectedTime: 0,
                actualTime: 0,
                visibility: 'team',
                owners: [],
                ownerId: userId,
                organizationId: organizationId,
                scheduledDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }

    // Handle create_task (existing code)
    if (pendingAction.type !== 'create_task') return null;
    if (!pendingAction.data.scheduledStartTime) return null;

    const startTime = new Date(pendingAction.data.scheduledStartTime);
    const durationMs = (pendingAction.data.durationMinutes ||
                       pendingAction.data.expectedTime ||
                       60) * 60000;
    const endTime = new Date(startTime.getTime() + durationMs);

    return {
        id: 'preview-block-temp',
        taskId: 'preview-task-temp',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ownerId: userId,
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        task: createPreviewTask(pendingAction, userId, organizationId, fallbackScheduledDate) || undefined,
    };
}
