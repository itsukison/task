'use client';

import React, { useRef, useMemo, useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { format, addMinutes, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as UiCalendar } from '@/components/ui/calendar';
import { Task, CalendarBlock, CalendarProps, MultiMemberBlock } from '@/lib/types';
import {
  CalendarHeader,
  CalendarTimeColumn,
  CalendarContextMenu,
  CalendarDayColumn,
  MemberSelector,
} from './calendar/';
import { CalendarQuickAddPopover } from './calendar/CalendarQuickAddPopover';
import { getBlocksWithLayout, BlockLayoutInfo } from './calendar/overlap-layout';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { useAuth } from '@/lib/auth/hooks';
import { FIXED_COLUMN_WIDTH } from './calendar/constants';
import { useCalendarZoom } from './calendar/useCalendarZoom';
import { useCalendarState } from './calendar/useCalendarState';
import { useCalendarHorizontalScroll } from './calendar/useCalendarHorizontalScroll';

import { useCalendarDrag } from './calendar/useCalendarDrag';
import { useLanguage } from '@/lib/i18n';

type CalendarPreviewGhost = {
  block: CalendarBlock | MultiMemberBlock;
  task: Task;
  layout: BlockLayoutInfo;
};

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
  view,
  viewDate,
  startHour = 0,
  endHour = 24,
  scrollAlignment = 'center',
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
  blockOverTaskList = false,
  dayColumnWidth = FIXED_COLUMN_WIDTH,
  occludedRightPx = 0,
  onDayViewportWidthChange,
}: CalendarProps) {
  const { membersWithVisibility } = useOrganizationMembers();
  const { user, currentOrg } = useAuth();
  const { t } = useLanguage();
  // Lasso selection — only a boolean in React state so children never re-render during drag.
  // Coordinates live in a ref; the visual box is updated via direct DOM mutation.
  const [isLassoActive, setIsLassoActive] = React.useState(false);
  const selectionBoxRef = useRef<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const selectionBoxDivRef = useRef<HTMLDivElement>(null);
  const isDragSelectingRef = useRef(false);
  const selectionRafRef = useRef<number | null>(null);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [now, setNow] = React.useState(new Date());
  const hasAutoCenteredRef = useRef(false);
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Horizontal scroll hook — bodyScrollRef is the unified scroll container
  const {
    allDisplayedDays,
    bodyScrollRef,
    handleBodyScroll,
  } = useCalendarHorizontalScroll({
    viewDate,
    view,
    scrollAlignment,
    onViewDateChange: onViewDateChange || (() => { }),
    dayColumnWidth,
    occludedRightPx,
  });

  // Pass bodyScrollRef (the unified scroll container) to the zoom hook
  const { hourHeight, snapInterval, resetZoom } = useCalendarZoom(bodyScrollRef);

  // Visible hours array driven by startHour and endHour
  const visibleHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const { dragPreview, setDragPreview, contextMenu, setContextMenu, quickAdd, setQuickAdd, dragSource, setDragSource } =
    useCalendarState();

  useEffect(() => {
    if (!blockOverTaskList) return;
    setDragPreview(null);
  }, [blockOverTaskList, setDragPreview]);

  // Global dragend listener — clears preview state as a safety net
  // when the source element unmounts before dragend fires on it
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDragPreview(null);
      setDragSource(null);
    };
    window.addEventListener('dragend', handleGlobalDragEnd);
    return () => window.removeEventListener('dragend', handleGlobalDragEnd);
  }, [setDragPreview, setDragSource]);
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

  const { handleDragOverDay, handleDragStartInternal, handleDrop } =
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
  const displayedDays = useMemo(
    () => (view === 'week' ? allDisplayedDays : [viewDate]),
    [allDisplayedDays, view, viewDate]
  );

  useLayoutEffect(() => {
    if (hasAutoCenteredRef.current) return;
    const el = bodyScrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      if (hasAutoCenteredRef.current) return;
      if (!bodyScrollRef.current) return;

      const nowLocal = new Date();
      const minutesFromStart = Math.max(
        0,
        (nowLocal.getHours() - startHour) * 60 + nowLocal.getMinutes()
      );
      const topPx = minutesFromStart * (hourHeight / 60);

      const containerHeight = el.clientHeight;
      const maxScrollTop = Math.max(0, el.scrollHeight - containerHeight);
      const desiredLineY = containerHeight / 2 - hourHeight;
      const targetScrollTop = Math.min(
        Math.max(0, topPx - desiredLineY),
        maxScrollTop
      );

      el.scrollTop = targetScrollTop;
      hasAutoCenteredRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [bodyScrollRef, hourHeight, startHour]);

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
      if (block.id.startsWith('optimistic-')) {
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
        position: 'absolute' as const,
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
      // Merge own calendarBlocks as fallback so own blocks remain visible
      // while multiMemberBlocks is still loading (deduped by block ID)
      const multiBlockIds = new Set(multiMemberBlocks.map(b => b.id));
      const ownBlocksFallback = calendarBlocks.filter(b => !multiBlockIds.has(b.id));
      blocks = [...multiMemberBlocks, ...ownBlocksFallback];
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
          parentTaskId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      };

      blocks = [...blocks, quickAddBlock];
    }

    return blocks;
  }, [calendarBlocks, currentOrg, multiMemberBlocks, optimisticBlock, previewBlock, quickAdd, selectedMemberIds, t, user]);

  // Stable string key: changes only when a block is created, deleted, or time-shifted.
  // Does NOT change on task title/status edits — prevents redundant O(n²) layout runs.
  const blockLayoutKey = useMemo(
    () => allBlocks.map(b => `${b.id}:${b.startTime}:${b.endTime}`).join('|'),
    [allBlocks]
  );

  // Pre-compute overlap layout per day, memoized against blockLayoutKey
  const blocksWithLayoutByDay = useMemo(() => {
    const byDay = new Map<string, Array<typeof allBlocks[number]>>();
    allBlocks.forEach(b => {
      const day = format(new Date(b.startTime), 'yyyy-MM-dd');
      const list = byDay.get(day) ?? [];
      list.push(b);
      byDay.set(day, list);
    });
    const result = new Map<string, ReturnType<typeof getBlocksWithLayout>>();
    byDay.forEach((dayBlocks, day) => result.set(day, getBlocksWithLayout(dayBlocks)));
    return result;
  // blockLayoutKey is derived from allBlocks — using it instead of allBlocks directly
  // skips layout recomputation when only non-layout fields (title, status) change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockLayoutKey]);

  const { previewBlocksByDay, activeDragBlockIds } = useMemo(() => {
    const emptyState = {
      previewBlocksByDay: new Map<string, CalendarPreviewGhost[]>(),
      activeDragBlockIds: new Set<string>(),
    };

    if (!dragPreview || !draggingTask || blockOverTaskList) {
      return emptyState;
    }

    const taskById = new Map(tasks.map((task) => [task.id, task]));
    const movingIds = new Set<string>();
    const previewBlocks: (CalendarBlock | MultiMemberBlock)[] = [];
    const previewTaskByBlockId = new Map<string, Task>();

    const buildStartDate = (dateStr: string, minutes: number) => {
      const startDate = new Date(dateStr);
      startDate.setHours(0, 0, 0, 0);
      startDate.setMinutes(minutes);
      return startDate;
    };

    if (dragSource === 'calendar' && dragPreview.isMultiDrag && dragPreview.deltaMinutes !== undefined && selectedBlockIds?.size) {
      const selectedBlocks = allBlocks.filter((block) => selectedBlockIds.has(block.id));
      selectedBlocks.forEach((block) => {
        const task = block.task || taskById.get(block.taskId);
        if (!task) return;

        movingIds.add(block.id);

        const newStart = new Date(new Date(block.startTime).getTime() + dragPreview.deltaMinutes! * 60_000);
        const newEnd = new Date(new Date(block.endTime).getTime() + dragPreview.deltaMinutes! * 60_000);
        const previewBlock = {
          ...block,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          task,
        };

        previewBlocks.push(previewBlock);
        previewTaskByBlockId.set(previewBlock.id, task);
      });
    } else if (dragSource === 'calendar' && dragPreview.blockId) {
      const sourceBlock = allBlocks.find((block) => block.id === dragPreview.blockId);
      const sourceTask = sourceBlock ? (sourceBlock.task || taskById.get(sourceBlock.taskId)) : null;

      if (sourceBlock && sourceTask) {
        movingIds.add(sourceBlock.id);

        const newStart = buildStartDate(dragPreview.dateStr, dragPreview.minutes);
        const newEnd = new Date(newStart.getTime() + sourceTask.expectedTime * 60_000);
        const previewBlock = {
          ...sourceBlock,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
          task: sourceTask,
        };

        previewBlocks.push(previewBlock);
        previewTaskByBlockId.set(previewBlock.id, sourceTask);
      }
    } else {
      const previewId = `drag-preview-${draggingTask.id}`;
      const newStart = buildStartDate(dragPreview.dateStr, dragPreview.minutes);
      const newEnd = new Date(newStart.getTime() + draggingTask.expectedTime * 60_000);
      const previewBlock: CalendarBlock = {
        id: previewId,
        taskId: previewId,
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        ownerId: user?.id ?? draggingTask.ownerId,
        organizationId: currentOrg?.id ?? draggingTask.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        task: draggingTask,
      };

      previewBlocks.push(previewBlock);
      previewTaskByBlockId.set(previewId, draggingTask);
    }

    if (previewBlocks.length === 0) {
      return emptyState;
    }

    const previewDays = new Set(previewBlocks.map((block) => format(new Date(block.startTime), 'yyyy-MM-dd')));
    const stationaryBlocksByDay = new Map<string, (CalendarBlock | MultiMemberBlock)[]>();

    allBlocks.forEach((block) => {
      if (movingIds.has(block.id)) return;

      const dayKey = format(new Date(block.startTime), 'yyyy-MM-dd');
      if (!previewDays.has(dayKey)) return;

      const dayBlocks = stationaryBlocksByDay.get(dayKey) ?? [];
      dayBlocks.push(block);
      stationaryBlocksByDay.set(dayKey, dayBlocks);
    });

    const previewBlocksByDay = new Map<string, CalendarPreviewGhost[]>();

    previewDays.forEach((dayKey) => {
      const dayPreviewBlocks = previewBlocks.filter((block) => format(new Date(block.startTime), 'yyyy-MM-dd') === dayKey);
      const combinedBlocks = [...(stationaryBlocksByDay.get(dayKey) ?? []), ...dayPreviewBlocks];
      const layoutEntries = getBlocksWithLayout(combinedBlocks);

      const previewEntries = layoutEntries.flatMap(({ block, layout }) => {
        const task = previewTaskByBlockId.get(block.id);
        if (!task) return [];
        return [{ block, task, layout }];
      });

      previewBlocksByDay.set(dayKey, previewEntries);
    });

    return {
      previewBlocksByDay,
      activeDragBlockIds: movingIds,
    };
  }, [
    allBlocks,
    blockOverTaskList,
    currentOrg?.id,
    dragPreview,
    dragSource,
    draggingTask,
    selectedBlockIds,
    tasks,
    user?.id,
  ]);

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

    selectionBoxRef.current = { startX, startY, currentX: startX, currentY: startY };
    isDragSelectingRef.current = true;
    setIsLassoActive(true); // one React state update — mounts the selection box div

    if (!e.shiftKey && !e.metaKey && !e.ctrlKey && onSelectBlocks) {
      onSelectBlocks(new Set());
    }
  }, [bodyScrollRef, onSelectBlocks]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragSelectingRef.current || !selectionBoxRef.current || !bodyScrollRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const box = selectionBoxRef.current;
    box.currentX = e.clientX - rect.left;
    box.currentY = e.clientY - rect.top;

    // Update the selection box visually via direct DOM mutation — zero React re-renders
    const el = selectionBoxDivRef.current;
    if (el) {
      const left = Math.min(box.startX, box.currentX);
      const top = Math.min(box.startY, box.currentY);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      el.style.width = `${Math.abs(box.currentX - box.startX)}px`;
      el.style.height = `${Math.abs(box.currentY - box.startY)}px`;
    }

    if (!onSelectBlocks) return;

    // Throttle block hit-testing to one update per animation frame
    const left = Math.min(box.startX, box.currentX);
    const right = Math.max(box.startX, box.currentX);
    const top = Math.min(box.startY, box.currentY);
    const bottom = Math.max(box.startY, box.currentY);

    if (selectionRafRef.current !== null) return;
    selectionRafRef.current = requestAnimationFrame(() => {
      selectionRafRef.current = null;

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

        if (!(blockRight < left || blockLeft > right || blockBottom < top || blockTop > bottom)) {
          newSelected.add(block.id);
        }
      });

      onSelectBlocks(newSelected);
    });
  }, [view, allBlocks, displayedDays, hourHeight, startHour, onSelectBlocks, dayColumnWidth, bodyScrollRef]);

  React.useEffect(() => {
    if (!onDayViewportWidthChange || !bodyScrollRef.current) return;
    const el = bodyScrollRef.current;
    // Subtract the time column width (w-12 = 48px) because bodyScrollRef is now
    // the unified scroll container that includes the sticky time column area.
    const TIME_COL_WIDTH = 48;

    const emit = () => {
      onDayViewportWidthChange(el.clientWidth - TIME_COL_WIDTH);
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
    selectionBoxRef.current = null;
    if (selectionRafRef.current !== null) {
      cancelAnimationFrame(selectionRafRef.current);
      selectionRafRef.current = null;
    }
    setIsLassoActive(false); // one React state update — unmounts the selection box div
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
          {/* Date Picker */}
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <button className="p-1.5 hover:bg-[#EFEFED] text-[#787774] border border-[#E9E9E7] rounded-md bg-white shadow-sm cursor-pointer">
                <CalendarIcon size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border border-[#E9E9E7] shadow-md" align="start">
              <UiCalendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  onSelectDate(date);
                  if (onViewDateChange) onViewDateChange(date);
                  setDatePickerOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Navigation */}
          {(onPrev || onNext || onToday) && (
            <div className="flex items-center bg-white border border-[#E9E9E7] rounded-md shadow-sm">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-1 hover:bg-[#EFEFED] text-[#787774] border-r border-[#E9E9E7] cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              {onToday && (
                <button
                  onClick={onToday}
                  className="px-2 py-1 text-xs font-medium hover:bg-[#EFEFED] text-[#37352F] cursor-pointer"
                >
                  {t('calendar.today')}
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-1 hover:bg-[#EFEFED] text-[#787774] border-l border-[#E9E9E7] cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Zoom Controls */}
          <div className="flex items-center">
            <button
              onClick={() => {
                resetZoom(startHour);
                // Reuse "today" handler to horizontally center and select today
                onToday?.();
              }}
              className="text-xs px-2 py-1 text-[#787774] hover:bg-[#EFEFED] rounded-md transition-colors cursor-pointer"
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

      {/* Unified scroll container — handles both vertical and horizontal scrolling.
          CalendarHeader is inside with sticky top-0, so header and body scroll
          together natively at the compositor level. No JS sync needed. */}
      <div
        ref={bodyScrollRef}
        onScroll={handleBodyScroll}
        className="flex-1 overflow-auto relative custom-scrollbar"
      >
        {/* Inner width wrapper — sets the total scrollable content width */}
        <div style={{ width: view === 'week' ? `${48 + displayedDays.length * dayColumnWidth}px` : '100%' }}>

          {/* Calendar Header — sticky top so it stays visible on vertical scroll.
              Scrolls horizontally with the content (no JS needed).
              Corner spacer inside is sticky left to always stay in the top-left. */}
          <CalendarHeader
            displayedDays={displayedDays}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            dayColumnWidth={dayColumnWidth}
          />

          {/* Body — time column sticky left, day columns at natural width */}
          <div className="flex relative" style={{ height: visibleHours.length * hourHeight }}>
            {/* Time column — sticky left */}
            <div className="sticky left-0 z-20 bg-white">
              <CalendarTimeColumn hours={visibleHours} hourHeight={hourHeight} snapInterval={snapInterval} />
            </div>

            {/* Day columns */}
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
              onDragLeave={(e) => {
                // Only clear if leaving the calendar entirely (not moving between day columns)
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragPreview(null);
                }
              }}
            >
              {/* Faint current-time line spanning all visible day columns */}
              {displayedDays.some(d => isSameDay(d, now)) && (() => {
                const top = Math.max(0, (now.getHours() - startHour) * 60 + now.getMinutes()) * (hourHeight / 60);
                return (
                  <div
                    className="absolute left-0 right-0 border-t border-red-400/25 z-15 pointer-events-none"
                    style={{ top: `${top}px` }}
                  />
                );
              })()}
              {isLassoActive && (
                <div
                  ref={selectionBoxDivRef}
                  className="absolute border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/10 pointer-events-none z-50 rounded"
                  style={{ left: 0, top: 0, width: 0, height: 0 }}
                />
              )}
              {displayedDays.map((date) => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const blocksWithLayout = blocksWithLayoutByDay.get(dateStr) ?? [];

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
                    blockOverTaskList={blockOverTaskList}
                    previewBlocks={previewBlocksByDay.get(dateStr) ?? []}
                    activeDragBlockIds={activeDragBlockIds}
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
