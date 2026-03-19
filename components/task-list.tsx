'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Task, TaskStatus, TaskListProps, AssignmentStatus } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { getSortFields } from '@/lib/utils/task-helpers';
import { TaskListToolbar } from './task-list/TaskListToolbar';
import { useTaskSections, TaskWithExtras } from '@/lib/hooks/use-task-sections';
import { useTaskVirtualizer } from '@/lib/hooks/use-task-virtualizer';
import { useTaskDnd } from '@/lib/hooks/use-task-dnd';
import { FastSection } from './task-list/FastSection';

export default function TaskList({
    tasks,
    selectedDate,
    searchQuery,
    filterRules,
    onTaskClick,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    onDragStart,
    onSearchChange,
    onFilterChange,
    sortConfig,
    onSortChange,
    calendarBlocks = [],
    viewDate,
    currentUserId,
    onAcceptAssignment,
    onRejectAssignment,
    previewTask,
    onAddSubtask,
    onFocusDayFromTaskView,
    onDropCalendarBlock,
    onDeleteBlock,
    draggingTask,
    onCalendarBlockDragActiveChange,
    tableVariant = 'default',
}: TaskListProps) {
    const { t } = useLanguage();

    // Decouple task list viewport from external date
    const [anchorDate, setAnchorDate] = useState<Date>(selectedDate);
    const { members: orgMembers } = useOrganizationMembers();

    // Lifted editing state — only one row edits at a time
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    // Track newly created row for auto-focus
    const [newRowId, setNewRowId] = useState<string | null>(null);

    // Expand/collapse state for subtask rows
    const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());

    // Refs for stable callbacks
    const tasksRef = useRef(tasks);
    const onUpdateTaskRef = useRef(onUpdateTask);
    React.useEffect(() => {
        tasksRef.current = tasks;
        onUpdateTaskRef.current = onUpdateTask;
    });

    const {
        isDraggingTaskRow,
        dragOverDateKey,
        handleDragStart,
        handleDragEnd,
        handleSectionDragOver,
        handleSectionDragLeave,
        handleSectionDrop,
    } = useTaskDnd({
        tasks,
        onUpdateTask,
        onDragStart,
        onDropCalendarBlock,
        calendarBlocks,
        onDeleteBlock,
    });

    const {
        selectedDateKey,
        todayKey,
        dayRange,
        daySections,
        selectedDayTaskCount,
        subtaskCountMap,
    } = useTaskSections({
        tasks,
        calendarBlocks,
        selectedDate,
        anchorDate,
        searchQuery,
        filterRules,
        sortConfig,
        previewTask,
        isDraggingTaskRow,
        draggingTask,
        dragOverDateKey,
        expandedParentIds,
        t,
    });

    const {
        daySectionsScrollRef,
        daySectionsViewportRef,
        lastFocusedDayKeyRef,
        captureScrollAnchor,
    } = useTaskVirtualizer({
        daySections,
        selectedDateKey,
        selectedDate,
        setAnchorDate,
    });

    const toggleSubtasks = useCallback((parentId: string) => {
        const escapeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(parentId) : parentId;
        captureScrollAnchor(`[data-row-id="${escapeId}"]`);
        setExpandedParentIds(prev => {
            const next = new Set(prev);
            if (next.has(parentId)) next.delete(parentId);
            else next.add(parentId);
            return next;
        });
    }, [captureScrollAnchor]);

    const handleAddSubtask = useCallback(async (parentId: string, dateKey: string) => {
        const escapeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(parentId) : parentId;
        captureScrollAnchor(`[data-row-id="${escapeId}"]`);
        setExpandedParentIds(prev => new Set([...prev, parentId]));
        const result = await onAddSubtask?.(parentId, dateKey);
        if (result && 'id' in result) {
            setNewRowId(result.id);
            setEditingTaskId(result.id);
        }
    }, [onAddSubtask, captureScrollAnchor]);

    const SORT_FIELDS = useMemo(() => getSortFields(t), [t]);

    // ─── Row-level callbacks ──────────────────────────────────────────────

    const handleEditStart = useCallback((taskId: string) => {
        setEditingTaskId(taskId);
    }, []);

    const handleEditSave = useCallback((taskId: string, field: string, value: unknown) => {
        const task = tasksRef.current.find(t => t.id === taskId);
        if (!task) return;

        if (field === 'ownerIds') {
            onUpdateTaskRef.current({ ...task, ownerIds: value as string[] } as Task);
        } else {
            onUpdateTaskRef.current({ ...task, [field]: value } as Task);
        }
        setEditingTaskId(null);
        setNewRowId(null);
    }, []);

    const handleEditCancel = useCallback(() => {
        setEditingTaskId(null);
        setNewRowId(null);
    }, []);

    const handleToggleComplete = useCallback((taskId: string) => {
        const task = tasksRef.current.find(t => t.id === taskId);
        if (!task) return;
        const newStatus: TaskStatus = task.status === 'completed' ? 'planned' : 'completed';
        onUpdateTaskRef.current({ ...task, status: newStatus });
    }, []);

    const handleOwnerChange = useCallback((taskId: string, ownerIds: string[]) => {
        const task = tasksRef.current.find(t => t.id === taskId);
        if (!task) return;
        onUpdateTaskRef.current({ ...task, ownerIds } as Task);
    }, []);

    const handleRowClick = useCallback((row: TaskWithExtras) => {
        if (row.id === 'preview-task-temp') return;
        onTaskClick(row);
    }, [onTaskClick]);

    const handleDeleteEmpty = useCallback((taskId: string) => {
        onDeleteTask(taskId);
        setEditingTaskId(null);
        setNewRowId(null);
    }, [onDeleteTask]);

    // Handle Enter key in editing: save current + create new row in same section
    const makeEnterKeyHandler = useCallback((sectionDateKey: string) => {
        return async () => {
            const result = await onAddTask({ scheduledDate: sectionDateKey });
            if (result && 'id' in result) {
                setNewRowId(result.id);
                setEditingTaskId(result.id);
            }
        };
    }, [onAddTask]);

    return (
        <div
            className="w-full h-full bg-white flex flex-col font-sans"
            onDragOver={(e) => {
                if (!e.dataTransfer.types.includes('calendar-block')) return;
                onCalendarBlockDragActiveChange?.(true);
            }}
            onDragLeave={(e) => {
                if (!e.dataTransfer.types.includes('calendar-block')) return;
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    onCalendarBlockDragActiveChange?.(false);
                }
            }}
            onDrop={() => onCalendarBlockDragActiveChange?.(false)}
        >
            <TaskListToolbar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                filterRules={filterRules}
                onFilterChange={onFilterChange}
                sortConfig={sortConfig}
                onSortChange={onSortChange}
                sortFields={SORT_FIELDS}
            />

            <div className={cn("flex-1 overflow-auto", tableVariant === 'minimal' ? "pl-4" : "pl-1")}>
                <div ref={daySectionsViewportRef} className="h-full min-h-0 flex flex-col">
                    <div className="relative w-full h-full">
                        <div
                            ref={daySectionsScrollRef}
                            className="h-full overflow-y-auto [overflow-anchor:none]"
                        >
                            <div className="flex flex-col pr-4">
                                {daySections.map((section) => {
                                    const isDropActive = dragOverDateKey === section.dateKey;
                                    return (
                                        <FastSection
                                            key={section.dateKey}
                                            section={section}
                                            editingTaskId={editingTaskId}
                                            onEditStart={handleEditStart}
                                            onEditSave={handleEditSave}
                                            onEditCancel={handleEditCancel}
                                            onAddRow={async () => {
                                                captureScrollAnchor(`[data-date-key="${section.dateKey}"]`);
                                                const result = await onAddTask({ scheduledDate: section.dateKey });
                                                if (result && 'id' in result) {
                                                    setNewRowId(result.id);
                                                    setEditingTaskId(result.id);
                                                }
                                            }}
                                            onDeleteRow={(rowId) => {
                                                captureScrollAnchor(`[data-date-key="${section.dateKey}"]`);
                                                onDeleteTask(rowId);
                                            }}
                                            onRowClick={handleRowClick}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onToggleComplete={handleToggleComplete}
                                            onAddSubtask={(parentId) => handleAddSubtask(parentId, section.dateKey)}
                                            onToggleSubtasks={toggleSubtasks}
                                            expandedParentIds={expandedParentIds}
                                            subtaskCountMap={subtaskCountMap}
                                            orgMembers={orgMembers}
                                            onOwnerChange={handleOwnerChange}
                                            currentUserId={currentUserId}
                                            onAcceptAssignment={onAcceptAssignment}
                                            onRejectAssignment={onRejectAssignment}
                                            isDropActive={isDropActive}
                                            onSectionDragOver={handleSectionDragOver}
                                            onSectionDragLeave={handleSectionDragLeave}
                                            onSectionDrop={handleSectionDrop}
                                            onFocusDay={
                                                onFocusDayFromTaskView && section.dateKey !== selectedDateKey
                                                    ? () => {
                                                        if (lastFocusedDayKeyRef.current === section.dateKey) return;
                                                        lastFocusedDayKeyRef.current = section.dateKey;
                                                        requestAnimationFrame(() => {
                                                            onFocusDayFromTaskView!(section.date);
                                                        });
                                                    }
                                                    : undefined
                                            }
                                            variant={tableVariant === 'minimal' ? 'minimal' : 'default'}
                                            newRowId={newRowId}
                                            onEnterKey={makeEnterKeyHandler(section.dateKey)}
                                            onDeleteEmpty={handleDeleteEmpty}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
