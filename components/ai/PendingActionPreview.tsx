'use client';

import { Check, X } from 'lucide-react';
import { useAI } from '@/lib/ai/AIContextProvider';
import { Button } from '@/components/ui/button';
import { PendingAction } from '@/lib/ai/types';

export function PendingActionPreview({ existingAction }: { existingAction?: PendingAction }) {
    const { pendingAction: contextPendingAction, confirmAction, cancelAction } = useAI();

    // Use either the passed action (for history) or the active pending action
    const pendingAction = existingAction || contextPendingAction;

    if (!pendingAction) return null;

    const isHistory = !!existingAction;

    return (
        <div className={`bg-white px-3 ${isHistory ? 'py-2' : 'pb-4 pt-0'}`}>
            <div className="flex flex-col gap-1">
                {/* Task Actions */}
                {(pendingAction.type === 'create_task' ||
                    pendingAction.type === 'update_task' ||
                    pendingAction.type === 'delete_task') && (
                        <div className="flex flex-col gap-1">
                            <div className="text-sm text-[#37352F]">
                                <p className="whitespace-pre-wrap leading-relaxed">{pendingAction.preview}</p>
                            </div>
                            {!isHistory && (
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        onClick={confirmAction}
                                        size="sm"
                                        className="h-7 px-3 text-xs bg-[#FF5500] hover:bg-[#e04b00] text-white shadow-sm font-medium rounded-md"
                                    >
                                        Confirm
                                    </Button>
                                    <Button
                                        onClick={cancelAction}
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-3 text-xs text-[#787774] hover:bg-[#F7F7F5] hover:text-[#37352F] rounded-md"
                                    >
                                        Dismiss
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                {/* Calendar Actions */}
                {pendingAction.type === 'reschedule_calendar' && (
                    <div className="flex flex-col gap-1">
                        {/* Task title */}
                        <div className="text-sm font-medium text-[#37352F] mb-1">
                            {getTaskTitle(pendingAction.preview.originalBlock)}
                        </div>
                        <div className="flex flex-col gap-1 pl-1">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[#9B9A97] min-w-[60px] text-xs uppercase tracking-wide">Original:</span>
                                <span className="text-[#37352F]">
                                    {formatCalendarTime(pendingAction.preview.originalBlock)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[#FF5500] min-w-[60px] text-xs uppercase tracking-wide font-medium">New:</span>
                                <span className="font-medium text-[#37352F]">
                                    {formatCalendarTime(pendingAction.preview.suggestedBlock)}
                                </span>
                            </div>
                        </div>
                        {!isHistory && (
                            <div className="flex gap-2 mt-2">
                                <Button
                                    onClick={confirmAction}
                                    size="sm"
                                    className="h-7 px-3 text-xs bg-[#FF5500] hover:bg-[#e04b00] text-white shadow-sm font-medium rounded-md"
                                >
                                    Confirm
                                </Button>
                                <Button
                                    onClick={cancelAction}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-3 text-xs text-[#787774] hover:bg-[#F7F7F5] hover:text-[#37352F] rounded-md"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface CalendarBlockLike {
    start_time?: string;  // Database snake_case format
    end_time?: string;
    startTime?: string;   // Frontend camelCase format
    endTime?: string;
}

function formatCalendarTime(block: CalendarBlockLike): string {
    const start = new Date(block.startTime || block.start_time!);
    const end = new Date(block.endTime || block.end_time!);

    return `${start.toLocaleDateString()} ${start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })} - ${end.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })}`;
}

interface CalendarBlockWithTask {
    task?: {
        title?: string;
    };
    task_title?: string;
}

function getTaskTitle(block: CalendarBlockWithTask): string {
    // Handle both nested task object and direct task property
    if (block.task?.title) {
        return block.task.title;
    }
    if (block.task_title) {
        return block.task_title;
    }
    return 'Untitled Task';
}
