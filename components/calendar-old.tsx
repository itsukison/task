'use client';

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, CalendarBlock, CalendarProps, MultiMemberBlock } from '@/lib/types';
import {
    CalendarHeader,
    CalendarTimeColumn,
    CalendarContextMenu,
    CalendarDayColumn,
    MemberSelector
} from './calendar/';
import { getBlocksWithLayout, BlockLayoutInfo } from './calendar/overlap-layout';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useAuth } from '@/lib/auth/hooks';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Pre-create transparent drag image to prevent favicon from appearing during drag
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
    daysToShow = 5,
    onViewChange,
    onPrev,
    onNext,
    onToday,
    onCreateBlock,
    onUpdateBlock,
    onDeleteBlock,
    selectedMemberIds = [],
    onSelectedMembersChange,
    multiMemberBlocks = [],
}: CalendarProps) {
    const { membersWithVisibility } = useOrganizationMembers();
    const { user } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragPreview, setDragPreview] = useState<{ dateStr: string, minutes: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string, blockId?: string } | null>(null);
    // Track drag source: 'task-list' for new blocks, 'calendar' for moving existing
    const [dragSource, setDragSource] = useState<'task-list' | 'calendar' | null>(null);

    // Zoom state
    const [hourHeight, setHourHeight] = useState(64);
    // Ref to store zoom anchor point for cursor-centered zooming
    const zoomAnchorRef = useRef<{ timeHours: number, offsetY: number } | null>(null);

    // Scroll to 8 AM on mount (only if not zooming)
    useEffect(() => {
        if (containerRef.current && !zoomAnchorRef.current) {
            containerRef.current.scrollTop = 8 * hourHeight;
        }
    }, []); // Run once on mount

    // Handle Pinch-to-Zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();

                // Calculate anchor point before zoom
                const rect = container.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const scrollTop = container.scrollTop;
                const timeHours = (scrollTop + offsetY) / hourHeight;

                zoomAnchorRef.current = { timeHours, offsetY };

                const delta = -e.deltaY;
                setHourHeight(prev => {
                    const newHeight = Math.max(40, Math.min(200, prev + delta * 0.5));
                    return newHeight;
                });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [hourHeight]); // Add hourHeight dependency to ensure fresh state access in handler if needed

    // Restore scroll position after zoom to keep cursor centered
    useLayoutEffect(() => {
        if (containerRef.current && zoomAnchorRef.current) {
            const { timeHours, offsetY } = zoomAnchorRef.current;
            const newScrollTop = timeHours * hourHeight - offsetY;
            containerRef.current.scrollTop = newScrollTop;
            zoomAnchorRef.current = null;
        }
    }, [hourHeight]);

    // Global click listener to close context menu
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
    const displayedDays = view === 'week'
        ? Array.from({ length: daysToShow }, (_, i) => addDays(currentWeekStart, i))
        : [viewDate];

    const getTaskStyle = useCallback((block: CalendarBlock | MultiMemberBlock, task: Task, layout: BlockLayoutInfo) => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        const hours = start.getHours();
        const minutes = start.getMinutes();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

        const top = (hours * 60 + minutes) * (hourHeight / 60);
        const height = duration * (hourHeight / 60);

        // Notion-style: percentage-based positioning for side-by-side layout
        const padding = 2; // px padding on each side

        let bgColor = 'bg-white border-[#E9E9E7] shadow-sm text-[#37352F]';
        if (task.status === 'in_progress') bgColor = 'bg-orange-50 border-orange-100 text-orange-800';
        if (task.status === 'completed') bgColor = 'bg-[#F7F7F5] border-[#E9E9E7] text-[#9B9A97] line-through decoration-gray-400';
        if (task.status === 'overrun') bgColor = 'bg-red-50 border-red-100 text-red-800';

        // Check if this is the current user's block
        const isOwnBlock = block.ownerId === user?.id;

        // Only apply colored background to OTHER users' blocks in multi-member mode
        let backgroundColor = undefined;
        if ('ownerColor' in block && block.ownerColor && selectedMemberIds.length > 1 && !isOwnBlock) {
            // Convert hex color to rgba with 20% opacity
            const hex = block.ownerColor;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
        }

        return {
            top: `${top}px`,
            height: `${Math.max(height - 1, 24)}px`,
            position: 'absolute' as 'absolute',
            // Notion-style: side-by-side layout using percentages
            left: `calc(${layout.leftPercent}% + ${padding}px)`,
            width: `calc(${layout.widthPercent}% - ${padding * 2}px)`,
            backgroundColor: backgroundColor,
            className: `rounded-md p-1.5 text-xs border ${bgColor} hover:brightness-95 transition-colors cursor-pointer overflow-hidden flex flex-col justify-start select-none`,
            zIndex: 10 + layout.columnIndex, // Stack columns for visual layering
        };
    }, [selectedMemberIds, user, hourHeight]); // Added hourHeight dependency

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
        const minutes = Math.floor((offsetY / hourHeight) * 60);
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
        e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
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

    // Combine calendar blocks with multi-member blocks for rendering
    const allBlocks = React.useMemo(() => {
        // Use multi-member view unless ONLY the current user is selected
        const isOnlySelfSelected = selectedMemberIds.length === 1 && selectedMemberIds[0] === user?.id;
        if (!isOnlySelfSelected && selectedMemberIds.length > 0) {
            return multiMemberBlocks;
        }
        // Use regular calendar blocks when only viewing own schedule
        return calendarBlocks;
    }, [calendarBlocks, multiMemberBlocks, selectedMemberIds, user?.id]);

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden font-sans relative pl-3">

            <CalendarContextMenu
                contextMenu={contextMenu}
                onDeleteBlock={onDeleteBlock}
                onClose={() => setContextMenu(null)}
            />

            {/* Calendar Toolbar */}
            <div className="px-3 h-12 border-b border-[#E9E9E7] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    {onViewChange && (
                        <div className="flex bg-[#EFEFED] p-0.5 rounded-md">
                            <button
                                onClick={() => onViewChange('week')}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${view === 'week' ? 'bg-white text-[#37352F] shadow-sm' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => onViewChange('day')}
                                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${view === 'day' ? 'bg-white text-[#37352F] shadow-sm' : 'bg-transparent text-[#787774] hover:text-[#37352F]'}`}
                            >
                                Day
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    {(onPrev || onNext || onToday) && (
                        <div className="flex items-center bg-white border border-[#E9E9E7] rounded-md shadow-sm">
                            {onPrev && (
                                <button onClick={onPrev} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-r border-[#E9E9E7]">
                                    <ChevronRight size={14} />
                                </button>
                            )}
                            {onToday && (
                                <button onClick={onToday} className="px-2 py-1 text-xs font-medium hover:bg-[#EFEFED] text-[#37352F]">
                                    Today
                                </button>
                            )}
                            {onNext && (
                                <button onClick={onNext} className="p-1 hover:bg-[#EFEFED] text-[#787774] border-l border-[#E9E9E7]">
                                    <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1 ml-2">
                        <button
                            onClick={() => setHourHeight(64)}
                            className="text-xs px-2 py-1 text-[#787774] hover:bg-[#EFEFED] rounded-md transition-colors"
                            title="Reset Zoom"
                        >
                            Reset Zoom
                        </button>
                    </div>
                </div>

                {/* Member Selector (Compact) */}
                {onSelectedMembersChange && (
                    <MemberSelector
                        members={membersWithVisibility}
                        selectedMemberIds={selectedMemberIds}
                        onSelectedMembersChange={onSelectedMembersChange}
                        compact
                        showAllOption={true}
                    />
                )}
            </div>

            <CalendarHeader
                displayedDays={displayedDays}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
                dayColumnWidth={160}
            />

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
                <div className="flex relative" style={{ height: HOURS.length * hourHeight }}>

                    <CalendarTimeColumn hours={HOURS} hourHeight={hourHeight} />

                    {/* Grid Columns */}
                    {displayedDays.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');

                        // Get blocks for this day
                        const dayBlocks = allBlocks.filter(b => {
                            const blockDate = format(new Date(b.startTime), 'yyyy-MM-dd');
                            return blockDate === dateStr;
                        });

                        // Calculate Notion-style layout for overlapping blocks
                        const blocksWithLayout = getBlocksWithLayout(dayBlocks);

                        return (
                            <CalendarDayColumn
                                key={dateStr}
                                date={date}
                                dateStr={dateStr}
                                selectedDate={selectedDate}
                                hours={HOURS}
                                hourHeight={hourHeight}
                                tasks={tasks}
                                calendarBlocks={allBlocks}
                                draggingTask={draggingTask}
                                dragPreview={dragPreview}
                                getTaskStyle={getTaskStyle}
                                onDragOverDay={handleDragOverDay}
                                onDrop={handleDrop}
                                onTaskClick={onTaskClick}
                                onContextMenu={(e, taskId, blockId) => setContextMenu({ x: e.clientX, y: e.clientY, taskId: taskId || '', blockId: blockId || '' })}
                                onDragStart={handleDragStartInternal}
                                onUpdateBlock={onUpdateBlock}
                                onUpdateTask={onTaskUpdate}
                                blocksWithLayout={blocksWithLayout}
                                isMultiMemberMode={selectedMemberIds.length > 1}
                                currentUserId={user?.id}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default Calendar;
