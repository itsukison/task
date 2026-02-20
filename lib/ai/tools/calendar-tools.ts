import { createClient } from '@/lib/supabase/server';
import { PendingCalendarAction, PendingScheduleAction, PendingBatchScheduleAction, AgentContext } from '../types';

// ============================================================================
// Tool Definitions
// ============================================================================

export { calendarTools } from './schemas/calendar-schema';

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

// ============================================================================
// New Tool Implementation: Smart Schedule Task
// ============================================================================

export async function scheduleTask(
    taskId: string,
    preferredDate: string | undefined,
    preferredStartTime: string | undefined,
    searchDays: number = 7,
    context: AgentContext
): Promise<PendingScheduleAction> {
    const supabase = await createClient();

    // Find task from context
    // Find task from context or DB
    let task = context.tasks?.find(t => t.id === taskId);

    if (!task) {
        console.log(`Task ${taskId} not found in context, fetching from DB...`);
        const { data: dbTask, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (error || !dbTask) {
            console.error('Failed to fetch task from DB:', error);
            throw new Error('Task not found. Please ensure the task exists.');
        }

        // Map DB task to Task interface (minimal fields needed for scheduling)
        task = {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description,
            status: dbTask.status,
            expectedTime: dbTask.expected_time_minutes,
            actualTime: dbTask.actual_time_minutes,
            visibility: dbTask.visibility,
            owners: [], // Not needed for scheduling
            ownerId: dbTask.owner_id || dbTask.created_by,
            organizationId: dbTask.organization_id,
            scheduledDate: dbTask.scheduled_date,
            createdAt: dbTask.created_at,
            updatedAt: dbTask.updated_at,
        } as any; // Cast to any/Task since we're missing some joined fields like owners profiles
    }

    if (!task) {
        throw new Error('Task not found.');
    }

    if (!task.expectedTime || task.expectedTime === 0) {
        throw new Error('Task has no expected time set. Please add an estimated time to the task before scheduling.');
    }

    const taskDuration = task.expectedTime; // in minutes

    // Determine search window
    const startDate = preferredDate ? new Date(preferredDate) : new Date();
    startDate.setHours(0, 0, 0, 0); // Reset to midnight

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + searchDays);

    // Fetch all existing blocks for the user in the search window
    const { data: existingBlocks, error } = await supabase
        .from('calendar_blocks')
        .select('id, start_time, end_time')
        .eq('organization_id', context.organizationId)
        .eq('owner_id', context.userId)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch calendar blocks: ${error.message}`);
    }

    // Try each day in the search window
    for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);

        // Get blocks for this day
        const dayBlocks = (existingBlocks || []).filter(block => {
            const blockStart = new Date(block.start_time);
            return blockStart.toDateString() === currentDate.toDateString();
        });

        // Find available slots for this day
        const slots = findAvailableSlots(
            currentDate,
            dayBlocks.map(b => ({
                startTime: b.start_time,
                endTime: b.end_time,
            })),
            taskDuration,
            dayOffset === 0 ? preferredStartTime : undefined // Only use preferred time on first day
        );

        if (slots.length > 0) {
            // Found a slot! Use the first one
            const slot = slots[0];

            // Format preview
            const dateFormatted = slot.start.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
            });

            const timeFormatted = `${formatTime(slot.start)} - ${formatTime(slot.end)}`;

            const hours = Math.floor(taskDuration / 60);
            const minutes = taskDuration % 60;
            let durationFormatted = '';
            if (hours > 0) durationFormatted += `${hours}h `;
            if (minutes > 0) durationFormatted += `${minutes}m`;

            return {
                type: 'schedule_task',
                taskId: task.id,
                taskTitle: task.title,
                startTime: slot.start.toISOString(),
                endTime: slot.end.toISOString(),
                duration: taskDuration,
                preview: {
                    dateFormatted,
                    timeFormatted: timeFormatted.trim(),
                    durationFormatted: durationFormatted.trim(),
                },
            };
        }
    }

    // No slots found
    throw new Error(`No available time slots found in the next ${searchDays} day(s). Try increasing search_days or choosing a different date.`);
}

function findAvailableSlots(
    date: Date,
    existingBlocks: Array<{ startTime: string; endTime: string }>,
    taskDuration: number,
    preferredStartTime?: string
): Array<{ start: Date; end: Date }> {
    const WORK_START = 9 * 60; // 9am in minutes from midnight
    const WORK_END = 17 * 60;  // 5pm in minutes from midnight

    // Convert blocks to minute intervals
    const intervals = existingBlocks
        .map(b => ({
            start: getMinutesFromMidnight(new Date(b.startTime)),
            end: getMinutesFromMidnight(new Date(b.endTime)),
        }))
        .sort((a, b) => a.start - b.start);

    const slots: Array<{ start: number; end: number }> = [];
    let currentTime = WORK_START;

    // If preferred time provided, start from there
    if (preferredStartTime) {
        try {
            const [hours, mins] = preferredStartTime.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(mins)) {
                currentTime = Math.max(WORK_START, hours * 60 + mins);
            }
        } catch (e) {
            // Invalid format, ignore and use default
        }
    }

    // Find gaps between blocks
    for (const interval of intervals) {
        // Gap before this block?
        if (interval.start - currentTime >= taskDuration) {
            slots.push({ start: currentTime, end: interval.start });
        }
        currentTime = Math.max(currentTime, interval.end);
    }

    // Gap after last block until end of work day?
    if (WORK_END - currentTime >= taskDuration) {
        slots.push({ start: currentTime, end: WORK_END });
    }

    // Convert minute intervals back to Date objects
    return slots.map(slot => ({
        start: createDateWithMinutes(date, slot.start),
        end: createDateWithMinutes(date, slot.start + taskDuration),
    }));
}

function getMinutesFromMidnight(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

export async function autoScheduleTasks(
    taskIds: string[],
    date: string | undefined,
    startTime: string | undefined,
    context: AgentContext
): Promise<PendingBatchScheduleAction> {
    const supabase = await createClient();
    const scheduleDate = date ? new Date(date) : new Date();
    scheduleDate.setHours(0, 0, 0, 0);

    // 1. Fetch all tasks
    const tasks: any[] = [];
    for (const taskId of taskIds) {
        let task = context.tasks?.find(t => t.id === taskId);
        if (!task) {
            const { data: dbTask } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();

            if (dbTask) {
                task = {
                    id: dbTask.id,
                    title: dbTask.title,
                    expectedTime: dbTask.expected_time_minutes,
                    // map other fields if needed
                } as any;
            }
        }
        if (task) tasks.push(task);
    }

    if (tasks.length === 0) {
        throw new Error('No valid tasks found to schedule.');
    }

    // 2. Fetch existing blocks for the day
    const { data: existingBlocks } = await supabase
        .from('calendar_blocks')
        .select('start_time, end_time')
        .eq('organization_id', context.organizationId)
        .gte('start_time', scheduleDate.toISOString())
        .lte('end_time', new Date(scheduleDate.getTime() + 86400000).toISOString());

    // 3. Simulation state
    let busySlots = (existingBlocks || []).map(b => ({
        startTime: b.start_time,
        endTime: b.end_time
    }));

    const proposedSchedules = [];
    let currentSearchTime = startTime || '09:00';

    // 4. Schedule each task
    for (const task of tasks) {
        if (!task.expectedTime) continue;

        // Find slot for this task
        const slots = findAvailableSlots(
            scheduleDate,
            busySlots,
            task.expectedTime,
            currentSearchTime
        );

        if (slots.length > 0) {
            const slot = slots[0];

            // Add to proposed
            proposedSchedules.push({
                taskId: task.id,
                taskTitle: task.title,
                startTime: slot.start.toISOString(),
                endTime: slot.end.toISOString()
            });

            // Add to busy slots so next task doesn't overlap
            busySlots.push({
                startTime: slot.start.toISOString(),
                endTime: slot.end.toISOString()
            });

            // Update search time to be after this task (optional optimization)
            // currentSearchTime = formatTime24(slot.end); 
        }
    }

    if (proposedSchedules.length === 0) {
        throw new Error('Could not find available slots for any of the tasks.');
    }

    // 5. Generate summary
    const summary = `Proposed schedule for ${tasks.length} tasks:\n` +
        proposedSchedules.map(s => {
            const start = new Date(s.startTime);
            const end = new Date(s.endTime);
            return `- ${s.taskTitle}: ${formatTime(start)} - ${formatTime(end)}`;
        }).join('\n');

    return {
        type: 'batch_schedule',
        data: {
            date: scheduleDate.toISOString().split('T')[0],
            schedules: proposedSchedules
        },
        preview: summary
    };
}

function createDateWithMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0); // Reset to midnight
    result.setMinutes(minutes);
    return result;
}
