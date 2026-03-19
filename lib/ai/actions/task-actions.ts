import { ActionContext, ActionCallbacks } from './types';
import { PendingTaskAction } from '../types';

export const handleCreateTask = async (
    action: PendingTaskAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { user, currentOrganization, selectedDate } = context;
    const { setMessages, setPendingAction, onTasksChange, onCalendarChange } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    if (!currentOrganization || !user) return;

    // Create the task first
    // Database constraint requires expected_time_minutes > 0, so use duration or default to 30
    const expectedTimeMinutes = action.data.expectedTime ||
        action.data.durationMinutes ||
        30;

    // Format selectedDate as fallback for scheduled_date
    const formatDateToLocalISO = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Use AI-provided date, or fall back to selected calendar date, or use today's date
    const scheduledDateValue = action.data.scheduledDate ||
        (selectedDate ? formatDateToLocalISO(selectedDate) : null);

    const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
        organization_id: currentOrganization.id,
        owner_id: user.id,
        created_by: user.id,
        title: action.data.title,
        description: action.data.description || null,
        status: (action.data.status || 'planned') as any,
        expected_time_minutes: expectedTimeMinutes,
        actual_time_minutes: 0,
        visibility: 'team',
        scheduled_date: scheduledDateValue,
    } as any).select().single();

    if (taskError) {
        const errorMessage = taskError.message || 'Unknown error';
        const errorCode = (taskError as any).code || '';

        console.error('Failed to create task:', {
            message: errorMessage,
            code: errorCode,
            details: (taskError as any).details,
            fullError: taskError
        });

        let userMessage = '❌ Failed to create task. ';
        if (errorCode === '23503') {
            userMessage += 'Invalid reference data.';
        } else if (errorMessage.includes('permission')) {
            userMessage += 'You do not have permission to create tasks.';
        } else {
            userMessage += `Error: ${errorMessage}`;
        }

        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: userMessage,
                timestamp: Date.now(),
            },
        ]);
        setPendingAction(null);
        return;
    }

    // Add creator as initial owner (matching useTasks pattern)
    if (newTask) {
        const { error: ownerError } = await supabase
            .from('task_owners')
            .insert({
                task_id: newTask.id,
                user_id: user.id,
                organization_id: currentOrganization.id,
                status: 'confirmed',
                assigned_by: user.id,
            });

        if (ownerError) {
            console.error('Failed to add initial owner:', ownerError);
            // Don't fail the operation, just log
        }
    }

    // If scheduled, create a calendar block
    if (action.data.scheduledStartTime && newTask) {
        console.log('📅 Creating calendar block for task', newTask.id, action.data.scheduledStartTime);
        const startTime = new Date(action.data.scheduledStartTime);
        const durationMs = (action.data.durationMinutes || action.data.expectedTime || 60) * 60000;
        const endTime = new Date(startTime.getTime() + durationMs);

        await supabase.from('calendar_blocks').insert({
            organization_id: currentOrganization.id,
            owner_id: user.id,
            task_id: newTask.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
        } as any);

        // Trigger calendar refresh since we created a block
        if (onCalendarChange) {
            await onCalendarChange();
        } else {
            // Fallback: dispatch custom event
            window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
        }
    }

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: 'Task created successfully',
            timestamp: Date.now(),
            action: { ...action, type: 'create_task' } // Persist action
        },
    ]);

    // Trigger UI refresh via callbacks or custom event
    if (onTasksChange) {
        await onTasksChange();
    } else {
        // Fallback: dispatch custom event for workspace to listen
        window.dispatchEvent(new CustomEvent('ai-tasks-changed'));
    }
};

export const handleUpdateTask = async (
    action: PendingTaskAction,
    context: ActionContext,
    callbacks: ActionCallbacks
) => {
    const { setMessages, setPendingAction, onTasksChange } = callbacks;

    const supabaseImport = await import('@/lib/supabase/client');
    const supabase = supabaseImport.createClient();

    const updates: any = {};
    if (action.data.title) updates.title = action.data.title;
    if (action.data.description !== undefined)
        updates.description = action.data.description;
    if (action.data.status) updates.status = action.data.status as any;
    if (action.data.expectedTime)
        updates.expected_time_minutes = action.data.expectedTime;

    if (action.data.taskId) {
        const { error: updateError } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', action.data.taskId);

        if (updateError) {
            console.error('Failed to update task:', updateError);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `❌ Failed to update task: ${updateError.message}`,
                    timestamp: Date.now(),
                },
            ]);
            setPendingAction(null);
            return;
        }
    }

    setMessages((prev) => [
        ...prev,
        {
            role: 'assistant',
            content: 'Task updated successfully',
            timestamp: Date.now(),
            action: { ...action, type: 'update_task' } // Persist action
        },
    ]);

    // Trigger UI refresh via callbacks or custom event
    if (onTasksChange) {
        await onTasksChange();
    } else {
        // Fallback: dispatch custom event for workspace to listen
        window.dispatchEvent(new CustomEvent('ai-tasks-changed'));
    }
};
