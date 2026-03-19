'use client';

import React, { useState, useCallback, useRef } from 'react';
import { addWeeks, subWeeks, format } from 'date-fns';
import ResizableSplitView from './resizable-split-view';
import TaskList from './task-list';
import Calendar from './calendar';
import { TaskStatus, WorkspaceViewProps } from '@/lib/types';
import { FilterRule } from '@/lib/utils/filterRules';
import { SortConfig } from './editable-table';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { FIXED_COLUMN_WIDTH } from './calendar/constants';

export default function WorkspaceView({
    tasks,
    calendarBlocks,
    selectedDate,
    onSelectDate,
    viewDate,
    onViewDateChange,
    startHour,
    endHour,
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
    previewTask,
    previewBlock,
    optimisticBlock,
    onCreateSubtask,
    onAddSubtask,
    selectedBlockIds,
    onSelectBlocks,
    onUpdateMultipleBlocks,
    tableVariant = 'default',
}: WorkspaceViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
    // Track scroll alignment for "Center Today" vs "Left Next/Prev"
    const [scrollAlignment, setScrollAlignment] = useState<'center' | 'left'>('center');

    // Sort state
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [showSortMenu, setShowSortMenu] = useState(false);

    // Column visibility state
    const [hiddenColumns, setHiddenColumns] = useState<string[]>(['status']);
    const [dayColumnWidth, setDayColumnWidth] = useState(FIXED_COLUMN_WIDTH);
    const [isTaskPaneCollapsed, setIsTaskPaneCollapsed] = useState(false);
    const [occludedRightPx, setOccludedRightPx] = useState(0);
    const [blockOverTaskList, setBlockOverTaskList] = useState(false);
    const calendarViewportWidthRef = useRef(0);

    const handlePrev = useCallback(() => {
        setScrollAlignment('left');
        onViewDateChange(subWeeks(viewDate, 1));
    }, [viewDate, onViewDateChange]);

    const handleNext = useCallback(() => {
        setScrollAlignment('left');
        onViewDateChange(addWeeks(viewDate, 1));
    }, [viewDate, onViewDateChange]);

    const handleToday = useCallback(() => {
        setScrollAlignment('center');
        const today = new Date();
        onViewDateChange(today);
        onSelectDate(today);
    }, [onSelectDate, onViewDateChange]);

    const handleFocusDayFromTaskView = useCallback((date: Date) => {
        setScrollAlignment('center');
        onViewDateChange(date);
        onSelectDate(date);
    }, [onViewDateChange, onSelectDate]);

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

    const handleDropCalendarBlock = useCallback((blockId: string, dateKey: string) => {
        const block = calendarBlocks.find(b => b.id === blockId);
        onDeleteBlock?.(blockId);
        if (block) {
            const task = tasks.find(t => t.id === block.taskId);
            if (task) onUpdateTask({ ...task, scheduledDate: dateKey });
        }
        onDragStart(null);
    }, [calendarBlocks, tasks, onDeleteBlock, onUpdateTask, onDragStart]);

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
        return {
            totalTasks,
            tasksLeft,
            estimatedHours: Math.round((estimatedMinutes / 60) * 10) / 10
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
                    onLayoutChange={({ collapsedSide, overlayWidthPx }) => {
                        const collapsed = collapsedSide === 'right';
                        setIsTaskPaneCollapsed(collapsed);
                        setOccludedRightPx(overlayWidthPx);
                        if (collapsed && calendarViewportWidthRef.current > 0) {
                            const calibrated = Math.floor(calendarViewportWidthRef.current / 7);
                            setDayColumnWidth(Math.max(120, calibrated));
                        }
                    }}
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
                            view="week"
                            viewDate={viewDate}
                            startHour={startHour}
                            endHour={endHour}
                            scrollAlignment={scrollAlignment}
                            onViewDateChange={onViewDateChange}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onToday={handleToday}
                            onCreateBlock={onCreateBlock}
                            onUpdateBlock={onUpdateBlock}
                            onDeleteBlock={onDeleteBlock}
                            selectedMemberIds={selectedMemberIds}
                            onSelectedMembersChange={onSelectedMembersChange}
                            multiMemberBlocks={multiMemberBlocks}
                            previewBlock={previewBlock}
                            optimisticBlock={optimisticBlock}
                            onAddTask={onAddTask}
                            selectedBlockIds={selectedBlockIds}
                            onSelectBlocks={onSelectBlocks}
                            onUpdateMultipleBlocks={onUpdateMultipleBlocks}
                            blockOverTaskList={blockOverTaskList}
                            dayColumnWidth={dayColumnWidth}
                            occludedRightPx={occludedRightPx}
                            onDayViewportWidthChange={(width) => {
                                if (width <= 0) return;
                                calendarViewportWidthRef.current = width;
                                if (!isTaskPaneCollapsed) return;
                                const calibrated = Math.floor(width / 7);
                                setDayColumnWidth(Math.max(120, calibrated));
                            }}
                        />
                    }
                    rightMinWidth={520}
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
                            viewMode="week"
                            viewDate={viewDate}
                            currentUserId={currentUserId}
                            onAcceptAssignment={onAcceptAssignment}
                            onRejectAssignment={onRejectAssignment}
                            previewTask={previewTask}
                            onCreateSubtask={onCreateSubtask}
                            onAddSubtask={onAddSubtask}
                            onFocusDayFromTaskView={handleFocusDayFromTaskView}
                            onDropCalendarBlock={handleDropCalendarBlock}
                            draggingTask={draggingTask}
                            onCalendarBlockDragActiveChange={setBlockOverTaskList}
                            tableVariant={tableVariant}
                        />
                    }
                />
            </div>
        </div>
    );
}
