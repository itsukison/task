'use client';

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableColumn } from '@/lib/types';
import { Cell } from './cells';
import { HeaderMenu } from './menus';
import { DataTypeIcon } from './utils';

interface UseTableColumnsProps<T> {
    tableColumns: TableColumn<T>[];
    onCellChange: (rowId: string, columnId: string, value: unknown) => void;
    activeHeaderMenu: { columnId: string; position: { top: number; left: number } } | null;
    setActiveHeaderMenu: (menu: { columnId: string; position: { top: number; left: number } } | null) => void;
    handleSort: (columnId: string, desc: boolean) => void;
    onHideColumn?: (columnId: string) => void;
    onOpenRow?: (rowId: string) => void;
    handleRowActionClick: (e: React.MouseEvent, rowId: string) => void;
}

export function useTableColumns<T extends { id: string }>({
    tableColumns,
    onCellChange,
    activeHeaderMenu,
    setActiveHeaderMenu,
    handleSort,
    onHideColumn,
    onOpenRow,
    handleRowActionClick,
}: UseTableColumnsProps<T>) {
    return useMemo<ColumnDef<T>[]>(() => {
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
                            className={cn(
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
    }, [tableColumns, onCellChange, activeHeaderMenu, onHideColumn, onOpenRow, setActiveHeaderMenu, handleSort, handleRowActionClick]);
}
