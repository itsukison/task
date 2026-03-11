'use client';

import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, ChevronDown, ChevronUp } from 'lucide-react';
import { EditableTable, TableColumn, ColumnOption, SortConfig } from './editable-table';
import { Task, TaskStatus, TaskListProps, PeopleOption, AssignmentStatus } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useLanguage } from '@/lib/i18n';
import { HiddenColumnsMenu } from './task-list/HiddenColumnsMenu';
import { AdvancedFilterMenu } from './task-list/AdvancedFilterMenu';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { evaluateFilterRules } from '@/lib/utils/filterRules';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';
import { addDays } from 'date-fns';

const getSortFields = (t: any) => [
    { id: 'title', label: t('headers.task_name') },
    { id: 'status', label: t('headers.status') },
    { id: 'expectedTime', label: t('headers.est_time') },
    { id: 'owner', label: t('headers.owner') },
];

// Convert Date to YYYY-MM-DD string in local timezone
const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getRelativeDayLabel = (target: Date, reference: Date): 'yesterday' | 'today' | 'tomorrow' | null => {
    const targetMidnight = new Date(target);
    targetMidnight.setHours(0, 0, 0, 0);

    const referenceMidnight = new Date(reference);
    referenceMidnight.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetMidnight.getTime() - referenceMidnight.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays === -1) return 'yesterday';
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return null;
};

// Status options with colors matching Notion-style badges
const STATUS_OPTIONS: ColumnOption[] = [
    { label: 'planned', backgroundColor: 'hsl(0, 0%, 93%)' },
    { label: 'in_progress', backgroundColor: 'hsl(35, 100%, 90%)' },
    { label: 'overrun', backgroundColor: 'hsl(0, 100%, 92%)' },
    { label: 'completed', backgroundColor: 'hsl(120, 60%, 90%)' },
];

// Define column configuration for Task data with optional custom columns
function getTaskColumns(orgMembers: PeopleOption[], customColumns: any[], t: any): TableColumn<Task>[] {
    const baseColumns = [
        {
            id: 'title',
            label: t('headers.task_name'),
            dataType: 'text',
            width: 280,
            minWidth: 150,
        },
        // {
        //     id: 'status',
        //     label: t('headers.status'),
        //     dataType: 'select',
        //     width: 140,
        //     minWidth: 100,
        //     options: STATUS_OPTIONS,
        // },
        {
            id: 'time',
            label: t('headers.time'),
            dataType: 'combinedTime',
            width: 150,
            minWidth: 110,
        },
        {
            id: 'ownerIds',  // Array of user IDs
            label: t('headers.owner'),
            dataType: 'people',
            width: 200,
            minWidth: 80,
            peopleOptions: orgMembers,
        },
    ];

    return baseColumns as TableColumn<Task>[];
}

export default function TaskList({
    tasks,
    selectedDate,
    searchQuery,
    filterRules,
    onTaskClick,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    onDuplicateTask,
    onDragStart,
    onSearchChange,
    onFilterChange,
    sortConfig,
    onSortChange,
    hiddenColumns = [],
    onHideColumn,
    onShowColumn,
    calendarBlocks = [],
    viewMode,
    viewDate,
    currentUserId,
    onAcceptAssignment,
    onRejectAssignment,
    previewTask,
    onCreateSubtask,
    onAddSubtask,
    onFocusDayFromTaskView,
}: TaskListProps) {
    const { t } = useLanguage();
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Decouple task list viewport from external date to prevent shifting on internal clicks
    const [anchorDate, setAnchorDate] = useState<Date>(selectedDate);
    const [scrollToDateKey, setScrollToDateKey] = useState<string | null>(null);
    // Fetch organization members for people picker
    const { members: orgMembers } = useOrganizationMembers();
    // Get custom columns and preferences from user preferences
    const {
        preferences,
        updatePreferences,
        customColumns,
        addCustomColumn,
        removeCustomColumn
    } = useUserPreferences();

    // Sync isExpanded with user preferences
    useEffect(() => {
        if (preferences?.tasks_collapsed !== undefined && preferences?.tasks_collapsed !== null) {
            setIsExpanded(!preferences.tasks_collapsed);
        }
    }, [preferences?.tasks_collapsed]);

    const handleToggleExpand = async (expanded: boolean) => {
        setIsExpanded(expanded);
        await updatePreferences({ tasks_collapsed: !expanded });
    };

    // Expand/collapse state for subtask rows — ephemeral, resets on page reload
    const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());

    const toggleSubtasks = useCallback((parentId: string) => {
        setExpandedParentIds(prev => {
            const next = new Set(prev);
            if (next.has(parentId)) {
                next.delete(parentId);
            } else {
                next.add(parentId);
            }
            return next;
        });
    }, []);

    const handleAddSubtask = useCallback(async (parentId: string, dateKey: string) => {
        // Expand the parent so the new subtask is visible
        setExpandedParentIds(prev => new Set([...prev, parentId]));
        return await onAddSubtask?.(parentId, dateKey);
    }, [onAddSubtask]);

    // Use refs to stabilize handleCellChange and prevent column regeneration/cell remounting
    const tasksRef = useRef(tasks);
    const onUpdateTaskRef = useRef(onUpdateTask);

    React.useEffect(() => {
        tasksRef.current = tasks;
        onUpdateTaskRef.current = onUpdateTask;
    });

    // Transform tasks to include virtual properties
    type TaskWithExtras = Task & {
        ownerIds: string[];
        startTime?: string; // ISO string from calendar block
    };

    type DaySection = {
        date: Date;
        dateKey: string;
        title: string;
        tasks: TaskWithExtras[];
    };

    const selectedDateKey = useMemo(
        () => formatDateToLocalISO(selectedDate),
        [selectedDate]
    );
    const todayKey = useMemo(
        () => formatDateToLocalISO(new Date()),
        []
    );

    const daySectionsScrollRef = useRef<HTMLDivElement>(null);
    const daySectionsViewportRef = useRef<HTMLDivElement>(null);
    const lastFocusedDayKeyRef = useRef<string | null>(null);
    const collapsedTopFadePx = 8;
    const collapsedBottomFadePx = 80;
    const collapsedContentGapPx = 20;

    const dayRange = useMemo(() => {
        return Array.from({ length: 61 }, (_, index) => {
            const date = addDays(anchorDate, index - 30);
            return {
                date,
                dateKey: formatDateToLocalISO(date),
            };
        });
    }, [anchorDate]);

    const dayTitleFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }, []);
    const dayTitleWithYearFormatter = useMemo(() => {
        return new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }, []);

    const blockStartTimeByTaskId = useMemo(() => {
        const blockMap = new Map<string, string>();
        calendarBlocks.forEach((block) => {
            if (!blockMap.has(block.taskId)) {
                blockMap.set(block.taskId, block.startTime);
            }
        });
        return blockMap;
    }, [calendarBlocks]);

    // All tasks as TaskWithExtras — used to build subtask lookup maps
    const allTasksWithExtras = useMemo((): TaskWithExtras[] => {
        return tasks.map(t => ({
            ...t,
            ownerIds: t.owners.map(o => o.id),
            startTime: blockStartTimeByTaskId.get(t.id),
        }));
    }, [tasks, blockStartTimeByTaskId]);

    // Subtasks grouped by parent ID (from all tasks, not just top-level)
    const subtasksByParentId = useMemo((): Map<string, TaskWithExtras[]> => {
        const map = new Map<string, TaskWithExtras[]>();
        allTasksWithExtras.forEach(t => {
            if (t.parentTaskId) {
                const list = map.get(t.parentTaskId) ?? [];
                list.push(t);
                map.set(t.parentTaskId, list);
            }
        });
        return map;
    }, [allTasksWithExtras]);

    // Count of subtasks per parent task — passed to table for chevron rendering
    const subtaskCountMap = useMemo((): Map<string, number> => {
        const map = new Map<string, number>();
        subtasksByParentId.forEach((children, parentId) => {
            map.set(parentId, children.length);
        });
        return map;
    }, [subtasksByParentId]);

    const sortedFilteredTasks = useMemo((): TaskWithExtras[] => {
        // Only top-level tasks (no parentTaskId) participate in day sections
        let result = [...tasks].filter(t => !t.parentTaskId) as TaskWithExtras[];

        if (filterRules && filterRules.length > 0) {
            result = result.filter(t => evaluateFilterRules(t, filterRules));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.owners.some(o => o.display_name.toLowerCase().includes(query))
            );
        }

        const enrichedTasks = result.map(t => ({
            ...t,
            ownerIds: t.owners.map(o => o.id),
            startTime: blockStartTimeByTaskId.get(t.id),
        }));

        if (!sortConfig) {
            enrichedTasks.sort((a, b) => {
                if (a.startTime && !b.startTime) return -1;
                if (!a.startTime && b.startTime) return 1;
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }
                return 0;
            });
        }

        return enrichedTasks;
    }, [tasks, filterRules, searchQuery, sortConfig, blockStartTimeByTaskId]);

    const daySections = useMemo((): DaySection[] => {
        const tasksByDate = new Map<string, TaskWithExtras[]>();
        sortedFilteredTasks.forEach(task => {
            if (!task.scheduledDate) return;
            const bucket = tasksByDate.get(task.scheduledDate) ?? [];
            bucket.push(task);
            tasksByDate.set(task.scheduledDate, bucket);
        });

        if (previewTask?.scheduledDate) {
            const previewWithExtras: TaskWithExtras = {
                ...previewTask,
                ownerIds: previewTask.owners.map(o => o.id),
                startTime: blockStartTimeByTaskId.get(previewTask.id),
            };
            const previewBucket = tasksByDate.get(previewTask.scheduledDate) ?? [];
            tasksByDate.set(previewTask.scheduledDate, [previewWithExtras, ...previewBucket]);
        }

        const currentYear = new Date().getFullYear();

        return dayRange.map(({ date, dateKey }) => {
            const relativeLabel = getRelativeDayLabel(date, new Date(todayKey));
            const title = relativeLabel ? t(`common.${relativeLabel}`) : (date.getFullYear() === currentYear
                ? dayTitleFormatter.format(date)
                : dayTitleWithYearFormatter.format(date));

            const topLevelTasks = tasksByDate.get(dateKey) ?? [];

            // Interleave subtasks after their expanded parents
            const interleaved: TaskWithExtras[] = [];
            topLevelTasks.forEach(task => {
                interleaved.push(task);
                if (expandedParentIds.has(task.id)) {
                    const children = subtasksByParentId.get(task.id) ?? [];
                    interleaved.push(...children);
                }
            });

            return {
                date,
                dateKey,
                title,
                tasks: interleaved,
            };
        });
    }, [dayRange, sortedFilteredTasks, previewTask, blockStartTimeByTaskId, dayTitleFormatter, dayTitleWithYearFormatter, todayKey, t, expandedParentIds, subtasksByParentId]);

    const selectedDayTaskCount = useMemo(() => {
        const selectedSection = daySections.find(section => section.dateKey === selectedDateKey);
        return selectedSection?.tasks.length ?? 0;
    }, [daySections, selectedDateKey]);

    // Derive collapsed viewport height from task count — avoids DOM measurement
    const collapsedViewportHeight = useMemo(() => {
        // Non-row section height: title(20) + table header(42) + New button(36) + padding(12) = 110px
        const sectionContent = 110 + selectedDayTaskCount * 36;
        const estimated = collapsedTopFadePx + sectionContent + collapsedContentGapPx + collapsedBottomFadePx;
        return estimated;
    }, [selectedDayTaskCount, collapsedTopFadePx, collapsedContentGapPx, collapsedBottomFadePx]);

    const rowVirtualizer = useVirtualizer({
        count: daySections.length,
        getScrollElement: () => daySectionsScrollRef.current,
        estimateSize: (index) => {
            const count = daySections[index]?.tasks.length ?? 0;
            return 110 + count * 36;
        },
        overscan: 3,
        getItemKey: (index) => daySections[index].dateKey,
    });

    // Scroll to selected day whenever the date changes externally
    useEffect(() => {
        // If the date change was initiated by interacting with a task list section, don't auto-scroll
        if (lastFocusedDayKeyRef.current === selectedDateKey) {
            lastFocusedDayKeyRef.current = null;
            return;
        }

        // External change (e.g. from calendar): Update anchor to center viewport and queue scroll
        setAnchorDate(selectedDate);
        setScrollToDateKey(selectedDateKey);
    }, [selectedDate, selectedDateKey]);

    // Apply scroll safely after daySections have finished rebuilding using the new anchorDate
    useEffect(() => {
        if (!scrollToDateKey) return;

        const selectedIndex = daySections.findIndex(s => s.dateKey === scrollToDateKey);
        if (selectedIndex === -1) return;

        rowVirtualizer.scrollToIndex(selectedIndex, { align: 'start', behavior: 'auto' });
        setScrollToDateKey(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daySections, scrollToDateKey]);

    // Block user-initiated scroll in collapsed mode; virtualizer still drives scrollTop
    useEffect(() => {
        const el = daySectionsScrollRef.current;
        if (!el || isExpanded) return;
        const prevent = (e: WheelEvent) => e.preventDefault();
        const preventTouch = (e: TouchEvent) => e.preventDefault();
        el.addEventListener('wheel', prevent, { passive: false });
        el.addEventListener('touchmove', preventTouch, { passive: false });
        return () => {
            el.removeEventListener('wheel', prevent);
            el.removeEventListener('touchmove', preventTouch);
        };
    }, [isExpanded]);


    // Check if a task is assigned (has start time) for the separator
    const isAssigned = useCallback((task: TaskWithExtras) => {
        return !!task.startTime;
    }, []);

    // Handle cell value changes
    // Stabilized with useCallback and refs to prevent table re-renders that close dropdowns
    const handleCellChange = useCallback((rowId: string, columnId: string, value: unknown) => {
        const task = tasksRef.current.find(t => t.id === rowId);
        if (!task) return;

        // Handle ownerIds changes (people picker)
        if (columnId === 'ownerIds') {
            const ownerIds = value as string[];
            onUpdateTaskRef.current({
                ...task,
                ownerIds,
            } as Task);
            return;
        }

        const updatedTask: Task = {
            ...task,
            [columnId]: value,
        };

        // Handle status type conversion
        if (columnId === 'status') {
            updatedTask.status = value as TaskStatus;
        }

        onUpdateTaskRef.current(updatedTask);
    }, []);

    // Handle row click
    const handleRowClick = (row: TaskWithExtras) => {
        // Disable clicking on preview task
        if (row.id === 'preview-task-temp') return;
        onTaskClick(row);
    };

    // Handle drag start
    const handleDragStart = (rowId: string) => {
        onDragStart(rowId);
    };

    // Handle drag end
    const handleDragEnd = () => {
        onDragStart(null);
    };

    const columns = useMemo(() => getTaskColumns(orgMembers, customColumns || [], t), [orgMembers, customColumns, t]);
    const SORT_FIELDS = useMemo(() => getSortFields(t), [t]);

    // Create column label map for hidden columns menu
    const columnLabels = useMemo(() => {
        const labels: Record<string, string> = {};
        columns.forEach(col => {
            labels[String(col.id)] = col.label;
        });
        return labels;
    }, [columns]);

    // Check if a task is pending for the current user OR is a preview task
    const isPendingTask = useCallback((task: Task) => {
        // Check if it's the AI preview task
        if (task.id === 'preview-task-temp') return true;

        // Check if it's a pending assignment
        if (!currentUserId) return false;
        return task.owners.some(
            owner => owner.id === currentUserId && owner.status === 'pending'
        );
    }, [currentUserId]);

    // Get owner statuses for a task (for PeopleCell display)
    const getOwnerStatuses = useCallback((task: Task): Record<string, AssignmentStatus> => {
        const statuses: Record<string, AssignmentStatus> = {};
        task.owners.forEach(owner => {
            if (owner.status) {
                statuses[owner.id] = owner.status;
            }
        });
        return statuses;
    }, []);

    // Handler for adding custom columns
    const handleAddCustomColumn = useCallback(async (type: 'subtask' | 'document') => {
        // Prevent duplicates
        const existingColumn = customColumns?.find(col => col.type === type);
        if (existingColumn) {
            console.warn(`Column of type ${type} already exists`);
            return;
        }

        const label = type === 'subtask' ? 'Subtasks' : 'Documents';
        await addCustomColumn(type, label);
    }, [customColumns, addCustomColumn]);

    const handleSortChange = (sort: SortConfig | null) => {
        onSortChange?.(sort);
        setShowSortMenu(false);
    };

    const toggleSortDirection = () => {
        if (sortConfig) {
            onSortChange?.({
                ...sortConfig,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        }
    };

    const clearSort = () => {
        onSortChange?.(null);
    };

    return (
        <div className="w-full h-full bg-white flex flex-col font-sans">
            {/* Task List Toolbar */}
            {(onSearchChange || onFilterChange || onSortChange) && (
                <div className="px-3 h-12 border-b border-[#E9E9E7] flex items-center gap-1">
                    {/* Inline Expanding Search */}
                    {onSearchChange && (
                        <div className="flex items-center transition-all duration-200 ease-in-out" style={{ width: isSearchExpanded ? '160px' : 'auto' }}>
                            <button
                                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex-shrink-0 ${searchQuery ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                            >
                                <Search size={16} />
                            </button>
                            {isSearchExpanded && (
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder={t('common.search_placeholder')}
                                    className="flex-1 ml-2 px-0 py-1 text-sm text-[#37352F] placeholder-gray-400 border-0 border-b border-gray-300 outline-none focus:border-orange-500 bg-transparent min-w-0"
                                    autoFocus
                                />
                            )}
                        </div>
                    )}

                    {/* Advanced Filter */}
                    {onFilterChange && (
                        <Popover open={showFilterMenu} onOpenChange={setShowFilterMenu}>
                            <PopoverTrigger asChild>
                                <button
                                    className={`p-1 hover:bg-[#EFEFED] rounded transition-colors ${filterRules.length > 0 ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                                    title={t('common.filter_tooltip')}
                                >
                                    <Filter size={16} />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" sideOffset={4} className="p-0 w-auto bg-transparent border-none shadow-none">
                                <AdvancedFilterMenu
                                    rules={filterRules}
                                    onUpdateRules={(rules) => {
                                        onFilterChange?.(rules);
                                    }}
                                    onResetAll={() => {
                                        onFilterChange?.([]);
                                    }}
                                    onClose={() => setShowFilterMenu(false)}
                                />
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* Sort Control */}
                    {onSortChange && (
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex items-center gap-0.5 ${sortConfig ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                                title={t('common.sort_tooltip')}
                            >
                                <ArrowUpDown size={16} />
                            </button>

                            {/* Sort Menu */}
                            {showSortMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[180px]">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">{t('common.sort_by')}</div>
                                        {SORT_FIELDS.map(field => (
                                            <button
                                                key={field.id}
                                                className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-gray-50 transition-colors ${sortConfig?.columnId === field.id ? 'text-accent bg-orange-50' : 'text-[#37352F]'}`}
                                                onClick={() => handleSortChange({ columnId: field.id, direction: 'asc' })}
                                            >
                                                {field.label}
                                                {sortConfig?.columnId === field.id && (
                                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                                )}
                                            </button>
                                        ))}
                                        {sortConfig && (
                                            <>
                                                <div className="border-t border-gray-100 my-1" />
                                                <button
                                                    className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                    onClick={clearSort}
                                                >
                                                    <X size={14} />
                                                    {t('common.clear_sort')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Active Sort Indicator */}
                    {sortConfig && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded text-xs text-accent border border-orange-200">
                            <span className="font-medium">
                                {SORT_FIELDS.find(f => f.id === sortConfig.columnId)?.label}
                            </span>
                            <button
                                onClick={toggleSortDirection}
                                className="hover:bg-orange-100 rounded p-0.5"
                            >
                                {sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            </button>
                            <button
                                onClick={clearSort}
                                className="hover:bg-orange-100 rounded p-0.5"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                </div>
            )}

            <div className="flex-1 overflow-auto pt-2 pl-1 pr-2">
                <div ref={daySectionsViewportRef} className="h-full min-h-0 flex flex-col">
                    <div
                        className="relative w-full"
                        style={{ height: isExpanded ? '100%' : `${collapsedViewportHeight}px` }}
                    >
                        <div
                            ref={daySectionsScrollRef}
                            className="h-full pr-1 overflow-y-auto"
                            style={{ paddingTop: collapsedTopFadePx }}
                        >
                            <div
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                    const section = daySections[virtualRow.index];
                                    return (
                                        <div
                                            key={section.dateKey}
                                            data-index={virtualRow.index}
                                            ref={rowVirtualizer.measureElement}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <section
                                                className="pt-1 pb-2"
                                                onFocus={() => {
                                                    if (!isExpanded || !onFocusDayFromTaskView) return;
                                                    if (section.dateKey === selectedDateKey) return;
                                                    if (lastFocusedDayKeyRef.current === section.dateKey) return;

                                                    lastFocusedDayKeyRef.current = section.dateKey;
                                                    // Defer so the browser commits focus + cursor placement before the
                                                    // calendar update triggers a React re-render.
                                                    requestAnimationFrame(() => {
                                                        onFocusDayFromTaskView(section.date);
                                                    });
                                                }}
                                            >
                                                <div className="px-2 pb-0 text-[11px] font-semibold text-[#787774]">
                                                    {section.title}
                                                </div>
                                                <EditableTable<TaskWithExtras>
                                                    data={section.tasks}
                                                    columns={columns}
                                                    onCellChange={handleCellChange}
                                                    onAddRow={() => onAddTask({ scheduledDate: section.dateKey })}
                                                    onRowClick={handleRowClick}
                                                    onOpenRow={(rowId) => {
                                                        const task = tasks.find(t => t.id === rowId);
                                                        if (task) onTaskClick(task);
                                                    }}
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                    onDeleteRow={onDeleteTask}
                                                    onDuplicateRow={onDuplicateTask}
                                                    sorting={sortConfig}
                                                    onSortChange={onSortChange}
                                                    hiddenColumns={hiddenColumns}
                                                    onHideColumn={onHideColumn}
                                                    isPendingRow={isPendingTask}
                                                    onAcceptRow={onAcceptAssignment}
                                                    onRejectRow={onRejectAssignment}
                                                    getOwnerStatuses={getOwnerStatuses}
                                                    customColumns={customColumns}
                                                    onAddCustomColumn={handleAddCustomColumn}
                                                    onRemoveCustomColumn={removeCustomColumn}
                                                    onCreateSubtask={onCreateSubtask}
                                                    isAssigned={isAssigned}
                                                    onAddSubtask={onAddSubtask
                                                        ? (parentId) => handleAddSubtask(parentId, section.dateKey)
                                                        : undefined
                                                    }
                                                    onToggleSubtasks={toggleSubtasks}
                                                    expandedSubtaskParentIds={expandedParentIds}
                                                    subtaskCountMap={subtaskCountMap}
                                                />
                                            </section>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {!isExpanded && (
                            <>
                                <div
                                    className="pointer-events-none absolute top-0 left-0 right-0 bg-gradient-to-b from-white via-white to-transparent"
                                    style={{ height: `${collapsedTopFadePx}px` }}
                                />
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent flex items-start justify-center"
                                    style={{ height: `${collapsedBottomFadePx}px`, paddingTop: '28px' }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleToggleExpand(true)}
                                        className="flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352F] transition-colors"
                                    >
                                        <span>{t('common.expand')}</span>
                                        <ChevronDown size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                        {isExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent flex items-end justify-center pb-2">
                                <button
                                    type="button"
                                    onClick={() => handleToggleExpand(false)}
                                    className="flex items-center gap-1 text-xs text-[#787774] hover:text-[#37352F] transition-colors"
                                >
                                    <span>{t('common.collapse')}</span>
                                    <ChevronUp size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
