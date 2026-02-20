export const calendarTools = [
    {
        type: 'function',
        function: {
            name: 'get_calendar_blocks',
            description: 'Retrieves calendar blocks (scheduled tasks) for a specific date range. RETURNS: Calendar blocks with [Block refs: 1→uuid1 2→uuid2...] mapping numbers to block IDs. USE WITH: suggest_reschedule - call get_calendar_blocks first to get block_id, then use suggest_reschedule to move the block to a new time.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: {
                        type: 'string',
                        description: 'Start date in ISO format (YYYY-MM-DD)',
                    },
                    end_date: {
                        type: 'string',
                        description: 'Optional end date in ISO format',
                    },
                },
                required: ['start_date'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'suggest_reschedule',
            description: 'Moves a calendar block to a new time (use when user wants to reschedule). REQUIRES: block_id from get_calendar_blocks result. USE WITH: get_calendar_blocks to find block_id first, then call this with new times. RETURNS: Preview for user confirmation. Maintains same duration, just moves start/end time.',
            parameters: {
                type: 'object',
                properties: {
                    block_id: {
                        type: 'string',
                        description: 'ID of the calendar block to reschedule',
                    },
                    new_start_time: {
                        type: 'string',
                        description: 'New start time in ISO format',
                    },
                    new_end_time: {
                        type: 'string',
                        description: 'New end time in ISO format',
                    },
                },
                required: ['block_id', 'new_start_time', 'new_end_time'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'schedule_task',
            description: 'Finds available time slots and creates calendar block for a task. REQUIRES: task_id from list_tasks OR create_task result. Task must have expected_time > 0 or will error. USE WITH: list_tasks (for existing tasks) OR create_task (for new tasks). RETURNS: Proposed calendar block at first available slot, or message if no slots found. Respects work hours (9am-5pm) and avoids conflicts.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: {
                        type: 'string',
                        description: 'The ID of the task to schedule (UUID). Get this from list_tasks result OR create_task return value. Task must exist and have expected_time > 0.',
                    },
                    preferred_date: {
                        type: 'string',
                        description: 'Preferred date to schedule on in ISO format (YYYY-MM-DD). If not provided, searches starting from today.',
                    },
                    preferred_start_time: {
                        type: 'string',
                        description: 'Optional preferred start time in 24-hour format (HH:mm). If provided, tries to find a slot at or after this time. Examples: "09:00", "14:30"',
                    },
                    search_days: {
                        type: 'number',
                        description: 'Number of days to search forward for available slots. Default: 7 days.',
                        default: 7,
                    },
                },
                required: ['task_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'auto_schedule_tasks',
            description: 'Automatically schedules multiple tasks at once. REQUIRES: list of task_ids. USE WHEN: User says "Schedule all my tasks", "Plan my day", or gives a list of tasks to schedule. RETURNS: A single batch action with proposed times for all tasks. Smartly finds non-overlapping slots for each task.',
            parameters: {
                type: 'object',
                properties: {
                    task_ids: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'List of task IDs to schedule',
                    },
                    date: {
                        type: 'string',
                        description: 'Date to schedule on (ISO YYYY-MM-DD). Defaults to today if not specified.',
                    },
                    start_time: {
                        type: 'string',
                        description: 'Optional start time to begin scheduling from (HH:mm). Defaults to 09:00.',
                    },
                },
                required: ['task_ids'],
            },
        },
    },
];
