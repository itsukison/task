import { createClient } from '@/lib/supabase/server';
import { PendingCalendarAction } from '../types';

// ============================================================================
// Tool Definitions
// ============================================================================

export const calendarTools = [
    {
        type: 'function',
        function: {
            name: 'get_calendar_blocks',
            description: 'Retrieves calendar blocks (scheduled tasks) for a specific date range. Use this to: (1) view what is scheduled, or (2) find a calendar block ID before rescheduling it with suggest_reschedule.',
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
            description: 'Reschedules a calendar block to a new time (use when user wants to move/reschedule a scheduled task). First call get_calendar_blocks to find the block_id of the task to reschedule. Returns a preview for user confirmation. Example: User says "move my meeting to 3pm" → get_calendar_blocks → extract block_id from [Block refs] → suggest_reschedule.',
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
];

// ============================================================================
// Tool Implementations
// ============================================================================

export async function getCalendarBlocks(
    organizationId: string,
    userId: string,
    startDate: string,
    endDate?: string
): Promise<string> {
    const supabase = await createClient();

    const endDateActual = endDate || startDate;

    const { data, error } = await supabase
        .from('calendar_blocks')
        .select(`
      id,
      start_time,
      end_time,
      task:tasks (
        title
      )
    `)
        .eq('organization_id', organizationId)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('end_time', `${endDateActual}T23:59:59`)
        .order('start_time', { ascending: true });

    if (error) {
        throw new Error(`Failed to get calendar blocks: ${error.message}`);
    }

    if (!data || data.length === 0) {
        return `No calendar blocks found for ${startDate}${endDate ? ` to ${endDate}` : ''}.`;
    }

    const blockList = data.map((block: any, idx: number) => {
        const start = new Date(block.start_time);
        const end = new Date(block.end_time);
        const taskTitle = block.task?.title || 'Untitled';

        return `${idx + 1}. ${taskTitle}: ${formatTime(start)} - ${formatTime(end)}`;
    });

    // Add block ID references (hidden from main display but available for AI to use)
    const blockRefs = data.map((block: any, idx: number) =>
        `${idx + 1}→${block.id}`
    ).join(' ');

    return `Found ${data.length} calendar block(s):\n${blockList.join('\n')}\n\n[Block refs: ${blockRefs}]`;
}

export async function suggestReschedule(params: {
    block_id: string;
    new_start_time: string;
    new_end_time: string;
}): Promise<PendingCalendarAction> {
    const supabase = await createClient();

    // Fetch original block
    const { data: originalBlock, error } = await supabase
        .from('calendar_blocks')
        .select(`
      *,
      task:tasks (
        *
      )
    `)
        .eq('id', params.block_id)
        .single();

    if (error || !originalBlock) {
        throw new Error('Calendar block not found');
    }

    // Create suggested block (not saved to DB yet)
    const suggestedBlock = {
        ...originalBlock,
        start_time: params.new_start_time,
        end_time: params.new_end_time,
    };

    return {
        type: 'reschedule_calendar',
        data: {
            blockId: params.block_id,
            newStartTime: params.new_start_time,
            newEndTime: params.new_end_time,
        },
        preview: {
            originalBlock: originalBlock as any,
            suggestedBlock: suggestedBlock as any,
        },
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}
