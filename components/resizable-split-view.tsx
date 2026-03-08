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
    const [isDragging, setIsDragging] = useState(false);
    const [collapsedSide, setCollapsedSide] = useState<'left' | 'right' | null>(null);
    const [isHoveringDivider, setIsHoveringDivider] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const startResize = useCallback(() => {
        setIsDragging(true);
    }, []);

    const stopResize = useCallback(() => {
        setIsDragging(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isDragging && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const relativeX = e.clientX - containerRect.left;
            const newOverlayWidth = ((containerRect.width - relativeX) / containerRect.width) * 100;

            // Enforce pixel-based min widths for both layers (calendar remains full-size under overlay)
            const overlayPx = (newOverlayWidth / 100) * containerRect.width;
            const visibleCalendarPx = containerRect.width - overlayPx;

            if (visibleCalendarPx >= leftMinWidth && overlayPx >= rightMinWidth && newOverlayWidth > 0 && newOverlayWidth < 100) {
                setCollapsedSide(null);
                setOverlayWidthPercent(newOverlayWidth);
            }
        }
    }, [isDragging, leftMinWidth, rightMinWidth]);

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
            <div
                className="absolute inset-0 z-0"
            >
                <div className="w-full h-full">
                    {left}
                </div>
            </div>

            {/* Task Overlay Layer */}
            <div
                style={{ width: `${computedOverlayWidth}%` }}
                className={`absolute right-0 top-0 h-full z-20 bg-white border-l border-[#E9E9E7] overflow-hidden ${isDragging ? '' : 'transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]'}`}
            >
                <div className="w-full h-full min-w-[300px]">
                    {right}
                </div>
            </div>

            {/* Resizer Handle - anchored to overlay's left edge */}
            <div
                style={{ right: `${computedOverlayWidth}%` }}
                className={`absolute top-0 h-full w-4 -mr-2 hover:cursor-col-resize flex flex-col justify-center items-center z-50 ${isDragging ? '' : 'transition-all duration-300'} ${collapsedSide ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                onMouseDown={startResize}
                onMouseEnter={() => setIsHoveringDivider(true)}
                onMouseLeave={() => setIsHoveringDivider(false)}
            >
                {/* Divider Line */}
                <div className={`w-[2px] h-full transition-colors duration-300 ${isDragging || isHoveringDivider ? 'bg-accent' : 'bg-[#E9E9E7]'}`}></div>

                {/* Collapse Buttons */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0 transition-opacity duration-200 ${isHoveringDivider ? 'opacity-100' : 'opacity-0'}`}>
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
