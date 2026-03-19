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
    variant?: 'default' | 'minimal';
}

export function TableBody<T extends { id: string }>({
    rows,
    onRowClick,
    onDragStart,
    onDragEnd,
    isPendingRow,
    onAcceptRow,
    onRejectRow,
    variant = 'default',
}: TableBodyProps<T>) {
    const handleDragStart = (e: React.DragEvent, row: Row<T>) => {
        onDragStart?.(row.original.id);
        const task = row.original as any;
        e.dataTransfer.setData('task-row', '1');
        e.dataTransfer.setData('rowId', task.id);
        if (task.expectedTime) {
            e.dataTransfer.setData('duration', String(task.expectedTime));
        }
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setDragImage(transparentDragImage, 0, 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
    };

    return (
        <div>
            {rows.map((row) => {
                const isPending = isPendingRow?.(row.original) ?? false;
                const isSubtask = !!(row.original as any).parentTaskId;
                const isCompleted = (row.original as any).status === 'completed' || !!(row.original as any).parentCompleted;

                return (
                    <React.Fragment key={row.original.id}>
                        <div
                            data-row-id={row.original.id}
                            data-subtask={isSubtask ? 'true' : 'false'}
                            draggable={!isPending && !isSubtask}  // Don't allow dragging pending rows or subtasks
                            onDragStart={(e) => !isPending && !isSubtask && handleDragStart(e, row)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                                'flex group border-b border-[#e0e0e0]',
                                'transition-colors',
                                isSubtask && 'bg-[#fafafa]',
                                isSubtask && "h-10 [&_[data-table-cell='true']>div]:!py-2 [&_[data-table-cell='true']>input]:!py-2",
                                isCompleted && 'bg-[#f7f7f5]',
                                isPending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#f7f7f5] cursor-pointer',
                                // Strikethrough + muted text for completed rows
                                isCompleted && '[&_div]:line-through [&_div]:!text-[#b0b0b0] [&_input]:line-through [&_input]:!text-[#b0b0b0] [&_span]:line-through [&_span]:!text-[#b0b0b0]'
                            )}
                            onClick={() => {
                                if (isPending) return;  // Disable clicking on pending rows
                                onRowClick?.(row.original);
                            }}
                        >
                            {row.getVisibleCells().map((cell, cellIndex) => {
                                let cellStyle: React.CSSProperties = {
                                    width: cell.column.getSize(),
                                };

                                if (cell.column.id === 'title') {
                                    cellStyle = {
                                        flex: `1 1 ${cell.column.getSize()}px`,
                                        minWidth: Math.max(cell.column.columnDef.minSize ?? 160, 160),
                                    };
                                } else if (cell.column.id === 'actions') {
                                    cellStyle = {
                                        flex: `0 0 ${cell.column.getSize()}px`,
                                        width: cell.column.getSize(),
                                        minWidth: cell.column.getSize(),
                                        maxWidth: cell.column.getSize()
                                    };
                                } else {
                                    cellStyle = {
                                        flex: `0 1 ${cell.column.getSize()}px`,
                                        minWidth: cell.column.columnDef.minSize ?? 100,
                                    };
                                }
                                return (
                                    <div
                                        key={cell.id}
                                        data-table-cell="true"
                                        className={cn(
                                            'flex items-center',
                                            cellIndex > 0 && variant !== 'minimal' && 'border-l border-[#e0e0e0]'
                                        )}
                                        style={cellStyle}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                );
                            })}
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
