'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ResizableSplitViewProps {
    left: React.ReactNode;
    right: React.ReactNode;
    leftMinWidth?: number;
    rightMinWidth?: number;
    onLayoutChange?: (layout: {
        collapsedSide: 'left' | 'right' | null;
        overlayWidthPx: number;
        overlayWidthPercent: number;
        containerWidth: number;
    }) => void;
}

export default function ResizableSplitView({
    left,
    right,
    leftMinWidth = 400,
    rightMinWidth = 400,
    onLayoutChange,
}: ResizableSplitViewProps) {
    const [overlayWidthPercent, setOverlayWidthPercent] = useState<number>(50);
    const [collapsedSide, setCollapsedSide] = useState<'left' | 'right' | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    // Ref-based drag flag — avoids re-rendering children on every drag start/stop
    const isDraggingRef = useRef(false);
    // Tracks current width during drag so stopResize can commit to state once
    const liveWidthRef = useRef(overlayWidthPercent);

    // Apply position directly to DOM — no React re-render per pixel
    const applyWidth = useCallback((pct: number) => {
        liveWidthRef.current = pct;
        if (overlayRef.current) overlayRef.current.style.width = `${pct}%`;
        if (handleRef.current) handleRef.current.style.right = `${pct}%`;
    }, []);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDraggingRef.current = true;
        // Suppress CSS transition during drag for 1:1 mouse tracking
        if (overlayRef.current) overlayRef.current.style.transition = 'none';
        if (handleRef.current) handleRef.current.style.transition = 'none';
        // Apply cursor globally so it persists while pointer moves over children
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResize = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        // Restore transitions and cursor
        if (overlayRef.current) overlayRef.current.style.transition = '';
        if (handleRef.current) handleRef.current.style.transition = '';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // Commit final position to React state exactly once
        setOverlayWidthPercent(liveWidthRef.current);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - containerRect.left;
        const newOverlayWidth = ((containerRect.width - relativeX) / containerRect.width) * 100;

        const overlayPx = (newOverlayWidth / 100) * containerRect.width;
        const visibleCalendarPx = containerRect.width - overlayPx;

        if (visibleCalendarPx >= leftMinWidth && overlayPx >= rightMinWidth && newOverlayWidth > 0 && newOverlayWidth < 100) {
            applyWidth(newOverlayWidth);
        }
    // leftMinWidth and rightMinWidth are stable props — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applyWidth]);

    // Register listeners once — resize/stopResize are now stable
    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
        };
    }, [resize, stopResize]);

    const handleCollapseLeft = () => {
        setCollapsedSide('left');
    };

    const handleCollapseRight = () => {
        setCollapsedSide('right');
    };

    const handleRestore = () => {
        setCollapsedSide(null);
    };

    const computedOverlayWidth = collapsedSide === 'left' ? 100 : collapsedSide === 'right' ? 0 : overlayWidthPercent;

    useEffect(() => {
        if (!onLayoutChange || !containerRef.current) return;

        const emitLayout = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const overlayWidthPx = (computedOverlayWidth / 100) * containerWidth;

            onLayoutChange({
                collapsedSide,
                overlayWidthPx,
                overlayWidthPercent: computedOverlayWidth,
                containerWidth,
            });
        };

        emitLayout();

        const observer = new ResizeObserver(() => {
            emitLayout();
        });
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [collapsedSide, computedOverlayWidth, onLayoutChange]);

    return (
        <div ref={containerRef} className="h-full w-full overflow-hidden relative group/split">

            {/* Restore Button Left (When Left is Collapsed) */}
            <button
                onClick={handleRestore}
                className={`absolute top-2 left-3 z-50 text-gray-400 hover:text-gray-900 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${collapsedSide === 'left' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'
                    }`}
                title="Expand Calendar"
            >
                <ChevronsRight size={18} />
            </button>

            {/* Restore Button Right (When Right is Collapsed) */}
            <button
                onClick={handleRestore}
                className={`absolute top-2 right-3 z-50 text-gray-400 hover:text-gray-900 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${collapsedSide === 'right' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'
                    }`}
                title="Expand List"
            >
                <ChevronsLeft size={18} />
            </button>

            {/* Calendar Layer (always full-size) */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full">
                    {left}
                </div>
            </div>

            {/* Task Overlay Layer — width mutated directly during drag, React state on release */}
            <div
                ref={overlayRef}
                style={{ width: `${computedOverlayWidth}%` }}
                className="absolute right-0 top-0 h-full z-20 bg-white border-l border-[#E9E9E7] overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            >
                <div className="w-full h-full min-w-[300px]">
                    {right}
                </div>
            </div>

            {/* Resizer Handle — right position mutated directly during drag */}
            <div
                ref={handleRef}
                style={{ right: `${computedOverlayWidth}%` }}
                className={`absolute top-0 h-full w-4 -mr-2 hover:cursor-col-resize flex flex-col justify-center items-center z-50 group/divider transition-all duration-300 ${collapsedSide ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onMouseDown={startResize}
            >
                {/* Divider Line — color driven by CSS group-hover, no React state needed */}
                <div className="w-[2px] h-full transition-colors duration-300 bg-[#E9E9E7] group-hover/divider:bg-accent"></div>

                {/* Collapse Buttons */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0 transition-opacity duration-200 opacity-0 group-hover/divider:opacity-100">
                    <button
                        className="text-gray-400 hover:text-accent transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); handleCollapseLeft(); }}
                        title="Collapse Calendar"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        className="text-gray-400 hover:text-accent transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); handleCollapseRight(); }}
                        title="Collapse List"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
