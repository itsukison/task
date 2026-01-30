'use client';

import React, { useState, useCallback } from 'react';
import { addWeeks, subWeeks, addDays, format } from 'date-fns';
import ResizableSplitView from './resizable-split-view';
import TaskList from './task-list';
import Calendar from './calendar';
import { TaskStatus, WorkspaceViewProps } from '@/lib/types';
import { FilterRule } from '@/lib/utils/filterRules';
import { SortConfig } from './editable-table';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';

export default function WorkspaceView({
    tasks,
    calendarBlocks,
    selectedDate,
    onSelectDate,
    viewDate,
    onViewDateChange,
    showWeekends,
    onTaskClick,
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    draggingTask,
    onDragStart,
    onCreateBlock,
    onUpdateBlock,
    onDeleteBlock,
    selectedMemberIds,
    onSelectedMembersChange,
    multiMemberBlocks,
    currentUserId,
    onAcceptAssignment,
    onRejectAssignment,
}: WorkspaceViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    const [calendarView, setCalendarView] = useState<'week' | 'day'>('week');

    // Sort state
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Column visibility state
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

    const handlePrev = useCallback(() => {
        if (calendarView === 'week') onViewDateChange(subWeeks(viewDate, 1));
        else onViewDateChange(addDays(viewDate, -1));
    }, [calendarView, viewDate, onViewDateChange]);

    const handleNext = useCallback(() => {
        if (calendarView === 'week') onViewDateChange(addWeeks(viewDate, 1));
        else onViewDateChange(addDays(viewDate, 1));
    }, [calendarView, viewDate, onViewDateChange]);

    const handleToday = useCallback(() => {
        const today = new Date();
        onViewDateChange(today);
        onSelectDate(today);
    }, [onSelectDate, onViewDateChange]);

    const handleSortChange = useCallback((sort: SortConfig | null) => {
        setSortConfig(sort);
        setShowSortMenu(false);
    }, []);

    const handleHideColumn = useCallback((columnId: string) => {
        setHiddenColumns(prev => [...prev, columnId]);
    }, []);

    const handleShowColumn = useCallback((columnId: string) => {
        setHiddenColumns(prev => prev.filter(c => c !== columnId));
    }, []);

    const toggleSortDirection = useCallback(() => {
        if (sortConfig) {
            setSortConfig({
                ...sortConfig,
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
            });
        }
    }, [sortConfig]);

    const clearSort = useCallback(() => {
        setSortConfig(null);
    }, []);

    // Calculate stats for the current view
    const stats = React.useMemo(() => {
        // Filter tasks that belong to the current view (week or day)
        // For now, let's align with the "Left" logic: tasks scheduled for the view date range
        // Since the header says "for [Month] [Year]", but the "Left" usually implies "for the selected period"

        // Let's filter tasks based on the selectedDate (specific day) to match the "Daily Planner" vibe
        // or should it be for the whole view? The prompt says "Fetch info from tasks that day"
        const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

        const dailyTasks = tasks.filter(t => t.scheduledDate === targetDateStr);

        const totalTasks = dailyTasks.length;

        // Left: "in progress" "planned" or "overrun"
        const tasksLeft = dailyTasks.filter(t =>
            ['planned', 'in_progress', 'overrun'].includes(t.status)
        ).length;

        const estimatedMinutes = dailyTasks.reduce((sum, t) => sum + t.expectedTime, 0);
        const actualMinutes = dailyTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);

        return {
            totalTasks,
            tasksLeft,
            estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10,
            actualHours: Math.round((actualMinutes / 60) * 10) / 10
        };
    }, [tasks, selectedDate]);

    return (
        <div className="flex flex-col h-full w-full bg-white">
            {/* Header */}
            <WorkspaceHeader
                viewDate={viewDate}
                onAddTask={onAddTask}
                stats={stats}
            />

            {/* Content Area with Split View */}
            <div className="flex-1 overflow-hidden relative">
                <ResizableSplitView
                    left={
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
                            showWeekends={showWeekends}
                            onViewChange={setCalendarView}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onToday={handleToday}
                            onCreateBlock={onCreateBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDeleteBlock={onDeleteBlock}
                            selectedMemberIds={selectedMemberIds}
                            onSelectedMembersChange={onSelectedMembersChange}
                            multiMemberBlocks={multiMemberBlocks}
                        />
                    }
                    right={
                        <TaskList
                            tasks={tasks}
                            selectedDate={selectedDate}
                            searchQuery={searchQuery}
                            filterRules={filterRules}
                            onTaskClick={onTaskClick}
                            onUpdateTask={onUpdateTask}
                            onAddTask={onAddTask}
                            onDeleteTask={onDeleteTask}
                            onDragStart={onDragStart}
                            onSearchChange={setSearchQuery}
                            onFilterChange={setFilterRules}
                            sortConfig={sortConfig}
                            onSortChange={handleSortChange}
                            hiddenColumns={hiddenColumns}
                            onHideColumn={handleHideColumn}
                            onShowColumn={handleShowColumn}
                            calendarBlocks={calendarBlocks}
                            viewMode={calendarView}
                            viewDate={viewDate}
                            currentUserId={currentUserId}
                            onAcceptAssignment={onAcceptAssignment}
                            onRejectAssignment={onRejectAssignment}
                        />
                    }
                />
            </div>
        </div>
    );
}
