'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { Task, CalendarBlock, MultiMemberBlock } from '@/lib/types';
import { CalendarBlockWithPending } from '@/lib/hooks/use-calendar-blocks';
import { BlockLayoutInfo } from './overlap-layout';

interface CalendarDayColumnProps {
  date: Date;
  dateStr: string;
  selectedDate: Date;
  hours: number[];
  hourHeight?: number;
  tasks: Task[];
  calendarBlocks: (CalendarBlock | MultiMemberBlock | CalendarBlockWithPending)[];
  draggingTask: Task | null;
  dragPreview: { dateStr: string; minutes: number; deltaMinutes?: number; isMultiDrag?: boolean } | null;
  getTaskStyle: (block: CalendarBlock | MultiMemberBlock, task: Task, layout: BlockLayoutInfo) => any;
  formatMinutesToTime: (minutes: number) => string;
  onDragOverDay: (e: React.DragEvent, dateStr: string) => void;
  onDrop: (e: React.DragEvent, dateStr: string) => void;
  onTaskClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId?: string, blockId?: string, date?: Date, xOffset?: number) => void;
  onDragStart: (e: React.DragEvent, task: Task, blockId?: string, startTime?: string) => void;
  snapInterval?: number;
  onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
  onUpdateTask?: (task: Task) => void;
  blocksWithLayout?: Array<{
    block: CalendarBlock | MultiMemberBlock;
    layout: BlockLayoutInfo;
  }>;
  isMultiMemberMode?: boolean;
  currentUserId?: string;  // For enabling drag only on own blocks
  selectedBlockIds?: Set<string>;
  onSelectBlocks?: (blockIds: Set<string>) => void;
  startHour?: number;
}

function CurrentTimeLine({ startHour, hourHeight }: { startHour: number; hourHeight: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const top = Math.max(0, (now.getHours() - startHour) * 60 + now.getMinutes()) * (hourHeight / 60);
  return (
    <div
      className="absolute left-0 right-0 border-t border-red-500 z-20 pointer-events-none flex items-center"
      style={{ top: `${top}px` }}
    >
      <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-[3px]"></div>
    </div>
  );
}

export const CalendarDayColumn = React.memo(function CalendarDayColumn({
  date,
  dateStr,
  selectedDate,
  hours,
  hourHeight = 64,
  tasks,
  calendarBlocks,
  draggingTask,
  dragPreview,
  getTaskStyle,
  formatMinutesToTime,
  onDragOverDay,
  onDrop,
  onTaskClick,
  onContextMenu,
  onDragStart,
  snapInterval = 15,
  onUpdateBlock,
  onUpdateTask,
  blocksWithLayout,
  isMultiMemberMode = false,
  currentUserId,
  selectedBlockIds,
  onSelectBlocks,
  startHour = 0,
}: CalendarDayColumnProps) {
  // Resize state
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
  const [resizeHeight, setResizeHeight] = useState<number | null>(null);
  const [justResized, setJustResized] = useState(false);
  // Store optimistic resize state to keep height after mouseup
  const [optimisticResizeBlock, setOptimisticResizeBlock] = useState<{ blockId: string, height: number } | null>(null);
  const resizeRef = useRef<{ startY: number, startHeight: number, expectedTime: number, startTime: Date, taskId: string } | null>(null);

  // Refs for values used inside resize handlers — prevents listener re-registration on every render
  const tasksRef = useRef(tasks);
  const onUpdateTaskRef = useRef(onUpdateTask);
  const onUpdateBlockRef = useRef(onUpdateBlock);
  const hourHeightRef = useRef(hourHeight);
  const snapIntervalRef = useRef(snapInterval);
  const resizeHeightRef = useRef(resizeHeight);
  useEffect(() => {
    tasksRef.current = tasks;
    onUpdateTaskRef.current = onUpdateTask;
    onUpdateBlockRef.current = onUpdateBlock;
    hourHeightRef.current = hourHeight;
    snapIntervalRef.current = snapInterval;
    resizeHeightRef.current = resizeHeight;
  }); // no dep array — cheap sync on every render

  // Global resize handlers — dep array is [resizingBlockId] only; all other values read via refs
  useEffect(() => {
    if (!resizingBlockId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;

      const hh = hourHeightRef.current;
      const snap = snapIntervalRef.current;
      const deltaY = e.clientY - resizeRef.current.startY;
      const rawCurrentHeight = Math.max(resizeRef.current.startHeight + deltaY, 15);

      const minutes = Math.round((rawCurrentHeight / (hh / 60)) / snap) * snap;
      const snappedHeight = minutes * (hh / 60);

      setResizeHeight(Math.max(snappedHeight, Math.max(16, snap * (hh / 60))));
    };

    const handleMouseUp = () => {
      const hh = hourHeightRef.current;
      if (resizingBlockId && resizeRef.current && onUpdateBlockRef.current) {
        const currentHeight = resizeHeightRef.current ?? resizeRef.current.startHeight;
        const durationMinutes = Math.round(currentHeight / (hh / 60));

        const endTime = new Date(resizeRef.current.startTime);
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);

        onUpdateBlockRef.current(resizingBlockId, resizeRef.current.startTime, endTime);

        if (onUpdateTaskRef.current && durationMinutes !== resizeRef.current.expectedTime) {
          const task = tasksRef.current.find(t => t.id === resizeRef.current?.taskId);
          if (task) {
            onUpdateTaskRef.current({ ...task, expectedTime: durationMinutes });
          }
        }

        setJustResized(true);
        setTimeout(() => setJustResized(false), 100);
      }

      const finalHeight = resizeHeightRef.current;
      if (finalHeight !== null && resizingBlockId) {
        setOptimisticResizeBlock({ blockId: resizingBlockId, height: finalHeight });
      }

      setResizingBlockId(null);
      setTimeout(() => {
        setResizeHeight(null);
        setOptimisticResizeBlock(null);
      }, 300);
      resizeRef.current = null;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingBlockId]); // resizeHeight removed — read via resizeHeightRef to prevent listener churn during resize

  const handleResizeStart = (e: React.MouseEvent, block: CalendarBlock | MultiMemberBlock, task: Task) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent drag start

    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    const startHeight = duration * (hourHeight / 60);

    setResizingBlockId(block.id);
    setResizeHeight(startHeight);
    resizeRef.current = {
      startY: e.clientY,
      startHeight: startHeight,
      expectedTime: task.expectedTime,
      startTime: start,
      taskId: task.id
    };
    document.body.style.cursor = 'ns-resize';
  };
  // Use provided layout or create default layout for blocks
  const dayBlocks = blocksWithLayout || calendarBlocks
    .filter(b => {
      const blockDate = format(new Date(b.startTime), 'yyyy-MM-dd');
      return blockDate === dateStr;
    })
    .map(block => ({
      block,
      layout: {
        columnIndex: 0,
        totalColumns: 1,
        widthPercent: 100,
        leftPercent: 0,
      } as BlockLayoutInfo,
    }));

  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isPreviewing = dragPreview?.dateStr === dateStr && draggingTask;

  return (
    <div
      className={`flex-1 border-r border-[#E9E9E7] last:border-r-0 relative group ${isSameDay(date, selectedDate) ? 'bg-orange-50/10' : isWeekend ? 'bg-[#FAFAFA]' : ''
        }`}
      onDragOver={(e) => onDragOverDay(e, dateStr)}
      onDrop={(e) => onDrop(e, dateStr)}
      onContextMenu={(e) => {
        e.preventDefault();

        // Calculate time from click position
        const rect = e.currentTarget.getBoundingClientRect();
        // Adjust for scroll position if the container is scrolled
        const y = e.clientY - rect.top;
        const minutes = startHour * 60 + Math.floor(y / (hourHeight / 60) / snapInterval) * snapInterval;

        const clickDate = new Date(date);
        clickDate.setHours(Math.floor(minutes / 60));
        clickDate.setMinutes(minutes % 60);

        // Pass the absolute right edge of the column for popover positioning
        const xOffset = rect.right;

        onContextMenu(e, undefined, undefined, clickDate, xOffset);
      }}
    >
      {/* Background Grid Lines */}
      {hours.map(hour => (
        <div
          key={hour}
          className="h-16 border-b border-[#E9E9E7] box-border w-full absolute left-0 right-0 pointer-events-none z-0"
          style={{ top: `${(hour - startHour) * hourHeight}px`, height: `${hourHeight}px` }}
        >
          {Array.from({ length: Math.floor(60 / snapInterval) - 1 }, (_, i) => i + 1).map(i => {
            const minuteOffset = i * snapInterval;
            const isHalfHour = minuteOffset % 30 === 0;
            return (
              <div
                key={i}
                className={`absolute w-full left-0 pointer-events-none border-t border-dashed ${isHalfHour ? 'border-gray-200' : 'border-gray-100'
                  }`}
                style={{ top: `${(minuteOffset / 60) * 100}%` }}
              />
            );
          })}
        </div>
      ))}

      {/* Current Time Line — updates every 60 s so the indicator stays accurate */}
      {isToday && <CurrentTimeLine startHour={startHour} hourHeight={hourHeight} />}

      {/* Ghost Blocks for Drag Preview */}
      {dragPreview && draggingTask && (
        <>
          {/* Single Drag Preview */}
          {!dragPreview.isMultiDrag && isPreviewing && (
            <div
              style={{
                top: `${(dragPreview.minutes - startHour * 60) * (hourHeight / 60)}px`,
                height: `${Math.max(draggingTask.expectedTime, 30) * (hourHeight / 60) - 1}px`,
                left: '2px',
                right: '2px',
              }}
              className="absolute z-30 rounded-md bg-accent/20 border-2 border-accent/50 pointer-events-none flex flex-col justify-start p-1.5"
            >
              <div className="font-medium text-accent-dark truncate leading-tight text-xs">
                {draggingTask.title}
              </div>
              <div className="text-[10px] text-accent font-medium mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {formatMinutesToTime(dragPreview.minutes)}
              </div>
            </div>
          )}

          {/* Multi Drag Preview */}
          {dragPreview.isMultiDrag && dragPreview.deltaMinutes !== undefined && calendarBlocks
            .filter(b => selectedBlockIds?.has(b.id))
            .map(block => {
              const task = block.task || tasks.find(t => t.id === block.taskId);
              if (!task) return null;

              const newStart = new Date(new Date(block.startTime).getTime() + dragPreview.deltaMinutes! * 60000);
              if (format(newStart, 'yyyy-MM-dd') !== dateStr) return null;

              const duration = (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000;
              const newMinutes = newStart.getHours() * 60 + newStart.getMinutes();

              const blockPxHeight = duration * (hourHeight / 60);
              const isMicroBlock = blockPxHeight < 14;
              const isSmallBlock = blockPxHeight < 22;

              return (
                <div
                  key={`ghost-${block.id}`}
                  style={{
                    top: `${(newMinutes - startHour * 60) * (hourHeight / 60)}px`,
                    height: `${Math.max(duration, 15) * (hourHeight / 60) - 1}px`,
                    left: '2px',
                    right: '2px',
                  }}
                  className={`absolute z-30 rounded-md bg-accent/20 border-2 border-accent/50 pointer-events-none flex flex-col justify-start ${isMicroBlock ? 'px-1 py-0' : isSmallBlock ? 'px-1 py-0.5' : 'p-1.5'}`}
                >
                  <div className={`font-medium text-accent-dark truncate leading-tight ${isMicroBlock ? 'text-[8px]' : isSmallBlock ? 'text-[9px]' : 'text-xs'}`}>
                    {task.title}
                  </div>
                  {!isSmallBlock && duration >= 45 && (
                    <div className="text-[10px] text-accent font-medium mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {formatMinutesToTime(newMinutes)}
                    </div>
                  )}
                </div>
              );
            })
          }
        </>
      )}

      {/* Tasks Layer */}
      <div className="absolute inset-0 z-10">
        {dayBlocks.map(({ block, layout }) => {
          // Use embedded task from block (for multi-member mode) or fallback to tasks array
          const task = block.task || tasks.find(t => t.id === block.taskId);
          if (!task) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Block has no task data:', { blockId: block.id, taskId: block.taskId, startTime: block.startTime, hasEmbeddedTask: !!block.task });
            }
            return null;
          }

          const style = getTaskStyle(block, task, layout);
          const isBeingDragged = draggingTask?.id === task.id;
          const isMultiMember = 'ownerName' in block;
          const isPendingBlock = 'isPendingAssignment' in block && block.isPendingAssignment;
          const isPreviewBlock = block.id === 'preview-block-temp';

          // Compute pixel height to adapt text density for short blocks.
          // During resize, use the live resize height so padding classes don't
          // oscillate (which would itself cause flicker).
          const blockDurationMin = (new Date(block.endTime).getTime() - new Date(block.startTime).getTime()) / 60000;
          const blockPxHeight = blockDurationMin * (hourHeight / 60);
          const isResizing = resizingBlockId === block.id;
          const hasOptimisticHeight = optimisticResizeBlock?.blockId === block.id;
          const liveHeight = isResizing && resizeHeight !== null
            ? resizeHeight
            : hasOptimisticHeight
              ? optimisticResizeBlock!.height
              : blockPxHeight;
          const isSmallBlock = liveHeight < 22;
          const isMicroBlock = liveHeight < 14;

          // Check if current user is a confirmed owner of the task
          const isConfirmedOwner = task.owners?.some(
            owner => owner.id === currentUserId && owner.status === 'confirmed'
          ) ?? false;

          // (isResizing and hasOptimisticHeight already computed above)
          const isSelected = selectedBlockIds?.has(block.id);

          // Apply resize height during active resize or optimistic state
          if ((isResizing && resizeHeight !== null) || hasOptimisticHeight) {
            const heightToUse = isResizing ? resizeHeight : optimisticResizeBlock!.height;
            style.height = `${heightToUse! - 1}px`;
            style.zIndex = 50; // Bring to front while resizing

            // Suppress hover-brightness and CSS transitions during resize.
            // As the block height changes on every mousemove, the cursor rapidly
            // crosses the block boundary, toggling :hover on and off. With
            // `transition-colors` active this produces a rapid gray↔white flicker.
            style.className = style.className
              .replace('hover:brightness-95', '')
              .replace('transition-colors', '');
          }

          // Optimistic block styling (translucent orange)
          if (block.id.startsWith('optimistic-') || task.id.startsWith('optimistic-')) {
            style.className = `${style.className} bg-orange-500/20 border-orange-500/30 text-orange-700 backdrop-blur-sm quick-add-target`;
          }

          if (isSelected) {
            style.className = `${style.className} ring-2 ring-accent ring-offset-[1px] shadow-md z-40`;
          }

          // Reduce padding for short blocks so text isn't clipped
          if (isMicroBlock) {
            style.className = style.className.replace('p-1.5', 'px-1 py-0');
          } else if (isSmallBlock) {
            style.className = style.className.replace('p-1.5', 'px-1 py-0.5');
          }

          // Allow dragging if user is confirmed owner and assignment is not pending and not preview
          // Optimistic blocks (ID starts with 'optimistic-') are always draggable
          const isOptimisticBlock = block.id.startsWith('optimistic-') || block.taskId.startsWith('optimistic-');
          const canDrag = (isConfirmedOwner && !isPendingBlock && !isPreviewBlock) || isOptimisticBlock;

          // Generate initials for multi-member blocks
          const getInitials = (name: string) => {
            return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          };

          return (
            <div
              key={`${block.id}-${task.expectedTime}`}
              style={style}
              className={`${style.className} ${isPreviewBlock ? 'pointer-events-none' : 'pointer-events-auto'} ${isBeingDragged ? 'opacity-50' : ''} ${!canDrag ? 'cursor-default' : ''} ${isPendingBlock ? 'opacity-50 border-dashed' : ''} ${isPreviewBlock ? 'opacity-50 cursor-not-allowed' : ''} group/block`}
              onClick={(e) => {
                e.stopPropagation();
                // Disable clicking on preview blocks
                if (isPreviewBlock) return;
                // Prevent modal from opening if we just finished resizing
                if (justResized) return;

                if ((e.shiftKey || e.metaKey || e.ctrlKey) && onSelectBlocks && selectedBlockIds) {
                  const newSelected = new Set(selectedBlockIds);
                  if (newSelected.has(block.id)) {
                    newSelected.delete(block.id);
                  } else {
                    newSelected.add(block.id);
                  }
                  onSelectBlocks(newSelected);
                  return;
                }

                if (selectedBlockIds && selectedBlockIds.size > 0 && onSelectBlocks) {
                  onSelectBlocks(new Set());
                }

                onTaskClick(task);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, task.id, block.id);
              }}
              draggable={canDrag && !resizingBlockId}
              onDragStart={(e) => canDrag && onDragStart(e, task, block.id, block.startTime)}
            >
              <div className={`font-medium truncate leading-none flex items-center gap-1 ${isMicroBlock ? 'text-[8px]' : isSmallBlock ? 'text-[9px]' : 'text-xs'}`}>
                {!isMicroBlock && isMultiMember && isMultiMemberMode && (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: block.ownerColor }}
                    title={block.ownerName}
                  >
                    {getInitials(block.ownerName)}
                  </div>
                )}
                {task.status === 'completed' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>}
                {task.title}
              </div>
              {!isSmallBlock && task.expectedTime >= 45 && (
                <div className="opacity-70 truncate mt-0.5 text-[10px] flex items-center gap-1">
                  <Clock size={10} /> {format(new Date(block.startTime), 'HH:mm')} ({isResizing ? Math.round((resizeHeight || 0) / (hourHeight / 60)) : task.expectedTime}m)
                </div>
              )}

              {/* Resize Handle */}
              {canDrag && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover/block:opacity-100 hover:bg-black/5 transition-opacity z-20 flex justify-center items-end pb-0.5"
                  onMouseDown={(e) => handleResizeStart(e, block, task)}
                >
                  {/* Visual indicator (optional, like small handle lines) */}
                  <div className="w-4 h-0.5 bg-gray-400/50 rounded-full mb-0.5"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
