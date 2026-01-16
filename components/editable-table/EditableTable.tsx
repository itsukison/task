'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnResizeMode,
    VisibilityState,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { EditableTableProps } from '@/lib/types';
import { RowActionsMenu } from './menus';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { useTableColumns } from './useTableColumns';

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

    const columns = useTableColumns({
        tableColumns,
        onCellChange,
        activeHeaderMenu,
        setActiveHeaderMenu,
        handleSort,
        onHideColumn,
        onOpenRow,
        handleRowActionClick,
    });

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

    return (
        <div className="w-full overflow-auto ml-2">
            <div className="inline-block min-w-full">
                {/* Header */}
                <TableHeader headerGroups={table.getHeaderGroups()} />

                {/* Body */}
                <TableBody
                    rows={table.getRowModel().rows}
                    onRowClick={onRowClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                />

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
