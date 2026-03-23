'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Task, CalendarBlock, MultiMemberBlock } from '@/lib/types';

export interface UseBlockResizeParams {
    hourHeight: number;
    snapInterval: number;
    onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
    onUpdateTask?: (task: Task) => void;
    tasks: Task[];
}

export interface UseBlockResizeReturn {
    resizingBlockId: string | null;
    resizeHeight: number | null;
    justResized: boolean;
    optimisticResizeBlock: { blockId: string; height: number } | null;
    handleResizeStart: (e: React.MouseEvent, block: CalendarBlock | MultiMemberBlock, task: Task) => void;
}

export function useBlockResize({
    hourHeight,
    snapInterval,
    onUpdateBlock,
    onUpdateTask,
    tasks,
}: UseBlockResizeParams): UseBlockResizeReturn {
    const [resizingBlockId, setResizingBlockId] = useState<string | null>(null);
    const [resizeHeight, setResizeHeight] = useState<number | null>(null);
    const [justResized, setJustResized] = useState(false);
    const [optimisticResizeBlock, setOptimisticResizeBlock] = useState<{ blockId: string; height: number } | null>(null);

    const resizeRef = useRef<{ startY: number; startHeight: number; expectedTime: number; startTime: Date; taskId: string } | null>(null);

    // Refs for values used inside resize handlers — prevents listener re-registration on every render
    const tasksRef = useRef(tasks);
    const onUpdateTaskRef = useRef(onUpdateTask);
    const onUpdateBlockRef = useRef(onUpdateBlock);
    const hourHeightRef = useRef(hourHeight);
    const snapIntervalRef = useRef(snapInterval);
    const resizeHeightRef = useRef(resizeHeight);
    // Sync refs after every render — no dep array intentional (cheap, avoids stale closures)
    useLayoutEffect(() => {
        tasksRef.current = tasks;
        onUpdateTaskRef.current = onUpdateTask;
        onUpdateBlockRef.current = onUpdateBlock;
        hourHeightRef.current = hourHeight;
        snapIntervalRef.current = snapInterval;
        resizeHeightRef.current = resizeHeight;
    });

    useEffect(() => {
        document.body.style.cursor = resizingBlockId ? 'ns-resize' : '';
        return () => {
            document.body.style.cursor = '';
        };
    }, [resizingBlockId]);

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
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingBlockId]); // resizeHeight removed — read via resizeHeightRef to prevent listener churn

    const handleResizeStart = (e: React.MouseEvent, block: CalendarBlock | MultiMemberBlock, task: Task) => {
        e.stopPropagation();
        e.preventDefault();

        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
        const startHeight = duration * (hourHeight / 60);

        setResizingBlockId(block.id);
        setResizeHeight(startHeight);
        resizeRef.current = {
            startY: e.clientY,
            startHeight,
            expectedTime: task.expectedTime,
            startTime: start,
            taskId: task.id,
        };
    };

    return { resizingBlockId, resizeHeight, justResized, optimisticResizeBlock, handleResizeStart };
}
