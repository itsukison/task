'use client';

import React, { useState } from 'react';
import { Layout, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import { format, addWeeks, subWeeks, addDays } from 'date-fns';
import ResizableSplitView from './resizable-split-view';
import TaskList from './task-list';
import Calendar from './calendar';
import { Input } from './ui/primitives';
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

interface CalendarBlock {
    id: string;
    taskId: string;
    startTime: string;
    endTime: string;
}

interface WorkspaceViewProps {
    tasks: Task[];
    calendarBlocks: CalendarBlock[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
    onDeleteTask: (taskId: string) => void;
    draggingTask: Task | null;
    onDragStart: (taskId: string | null) => void;
}

export default function WorkspaceView({
    tasks,
    calendarBlocks,
    selectedDate,
    onSelectDate,
    onTaskClick,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    draggingTask,
    onDragStart
}: WorkspaceViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
    const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
    const [viewDate, setViewDate] = useState(new Date());

    const handlePrev = () => {
        if (calendarView === 'week') setViewDate(subWeeks(viewDate, 1));
        else setViewDate(addDays(viewDate, -1));
    };

    const handleNext = () => {
        if (calendarView === 'week') setViewDate(addWeeks(viewDate, 1));
        else setViewDate(addDays(viewDate, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        onSelectDate(today);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <div className="pt-12 px-8 pb-4 flex-shrink-0">
                <div className="flex items-start gap-3 mb-4">
                    <div className="mt-1 text-[#37352F]">
                        <Layout size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#37352F] mb-1 tracking-tight">Workspace</h1>
                        <p className="text-[#787774] text-sm">
                            Task list and calendar overview for <span className="font-semibold text-blue-600">{format(viewDate, 'MMMM yyyy')}</span>.
                        </p>
                    </div>
                </div>

                {/* Unified Toolbar */}
                <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-2">

                    {/* Left: List Controls */}
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFEFED] rounded text-sm font-medium text-[#37352F]">
                            <List size={16} />
                            {format(selectedDate, 'MMM d')} List
                        </div>
                        <div className="h-4 w-px bg-gray-200 mx-2"></div>
                        <div className="relative group">
                            <button className="p-1 hover:bg-[#EFEFED] rounded text-[#787774] transition-colors"><Search size={16} /></button>
                            <div className="absolute top-0 left-8 hidden group-hover:block hover:block z-20">
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-48 bg-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setFilterStatus(filterStatus === 'ALL' ? 'in_progress' : 'ALL')}
                            className={`p-1 hover:bg-[#EFEFED] rounded transition-colors ${filterStatus !== 'ALL' ? 'text-blue-600 bg-blue-50' : 'text-[#787774]'}`}
                            title="Filter by Status"
                        >
                            <Filter size={16} />
                        </button>
                    </div>

                    {/* Right: Calendar Controls & Global Actions */}
                    <div className="flex items-center gap-2">
                        <div className="flex bg-[#EFEFED] p-0.5 rounded-md mr-1">
                            <button
                                onClick={() => setCalendarView('week')}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all shadow-sm ${calendarView === 'week' ? 'bg-white text-[#37352F]' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setCalendarView('day')}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all shadow-sm ${calendarView === 'day' ? 'bg-white text-[#37352F]' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                            >
                                Day
                            </button>
                        </div>

                        <div className="flex items-center bg-white border border-[#E9E9E7] rounded-md shadow-sm">
                            <button onClick={handlePrev} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-r border-[#E9E9E7]"><ChevronLeft size={14} /></button>
                            <button onClick={handleToday} className="px-2 py-1 text-xs font-medium hover:bg-[#EFEFED] text-[#37352F]">Today</button>
                            <button onClick={handleNext} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-l border-[#E9E9E7]"><ChevronRight size={14} /></button>
                        </div>

                        <div className="h-4 w-px bg-gray-200 mx-1"></div>

                        <button
                            onClick={onAddTask}
                            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-sm font-medium transition-colors"
                        >
                            <Plus size={14} /> New
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area with Split View */}
            <div className="flex-1 overflow-hidden relative">
                <ResizableSplitView
                    left={
                        <TaskList
                            tasks={tasks}
                            selectedDate={selectedDate}
                            searchQuery={searchQuery}
                            filterStatus={filterStatus}
                            onTaskClick={onTaskClick}
                            onUpdateTask={onUpdateTask}
                            onAddTask={onAddTask}
                            onDragStart={onDragStart}
                        />
                    }
                    right={
                        <Calendar
                            tasks={tasks}
                            calendarBlocks={calendarBlocks}
                            selectedDate={selectedDate}
                            onSelectDate={onSelectDate}
                            onTaskUpdate={onUpdateTask}
                            onTaskClick={onTaskClick}
                            draggingTask={draggingTask}
                            onDragStart={onDragStart}
                            onDeleteTask={onDeleteTask}
                            view={calendarView}
                            viewDate={viewDate}
                        />
                    }
                />
            </div>
        </div>
    );
}
