'use client';

import React, { useCallback } from 'react';
import { GripVertical, CornerDownRight, Edit2, ChevronDown, ChevronRight, Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { TaskWithExtras } from '@/lib/hooks/use-task-sections';
import { PeopleOption, AssignmentStatus } from '@/lib/types';
import { FastTaskInput } from './FastTaskInput';
import { FastEstTimeInput } from './FastEstTimeInput';
import { PeopleAvatar } from './PeopleAvatar';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/lib/utils/time-helpers';
import { useLanguage } from '@/lib/i18n';

// Pre-create transparent drag image
const transparentDragImage = typeof Image !== 'undefined' ? (() => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return img;
})() : null;

interface FastTaskRowProps {
    task: TaskWithExtras;
    isEditing: boolean;
    isSubtask: boolean;
    hasSubtasks: boolean;
    isExpanded: boolean;
    onEditStart: (taskId: string) => void;
    onEditSave: (taskId: string, field: string, value: unknown) => void;
    onEditCancel: () => void;
    onToggleComplete: (taskId: string) => void;
    onDelete: (taskId: string) => void;
    onDragStart: (taskId: string) => void;
    onDragEnd: () => void;
    onClick: (task: TaskWithExtras) => void;
    onAddSubtask: (parentId: string) => void;
    onToggleSubtasks: (parentId: string) => void;
    orgMembers: PeopleOption[];
    onOwnerChange: (taskId: string, ownerIds: string[]) => void;
    ownerStatuses: Record<string, AssignmentStatus>;
    isPending: boolean;
    onAccept?: (taskId: string) => void;
    onReject?: (taskId: string) => void;
    autoFocus?: boolean;
    onEnterKey?: () => void;
    onDeleteEmpty?: (taskId: string) => void;
}

export const FastTaskRow = React.memo(function FastTaskRow({
    task,
    isEditing,
    isSubtask,
    hasSubtasks,
    isExpanded,
    onEditStart,
    onEditSave,
    onEditCancel,
    onToggleComplete,
    onDelete,
    onDragStart,
    onDragEnd,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onClick: _onClick,
    onAddSubtask,
    onToggleSubtasks,
    orgMembers,
    onOwnerChange,
    ownerStatuses,
    isPending,
    onAccept,
    onReject,
    autoFocus,
    onEnterKey,
    onDeleteEmpty,
}: FastTaskRowProps) {
    const { t } = useLanguage();
    const isCompleted = task.status === 'completed' || !!task.parentCompleted;

    const handleDragStart = useCallback((e: React.DragEvent) => {
        onDragStart(task.id);
        e.dataTransfer.setData('task-row', '1');
        e.dataTransfer.setData('rowId', task.id);
        if (task.expectedTime) {
            e.dataTransfer.setData('duration', String(task.expectedTime));
        }
        e.dataTransfer.effectAllowed = 'move';
        if (transparentDragImage) {
            e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
        }
    }, [task.id, task.expectedTime, onDragStart]);

    const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onToggleComplete(task.id);
    }, [task.id, onToggleComplete]);

    // Row-level click intentionally removed – task modal is not opened from the workspace table.

    const handleOwnerChange = useCallback((ownerIds: string[]) => {
        onOwnerChange(task.id, ownerIds);
    }, [task.id, onOwnerChange]);

    // Format time range for display
    const timeDisplay = formatTimeRange(task.startTime, task.expectedTime);

    return (
        <div
            data-row-id={task.id}
            data-subtask={isSubtask ? 'true' : 'false'}
            draggable={!isPending && !isSubtask}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            className={cn(
                'group flex items-start px-1 py-1 border-b border-[#dfe1e6] bg-white transition-colors',
                isSubtask && 'bg-[#fafafa]',
                isEditing ? 'bg-[#f4f5f7] relative z-40' : 'relative z-10',
                isCompleted && 'bg-[#f7f7f5]',
                isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f4f5f7]',
            )}
        >
            {/* Drag handle / persist error indicator */}
            <div className="w-4 flex justify-center self-center flex-shrink-0">
                {task.persistError ? (
                    <AlertCircle size={14} className="text-red-500" />
                ) : !isSubtask ? (
                    <GripVertical size={16} className="text-[#a5adba] opacity-0 group-hover:opacity-100 cursor-grab" />
                ) : null}
            </div>

            {/* Checkbox */}
            <div className={cn("w-5 flex justify-center self-center flex-shrink-0", isSubtask && "ml-6")}>
                <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={handleCheckboxChange}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[14px] h-[14px] border-2 border-[#dfe1e6] rounded-[3px] cursor-pointer accent-[#ea580c]"
                />
            </div>

            {/* Title + time range */}
            <div className={cn(
                'flex-1 flex flex-col min-w-0 px-1 relative',
                isCompleted && 'opacity-60 line-through',
            )}>
                <div className="flex items-start w-full relative">
                    <div className={cn("relative flex-1 min-w-0 min-h-[36px]")}>
                        {/* Display mode */}
                        <div
                            className={cn(
                                'text-[14px] text-[#172b4d] cursor-grab active:cursor-grabbing px-1 py-1 min-h-[28px] rounded-[3px] w-full flex items-center border border-transparent leading-tight',
                                isEditing && 'opacity-0 pointer-events-none',
                            )}
                        >
                            <span className="truncate min-w-0">
                                {task.title || <span className="text-[#a5adba] italic">{t('common.add_task_placeholder')}</span>}
                            </span>
                            {!isEditing && (
                                <button
                                    className="opacity-0 group-hover:opacity-100 ml-1.5 p-1 text-[#5e6c84] hover:text-[#172b4d] hover:bg-gray-200 rounded-[3px] flex-shrink-0 cursor-pointer transition-colors"
                                    onClick={(e) => { e.stopPropagation(); onEditStart(task.id); }}
                                    title={t('common.edit')}
                                >
                                    <Edit2 size={12} />
                                </button>
                            )}
                        </div>

                        {/* Edit mode */}
                        {isEditing && (
                            <div className="absolute top-0 left-0 w-full z-30">
                                <FastTaskInput
                                    initialValue={task.title}
                                    onSave={(val) => onEditSave(task.id, 'title', val)}
                                    onCancel={onEditCancel}
                                    onEnterKey={onEnterKey}
                                    onDeleteEmpty={onDeleteEmpty ? () => onDeleteEmpty(task.id) : undefined}
                                    autoFocus={autoFocus}
                                    placeholder={t('common.add_task_placeholder')}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {!isSubtask && (
                    <div className="text-[10px] text-[#8993a4] flex items-center ml-2 -mt-1 mb-0.5 font-medium">
                        {timeDisplay || '--'}
                    </div>
                )}
            </div>

            {/* Right side: est time, people, actions */}
            <div className="flex items-center self-center gap-0.5 flex-shrink-0">
                {/* Estimated time */}
                <div className="w-[44px] flex justify-center">
                    <FastEstTimeInput
                        value={task.expectedTime || 0}
                        onChange={(val) => onEditSave(task.id, 'expectedTime', val)}
                    />
                </div>

                {/* People avatar */}
                <div className="w-[36px] flex justify-center ml-1">
                    <PeopleAvatar
                        ownerIds={task.ownerIds}
                        orgMembers={orgMembers}
                        ownerStatuses={ownerStatuses}
                        onChange={handleOwnerChange}
                    />
                </div>

                {/* Subtask + delete actions */}
                <div className="w-[44px] flex items-center justify-end gap-1 transition-opacity">
                    {isSubtask ? (
                        task.parentTaskId ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddSubtask(task.parentTaskId!); }}
                                className="p-0.5 text-[#5e6c84] hover:bg-gray-200 rounded-[3px] opacity-0 group-hover:opacity-100 cursor-pointer"
                                title={t('common.add_subtask')}
                            >
                                <Plus size={14} />
                            </button>
                        ) : null
                    ) : (
                        hasSubtasks ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleSubtasks(task.id); }}
                                className="p-0.5 text-[#5e6c84] hover:bg-gray-200 rounded-[3px] flex items-center gap-0.5 cursor-pointer"
                                title={isExpanded ? t('common.collapse_subtasks') : t('common.expand_subtasks')}
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAddSubtask(task.id); }}
                                className="p-0.5 text-[#5e6c84] hover:bg-gray-200 rounded-[3px] opacity-0 group-hover:opacity-100 cursor-pointer"
                                title={t('common.add_subtask')}
                            >
                                <Plus size={14} />
                            </button>
                        )
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                        className="p-0.5 text-[#5e6c84] hover:bg-red-100 hover:text-red-600 rounded-[3px] opacity-0 group-hover:opacity-100 cursor-pointer"
                        title={t('common.delete')}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Accept/Reject for pending tasks */}
            {isPending && onAccept && onReject && (
                <div className="flex items-center gap-1 ml-2 self-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAccept(task.id); }}
                        className="p-1 rounded-md bg-green-50 hover:bg-green-100 text-green-600 cursor-pointer"
                        title={t('common.accept')}
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onReject(task.id); }}
                        className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                        title={t('common.reject')}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    // Custom equality: skip re-render if nothing changed
    return (
        prev.task === next.task &&
        prev.isEditing === next.isEditing &&
        prev.isSubtask === next.isSubtask &&
        prev.hasSubtasks === next.hasSubtasks &&
        prev.isExpanded === next.isExpanded &&
        prev.isPending === next.isPending &&
        prev.autoFocus === next.autoFocus &&
        prev.orgMembers === next.orgMembers &&
        prev.ownerStatuses === next.ownerStatuses
    );
});
