'use client';

import { Database } from '@/lib/database.types';
import { CalendarBlock, AssignmentStatus } from '@/lib/types';

export type DbCalendarBlock = Database['public']['Tables']['calendar_blocks']['Row'];

export interface CalendarBlockWithPending extends CalendarBlock {
    isPendingAssignment?: boolean;
    assignmentStatus?: AssignmentStatus;
}

export interface CreateCalendarBlockInput {
    taskId: string;
    startTime: Date;
    endTime: Date;
}

export interface UpdateCalendarBlockInput {
    startTime?: Date;
    endTime?: Date;
}

export interface UseCalendarBlocksReturn {
    calendarBlocks: CalendarBlockWithPending[];
    loading: boolean;
    error: string | null;
    createCalendarBlock: (input: CreateCalendarBlockInput) => Promise<CalendarBlock>;
    updateCalendarBlock: (id: string, input: UpdateCalendarBlockInput) => Promise<void>;
    deleteCalendarBlock: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
    getBlocksForDateRange: (start: Date, end: Date) => CalendarBlockWithPending[];
    hasBlockForTask: (taskId: string) => boolean;
}

export function dbToCalendarBlock(
    row: DbCalendarBlock,
    pendingInfo?: { isPending: boolean; status?: AssignmentStatus }
): CalendarBlockWithPending {
    return {
        id: row.id,
        taskId: row.task_id,
        startTime: row.start_time,
        endTime: row.end_time,
        ownerId: row.owner_id,
        organizationId: row.organization_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isPendingAssignment: pendingInfo?.isPending ?? false,
        assignmentStatus: pendingInfo?.status,
    };
}
