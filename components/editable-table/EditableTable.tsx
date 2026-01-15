'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    ColumnDef,
    SortingState,
    ColumnResizeMode,
    Row,
    VisibilityState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, GripVertical, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { EditableTableProps, TableColumn, SortConfig } from '@/lib/types';
import { Cell } from './cells';
import { HeaderMenu, RowActionsMenu } from './menus';
import { DataTypeIcon } from './utils';

// ============================================================================
// Main Table Component
// ============================================================================

export default function EditableTable<T extends { id: string }>({
    data,
    columns: tableColumns,
    onCellChange,
    onAddRow,
    onRowClick,
    onOpenRow,
    onDragStart,
    onDragEnd,
    onDeleteRow,
    onDuplicateRow,
    sorting: externalSorting,
    onSortChange,
    hiddenColumns = [],
    onHideColumn,
}: EditableTableProps<T>) {
    const [internalSorting, setInternalSorting] = useState<SortingState>([]);
    const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<{ columnId: string; position: { top: number; left: number } } | null>(null);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [activeRowMenu, setActiveRowMenu] = useState<{ rowId: string; position: { top: number; left: number } } | null>(null);

    // Sync external sorting with internal
    useEffect(() => {
        if (externalSorting) {
            setInternalSorting([{ id: externalSorting.columnId, desc: externalSorting.direction === 'desc' }]);
        } else {
            setInternalSorting([]);
        }
    }, [externalSorting]);

    // Sync hidden columns
    useEffect(() => {
        const visibility: VisibilityState = {};
        hiddenColumns.forEach(col => {
            visibility[col] = false;
        });
        setColumnVisibility(visibility);
    }, [hiddenColumns]);

    const handleSort = (columnId: string, desc: boolean) => {
        if (onSortChange) {
            onSortChange({ columnId, direction: desc ? 'desc' : 'asc' });
        } else {
            setInternalSorting([{ id: columnId, desc }]);
        }
    };

    const handleRowActionClick = (e: React.MouseEvent, rowId: string) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setActiveRowMenu({
            rowId,
            position: { top: rect.bottom + 4, left: rect.left }
        });
    };

    const columns = useMemo<ColumnDef<T>[]>(() => {
        // Row action handle column (hidden by default, visible on hover)
        const dragColumn: ColumnDef<T> = {
            id: 'drag',
            header: () => null,
            cell: ({ row }) => (
                <div
                    className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={(e) => handleRowActionClick(e, row.original.id)}
                >
                    <GripVertical size={14} className="text-[#9e9e9e] hover:text-[#37352F]" />
                </div>
            ),
            size: 28,
            enableResizing: false,
        };

        // Data columns
        const dataColumns: ColumnDef<T>[] = tableColumns.map((col) => ({
            id: String(col.id),
            accessorKey: col.id,
            header: ({ column }) => {
                const isMenuOpen = activeHeaderMenu?.columnId === String(col.id);
                const isSorted = column.getIsSorted();

                const handleHeaderClick = (e: React.MouseEvent) => {
                    if (isMenuOpen) {
                        setActiveHeaderMenu(null);
                    } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setActiveHeaderMenu({
                            columnId: String(col.id),
                            position: { top: rect.bottom + 4, left: rect.left }
                        });
                    }
                };

                return (
                    <div className="relative">
                        <div
                            className={clsx(
                                'flex items-center gap-1.5 px-2 py-2 h-[42px] cursor-pointer select-none font-medium text-sm',
                                isMenuOpen ? 'bg-[#ebebea] text-[#37352F]' : 'text-[#9e9e9e]'
                            )}
                            onClick={handleHeaderClick}
                        >
                            <DataTypeIcon dataType={col.dataType} />
                            <span>{col.label}</span>
                            {isSorted === 'asc' && <ChevronUp size={14} />}
                            {isSorted === 'desc' && <ChevronDown size={14} />}
                        </div>

                        {isMenuOpen && activeHeaderMenu && (
                            <HeaderMenu
                                label={col.label}
                                dataType={col.dataType}
                                columnId={String(col.id)}
                                position={activeHeaderMenu.position}
                                onSortAsc={() => handleSort(String(col.id), false)}
                                onSortDesc={() => handleSort(String(col.id), true)}
                                onHide={() => onHideColumn?.(String(col.id))}
                                onClose={() => setActiveHeaderMenu(null)}
                            />
                        )}
                    </div>
                );
            },
            cell: ({ row, column }) => {
                const isFirstDataCol = tableColumns.findIndex(c => String(c.id) === column.id) === 0;

                return (
                    <div className="relative flex items-center w-full h-full">
                        <div className="flex-1 min-w-0">
                            <Cell
                                value={row.getValue(column.id)}
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.dataType}
                                options={col.options}
                                onChange={onCellChange}
                            />
                        </div>
                        {/* OPEN button for first column - appears on row hover */}
                        {isFirstDataCol && onOpenRow && (
                            <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 text-xs text-[#9e9e9e] hover:text-[#37352F] hover:bg-gray-100 rounded border border-gray-200 mr-1 whitespace-nowrap"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenRow(row.original.id);
                                }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                </svg>
                                OPEN
                            </button>
                        )}
                    </div>
                );
            },
            size: col.width ?? 150,
            minSize: col.minWidth ?? 50,
        }));

        // Add column button
        const addColumn: ColumnDef<T> = {
            id: 'add',
            header: () => (
                <div className="flex items-center justify-center h-full w-full text-[#9e9e9e] cursor-pointer hover:bg-gray-50">
                    <Plus size={16} />
                </div>
            ),
            cell: () => null,
            size: 40,
            enableResizing: false,
        };

        return [dragColumn, ...dataColumns, addColumn];
    }, [tableColumns, onCellChange, activeHeaderMenu, onHideColumn, onOpenRow]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting: internalSorting,
            columnVisibility,
        },
        onSortingChange: setInternalSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        columnResizeMode,
        enableColumnResizing: true,
    });

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
        <div className="w-full overflow-auto ml-2">
            <div className="inline-block min-w-full">
                {/* Header */}
                <div className="border-b border-[#e0e0e0]">
                    {table.getHeaderGroups().map(headerGroup => (
                        <div key={headerGroup.id} className="flex">
                            {headerGroup.headers.map(header => (
                                <div
                                    key={header.id}
                                    className={clsx(
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
                                            className={clsx(
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

                {/* Body */}
                <div>
                    {table.getRowModel().rows.map(row => (
                        <div
                            key={row.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, row)}
                            onDragEnd={handleDragEnd}
                            className={clsx(
                                'flex group border-b border-[#e0e0e0]',
                                'hover:bg-[#f7f7f5] transition-colors cursor-pointer'
                            )}
                            onClick={() => onRowClick?.(row.original)}
                        >
                            {row.getVisibleCells().map((cell, cellIndex) => (
                                <div
                                    key={cell.id}
                                    className={clsx(
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

                {/* Add Row Button - aligned with first column */}
                <div
                    className="flex items-center gap-1.5 py-2 text-[#9e9e9e] text-sm cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                    onClick={onAddRow}
                    style={{ paddingLeft: 32 }} // Matches drag column width for alignment
                >
                    <Plus size={14} />
                    <span>New</span>
                </div>
            </div>

            {/* Row Actions Menu */}
            {activeRowMenu && (
                <RowActionsMenu
                    rowId={activeRowMenu.rowId}
                    position={activeRowMenu.position}
                    onDuplicate={() => onDuplicateRow?.(activeRowMenu.rowId)}
                    onDelete={() => onDeleteRow?.(activeRowMenu.rowId)}
                    onCopyLink={() => {
                        navigator.clipboard.writeText(`${window.location.href}?task=${activeRowMenu.rowId}`);
                    }}
                    onClose={() => setActiveRowMenu(null)}
                />
            )}
        </div>
    );
}
