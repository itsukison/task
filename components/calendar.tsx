'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, CalendarBlock, CalendarProps, MultiMemberBlock } from '@/lib/types';
import {
  CalendarHeader,
  CalendarTimeColumn,
  CalendarContextMenu,
  CalendarDayColumn,
  MemberSelector,
} from './calendar/';
import { getBlocksWithLayout, BlockLayoutInfo } from './calendar/overlap-layout';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useAuth } from '@/lib/auth/hooks';
import { HOURS } from './calendar/constants';
import { useCalendarZoom } from './calendar/useCalendarZoom';
import { useCalendarState } from './calendar/useCalendarState';

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
  showWeekends = false,
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
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  // Use extracted hooks
  const { hourHeight } = useCalendarZoom(containerRef);
  const { dragPreview, setDragPreview, contextMenu, setContextMenu, dragSource, setDragSource } =
    useCalendarState();
  const { handleDragOverDay, handleDragStartInternal, handleDrop, formatMinutesToTime } =
    useCalendarDrag({
      draggingTask,
      hourHeight,
      tasks,
      dragPreview,
      dragSource,
      setDragPreview,
      setDragSource,
      onDragStart,
      onCreateBlock,
      onUpdateBlock,
    });

  const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const displayedDays =
    view === 'week'
      ? Array.from({ length: showWeekends ? 7 : 5 }, (_, i) => addDays(currentWeekStart, i))
      : [viewDate];

  const getTaskStyle = useCallback(
    (block: CalendarBlock | MultiMemberBlock, task: Task, layout: BlockLayoutInfo) => {
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
      if (task.status === 'in_progress')
        bgColor = 'bg-orange-50 border-orange-100 text-orange-800';
      if (task.status === 'completed')
        bgColor = 'bg-[#F7F7F5] border-[#E9E9E7] text-[#9B9A97] line-through decoration-gray-400';
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
    },
    [selectedMemberIds, user, hourHeight]
  );

  // Combine calendar blocks with multi-member blocks for rendering
  const allBlocks = useMemo(() => {
    // Use multi-member view unless ONLY the current user is selected
    const isOnlySelfSelected =
      selectedMemberIds.length === 1 && selectedMemberIds[0] === user?.id;
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
                  container.scrollTop = 8 * 64;
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

      <CalendarHeader
        displayedDays={displayedDays}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
        <div className="flex relative" style={{ height: HOURS.length * hourHeight }}>
          <CalendarTimeColumn hours={HOURS} hourHeight={hourHeight} />

          {/* Grid Columns */}
          {displayedDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');

            // Get blocks for this day
            const dayBlocks = allBlocks.filter((b) => {
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
                formatMinutesToTime={formatMinutesToTime}
                onDragOverDay={handleDragOverDay}
                onDrop={handleDrop}
                onTaskClick={onTaskClick}
                onContextMenu={(e, taskId, blockId) =>
                  setContextMenu({ x: e.clientX, y: e.clientY, taskId, blockId })
                }
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
    </div >
  );
});

export default Calendar;
