'use client';

import React from 'react';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface TableHeaderProps<T> {
    headerGroups: HeaderGroup<T>[];
}

export function TableHeader<T>({ headerGroups }: TableHeaderProps<T>) {
    return (
        <div className="border-b border-[#e0e0e0]">
            {headerGroups.map(headerGroup => (
                <div key={headerGroup.id} className="flex">
                    {headerGroup.headers.map(header => (
                        <div
                            key={header.id}
                            className={cn(
                                'relative',
                                // Add left border for columns after drag and first data column
                                header.column.id !== 'drag' && header.index > 1 && 'border-l border-[#e0e0e0]',
                                'hover:bg-[#f5f5f5] transition-colors'
                            )}
                            style={{ width: header.getSize() }}
                        >
                            {flexRender(header.column.columnDef.header, header.getContext())}

                            {header.column.getCanResize() && (
                                <div
                                    onMouseDown={header.getResizeHandler()}
                                    onTouchStart={header.getResizeHandler()}
                                    className={cn(
                                        'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                                        'hover:bg-[#8ecae6] transition-colors',
                                        header.column.getIsResizing() && 'bg-[#8ecae6]'
                                    )}
                                />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}
