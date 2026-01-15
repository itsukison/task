'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ResizableSplitViewProps {
    left: React.ReactNode;
    right: React.ReactNode;
    leftMinWidth?: number;
    rightMinWidth?: number;
}

export default function ResizableSplitView({
    left,
    right,
    leftMinWidth = 300,
    rightMinWidth = 400
}: ResizableSplitViewProps) {
    const [leftWidth, setLeftWidth] = useState<number>(50); // Percentage
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
            const newWidth = (relativeX / containerRect.width) * 100;

            if (newWidth > 15 && newWidth < 85) {
                setLeftWidth(newWidth);
            }
        }
    }, [isDragging]);

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

    const computedLeftWidth = collapsedSide === 'left' ? 0 : collapsedSide === 'right' ? 100 : leftWidth;

    return (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden relative group/split">

            {/* Restore Button Left (When Left is Collapsed) */}
            <button
                onClick={handleRestore}
                className={`absolute top-2 left-3 z-50 text-gray-400 hover:text-gray-900 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${collapsedSide === 'left' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 -translate-x-4 pointer-events-none'
                    }`}
                title="Expand List"
            >
                <ChevronsRight size={18} />
            </button>

            {/* Restore Button Right (When Right is Collapsed) */}
            <button
                onClick={handleRestore}
                className={`absolute top-2 right-3 z-50 text-gray-400 hover:text-gray-900 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${collapsedSide === 'right' ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'
                    }`}
                title="Expand Calendar"
            >
                <ChevronsLeft size={18} />
            </button>

            {/* Left Pane */}
            <div
                style={{ width: `${computedLeftWidth}%` }}
                className={`h-full overflow-hidden relative ${isDragging ? '' : 'transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]'}`}
            >
                <div className="w-full h-full min-w-[300px]">
                    {left}
                </div>
            </div>

            {/* Resizer Handle */}
            <div
                className={`w-4 -ml-2 hover:cursor-col-resize flex flex-col justify-center items-center relative z-50 transition-all duration-300 ${collapsedSide ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'
                    }`}
                onMouseDown={startResize}
                onMouseEnter={() => setIsHoveringDivider(true)}
                onMouseLeave={() => setIsHoveringDivider(false)}
            >
                {/* Divider Line */}
                <div className={`w-[2px] h-full transition-colors duration-300 ${isDragging || isHoveringDivider ? 'bg-accent' : 'bg-[#E9E9E7]'}`}></div>

                {/* Collapse Buttons */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-0 opacity-0 group-hover/split:opacity-100 transition-opacity duration-200 ${isHoveringDivider ? 'opacity-100' : ''}`}>
                    <button
                        className="text-gray-400 hover:text-accent transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); handleCollapseLeft(); }}
                        title="Collapse List"
                    >
                        <ChevronsLeft size={16} />
                    </button>
                    <button
                        className="text-gray-400 hover:text-accent transition-colors p-0.5"
                        onClick={(e) => { e.stopPropagation(); handleCollapseRight(); }}
                        title="Collapse Calendar"
                    >
                        <ChevronsRight size={16} />
                    </button>
                </div>
            </div>

            {/* Right Pane */}
            <div
                style={{ width: `${100 - computedLeftWidth}%` }}
                className={`h-full overflow-hidden relative ${isDragging ? '' : 'transition-[width] duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]'}`}
            >
                <div className="w-full h-full min-w-[400px]">
                    {right}
                </div>
            </div>
        </div>
    );
}
