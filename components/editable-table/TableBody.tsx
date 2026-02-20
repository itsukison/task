'use client';

import React from 'react';
import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { AcceptRejectButtons } from './cells/AcceptRejectButtons';

// Pre-create transparent drag image to prevent favicon from appearing during drag
const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

interface TableBodyProps<T extends { id: string }> {
    rows: Row<T>[];
    onRowClick?: (row: T) => void;
    onDragStart?: (rowId: string) => void;
    onDragEnd?: () => void;
    // Pending assignment handling
    isPendingRow?: (row: T) => boolean;
    onAcceptRow?: (rowId: string) => void;
    onRejectRow?: (rowId: string) => void;
    // Row separator logic
    isAssigned?: (row: T) => boolean;
    enableSeparator?: boolean;
}

export function TableBody<T extends { id: string }>({
    rows,
    onRowClick,
    onDragStart,
    onDragEnd,
    isPendingRow,
    onAcceptRow,
    onRejectRow,
    isAssigned,
    enableSeparator,
}: TableBodyProps<T>) {
    const handleDragStart = (e: React.DragEvent, row: Row<T>) => {
        onDragStart?.(row.original.id);
        e.dataTransfer.setData('rowId', row.original.id);
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
    };

    return (
        <div>
            {rows.map((row, index) => {
                const isPending = isPendingRow?.(row.original) ?? false;

                // Check if we need a separate visual style for unscheduled tasks
                const isUnscheduled = enableSeparator && isAssigned && !isAssigned(row.original);

                return (
                    <React.Fragment key={row.id}>
                        <div
                            draggable={!isPending}  // Don't allow dragging pending rows
                            onDragStart={(e) => !isPending && handleDragStart(e, row)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                'flex group border-b border-[#e0e0e0]',
                                'transition-colors',
                                isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f7f7f5] cursor-pointer',
                                // Mute unscheduled tasks when default sorting is active
                                isUnscheduled && 'opacity-55 grayscale-[0.5]'
                            )}
                            onClick={() => {
                                if (isPending) return;  // Disable clicking on pending rows
                                onRowClick?.(row.original);
                            }}
                        >
                            {row.getVisibleCells().map((cell, cellIndex) => (
                                <div
                                    key={cell.id}
                                    className={cn(
                                        'flex items-center',
                                        // Add left border for columns after drag and first data column
                                        cell.column.id !== 'drag' && cellIndex > 1 && 'border-l border-[#e0e0e0]'
                                    )}
                                    style={{ width: cell.column.getSize() }}
                                    onClick={(e) => {
                                        if (cell.column.id !== 'drag') {
                                            e.stopPropagation();
                                        }
                                    }}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                            ))}
                            {/* Accept/Reject buttons for pending rows */}
                            {isPending && onAcceptRow && onRejectRow && (
                                <div className="flex items-center -ml-4">
                                    <AcceptRejectButtons
                                        onAccept={() => onAcceptRow(row.original.id)}
                                        onReject={() => onRejectRow(row.original.id)}
                                    />
                                </div>
                            )}
                        </div>
                        {/* showSeparator removed */}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
