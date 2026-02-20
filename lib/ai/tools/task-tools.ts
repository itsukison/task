import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_CHARS, validateDocumentSize, PendingTaskAction } from '../types';

// ============================================================================
// Tool Definitions
// ============================================================================

export { taskTools } from './schemas/task-schema';

// ============================================================================
// Tool Implementations
// ============================================================================

export async function createTaskPreview(params: {
    title: string;
    description?: string;
    status?: string;
    expected_time_minutes?: number;
    scheduled_date?: string;
    scheduled_start_time?: string;
    duration_minutes?: number;
}): Promise<PendingTaskAction> {
    console.log('🏗️ createTaskPreview params:', params);
    let preview = `Create task: "${params.title}"`;
    if (params.description) preview += `\n${params.description}`;
    if (params.expected_time_minutes) preview += `\nExpected time: ${params.expected_time_minutes} min`;
    if (params.scheduled_date && !params.scheduled_start_time) {
        preview += `\nScheduled for: ${params.scheduled_date}`;
    }
    if (params.scheduled_start_time) {
        const startDate = new Date(params.scheduled_start_time);
        preview += `\nScheduled: ${startDate.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`;
        if (params.duration_minutes) {
            const endDate = new Date(startDate.getTime() + params.duration_minutes * 60000);
            preview += ` - ${endDate.toLocaleTimeString('en-US', { timeStyle: 'short' })}`;
        }
    }

    const result: PendingTaskAction = {
        type: 'create_task',
        data: {
            title: params.title,
            description: params.description,
            status: params.status || 'planned',
            expectedTime: params.expected_time_minutes,
            scheduledDate: params.scheduled_date,
            scheduledStartTime: params.scheduled_start_time,
            durationMinutes: params.duration_minutes,
        },
        preview,
    };
    console.log('📤 createTaskPreview result:', result);
    return result;
}

export async function updateTaskPreview(params: {
    task_id: string;
    title?: string;
    description?: string;
    status?: string;
    expected_time_minutes?: number;
}): Promise<PendingTaskAction> {
    const supabase = await createClient();

    // Fetch current task to show what will change
    const { data: task } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', params.task_id)
        .single();

    const changes: string[] = [];
    if (params.title) changes.push(`Title: ${params.title}`);
    if (params.description !== undefined) changes.push(`Description: ${params.description}`);
    if (params.status) changes.push(`Status: ${params.status}`);
    if (params.expected_time_minutes) changes.push(`Expected time: ${params.expected_time_minutes} min`);

    return {
        type: 'update_task',
        data: {
            taskId: params.task_id,
            title: params.title,
            description: params.description,
            status: params.status,
            expectedTime: params.expected_time_minutes,
        },
        preview: `Update task "${task?.title || '[Task not found]'}":\n${changes.join('\n')}`,
    };
}

export async function listTasks(
    organizationId: string,
    userId: string,
    statusFilter?: string,
    scheduledDate?: string
): Promise<string> {
    const supabase = await createClient();

    let query = supabase
        .from('tasks')
        .select('id, title, status, expected_time_minutes, scheduled_date')
        .eq('organization_id', organizationId)
        .is('deleted_at', null);

    if (statusFilter) {
        query = query.eq('status', statusFilter as any);
    }

    if (scheduledDate) {
        query = query.eq('scheduled_date', scheduledDate);
    }

    const { data, error } = await query.order('expected_time_minutes', { ascending: false }).limit(20);

    if (error) {
        throw new Error(`Failed to list tasks: ${error.message}`);
    }

    if (!data || data.length === 0) {
        return scheduledDate
            ? `No tasks found for ${scheduledDate}.`
            : 'No tasks found.';
    }

    // Format user-friendly list without IDs in main display
    const taskList = data.map(
        (task: any, idx: number) =>
            `${idx + 1}. ${task.title} (${task.status}${task.expected_time_minutes ? `, ${task.expected_time_minutes} min` : ''})${task.scheduled_date ? ` - ${task.scheduled_date}` : ''}`
    );

    // Include IDs in a subtle reference section for AI to use
    const taskRefs = data.map(
        (task: any, idx: number) => `${idx + 1}→${task.id}`
    ).join(' ');

    return `Found ${data.length} task(s)${scheduledDate ? ` for ${scheduledDate}` : ''}:\n${taskList.join('\n')}\n\n[Task refs: ${taskRefs}]`;
}
