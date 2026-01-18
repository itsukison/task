'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { Task, CalendarBlock } from '@/lib/types';

interface CalendarDayColumnProps {
  date: Date;
  dateStr: string;
  selectedDate: Date;
  hours: number[];
  tasks: Task[];
  calendarBlocks: CalendarBlock[];
  draggingTask: Task | null;
  dragPreview: { dateStr: string; minutes: number } | null;
  getTaskStyle: (block: CalendarBlock, task: Task) => any;
  formatMinutesToTime: (minutes: number) => string;
  onDragOverDay: (e: React.DragEvent, dateStr: string) => void;
  onDrop: (e: React.DragEvent, dateStr: string) => void;
  onTaskClick: (task: Task) => void;
  onContextMenu: (e: React.MouseEvent, taskId: string, blockId: string) => void;
  onDragStart: (e: React.DragEvent, task: Task, blockId?: string) => void;
}

export const CalendarDayColumn = React.memo(function CalendarDayColumn({
  date,
  dateStr,
  selectedDate,
  hours,
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
  onDragStart
}: CalendarDayColumnProps) {
  const dayBlocks = calendarBlocks.filter(b => {
    const blockDate = format(new Date(b.startTime), 'yyyy-MM-dd');
    return blockDate === dateStr;
  });

  const isToday = isSameDay(date, new Date());
  const isPreviewing = dragPreview?.dateStr === dateStr && draggingTask;

  return (
    <div
      className={`flex-1 border-r border-[#E9E9E7] last:border-r-0 relative group ${
        isSameDay(date, selectedDate) ? 'bg-orange-50/10' : ''
      }`}
      onDragOver={(e) => onDragOverDay(e, dateStr)}
      onDrop={(e) => onDrop(e, dateStr)}
    >
      {/* Background Grid Lines */}
      {hours.map(hour => (
        <div
          key={hour}
          className="h-16 border-b border-[#E9E9E7] box-border w-full absolute left-0 right-0 pointer-events-none z-0"
          style={{ top: `${hour * 64}px` }}
        >
          <div className="absolute w-full border-t border-dashed border-gray-100 top-1/2 left-0"></div>
        </div>
      ))}

      {/* Current Time Line */}
      {isToday && (
        <div
          className="absolute left-0 right-0 border-t border-red-500 z-20 pointer-events-none flex items-center"
          style={{ top: `${(new Date().getHours() * 60 + new Date().getMinutes()) * (64 / 60)}px` }}
        >
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full -ml-[3px]"></div>
        </div>
      )}

      {/* Ghost Block for Drag Preview */}
      {isPreviewing && draggingTask && (
        <div
          style={{
            top: `${dragPreview!.minutes * (64 / 60)}px`,
            height: `${Math.max(draggingTask.expectedTime, 30) * (64 / 60) - 1}px`,
            left: '2px',
            right: '2px',
          }}
          className="absolute z-30 rounded-md bg-accent/20 border-2 border-accent/50 pointer-events-none transition-all duration-75 flex flex-col justify-start p-1.5"
        >
          <div className="font-medium text-accent-dark truncate leading-tight text-xs">
            {draggingTask.title}
          </div>
          <div className="text-[10px] text-accent font-medium mt-0.5 flex items-center gap-1">
            <Clock size={10} />
            {formatMinutesToTime(dragPreview!.minutes)}
          </div>
        </div>
      )}

      {/* Tasks Layer */}
      <div className="absolute inset-0 z-10">
        {dayBlocks.map(block => {
          const task = tasks.find(t => t.id === block.taskId);
          if (!task) return null;

          const style = getTaskStyle(block, task);
          const isBeingDragged = draggingTask?.id === task.id;

          return (
            <div
              key={block.id}
              style={style}
              className={`${style.className} pointer-events-auto ${isBeingDragged ? 'opacity-50' : ''}`}
              onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContextMenu(e, task.id, block.id);
              }}
              draggable
              onDragStart={(e) => onDragStart(e, task, block.id)}
            >
              <div className="font-medium truncate leading-tight flex items-center gap-1.5">
                {task.status === 'completed' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>}
                {task.title}
              </div>
              {task.expectedTime >= 45 && (
                <div className="opacity-70 truncate mt-0.5 text-[10px] flex items-center gap-1">
                  <Clock size={10} /> {format(new Date(block.startTime), 'HH:mm')} ({task.expectedTime}m)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
