'use client';

import React, { useState } from 'react';
import { addWeeks, subWeeks, addDays } from 'date-fns';
import ResizableSplitView from './resizable-split-view';
import TaskList from './task-list';
import Calendar from './calendar';
import { TaskStatus, WorkspaceViewProps } from '@/lib/types';
import { SortConfig } from './editable-table';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';

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
    onDragStart,
    onCreateBlock,
    onUpdateBlock,
    onDeleteBlock,
}: WorkspaceViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
    const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');
    const [viewDate, setViewDate] = useState(new Date());

    // Sort state
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Column visibility state
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

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

    const handleSortChange = (sort: SortConfig | null) => {
        setSortConfig(sort);
        setShowSortMenu(false);
    };

    const handleHideColumn = (columnId: string) => {
        setHiddenColumns(prev => [...prev, columnId]);
    };

    const handleShowColumn = (columnId: string) => {
        setHiddenColumns(prev => prev.filter(c => c !== columnId));
    };

    const toggleSortDirection = () => {
        if (sortConfig) {
            setSortConfig({
                ...sortConfig,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        }
    };

    const clearSort = () => {
        setSortConfig(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <WorkspaceHeader
                viewDate={viewDate}
                selectedDate={selectedDate}
                calendarView={calendarView}
                searchQuery={searchQuery}
                filterStatus={filterStatus}
                sortConfig={sortConfig}
                showSortMenu={showSortMenu}
                hiddenColumns={hiddenColumns}
                onSearchChange={setSearchQuery}
                onFilterChange={setFilterStatus}
                onSortMenuToggle={() => setShowSortMenu(!showSortMenu)}
                onSortChange={handleSortChange}
                onToggleSortDirection={toggleSortDirection}
                onClearSort={clearSort}
                onClearHiddenColumns={() => setHiddenColumns([])}
                onCalendarViewChange={setCalendarView}
                onPrev={handlePrev}
                onNext={handleNext}
                onToday={handleToday}
                onAddTask={onAddTask}
            />

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
                            onDeleteTask={onDeleteTask}
                            onDragStart={onDragStart}
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                            hiddenColumns={hiddenColumns}
                            onHideColumn={handleHideColumn}
                            calendarBlocks={calendarBlocks}
                            viewMode={calendarView}
                            viewDate={viewDate}
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
                            onCreateBlock={onCreateBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDeleteBlock={onDeleteBlock}
                        />
                    }
                />
            </div>
        </div>
    );
}
