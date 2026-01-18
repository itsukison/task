'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Task, CalendarBlock, CalendarProps } from '@/lib/types';
import {
    CalendarHeader,
    CalendarTimeColumn,
    CalendarContextMenu,
    CalendarDayColumn
} from './calendar/';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const Calendar = React.memo(function Calendar({
    tasks,
    calendarBlocks,
    selectedDate,
    onSelectDate,
    onTaskUpdate,
    onTaskClick,
    draggingTask,
    onDragStart,
    onDeleteTask,
    view,
    viewDate,
    showWeekends = false,
    onCreateBlock,
    onUpdateBlock,
    onDeleteBlock,
}: CalendarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragPreview, setDragPreview] = useState<{ dateStr: string, minutes: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string, blockId?: string } | null>(null);
    // Track drag source: 'task-list' for new blocks, 'calendar' for moving existing
    const [dragSource, setDragSource] = useState<'task-list' | 'calendar' | null>(null);

    // Scroll to 8 AM on mount
    useEffect(() => {
        if (containerRef.current) {
            const rowHeight = 64;
            containerRef.current.scrollTop = 8 * rowHeight;
        }
    }, []);

    // Global click listener to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const displayedDays = view === 'week'
        ? Array.from({ length: showWeekends ? 7 : 5 }, (_, i) => addDays(currentWeekStart, i))
        : [viewDate];

    const getTaskStyle = useCallback((block: CalendarBlock, task: Task) => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        const hours = start.getHours();
        const minutes = start.getMinutes();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

        const top = (hours * 60 + minutes) * (64 / 60);
        const height = duration * (64 / 60);

        let bgColor = 'bg-white border-[#E9E9E7] shadow-sm text-[#37352F]';
        if (task.status === 'in_progress') bgColor = 'bg-orange-50 border-orange-100 text-orange-800';
        if (task.status === 'completed') bgColor = 'bg-[#F7F7F5] border-[#E9E9E7] text-[#9B9A97] line-through decoration-gray-400';
        if (task.status === 'overrun') bgColor = 'bg-red-50 border-red-100 text-red-800';

        return {
            top: `${top}px`,
            height: `${Math.max(height - 1, 24)}px`,
            position: 'absolute' as 'absolute',
            left: `2px`,
            right: `2px`,
            className: `rounded-md p-1.5 text-xs border ${bgColor} hover:brightness-95 transition-all cursor-pointer z-10 overflow-hidden flex flex-col justify-start select-none`
        };
    }, []);

    const formatMinutesToTime = useCallback((totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }, []);

    const handleDragOverDay = useCallback((e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (!draggingTask) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutes = Math.floor((offsetY / 64) * 60);
        const snapped = Math.max(0, Math.min(1440 - 15, Math.round(minutes / 15) * 15));

        setDragPreview({ dateStr, minutes: snapped });
    }, [draggingTask]);

    const handleDragStartInternal = useCallback((e: React.DragEvent, task: Task, blockId?: string) => {
        onDragStart(task.id);
        e.dataTransfer.setData('taskId', task.id);
        if (blockId) {
            e.dataTransfer.setData('blockId', blockId);
            setDragSource('calendar');
        } else {
            setDragSource('task-list');
        }
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    }, [onDragStart]);

    const handleDrop = useCallback((e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        setDragPreview(null);
        onDragStart(null);
        // Check both 'taskId' (from calendar drag) and 'rowId' (from table drag)
        const taskId = e.dataTransfer.getData('taskId') || e.dataTransfer.getData('rowId');
        const blockId = e.dataTransfer.getData('blockId');
        const source = dragSource;
        setDragSource(null);

        console.log('handleDrop:', { taskId, blockId, source, dragPreview: !!dragPreview, dateStr });

        if (taskId && dragPreview) {
            const task = tasks.find(t => t.id === taskId);

            if (task) {
                // Calculate start/end times
                const startDate = new Date(dateStr);
                startDate.setHours(0, 0, 0, 0);
                startDate.setMinutes(dragPreview.minutes);

                const endDate = new Date(startDate);
                endDate.setMinutes(startDate.getMinutes() + task.expectedTime);

                if (source === 'calendar' && blockId && onUpdateBlock) {
                    // Moving existing block
                    onUpdateBlock(blockId, startDate, endDate);
                } else if (onCreateBlock) {
                    // Creating new block from task list
                    onCreateBlock(taskId, startDate, endDate);
                }
            }
        }
    }, [dragPreview, dragSource, tasks, onUpdateBlock, onCreateBlock, onDragStart]);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden font-sans relative">

            <CalendarContextMenu
                contextMenu={contextMenu}
                onDeleteBlock={onDeleteBlock}
                onClose={() => setContextMenu(null)}
            />

            <CalendarHeader
                displayedDays={displayedDays}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
            />

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
                <div className="flex relative" style={{ height: HOURS.length * 64 }}>

                    <CalendarTimeColumn hours={HOURS} />

                    {/* Grid Columns */}
                    {displayedDays.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        return (
                            <CalendarDayColumn
                                key={dateStr}
                                date={date}
                                dateStr={dateStr}
                                selectedDate={selectedDate}
                                hours={HOURS}
                                tasks={tasks}
                                calendarBlocks={calendarBlocks}
                                draggingTask={draggingTask}
                                dragPreview={dragPreview}
                                getTaskStyle={getTaskStyle}
                                formatMinutesToTime={formatMinutesToTime}
                                onDragOverDay={handleDragOverDay}
                                onDrop={handleDrop}
                                onTaskClick={onTaskClick}
                                onContextMenu={(e, taskId, blockId) => setContextMenu({ x: e.clientX, y: e.clientY, taskId, blockId })}
                                onDragStart={handleDragStartInternal}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default Calendar;
