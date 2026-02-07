'use client';

import React, { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableColumn, AssignmentStatus } from '@/lib/types';
import { Cell } from './cells';
import { DataTypeIcon } from './utils';
import { AddColumnMenu } from './AddColumnMenu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface UseTableColumnsProps<T> {
    tableColumns: TableColumn<T>[];
    onCellChange: (rowId: string, columnId: string, value: unknown) => void;
    activeHeaderMenu: { columnId: string; position: { top: number; left: number } } | null;
    setActiveHeaderMenu: (menu: {
        columnId: string;
        position: { top: number; left: number };
        label: string;
        dataType: any;
        onSortAsc: () => void;
        onSortDesc: () => void;
        onHide: () => void;
        onDelete?: () => void;
    } | null) => void;
    handleSort: (columnId: string, desc: boolean) => void;
    onHideColumn?: (columnId: string) => void;
    onOpenRow?: (rowId: string) => void;
    handleRowActionClick: (e: React.MouseEvent, rowId: string) => void;
    getOwnerStatuses?: (row: T) => Record<string, AssignmentStatus>;
    // Custom column management
    customColumns?: any[];
    onAddCustomColumn?: (type: 'subtask' | 'document') => void;
    onRemoveCustomColumn?: (columnId: string) => void;
    onCreateSubtask?: (parentTaskId: string, title: string) => void;
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
    getOwnerStatuses,
    customColumns = [],
    onAddCustomColumn,
    onRemoveCustomColumn,
    onCreateSubtask,
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
                            position: { top: rect.bottom + 4, left: rect.left },
                            label: col.label,
                            dataType: col.dataType,
                            onSortAsc: () => handleSort(String(col.id), false),
                            onSortDesc: () => handleSort(String(col.id), true),
                            onHide: () => onHideColumn?.(String(col.id)),
                            // Standard columns cannot be deleted via this menu usually, or maybe they can?
                            // For now assuming standard columns don't have delete option here or it's disabled.
                            onDelete: undefined
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
                    </div>
                );
            },
            cell: ({ row, column }) => {
                const isFirstDataCol = tableColumns.findIndex(c => String(c.id) === column.id) === 0;

                return (
                    <div className="relative flex items-center w-full h-full">
                        <div className="flex-1 min-w-0">
                            <Cell
                                value={col.dataType === 'combinedTime' ? row.original : row.getValue(column.id)}
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.dataType}
                                options={col.options}
                                peopleOptions={col.peopleOptions}
                                ownerStatuses={col.dataType === 'people' && getOwnerStatuses ? getOwnerStatuses(row.original) : undefined}
                                onChange={onCellChange}
                                onCreateSubtask={col.dataType === 'subtask' ? onCreateSubtask : undefined}
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
            size: col.width || 150,
            enableResizing: true,
            minSize: col.minWidth || 100,
        }));

        // Append custom columns
        customColumns.forEach(col => {
            dataColumns.push({
                id: col.id,
                accessorKey: col.id,
                header: ({ column }) => {
                    const isMenuOpen = activeHeaderMenu?.columnId === col.id;
                    const isSorted = column.getIsSorted();

                    const handleHeaderClick = (e: React.MouseEvent) => {
                        if (isMenuOpen) {
                            setActiveHeaderMenu(null);
                        } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setActiveHeaderMenu({
                                columnId: col.id,
                                position: { top: rect.bottom + 4, left: rect.left },
                                label: col.label,
                                dataType: col.type,
                                onSortAsc: () => handleSort(col.id, false),
                                onSortDesc: () => handleSort(col.id, true),
                                onHide: () => onHideColumn?.(col.id),
                                onDelete: () => {
                                    // Custom columns can be deleted
                                    // We need to pass a callback here. 
                                    // For now we don't have a direct removeCustomColumn prop passed to useTableColumns.
                                    // We should probably add it to the props if we want to delete meaningful columns.
                                    // But wait, the task is to FIX "Delete Property".
                                    // If we don't have the function, we can't delete.
                                    // Use onAddCustomColumn as a proxy signal for now, but ideally we need onRemoveCustomColumn.
                                    if (onRemoveCustomColumn) {
                                        onRemoveCustomColumn(col.id);
                                    } else {
                                        console.warn('onRemoveCustomColumn not available');
                                    }
                                }
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
                                <DataTypeIcon dataType={col.type} />
                                <span>{col.label}</span>
                                {isSorted === 'asc' && <ChevronUp size={14} />}
                                {isSorted === 'desc' && <ChevronDown size={14} />}
                            </div>
                        </div>
                    );
                },
                cell: ({ row, column }) => (
                    <div className="relative flex items-center w-full h-full">
                        <div className="flex-1 min-w-0">
                            <Cell
                                value={(row.original as any)[col.id] || (col.type === 'subtask' ? [] : undefined)} // specific fallback for subtasks
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.type} // custom columns use 'type'
                                options={col.options}
                                onChange={onCellChange}
                                onCreateSubtask={col.type === 'subtask' ? onCreateSubtask : undefined}
                            />
                        </div>
                    </div>
                ),
                size: 180, // Default size for custom columns
                enableResizing: true,
                minSize: 140,
            });
        });

        // Add column button with menu
        const addColumn: ColumnDef<T> = {
            id: 'add',
            header: () => {
                const [showMenu, setShowMenu] = useState(false);

                const handleAddSubtask = () => {
                    onAddCustomColumn?.('subtask');
                    setShowMenu(false);
                };

                const handleAddDocument = () => {
                    onAddCustomColumn?.('document');
                    setShowMenu(false);
                };

                return (
                    <Popover open={showMenu} onOpenChange={setShowMenu}>
                        <PopoverTrigger asChild>
                            <div className="flex items-center justify-center h-full w-full text-[#9e9e9e] cursor-pointer hover:bg-gray-50 transition-colors">
                                <Plus size={16} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent
                            align="end"
                            className="p-0 w-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AddColumnMenu
                                onAddSubtask={handleAddSubtask}
                                onAddDocument={handleAddDocument}
                                canAddMore={customColumns.length < 2}
                            />
                        </PopoverContent>
                    </Popover>
                );
            },
            cell: () => null,
            size: 40,
            enableResizing: false,
        };

        return [dragColumn, ...dataColumns, addColumn];
    }, [tableColumns, onCellChange, activeHeaderMenu, onHideColumn, onOpenRow, setActiveHeaderMenu, handleSort, handleRowActionClick, getOwnerStatuses, customColumns, onAddCustomColumn, onRemoveCustomColumn, onCreateSubtask]);
}
