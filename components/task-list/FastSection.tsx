'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { DaySection, TaskWithExtras } from '@/lib/hooks/use-task-sections';
import { Task, PeopleOption, AssignmentStatus } from '@/lib/types';
import { FastTaskRow } from './FastTaskRow';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

interface FastSectionProps {
    section: DaySection;
    editingTaskId: string | null;
    onEditStart: (taskId: string) => void;
    onEditSave: (taskId: string, field: string, value: unknown) => void;
    onEditCancel: () => void;
    onAddRow: () => Promise<Task | void> | void;
    onDeleteRow: (taskId: string) => void;
    onRowClick: (task: TaskWithExtras) => void;
    onDragStart: (taskId: string) => void;
    onDragEnd: () => void;
    onToggleComplete: (taskId: string) => void;
    onAddSubtask: (parentId: string) => void;
    onToggleSubtasks: (parentId: string) => void;
    expandedParentIds: Set<string>;
    subtaskCountMap: Map<string, number>;
    orgMembers: PeopleOption[];
    onOwnerChange: (taskId: string, ownerIds: string[]) => void;
    currentUserId?: string;
    onAcceptAssignment?: (taskId: string) => void;
    onRejectAssignment?: (taskId: string) => void;
    isDropActive: boolean;
    // Drag events for the section
    onSectionDragOver: (e: React.DragEvent, dateKey: string) => void;
    onSectionDragLeave: (e: React.DragEvent) => void;
    onSectionDrop: (e: React.DragEvent, dateKey: string) => void;
    // Focus day
    onFocusDay?: () => void;
    // Minimal variant with summary header
    variant?: 'default' | 'minimal';
    // New row auto-focus support
    newRowId?: string | null;
    onEnterKey?: () => void;
    onDeleteEmpty?: (taskId: string) => void;
}

export const FastSection = React.memo(function FastSection({
    section,
    editingTaskId,
    onEditStart,
    onEditSave,
    onEditCancel,
    onAddRow,
    onDeleteRow,
    onRowClick,
    onDragStart,
    onDragEnd,
    onToggleComplete,
    onAddSubtask,
    onToggleSubtasks,
    expandedParentIds,
    subtaskCountMap,
    orgMembers,
    onOwnerChange,
    currentUserId,
    onAcceptAssignment,
    onRejectAssignment,
    isDropActive,
    onSectionDragOver,
    onSectionDragLeave,
    onSectionDrop,
    onFocusDay,
    variant = 'minimal',
    newRowId,
    onEnterKey,
    onDeleteEmpty,
}: FastSectionProps) {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(true);

    const isPendingTask = useCallback((task: TaskWithExtras) => {
        if (task.id === 'preview-task-temp') return true;
        if (!currentUserId) return false;
        return task.owners.some(
            owner => owner.id === currentUserId && owner.status === 'pending'
        );
    }, [currentUserId]);

    const getOwnerStatuses = useCallback((task: TaskWithExtras): Record<string, AssignmentStatus> => {
        const statuses: Record<string, AssignmentStatus> = {};
        task.owners.forEach(owner => {
            if (owner.status) {
                statuses[owner.id] = owner.status;
            }
        });
        return statuses;
    }, []);

    // Compute section stats
    const stats = useMemo(() => {
        const topLevelTasks = section.tasks.filter(t => !t.parentTaskId);
        const totalTasks = topLevelTasks.length;
        const completedTasks = topLevelTasks.filter(t => t.status === 'completed').length;
        const tasksLeft = topLevelTasks.filter(t =>
            ['planned', 'in_progress', 'overrun'].includes(t.status)
        ).length;
        const estimatedMinutes = topLevelTasks.reduce((sum, t) => sum + (t.expectedTime || 0), 0);
        const estimatedHours = Math.round((estimatedMinutes / 60) * 10) / 10;
        return { totalTasks, completedTasks, tasksLeft, estimatedHours };
    }, [section.tasks]);

    return (
        <div data-date-key={section.dateKey}>
            <section
                className="pt-1 pb-6 rounded-md transition-colors"
                onDragOver={(e) => onSectionDragOver(e, section.dateKey)}
                onDragLeave={onSectionDragLeave}
                onDrop={(e) => onSectionDrop(e, section.dateKey)}
                onFocus={() => onFocusDay?.()}
            >
                {/* Section header */}
                {variant === 'minimal' ? (
                    <div className="relative">
                        <div
                            className={cn(
                                "flex items-center justify-between px-2 py-2 bg-[#f4f5f7] rounded-t-[6px] border border-[#dfe1e6] border-b-0 cursor-pointer",
                                isDropActive && "border-orange-400"
                            )}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <div className="flex items-center">
                                <div className="w-6 flex justify-center text-[#42526e] hover:bg-gray-200 rounded-[3px] p-0.5 cursor-pointer">
                                    <ChevronDown size={18} className={cn('transform transition-transform', !isExpanded && '-rotate-90')} />
                                </div>
                                <div className="flex items-center gap-2.5 text-[#37352F] ml-1">
                                    <span className="text-[13px] font-bold">
                                        {section.title}
                                    </span>
                                    {isDropActive && (
                                        <span className="text-[10px] text-orange-400 font-normal">{t('common.drop_to_reschedule_here')}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4 mr-2">
                                <span className="text-[12px] text-[#5e6c84] font-medium">{stats.completedTasks} / {stats.totalTasks} {t('common.completed_short')}</span>
                                <span className="text-[12px] text-[#5e6c84] font-medium">{t('common.total_hours_short')} {stats.estimatedHours}h</span>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className={cn(
                                "border border-[#dfe1e6] rounded-b-[6px] bg-white border-t-0",
                                isDropActive && "border-orange-400"
                            )}>
                                {section.tasks.map((task) => {
                                    const isSubtask = !!task.parentTaskId;
                                    const hasSubtasks = (subtaskCountMap.get(task.id) ?? 0) > 0;
                                    const isSubtaskExpanded = expandedParentIds.has(task.id);
                                    const rowEnterKeyHandler = isSubtask && task.parentTaskId
                                        ? () => onAddSubtask(task.parentTaskId!)
                                        : onEnterKey;

                                    return (
                                        <FastTaskRow
                                            key={task._reactKey ?? task.id}
                                            task={task}
                                            isEditing={editingTaskId === task.id}
                                            isSubtask={isSubtask}
                                            hasSubtasks={hasSubtasks}
                                            isExpanded={isSubtaskExpanded}
                                            onEditStart={onEditStart}
                                            onEditSave={onEditSave}
                                            onEditCancel={onEditCancel}
                                            onToggleComplete={onToggleComplete}
                                            onDelete={onDeleteRow}
                                            onDragStart={onDragStart}
                                            onDragEnd={onDragEnd}
                                            onClick={onRowClick}
                                            onAddSubtask={onAddSubtask}
                                            onToggleSubtasks={onToggleSubtasks}
                                            orgMembers={orgMembers}
                                            onOwnerChange={onOwnerChange}
                                            ownerStatuses={getOwnerStatuses(task)}
                                            isPending={isPendingTask(task)}
                                            onAccept={onAcceptAssignment}
                                            onReject={onRejectAssignment}
                                            autoFocus={newRowId === task.id}
                                            onEnterKey={rowEnterKeyHandler}
                                            onDeleteEmpty={onDeleteEmpty}
                                        />
                                    );
                                })}

                                <div
                                    className="flex items-center px-1 py-1 text-[#5e6c84] hover:bg-[#f4f5f7] bg-white cursor-pointer rounded-b-[6px] text-[14px] transition-colors border-t border-[#dfe1e6]"
                                    onClick={(e) => { e.stopPropagation(); onAddRow(); }}
                                >
                                    <div className="w-4 flex-shrink-0" />
                                    <div className="w-5 flex-shrink-0 flex justify-center">
                                        <Plus size={16} />
                                    </div>
                                    <div className="flex-1 flex items-center px-1 py-1">
                                        <span>{t('common.create_task')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="px-2 pb-0 text-[11px] font-semibold flex items-center gap-2">
                            <span className="text-[#787774]">
                                {section.title}
                            </span>
                            {isDropActive && (
                                <span className="text-[10px] text-orange-400 font-normal">{t('common.drop_to_reschedule_here')}</span>
                            )}
                        </div>

                        {/* Task rows */}
                        {isExpanded && (
                            <div className="relative">
                                <div className={cn(
                                    "border border-[#dfe1e6] rounded-b-[6px] bg-white",
                                    isDropActive && 'border-orange-400'
                                )}>
                                    {section.tasks.map((task) => {
                                        const isSubtask = !!task.parentTaskId;
                                        const hasSubtasks = (subtaskCountMap.get(task.id) ?? 0) > 0;
                                        const isSubtaskExpanded = expandedParentIds.has(task.id);
                                        const rowEnterKeyHandler = isSubtask && task.parentTaskId
                                            ? () => onAddSubtask(task.parentTaskId!)
                                            : onEnterKey;

                                        return (
                                            <FastTaskRow
                                                key={task._reactKey ?? task.id}
                                                task={task}
                                                isEditing={editingTaskId === task.id}
                                                isSubtask={isSubtask}
                                                hasSubtasks={hasSubtasks}
                                                isExpanded={isSubtaskExpanded}
                                                onEditStart={onEditStart}
                                                onEditSave={onEditSave}
                                                onEditCancel={onEditCancel}
                                                onToggleComplete={onToggleComplete}
                                                onDelete={onDeleteRow}
                                                onDragStart={onDragStart}
                                                onDragEnd={onDragEnd}
                                                onClick={onRowClick}
                                                onAddSubtask={onAddSubtask}
                                                onToggleSubtasks={onToggleSubtasks}
                                                orgMembers={orgMembers}
                                                onOwnerChange={onOwnerChange}
                                                ownerStatuses={getOwnerStatuses(task)}
                                                isPending={isPendingTask(task)}
                                                onAccept={onAcceptAssignment}
                                                onReject={onRejectAssignment}
                                                autoFocus={newRowId === task.id}
                                                onEnterKey={rowEnterKeyHandler}
                                                onDeleteEmpty={onDeleteEmpty}
                                            />
                                        );
                                    })}

                                    {/* Add row button */}
                                    <div
                                        className="flex items-center px-1 py-1 text-[#5e6c84] hover:bg-[#f4f5f7] bg-white cursor-pointer rounded-b-[6px] text-[14px] transition-colors border-t border-[#dfe1e6]"
                                        onClick={(e) => { e.stopPropagation(); onAddRow(); }}
                                    >
                                        <div className="w-4 flex-shrink-0" />
                                        <div className="w-5 flex-shrink-0 flex justify-center">
                                            <Plus size={16} />
                                        </div>
                                        <div className="flex-1 flex items-center px-1 py-1">
                                            <span>{t('common.create_task')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
});
