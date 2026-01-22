'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { EditableTable, TableColumn, ColumnOption, SortConfig } from './editable-table';
import { Task, TaskStatus, TaskListProps, PeopleOption, AssignmentStatus } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { Input } from './ui/primitives';

const SORT_FIELDS = [
    { id: 'title', label: 'Task Name' },
    { id: 'status', label: 'Status' },
    { id: 'expectedTime', label: 'Est. Time' },
    { id: 'owner', label: 'Owner' },
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

// Define column configuration for Task data
function getTaskColumns(orgMembers: PeopleOption[]): TableColumn<Task>[] {
    return [
        {
            id: 'title',
            label: 'Task Name',
            dataType: 'text',
            width: 200,
            minWidth: 150,
        },
        {
            id: 'status',
            label: 'Status',
            dataType: 'select',
            width: 140,
            minWidth: 100,
            options: STATUS_OPTIONS,
        },
        {
            id: 'expectedTime',
            label: 'Est Time',
            dataType: 'number',
            width: 120,
            minWidth: 100,
        },
        {
            id: 'actualTime',
            label: 'Act Time',
            dataType: 'timerNumber',
            width: 120,
            minWidth: 100,
        },
        {
            id: 'ownerIds',  // Array of user IDs
            label: 'Owners',
            dataType: 'people',
            width: 200,
            minWidth: 150,
            peopleOptions: orgMembers,
        },
    ];
}

export default function TaskList({
    tasks,
    selectedDate,
    searchQuery,
    filterStatus,
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
    calendarBlocks = [],
    viewMode,
    viewDate,
    currentUserId,
    onAcceptAssignment,
    onRejectAssignment,
}: TaskListProps) {
    const [showSortMenu, setShowSortMenu] = useState(false);
    // Fetch organization members for people picker
    const { members: orgMembers } = useOrganizationMembers();

    // Use refs to stabilize handleCellChange and prevent column regeneration/cell remounting
    const tasksRef = useRef(tasks);
    tasksRef.current = tasks;
    const onUpdateTaskRef = useRef(onUpdateTask);
    onUpdateTaskRef.current = onUpdateTask;

    // Transform tasks to include virtual ownerIds field
    type TaskWithOwnerIds = Task & { ownerIds: string[] };

    // Filter tasks based on search, status, and date
    // Task list shows tasks matching the selected date
    const filteredTasks = useMemo((): TaskWithOwnerIds[] => {
        let result = [...tasks];

        // Filter by selected date - show tasks matching scheduled_date
        if (selectedDate) {
            const selectedDateISO = formatDateToLocalISO(selectedDate);
            result = result.filter(t => t.scheduledDate === selectedDateISO);
        }

        // Filter by status
        if (filterStatus !== 'ALL') {
            result = result.filter(t => t.status === filterStatus);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.owners.some(o => o.display_name.toLowerCase().includes(query))
            );
        }

        // Add virtual ownerIds field for PeopleCell
        return result.map(t => ({
            ...t,
            ownerIds: t.owners.map(o => o.id),
        }));
    }, [tasks, filterStatus, searchQuery, selectedDate]);

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
    const handleRowClick = (row: Task) => {
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

    const columns = useMemo(() => getTaskColumns(orgMembers), [orgMembers]);

    // Check if a task is pending for the current user
    const isPendingTask = useCallback((task: Task) => {
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
                    {/* Search */}
                    {onSearchChange && (
                        <div className="relative group">
                            <button className="p-1 hover:bg-[#EFEFED] rounded text-[#787774] transition-colors">
                                <Search size={16} />
                            </button>
                            <div className="absolute top-0 left-8 hidden group-hover:block hover:block z-20">
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-48 bg-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Filter */}
                    {onFilterChange && (
                        <button
                            onClick={() => onFilterChange(filterStatus === 'ALL' ? 'in_progress' : 'ALL')}
                            className={`p-1 hover:bg-[#EFEFED] rounded transition-colors ${filterStatus !== 'ALL' ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                            title="Filter by Status"
                        >
                            <Filter size={16} />
                        </button>
                    )}

                    {/* Sort Control */}
                    {onSortChange && (
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className={`p-1 hover:bg-[#EFEFED] rounded transition-colors flex items-center gap-0.5 ${sortConfig ? 'text-accent bg-orange-50' : 'text-[#787774]'}`}
                                title="Sort"
                            >
                                <ArrowUpDown size={16} />
                            </button>

                            {/* Sort Menu */}
                            {showSortMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[180px]">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">Sort by</div>
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
                                                    Clear sort
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

                    {/* Hidden Columns Indicator */}
                    {hiddenColumns.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-[#787774]">
                            <span>{hiddenColumns.length} hidden</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-auto pt-2 pl-1 pr-2">
                <EditableTable<Task>
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
                />
            </div>
        </div>
    );
}
