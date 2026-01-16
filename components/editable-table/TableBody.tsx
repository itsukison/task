'use client';

import React from 'react';
import { flexRender, Row } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface TableBodyProps<T extends { id: string }> {
    rows: Row<T>[];
    onRowClick?: (row: T) => void;
    onDragStart?: (rowId: string) => void;
    onDragEnd?: () => void;
}

export function TableBody<T extends { id: string }>({
    rows,
    onRowClick,
    onDragStart,
    onDragEnd
}: TableBodyProps<T>) {
    const handleDragStart = (e: React.DragEvent, row: Row<T>) => {
        onDragStart?.(row.original.id);
        e.dataTransfer.setData('rowId', row.original.id);
        e.dataTransfer.effectAllowed = 'copyMove';

        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragEnd = () => {
        onDragEnd?.();
    };

    return (
        <div>
            {rows.map(row => (
                <div
                    key={row.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, row)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        'flex group border-b border-[#e0e0e0]',
                        'hover:bg-[#f7f7f5] transition-colors cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row.original)}
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
                </div>
            ))}
        </div>
    );
}
