'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { EditableTable, TableColumn, ColumnOption, SortConfig } from './editable-table';
import { Task, TaskStatus, TaskListProps, PeopleOption, AssignmentStatus } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useLanguage } from '@/lib/i18n';
import { HiddenColumnsMenu } from './task-list/HiddenColumnsMenu';
import { AdvancedFilterMenu } from './task-list/AdvancedFilterMenu';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { evaluateFilterRules } from '@/lib/utils/filterRules';
import { useUserPreferences } from '@/lib/hooks/use-user-preferences';

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
        {
            id: 'status',
            label: t('headers.status'),
            dataType: 'select',
            width: 140,
            minWidth: 100,
            options: STATUS_OPTIONS,
        },
        {
            id: 'time',
            label: t('headers.time'),
            dataType: 'combinedTime',
            width: 150,
            minWidth: 120,
        },
        {
            id: 'ownerIds',  // Array of user IDs
            label: t('headers.owner'),
            dataType: 'people',
            width: 200,
            minWidth: 150,
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
}: TaskListProps) {
    const { t } = useLanguage();
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showHiddenColumnsMenu, setShowHiddenColumnsMenu] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    // Fetch organization members for people picker
    const { members: orgMembers } = useOrganizationMembers();
    // Get custom columns from user preferences
    const { customColumns, addCustomColumn, removeCustomColumn } = useUserPreferences();

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

    // Filter tasks based on search, status, and date
    // Task list shows tasks matching the selected date
    const filteredTasks = useMemo((): TaskWithExtras[] => {
        let result = [...tasks] as TaskWithExtras[];

        // Filter by selected date
        if (selectedDate) {
            const selectedDateISO = formatDateToLocalISO(selectedDate);
            result = result.filter(t => t.scheduledDate === selectedDateISO);
        }

        // Filter by status rules
        if (filterRules && filterRules.length > 0) {
            result = result.filter(t => evaluateFilterRules(t, filterRules));
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.owners.some(o => o.display_name.toLowerCase().includes(query))
            );
        }

        // Enrich with startTime from calendarBlocks
        // We only do this efficiently if calendarBlocks are available
        const tasksWithTime = result.map(t => {
            const block = calendarBlocks.find(b => b.taskId === t.id);
            return {
                ...t,
                ownerIds: t.owners.map(o => o.id),
                startTime: block?.startTime
            };
        });

        // Apply default sorting if no external sort config is present
        if (!sortConfig) {
            tasksWithTime.sort((a, b) => {
                // 1. Assigned (has startTime) comes first
                if (a.startTime && !b.startTime) return -1;
                if (!a.startTime && b.startTime) return 1;

                // 2. If both assigned, sort by startTime asc
                if (a.startTime && b.startTime) {
                    return a.startTime.localeCompare(b.startTime);
                }

                // 3. If both unassigned, keep original order (or maybe creation date?)
                // Defaulting to creation date desc for unassigned could be nice, or just stable
                return 0;
            });
        }

        // Add preview task if it exists (at the top)
        if (previewTask) {
            const matchesDateFilter = !selectedDate ||
                previewTask.scheduledDate === formatDateToLocalISO(selectedDate);

            if (matchesDateFilter) {
                const previewWithExtras: TaskWithExtras = {
                    ...previewTask,
                    ownerIds: previewTask.owners.map(o => o.id),
                    startTime: undefined // Preview usually implies pending creation/scheduling? Or if it has time, we should check.
                    // Assuming preview doesn't have a block yet unless optimistically created.
                };
                return [previewWithExtras, ...tasksWithTime];
            }
        }

        return tasksWithTime;
    }, [tasks, filterRules, searchQuery, selectedDate, previewTask, sortConfig, calendarBlocks]);

    // Check if a task is assigned (has start time) for the separator
    const isAssigned = useCallback((task: TaskWithExtras) => {
        // We need to check against the enriched data really, but here we can just lookup in calendarBlocks again
        // Or if EditableTable passes the enriched row, checking `startTime` would work if we cast it.
        // But types say T is Task.
        // Let's do a lookup.
        return calendarBlocks.some(b => b.taskId === task.id);
    }, [calendarBlocks]);

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

                    {/* Hidden Columns Badge */}
                    {hiddenColumns.length > 0 && onShowColumn && (
                        <Popover open={showHiddenColumnsMenu} onOpenChange={setShowHiddenColumnsMenu}>
                            <PopoverTrigger asChild>
                                <button
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-[#787774] cursor-pointer transition-colors"
                                >
                                    <span>{hiddenColumns.length} hidden</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" sideOffset={4} className="p-0 w-auto bg-transparent border-none shadow-none">
                                <HiddenColumnsMenu
                                    hiddenColumns={hiddenColumns}
                                    columnLabels={columnLabels}
                                    onShowColumn={onShowColumn}
                                    onClose={() => setShowHiddenColumnsMenu(false)}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-auto pt-2 pl-1 pr-2">
                <EditableTable<TaskWithExtras>
                    data={filteredTasks}
                    columns={columns}
                    onCellChange={handleCellChange}
                    onAddRow={onAddTask}
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
                />
            </div>
        </div>
    );
}
