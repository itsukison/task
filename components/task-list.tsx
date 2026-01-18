'use client';

import React, { useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { EditableTable, TableColumn, ColumnOption, SortConfig } from './editable-table';
import { Task, TaskStatus, TaskListProps, PeopleOption } from '@/lib/types';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';

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
            width: 250,
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

export interface ExtendedTaskListProps extends TaskListProps {
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
    hiddenColumns?: string[];
    onHideColumn?: (columnId: string) => void;
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
    sortConfig,
    onSortChange,
    hiddenColumns = [],
    onHideColumn,
    calendarBlocks = [],
    viewMode,
    viewDate,
}: ExtendedTaskListProps) {
    // Fetch organization members for people picker
    const { members: orgMembers } = useOrganizationMembers();

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
    const handleCellChange = (rowId: string, columnId: string, value: unknown) => {
        const task = tasks.find(t => t.id === rowId);
        if (!task) return;

        // Handle ownerIds changes (people picker)
        if (columnId === 'ownerIds') {
            const ownerIds = value as string[];
            onUpdateTask({
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

        onUpdateTask(updatedTask);
    };

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

    return (
        <div className="w-full h-full bg-white flex flex-col font-sans">
            <div className="flex-1 overflow-auto pt-2 px-2">
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
                />
            </div>
        </div>
    );
}
