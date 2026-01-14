'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Circle, Clock, Hash, User } from 'lucide-react';
import { Input, Select } from './ui/primitives';
import { format } from 'date-fns';
import { Database } from '@/lib/database.types';

type TaskStatus = Database['public']['Enums']['task_status'];

interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    expectedTime: number;
    actualTime: number;
    owner: string;
}

interface TaskListProps {
    tasks: Task[];
    selectedDate: Date;
    searchQuery: string;
    filterStatus: TaskStatus | 'ALL';
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
    onDragStart: (taskId: string | null) => void;
}

type SortField = 'title' | 'status' | 'expectedTime' | 'progress' | 'owner';
type SortDirection = 'asc' | 'desc';

const MIN_COL_WIDTH = 50;

export default function TaskList({
    tasks,
    selectedDate,
    searchQuery,
    filterStatus,
    onTaskClick,
    onUpdateTask,
    onAddTask,
    onDragStart
}: TaskListProps) {
    const [sortField, setSortField] = useState<SortField>('status');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [colWidths, setColWidths] = useState<{
        drag: number;
        title: number | null;
        status: number;
        expectedTime: number;
        progress: number;
        owner: number;
        [key: string]: number | null;
    }>({
        drag: 32,
        title: null,
        status: 130,
        expectedTime: 110,
        progress: 140,
        owner: 140
    });

    const [isResizing, setIsResizing] = useState<string | null>(null);
    const resizeRef = useRef<{ startX: number, startWidth: number, col: string } | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !resizeRef.current) return;
            const delta = e.clientX - resizeRef.current.startX;
            const newWidth = Math.max(MIN_COL_WIDTH, resizeRef.current.startWidth + delta);
            setColWidths(prev => ({
                ...prev,
                [resizeRef.current!.col]: newWidth
            }));
        };

        const handleMouseUp = () => {
            setIsResizing(null);
            resizeRef.current = null;
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    const startResize = (e: React.MouseEvent, col: string) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(col);
        let currentWidth = colWidths[col];
        if (col === 'title' && currentWidth === null) {
            const th = e.currentTarget.parentElement as HTMLElement;
            currentWidth = th.offsetWidth;
        }
        resizeRef.current = { startX: e.clientX, startWidth: currentWidth || 100, col };
    };

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        onDragStart(task.id);
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.setData('duration', task.expectedTime.toString());
        e.dataTransfer.effectAllowed = 'copyMove';

        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragEnd = () => {
        onDragStart(null);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'planned': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'overrun': return 'bg-red-50 text-red-700 border-red-200';
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getProgress = (task: Task) => {
        if (task.status === 'completed') return 100;
        if (task.expectedTime === 0) return 0;
        const p = (task.actualTime / task.expectedTime) * 100;
        return Math.min(p, 100);
    };

    const filteredAndSortedTasks = useMemo(() => {
        let result = [...tasks];

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Note: Filtering by date will be done via calendar_blocks query in production
        // For now, showing all tasks

        if (filterStatus !== 'ALL') {
            result = result.filter(t => t.status === filterStatus);
        }
        if (searchQuery) {
            result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        result.sort((a, b) => {
            let valA: string | number;
            let valB: string | number;

            if (sortField === 'progress') {
                valA = getProgress(a);
                valB = getProgress(b);
            } else {
                valA = a[sortField];
                valB = b[sortField];
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [tasks, sortField, sortDirection, filterStatus, searchQuery, selectedDate]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const Resizer = ({ col }: { col: string }) => (
        <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 flex justify-center group/resizer"
            onMouseDown={(e) => startResize(e, col)}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-[1px] h-full bg-transparent group-hover/resizer:bg-blue-400 transition-colors"></div>
        </div>
    );

    const statusOptions: TaskStatus[] = ['planned', 'in_progress', 'overrun', 'completed'];

    return (
        <div className="w-full h-full bg-white flex flex-col font-sans">

            {/* Table Section */}
            <div className="flex-1 overflow-auto pb-12 pt-2">
                <div className="min-w-full inline-block align-middle px-6">
                    <table className="w-full text-left text-sm border-collapse table-fixed">
                        <thead>
                            <tr className="border-b border-[#E9E9E7]">
                                <th style={{ width: colWidths.drag }} className="font-normal text-[#9B9A97] py-2 px-2 pl-1 relative border-r border-transparent">
                                </th>
                                <th
                                    style={colWidths.title ? { width: colWidths.title } : {}}
                                    className="relative font-normal text-[#9B9A97] py-2 px-3 text-xs uppercase tracking-wide border-r border-[#E9E9E7]/50 hover:bg-gray-50 group"
                                    onClick={() => handleSort('title')}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="text-base">Aa</span> Task Name <SortIcon field="title" />
                                    </div>
                                    <Resizer col="title" />
                                </th>
                                <th
                                    style={{ width: colWidths.status }}
                                    className="relative font-normal text-[#9B9A97] py-2 px-3 text-xs uppercase tracking-wide border-r border-[#E9E9E7]/50 hover:bg-gray-50"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Circle size={14} /> Status <SortIcon field="status" />
                                    </div>
                                    <Resizer col="status" />
                                </th>
                                <th
                                    style={{ width: colWidths.expectedTime }}
                                    className="relative font-normal text-[#9B9A97] py-2 px-3 text-xs uppercase tracking-wide border-r border-[#E9E9E7]/50 hover:bg-gray-50"
                                    onClick={() => handleSort('expectedTime')}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Clock size={14} /> Est. <SortIcon field="expectedTime" />
                                    </div>
                                    <Resizer col="expectedTime" />
                                </th>
                                <th
                                    style={{ width: colWidths.progress }}
                                    className="relative font-normal text-[#9B9A97] py-2 px-3 text-xs uppercase tracking-wide border-r border-[#E9E9E7]/50 hover:bg-gray-50"
                                    onClick={() => handleSort('progress')}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <Hash size={14} /> Progress <SortIcon field="progress" />
                                    </div>
                                    <Resizer col="progress" />
                                </th>
                                <th
                                    style={{ width: colWidths.owner }}
                                    className="relative font-normal text-[#9B9A97] py-2 px-3 text-xs uppercase tracking-wide hover:bg-gray-50"
                                    onClick={() => handleSort('owner')}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        <User size={14} /> Owner <SortIcon field="owner" />
                                    </div>
                                    <Resizer col="owner" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        No tasks found.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, task)}
                                        onDragEnd={handleDragEnd}
                                        className="group border-b border-[#E9E9E7] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                                    >
                                        {/* Drag Handle */}
                                        <td
                                            className="py-2 px-2 pl-1 relative overflow-hidden"
                                            onClick={() => onTaskClick(task)}
                                        >
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="p-0.5 hover:bg-[#E9E9E7] rounded cursor-grab">
                                                    <GripVertical size={12} className="text-[#9B9A97]" />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Task Name */}
                                        <td
                                            className="py-2 px-3 border-r border-[#E9E9E7]/50 group-hover:border-[#E9E9E7] overflow-hidden"
                                            onClick={() => onTaskClick(task)}
                                        >
                                            <div className="font-medium text-[#37352F] truncate" title={task.title || "Untitled"}>
                                                {task.title || <span className="text-gray-300 italic">Untitled</span>}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td
                                            className="py-1 px-1 border-r border-[#E9E9E7]/50 group-hover:border-[#E9E9E7] overflow-visible"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Select
                                                value={task.status}
                                                onChange={(val) => onUpdateTask({ ...task, status: val as TaskStatus })}
                                                options={statusOptions}
                                                renderOption={(val) => (
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(val as TaskStatus)}`}>
                                                        {val.replace('_', ' ')}
                                                    </span>
                                                )}
                                            />
                                        </td>

                                        {/* Est Time */}
                                        <td
                                            className="py-1 px-1 text-[#37352F] border-r border-[#E9E9E7]/50 group-hover:border-[#E9E9E7] overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Input
                                                type="number"
                                                value={task.expectedTime}
                                                onChange={(e) => onUpdateTask({ ...task, expectedTime: parseInt(e.target.value) || 0 })}
                                                className="h-8 font-mono text-xs"
                                            />
                                        </td>

                                        {/* Progress */}
                                        <td
                                            className="py-2 px-3 border-r border-[#E9E9E7]/50 group-hover:border-[#E9E9E7] align-middle overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-2 cursor-default">
                                                <div className="flex-1 h-1.5 bg-[#E9E9E7] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${getProgress(task)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-[#787774] w-8 text-right">{Math.round(getProgress(task))}%</span>
                                            </div>
                                        </td>

                                        {/* Owner */}
                                        <td
                                            className="py-1 px-1 border-r border-transparent group-hover:border-[#E9E9E7] overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-1 h-full">
                                                <Input
                                                    type="text"
                                                    value={task.owner}
                                                    onChange={(e) => onUpdateTask({ ...task, owner: e.target.value })}
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
