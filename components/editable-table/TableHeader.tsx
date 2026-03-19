'use client';

import React from 'react';
import { flexRender, HeaderGroup } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface TableHeaderProps<T> {
    headerGroups: HeaderGroup<T>[];
    variant?: 'default' | 'minimal';
}

export function TableHeader<T>({ headerGroups, variant = 'default' }: TableHeaderProps<T>) {
    return (
        <div className="border-b border-[#e0e0e0]">
            {headerGroups.map(headerGroup => (
                <div key={headerGroup.id} className="flex">
                    {headerGroup.headers.map(header => {
                        let cellStyle: React.CSSProperties = {
                            width: header.getSize(),
                        };

                        if (header.column.id === 'title') {
                            cellStyle = {
                                flex: `1 1 ${header.getSize()}px`,
                                minWidth: Math.max(header.column.columnDef.minSize ?? 160, 160),
                            };
                        } else if (header.column.id === 'actions') {
                            cellStyle = {
                                flex: `0 0 ${header.getSize()}px`,
                                width: header.getSize(),
                                minWidth: header.getSize(),
                                maxWidth: header.getSize()
                            };
                        } else {
                            cellStyle = {
                                flex: `0 1 ${header.getSize()}px`,
                                minWidth: header.column.columnDef.minSize ?? 100,
                            };
                        }
                        return (
                            <div
                                key={header.id}
                                className={cn(
                                    'relative',
                                    // Add left border for all columns after the first column
                                    header.index > 0 && variant !== 'minimal' && 'border-l border-[#e0e0e0]',
                                    'hover:bg-[#f5f5f5] transition-colors'
                                )}
                                style={cellStyle}
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
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
