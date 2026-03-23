/**
 * @deprecated This component is no longer used in the main workspace view.
 * The application has switched to the 'minimal' fast-list variant (FastSection/FastTaskRow).
 * This file is preserved for reference or potential future restoration of the detailed table view.
 */
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { RowActionsMenu } from './menus/RowActionsMenu';
import { HeaderMenu } from './menus/HeaderMenu';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { useTableColumns } from './useTableColumns';
import { EditableTableProvider } from './EditableTableContext';

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
    isPendingRow,
    onAcceptRow,
    onRejectRow,
    getOwnerStatuses,
    customColumns = [],
    onAddCustomColumn,
    onRemoveCustomColumn,
    onCreateSubtask,
    onAddSubtask: onAddSubtaskProp,
    onToggleSubtasks,
    expandedSubtaskParentIds,
    subtaskCountMap,
    variant = 'default',
    minimalHeaderContent,
    ...props
}: EditableTableProps<T>) {
    const [internalSorting, setInternalSorting] = useState<SortingState>([]);
    const [columnResizeMode] = useState<ColumnResizeMode>('onChange');
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<{
        columnId: string;
        position: { top: number; left: number };
        label: string;
        dataType: any;
        onSortAsc: () => void;
        onSortDesc: () => void;
        onHide: () => void;
        onDelete?: () => void;
    } | null>(null);
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

    const handleSort = useCallback((columnId: string, desc: boolean) => {
        if (onSortChange) {
            onSortChange({ columnId, direction: desc ? 'desc' : 'asc' });
        } else {
            setInternalSorting([{ id: columnId, desc }]);
        }
    }, [onSortChange]);

    const handleRowActionClick = useCallback((e: React.MouseEvent, rowId: string) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setActiveRowMenu({
            rowId,
            position: { top: rect.bottom + 4, left: rect.left }
        });
    }, []);

    const [focusRowId, setFocusRowId] = useState<string | null>(null);

    const handleAddRow = useCallback(async () => {
        const newRow = await onAddRow();
        if (newRow && typeof newRow === 'object' && 'id' in newRow) {
            setFocusRowId(String((newRow as any).id));
        }
    }, [onAddRow]);

    const handleAddSubtask = useCallback(async (parentId: string) => {
        const newTask = await onAddSubtaskProp?.(parentId);
        if (newTask && typeof newTask === 'object' && 'id' in newTask) {
            setFocusRowId(String((newTask as any).id));
        }
    }, [onAddSubtaskProp]);

    // Clear focusRowId after a longer delay so the cell has time to mount
    // and receive focus (server data may not have arrived yet for optimistic rows).
    useEffect(() => {
        if (!focusRowId) return;
        const id = setTimeout(() => setFocusRowId(null), 500);
        return () => clearTimeout(id);
    }, [focusRowId]);

    const columns = useTableColumns({
        tableColumns,
        onCellChange,
        activeHeaderMenu,
        setActiveHeaderMenu,
        handleSort,
        onHideColumn,
        onOpenRow,
        handleRowActionClick,
        getOwnerStatuses,
        customColumns,
        onAddCustomColumn,
        onRemoveCustomColumn,
        onCreateSubtask,
        onAddSubtask: onAddSubtaskProp ? handleAddSubtask : undefined,
        onToggleSubtasks,
        expandedSubtaskParentIds,
        subtaskCountMap,
        focusRowId,
        onEnter: handleAddRow,
        onDeleteRow,
        variant,
    });

    const table = useReactTable({
        data,
        columns,
        getRowId: (row) => row.id,
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
        <EditableTableProvider>
            <div className={`w-full overflow-hidden ${variant === 'minimal' ? 'border border-[#e0e0e0] rounded-xl' : ''}`}>
                <div className="w-full">
                    {/* Header */}
                    {variant === 'minimal' ? (
                        <div className="border-b border-[#e0e0e0]">
                            <div className="flex items-center justify-between px-2 py-2 h-[42px] text-[11px] font-semibold">
                                {minimalHeaderContent}
                            </div>
                        </div>
                    ) : (
                        <TableHeader headerGroups={table.getHeaderGroups()} variant={variant} />
                    )}

                    {/* Body */}
                    <TableBody
                        rows={table.getRowModel().rows}
                        onRowClick={onRowClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        isPendingRow={isPendingRow}
                        onAcceptRow={onAcceptRow}
                        onRejectRow={onRejectRow}
                        isAssigned={props.isAssigned}
                        enableSeparator={props.isAssigned && !externalSorting} // Only show separator when using default sort
                        variant={variant}
                    />

                    {/* Add Row Button - aligned with first column */}
                    <div
                        className="flex items-center justify-end gap-1.5 py-2 px-4 text-[#9e9e9e] text-sm cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                        onClick={handleAddRow}
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
                        onAddSubtask={
                            // Only show "Add subtask" for top-level tasks
                            onAddSubtaskProp && !((data.find(d => d.id === activeRowMenu.rowId) as any)?.parentTaskId)
                                ? () => handleAddSubtask(activeRowMenu.rowId)
                                : undefined
                        }
                    />
                )}

                {/* Header Menu */}
                {activeHeaderMenu && (
                    <HeaderMenu
                        {...activeHeaderMenu}
                        onClose={() => setActiveHeaderMenu(null)}
                    />
                )}
            </div>
        </EditableTableProvider>
    );
}
