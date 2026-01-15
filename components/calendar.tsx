'use client';

import React, { useRef, useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Clock, Trash2 } from 'lucide-react';
import { Task, CalendarBlock, TaskStatus, CalendarProps } from '@/lib/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Calendar({
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
    viewDate
}: CalendarProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragPreview, setDragPreview] = useState<{ dateStr: string, minutes: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string } | null>(null);

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
        ? Array.from({ length: 5 }, (_, i) => addDays(currentWeekStart, i))
        : [viewDate];

    const getTaskStyle = (block: CalendarBlock, task: Task) => {
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
    };

    const formatMinutesToTime = (totalMinutes: number) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const handleDragOverDay = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (!draggingTask) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutes = Math.floor((offsetY / 64) * 60);
        const snapped = Math.max(0, Math.min(1440 - 15, Math.round(minutes / 15) * 15));

        setDragPreview({ dateStr, minutes: snapped });
    };

    const handleDragStartInternal = (e: React.DragEvent, task: Task) => {
        onDragStart(task.id);
        e.dataTransfer.setData('taskId', task.id);
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDrop = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        setDragPreview(null);
        onDragStart(null);
        const taskId = e.dataTransfer.getData('taskId');

        if (taskId && dragPreview) {
            const startTime = formatMinutesToTime(dragPreview.minutes);
            const task = tasks.find(t => t.id === taskId);

            if (task) {
                // TODO: Create calendar block via Supabase
                console.log('Create calendar block:', { task, dateStr, startTime });
            }
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden font-sans relative">

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-32 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { onDeleteTask(contextMenu.taskId); setContextMenu(null); }}
                        className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            )}

            {/* Days Header */}
            <div className="flex border-b border-[#E9E9E7] bg-white z-20 mr-[8px] mt-2">
                <div className="w-12 flex-shrink-0 bg-white border-r border-[#E9E9E7]"></div>
                {displayedDays.map((date) => {
                    const isToday = isSameDay(date, new Date());
                    const isSelected = isSameDay(date, selectedDate);

                    return (
                        <div
                            key={date.toISOString()}
                            className={`flex-1 py-2 text-center border-r border-[#E9E9E7] last:border-r-0 cursor-pointer transition-colors group relative ${isSelected ? 'bg-orange-50/30' : 'hover:bg-[#F7F7F5]'}`}
                            onClick={() => onSelectDate(date)}
                        >
                            <div className={`text-[11px] uppercase font-semibold ${isToday ? 'text-red-500' : 'text-[#9B9A97]'}`}>
                                {format(date, 'EEE')}
                            </div>
                            <div className={`text-xl font-normal mt-0.5 flex items-center justify-center mx-auto transition-all ${isToday
                                ? 'bg-red-500 text-white w-7 h-7 rounded-full'
                                : isSelected ? 'text-accent' : 'text-[#37352F]'
                                }`}>
                                {format(date, 'd')}
                            </div>
                            {isSelected && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"></div>}
                        </div>
                    );
                })}
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
                <div className="flex relative" style={{ height: HOURS.length * 64 }}>

                    {/* Time Column */}
                    <div className="w-12 border-r border-[#E9E9E7] flex-shrink-0 bg-white flex flex-col text-[10px] text-[#9B9A97] font-sans text-right pr-2 select-none">
                        {HOURS.map(hour => (
                            <div key={hour} className="h-16 relative">
                                <span className="-top-2 relative text-[#9B9A97]/60">{hour === 0 ? '' : `${hour}:00`}</span>
                            </div>
                        ))}
                    </div>

                    {/* Grid Columns */}
                    {displayedDays.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const dayBlocks = calendarBlocks.filter(b => {
                            const blockDate = format(new Date(b.startTime), 'yyyy-MM-dd');
                            return blockDate === dateStr;
                        });
                        const isToday = isSameDay(date, new Date());
                        const isPreviewing = dragPreview?.dateStr === dateStr && draggingTask;

                        return (
                            <div
                                key={dateStr}
                                className={`flex-1 border-r border-[#E9E9E7] last:border-r-0 relative group ${isSameDay(date, selectedDate) ? 'bg-orange-50/10' : ''}`}
                                onDragOver={(e) => handleDragOverDay(e, dateStr)}
                                onDrop={(e) => handleDrop(e, dateStr)}
                            >
                                {/* Background Grid Lines */}
                                {HOURS.map(hour => (
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
                                                    setContextMenu({ x: e.clientX, y: e.clientY, taskId: task.id });
                                                }}
                                                draggable
                                                onDragStart={(e) => handleDragStartInternal(e, task)}
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
                    })}
                </div>
            </div>
        </div>
    );
}
