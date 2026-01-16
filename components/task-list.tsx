'use client';

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { EditableTable, TableColumn, ColumnOption, SortConfig } from './editable-table';
import { Task, TaskStatus, TaskListProps } from '@/lib/types';

// Status options with colors matching Notion-style badges
const STATUS_OPTIONS: ColumnOption[] = [
    { label: 'planned', backgroundColor: 'hsl(0, 0%, 93%)' },
    { label: 'in_progress', backgroundColor: 'hsl(35, 100%, 90%)' },
    { label: 'overrun', backgroundColor: 'hsl(0, 100%, 92%)' },
    { label: 'completed', backgroundColor: 'hsl(120, 60%, 90%)' },
];

// Define column configuration for Task data
function getTaskColumns(): TableColumn<Task>[] {
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
            label: 'Est. Time',
            dataType: 'number',
            width: 100,
            minWidth: 80,
        },
        {
            id: 'ownerDisplayName',  // Virtual field for display
            label: 'Owner',
            dataType: 'text',
            width: 150,
            minWidth: 100,
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
}: ExtendedTaskListProps) {

    // Transform tasks to include virtual ownerDisplayName field
    type TaskWithOwnerDisplay = Task & { ownerDisplayName: string };

    // Filter tasks based on search and status
    const filteredTasks = useMemo((): TaskWithOwnerDisplay[] => {
        let result = [...tasks];

        // Filter by status
        if (filterStatus !== 'ALL') {
            result = result.filter(t => t.status === filterStatus);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                (t.owner?.display_name?.toLowerCase().includes(query) ?? false)
            );
        }

        // Add virtual ownerDisplayName field for table display
        return result.map(t => ({
            ...t,
            ownerDisplayName: t.owner?.display_name ?? 'Unassigned',
        }));
    }, [tasks, filterStatus, searchQuery]);

    // Handle cell value changes
    const handleCellChange = (rowId: string, columnId: string, value: unknown) => {
        const task = tasks.find(t => t.id === rowId);
        if (!task) return;

        // Skip non-editable columns
        if (columnId === 'ownerDisplayName') return;

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

    const columns = useMemo(() => getTaskColumns(), []);

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
