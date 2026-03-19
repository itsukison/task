import { ActionContext, ActionCallbacks } from './types';
import { PendingCalendarAction, PendingScheduleAction, PendingBatchScheduleAction } from '../types';

export const handleRescheduleCalendar = async (
    action: PendingCalendarAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { setMessages, onCalendarChange } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    // Convert to Date objects to ensure proper timezone handling
    // This matches the pattern used in task creation (line 264)
    const newStartTime = new Date(action.data.newStartTime);
    const newEndTime = new Date(action.data.newEndTime);

    await supabase
        .from('calendar_blocks')
        .update({
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
        })
        .eq('id', action.data.blockId);

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: 'Calendar block rescheduled successfully',
            timestamp: Date.now(),
            action: { ...action, type: 'reschedule_calendar' } // Persist action
        },
    ]);

    // Trigger UI refresh via callbacks or custom event
    if (onCalendarChange) {
        await onCalendarChange();
    } else {
        // Fallback: dispatch custom event
        window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
    }
};

export const handleScheduleTask = async (
    action: PendingScheduleAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { user, currentOrganization } = context;
    const { setMessages, setPendingAction, onCalendarChange } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    if (!currentOrganization || !user) return;

    // Create calendar block
    const { error: blockError } = await supabase
        .from('calendar_blocks')
        .insert({
            organization_id: currentOrganization.id,
            owner_id: user.id,
            task_id: action.taskId,
            start_time: action.startTime,
            end_time: action.endTime,
        } as any);

    if (blockError) {
        console.error('Failed to create calendar block:', blockError);
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `❌ Failed to schedule task: ${blockError.message}`,
                timestamp: Date.now(),
            },
        ]);
        setPendingAction(null);
        return;
    }

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: `Scheduled "${action.taskTitle}" for ${action.preview.dateFormatted} at ${action.preview.timeFormatted}`,
            timestamp: Date.now(),
            action: { ...action, type: 'schedule_task' }
        },
    ]);

    // Trigger UI refresh via callbacks or custom event
    if (onCalendarChange) {
        await onCalendarChange();
    } else {
        window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
    }
};

export const handleBatchSchedule = async (
    action: PendingBatchScheduleAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { user, currentOrganization } = context;
    const { setMessages, onCalendarChange } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    if (!currentOrganization || !user) return;

    // Execute all schedule operations
    const schedules = action.data.schedules;
    let successCount = 0;
    let failCount = 0;

    for (const schedule of schedules) {
        const { error: blockError } = await supabase
            .from('calendar_blocks')
            .insert({
                organization_id: currentOrganization.id,
                owner_id: user.id,
                task_id: schedule.taskId,
                start_time: schedule.startTime,
                end_time: schedule.endTime,
            } as any);

        if (blockError) {
            console.error(`Failed to schedule task ${schedule.taskId}:`, blockError);
            failCount++;
        } else {
            successCount++;
        }
    }

    if (failCount > 0) {
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `Scheduled ${successCount} tasks, but failed to schedule ${failCount} tasks.`,
                timestamp: Date.now(),
                action: { ...action, type: 'batch_schedule' }
            },
        ]);
    } else {
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: `✅ Successfully scheduled ${successCount} tasks for ${action.data.date}`,
                timestamp: Date.now(),
                action: { ...action, type: 'batch_schedule' }
            },
        ]);
    }

    // Trigger UI refresh via callbacks or custom event
    if (onCalendarChange) {
        await onCalendarChange();
    } else {
        window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
    }
};
