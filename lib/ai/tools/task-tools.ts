import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_CHARS, validateDocumentSize, PendingTaskAction } from '../types';

// ============================================================================
// Tool Definitions
// ============================================================================

export const taskTools = [
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Creates a new task and optionally schedules it on the calendar. Returns a preview that requires user confirmation before applying.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'Task title',
                    },
                    description: {
                        type: 'string',
                        description: 'Optional task description',
                    },
                    status: {
                        type: 'string',
                        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
                        description: 'Task status, defaults to "planned"',
                    },
                    expected_time_minutes: {
                        type: 'number',
                        description: 'Expected time in minutes',
                    },
                    scheduled_date: {
                        type: 'string',
                        description: 'ISO date (YYYY-MM-DD) for task without specific time',
                    },
                    scheduled_start_time: {
                        type: 'string',
                        description: 'ISO 8601 datetime for tasks with specific time. Only use when user specifies a time.',
                    },
                    duration_minutes: {
                        type: 'number',
                        description: 'Duration in minutes for calendar block (if scheduling)',
                    },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'update_task',
            description: 'Updates an existing task. Returns a preview that requires user confirmation. IMPORTANT: You must first use list_tasks to find the task ID by searching for the task title/name, then use that ID here.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: {
                        type: 'string',
                        description: 'ID of the task to update (UUID from list_tasks results)',
                    },
                    title: {
                        type: 'string',
                        description: 'New title',
                    },
                    description: {
                        type: 'string',
                        description: 'New description',
                    },
                    status: {
                        type: 'string',
                        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
                    },
                    expected_time_minutes: {
                        type: 'number',
                    },
                },
                required: ['task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_tasks',
            description: 'Lists all tasks in the current workspace, optionally filtered by status and/or date.',
            parameters: {
                type: 'object',
                properties: {
                    status: {
                        type: 'string',
                        enum: ['planned', 'in_progress', 'completed', 'cancelled'],
                        description: 'Optional status filter',
                    },
                    scheduled_date: {
                        type: 'string',
                        description: 'Optional date filter in ISO format (YYYY-MM-DD). Use this when user asks for tasks "today", "tomorrow", or a specific date.',
                    },
                },
            },
        },
    },
];

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

    return {
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
