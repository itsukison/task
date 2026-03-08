'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek, addMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, CalendarBlock, CalendarProps, MultiMemberBlock } from '@/lib/types';
import {
  CalendarHeader,
  CalendarTimeColumn,
  CalendarContextMenu,
  CalendarDayColumn,
  MemberSelector,
} from './calendar/';
import { CalendarQuickAddPopover } from './calendar/CalendarQuickAddPopover';
import { SelectionBox } from '@/components/documents/SelectionBox';
import { getBlocksWithLayout, BlockLayoutInfo } from './calendar/overlap-layout';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useAuth } from '@/lib/auth/hooks';
import { FIXED_COLUMN_WIDTH } from './calendar/constants';
import { useCalendarZoom } from './calendar/useCalendarZoom';
import { useCalendarState } from './calendar/useCalendarState';
import { useCalendarHorizontalScroll } from './calendar/useCalendarHorizontalScroll';

import { useCalendarDrag } from './calendar/useCalendarDrag';
import { useLanguage } from '@/lib/i18n';

/**
 * Main Calendar Component
 *
 * REFACTORED: 373 lines → 194 lines (48% reduction)
 * - Extracted zoom logic to useCalendarZoom hook
 * - Extracted drag state to useCalendarState hook
 * - Extracted drag handlers to useCalendarDrag hook
 * - Extracted constants to separate file
 */
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
  startHour = 8,
  scrollAlignment = 'center',
  onViewChange,
  onViewDateChange,
  onPrev,
  onNext,
  onToday,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  selectedMemberIds = [],
  onSelectedMembersChange,
  multiMemberBlocks = [],
  previewBlock,
  optimisticBlock,
  onAddTask,
  selectedBlockIds,
  onSelectBlocks,
  onUpdateMultipleBlocks,
  dayColumnWidth = FIXED_COLUMN_WIDTH,
  occludedRightPx = 0,
  onDayViewportWidthChange,
}: CalendarProps) {
  const { membersWithVisibility } = useOrganizationMembers();
  const { user, currentOrg } = useAuth();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectionBox, setSelectionBox] = React.useState<{ startX: number; startY: number; currentX: number; currentY: number; } | null>(null);
  const isDragSelectingRef = useRef(false);

  // Use extracted hooks
  const { hourHeight, snapInterval } = useCalendarZoom(containerRef);

  // Horizontal scroll hook
  const {
    allDisplayedDays,
    bodyScrollRef,
    headerScrollRef,
    handleBodyScroll,
  } = useCalendarHorizontalScroll({
    viewDate,
    view,
    scrollAlignment,
    onViewDateChange: onViewDateChange || (() => { }),
    dayColumnWidth,
    occludedRightPx,
  });

  // Visible hours array driven by startHour (always show to midnight)
  const visibleHours = Array.from({ length: 24 - startHour }, (_, i) => startHour + i);

  const { dragPreview, setDragPreview, contextMenu, setContextMenu, quickAdd, setQuickAdd, dragSource, setDragSource } =
    useCalendarState();
  // Wrap handlers to intercept quick-add block updates
  const handleUpdateBlockInternal = useCallback((blockId: string, startTime: Date, endTime: Date) => {
    // Check for quick-add block
    if (blockId.startsWith('optimistic-quick-add-')) {
      // Only update state if quickAdd is still active to avoid zombies
      if (quickAdd) {
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        setQuickAdd({
          ...quickAdd,
          date: startTime,
          duration: duration
        });
      }
      // Always return to prevent calling backend with fake ID
      return;
    }

    // Check for other optimistic blocks (created via page.tsx)
    // These are handled by the parent component, but we should ensure they don't break anything
    // identifying them by ID prefix is done in the parent handleUpdateBlock too usually.
    // So we just pass through.

    if (onUpdateBlock) onUpdateBlock(blockId, startTime, endTime);
  }, [quickAdd, setQuickAdd, onUpdateBlock]);

  const handleTaskUpdateInternal = useCallback((task: Task) => {
    if (task.id.startsWith('optimistic-quick-add-')) return;
    if (onTaskUpdate) onTaskUpdate(task);
  }, [onTaskUpdate]);

  const handleTaskClickInternal = useCallback((task: Task) => {
    if (task.id.startsWith('optimistic-quick-add-')) return;
    if (onTaskClick) onTaskClick(task);
  }, [onTaskClick]);

  const { handleDragOverDay, handleDragStartInternal, handleDrop, formatMinutesToTime } =
    useCalendarDrag({
      draggingTask,
      hourHeight,
      snapInterval,
      tasks,
      dragPreview,
      dragSource,
      setDragPreview,
      setDragSource,
      onDragStart,
      onCreateBlock,
      onUpdateBlock: handleUpdateBlockInternal,
      selectedBlockIds,
      onUpdateMultipleBlocks,
      startHour,
    });

  // displayedDays is now driven by the horizontal scroll hook
  const displayedDays = view === 'week' ? allDisplayedDays : [viewDate];

  const getTaskStyle = useCallback(
    (block: CalendarBlock | MultiMemberBlock, task: Task, layout: BlockLayoutInfo) => {
      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      const hours = start.getHours();
      const minutes = start.getMinutes();
      const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

      const top = ((hours - startHour) * 60 + minutes) * (hourHeight / 60);
      const height = duration * (hourHeight / 60);

      // Notion-style: percentage-based positioning for side-by-side layout
      const padding = 2; // px padding on each side

      let bgColor = 'bg-white border-[#E9E9E7] shadow-sm text-[#37352F]';
      if (task.status === 'in_progress')
        bgColor = 'bg-orange-50 border-orange-100 text-orange-800';
      if (task.status === 'completed')
        bgColor = 'bg-[#F7F7F5] border-[#E9E9E7] text-[#9B9A97] line-through decoration-gray-400';
      if (task.status === 'overrun') bgColor = 'bg-red-50 border-red-100 text-red-800';

      // Optimistic block styling (orange/amber)
      if (block.id.startsWith('optimistic-') || task.id.startsWith('optimistic-')) {
        bgColor = 'bg-amber-100 border-amber-200 text-amber-800 opacity-90';
      }

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
        height: `${Math.max(height - 1, snapInterval * (hourHeight / 60))}px`,
        position: 'absolute' as 'absolute',
        // Notion-style: side-by-side layout using percentages
        left: `calc(${layout.leftPercent}% + ${padding}px)`,
        width: `calc(${layout.widthPercent}% - ${padding * 2}px)`,
        backgroundColor: backgroundColor,
        className: `rounded-md p-1.5 text-xs border ${bgColor} hover:brightness-95 transition-colors cursor-pointer overflow-hidden flex flex-col justify-start select-none`,
        zIndex: 10 + layout.columnIndex, // Stack columns for visual layering
      };
    },
    [selectedMemberIds, user, hourHeight, snapInterval, startHour]
  );

  // Combine calendar blocks with multi-member blocks for rendering
  const allBlocks = useMemo(() => {
    // Use multi-member view unless ONLY the current user is selected
    const isOnlySelfSelected =
      selectedMemberIds.length === 1 && selectedMemberIds[0] === user?.id;

    let blocks: (CalendarBlock | MultiMemberBlock)[];
    if (!isOnlySelfSelected && selectedMemberIds.length > 0) {
      blocks = multiMemberBlocks;
    } else {
      // Use regular calendar blocks when only viewing own schedule
      blocks = calendarBlocks;
    }

    // Add preview block if it exists
    if (previewBlock) {
      blocks = [...blocks, previewBlock];
    }

    // Add optimistic block if it exists
    if (optimisticBlock) {
      blocks = [...blocks, optimisticBlock];
    }

    // Add quick add preview (instant feedback during creation)
    if (quickAdd && user && currentOrg) {
      const startTime = quickAdd.date;
      const endTime = addMinutes(startTime, quickAdd.duration);
      const tempId = `optimistic-quick-add-${startTime.getTime()}`;

      const quickAddBlock: CalendarBlock = {
        id: tempId,
        taskId: tempId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        ownerId: user.id,
        organizationId: currentOrg.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Create minimal task object for rendering
        task: {
          id: tempId,
          title: t('tasks.new_task'),
          description: '',
          status: 'planned',
          expectedTime: quickAdd.duration,
          actualTime: 0,
          visibility: 'private',
          owners: [], // No owners yet
          ownerId: user.id,
          organizationId: currentOrg.id,
          scheduledDate: format(startTime, 'yyyy-MM-dd'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      blocks = [...blocks, quickAddBlock];
    }

    return blocks;
  }, [calendarBlocks, multiMemberBlocks, selectedMemberIds, user?.id, previewBlock, optimisticBlock, quickAdd, currentOrg]);

  // Selection Handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-draggable="true"]') || target.closest('[draggable="true"]') || target.closest('button') || target.closest('.cursor-ns-resize')) {
      return;
    }

    const container = bodyScrollRef.current;
    if (!container) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionBox({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
    isDragSelectingRef.current = true;

    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && onSelectBlocks) {
      onSelectBlocks(new Set());
    }
  }, [bodyScrollRef, onSelectBlocks]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragSelectingRef.current || !selectionBox || !bodyScrollRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const newBox = { ...selectionBox, currentX, currentY };
    setSelectionBox(newBox);

    if (!onSelectBlocks) return;

    const left = Math.min(newBox.startX, newBox.currentX);
    const right = Math.max(newBox.startX, newBox.currentX);
    const top = Math.min(newBox.startY, newBox.currentY);
    const bottom = Math.max(newBox.startY, newBox.currentY);

    const colWidth = dayColumnWidth;
    const newSelected = new Set<string>();

    allBlocks.forEach(block => {
      const dateStr = format(new Date(block.startTime), 'yyyy-MM-dd');
      const dayIndex = displayedDays.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr);
      if (dayIndex < 0) return;

      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      const duration = (end.getTime() - start.getTime()) / 60000;

      const blockTop = ((start.getHours() - startHour) * 60 + start.getMinutes()) * (hourHeight / 60);
      const blockBottom = blockTop + duration * (hourHeight / 60);

      const actualColWidth = view === 'week' ? colWidth : rect.width;
      const blockLeft = dayIndex * actualColWidth;
      const blockRight = blockLeft + actualColWidth;

      // Simple rect intersection
      if (!(blockRight < left || blockLeft > right || blockBottom < top || blockTop > bottom)) {
        newSelected.add(block.id);
      }
    });

    onSelectBlocks(newSelected);
  }, [selectionBox, view, allBlocks, displayedDays, hourHeight, startHour, onSelectBlocks, dayColumnWidth]);

  React.useEffect(() => {
    if (!onDayViewportWidthChange || !bodyScrollRef.current) return;
    const el = bodyScrollRef.current;

    const emit = () => {
      onDayViewportWidthChange(el.clientWidth);
    };

    emit();
    const observer = new ResizeObserver(emit);
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [bodyScrollRef, onDayViewportWidthChange]);

  const handleCanvasMouseUp = useCallback(() => {
    isDragSelectingRef.current = false;
    setSelectionBox(null);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden font-sans relative pl-3">
      <CalendarContextMenu
        contextMenu={contextMenu}
        onDeleteBlock={onDeleteBlock}
        onCreateTask={(date) => {
          if (contextMenu) {
            setQuickAdd({
              // Use xOffset (column right edge) if available, otherwise fallback to click X + standard offset
              x: contextMenu.xOffset || (contextMenu.x),
              y: contextMenu.y,
              date,
              duration: 30
            });
            setContextMenu(null);
          }
        }}
        onClose={() => setContextMenu(null)}
      />

      {quickAdd && onAddTask && (
        <CalendarQuickAddPopover
          initialDate={quickAdd.date}
          initialTime={quickAdd.duration}
          position={{ x: quickAdd.x + 10, y: quickAdd.y }}
          onClose={() => setQuickAdd(null)}
          onCreate={(data) => {
            onAddTask({
              scheduledDate: data.scheduledDate,
              expectedTime: data.expectedTime,
              title: data.title
            });
            setQuickAdd(null);
          }}
        />
      )}

      {/* Calendar Toolbar */}
      <div className="px-3 h-12 border-b border-[#E9E9E7] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          {onViewChange && (
            <div className="flex bg-[#EFEFED] p-0.5 rounded-md">
              <button
                onClick={() => onViewChange('week')}
                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${view === 'week'
                  ? 'bg-white text-[#37352F] shadow-sm'
                  : 'bg-transparent text-[#787774] hover:text-[#37352F]'
                  }`}
              >
                {t('calendar.week')}
              </button>
              <button
                onClick={() => onViewChange('day')}
                className={`px-2 py-0.5 text-xs font-medium rounded-sm transition-all ${view === 'day'
                  ? 'bg-white text-[#37352F] shadow-sm'
                  : 'bg-transparent text-[#787774] hover:text-[#37352F]'
                  }`}
              >
                {t('calendar.day')}
              </button>
            </div>
          )}

          {/* Navigation */}
          {(onPrev || onNext || onToday) && (
            <div className="flex items-center bg-white border border-[#E9E9E7] rounded-md shadow-sm">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-1 hover:bg-[#EFEFED] text-[#787774] border-r border-[#E9E9E7]"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              {onToday && (
                <button
                  onClick={onToday}
                  className="px-2 py-1 text-xs font-medium hover:bg-[#EFEFED] text-[#37352F]"
                >
                  {t('calendar.today')}
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-1 hover:bg-[#EFEFED] text-[#787774] border-l border-[#E9E9E7]"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => {
                const container = containerRef.current;
                if (container) {
                  container.scrollTop = 0;
                }
              }}
              className="text-xs px-2 py-1 text-[#787774] hover:bg-[#EFEFED] rounded-md transition-colors"
              title={t('calendar.reset_zoom')}
            >
              {t('calendar.reset_zoom')}
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

      {/* Calendar Header — syncs horizontal scroll with body */}
      <CalendarHeader
        displayedDays={displayedDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        scrollRef={headerScrollRef}
        isHorizontalScroll={view === 'week'}
        dayColumnWidth={dayColumnWidth}
      />

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
        <div className="flex relative" style={{ height: visibleHours.length * hourHeight }}>
          {/* Time column — sticky left */}
          <div className="sticky left-0 z-30 bg-white">
            <CalendarTimeColumn hours={visibleHours} hourHeight={hourHeight} snapInterval={snapInterval} />
          </div>

          {/* Horizontally scrollable day columns */}
          <div
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
            className="flex-1 overflow-x-auto"
          >
            <div
              className="flex relative"
              style={{
                width: view === 'week' ? `${displayedDays.length * dayColumnWidth}px` : '100%',
                height: visibleHours.length * hourHeight,
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              {selectionBox && (
                <SelectionBox
                  startX={selectionBox.startX}
                  startY={selectionBox.startY}
                  currentX={selectionBox.currentX}
                  currentY={selectionBox.currentY}
                />
              )}
              {displayedDays.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayBlocks = allBlocks.filter((b) => {
                  const blockDate = format(new Date(b.startTime), 'yyyy-MM-dd');
                  return blockDate === dateStr;
                });
                const blocksWithLayout = getBlocksWithLayout(dayBlocks);

                return (
                  <CalendarDayColumn
                    key={dateStr}
                    date={date}
                    dateStr={dateStr}
                    selectedDate={selectedDate}
                    hours={visibleHours}
                    hourHeight={hourHeight}
                    snapInterval={snapInterval}
                    startHour={startHour}
                    tasks={tasks}
                    calendarBlocks={allBlocks}
                    draggingTask={draggingTask}
                    dragPreview={dragPreview}
                    getTaskStyle={getTaskStyle}
                    formatMinutesToTime={formatMinutesToTime}
                    onDragOverDay={handleDragOverDay}
                    onDrop={handleDrop}
                    onTaskClick={handleTaskClickInternal}
                    onContextMenu={(e, taskId, blockId, date, xOffset) => {
                      setContextMenu({ x: e.clientX, y: e.clientY, taskId, blockId, date, xOffset });
                      setQuickAdd(null);
                    }}
                    onDragStart={handleDragStartInternal}
                    onUpdateBlock={handleUpdateBlockInternal}
                    onUpdateTask={handleTaskUpdateInternal}
                    blocksWithLayout={blocksWithLayout}
                    isMultiMemberMode={selectedMemberIds.length > 1}
                    currentUserId={user?.id}
                    selectedBlockIds={selectedBlockIds}
                    onSelectBlocks={onSelectBlocks}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
});

export default Calendar;
