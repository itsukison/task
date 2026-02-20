export const taskTools = [
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Creates a new task. RETURNS: task_id that can be used with schedule_task or update_task. USE WITH: schedule_task to find available time slots. Calendar block creation: (1) No scheduled fields = no block (2) scheduled_start_time set = block created at exact time (3) Use schedule_task after creation to find available slots.',
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
                        description: 'ISO date (YYYY-MM-DD) for task without specific time. Sets a date flag but does NOT create calendar block. Rarely used - prefer leaving blank or using schedule_task to find available slots.',
                    },
                    scheduled_start_time: {
                        type: 'string',
                        description: 'ISO 8601 datetime when user specifies exact time (e.g., "at 3pm", "tomorrow at 10am", "from 9"). Automatically creates calendar block even if overlapping with existing blocks. REQUIRED for "from [time]" requests.',
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
            description: 'Updates an existing task (title, description, status, expected_time). REQUIRES: task_id from list_tasks result. USE WITH: list_tasks to find task_id first. RETURNS: Preview for user confirmation. Note: This only updates metadata, not schedule times. To move scheduled blocks, use get_calendar_blocks and suggest_reschedule instead.',
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
            description: 'Lists all tasks in the current workspace, optionally filtered by status and/or date. RETURNS: Task list with [Task refs: 1→uuid1 2→uuid2...] mapping numbers to task IDs. USE WITH: update_task or schedule_task - call list_tasks first to get task_id.',
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
