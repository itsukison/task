'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronRight, Plus, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableColumn, AssignmentStatus } from '@/lib/types';
import { Cell } from './cells';
import { DataTypeIcon } from './utils';

const formatTimeRange = (startTime: unknown, expectedTime: unknown): string | undefined => {
    if (typeof startTime !== 'string') return undefined;

    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) return undefined;

    const durationMinutes = typeof expectedTime === 'number' ? expectedTime : Number(expectedTime);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return undefined;

    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
    const formatPart = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    return `${formatPart(startDate)}–${formatPart(endDate)}`;
};

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
    // Inline subtask row actions
    onAddSubtask?: (parentId: string) => void;
    onToggleSubtasks?: (parentId: string) => void;
    expandedSubtaskParentIds?: Set<string>;
    subtaskCountMap?: Map<string, number>;
    onDeleteRow?: (rowId: string) => void;
    // Row focus management
    focusRowId?: string | null;
    onEnter?: () => void;
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
    onAddSubtask,
    onToggleSubtasks,
    expandedSubtaskParentIds,
    subtaskCountMap,
    focusRowId,
    onEnter,
    onDeleteRow,
}: UseTableColumnsProps<T>) {
    // Refs for high-churn values so they don't trigger useMemo recomputation
    const focusRowIdRef = useRef(focusRowId);
    const expandedRef = useRef(expandedSubtaskParentIds);
    const subtaskCountRef = useRef(subtaskCountMap);
    useEffect(() => {
        focusRowIdRef.current = focusRowId;
        expandedRef.current = expandedSubtaskParentIds;
        subtaskCountRef.current = subtaskCountMap;
    });

    return useMemo<ColumnDef<T>[]>(() => {
        // dragColumn removed — actions moved to right-side actionsColumn

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
            // In the cell definition for data columns, replace the cell render function:

            cell: ({ row, column }) => {
                const isFirstDataCol = tableColumns.findIndex(c => String(c.id) === column.id) === 0;
                const isCompleted = isFirstDataCol && (row.original as any).status === 'completed';
                const scheduleTimeRange = isFirstDataCol
                    ? formatTimeRange((row.original as any).startTime, (row.original as any).expectedTime) || '-'
                    : undefined;
                const parentTaskId = (row.original as any).parentTaskId as string | undefined;
                const isSubtask = !!parentTaskId;
                const hasSubtasks = isFirstDataCol && !isSubtask && (subtaskCountRef.current?.get(row.original.id) ?? 0) > 0;
                const isExpanded = isFirstDataCol && (expandedRef.current?.has(row.original.id) ?? false);

                return (
                    <div
                        className="relative flex items-center w-full h-full overflow-hidden"
                        style={isSubtask && isFirstDataCol ? { paddingLeft: '36px' } : undefined}
                    >
                        {/* Chevron toggle — visible whenever task has subtasks */}
                        {hasSubtasks && (
                            <button
                                className="flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 mr-2 text-[#9e9e9e] hover:text-[#37352F] transition-colors opacity-0 group-hover:opacity-100"
                                onClick={(e) => { e.stopPropagation(); onToggleSubtasks?.(row.original.id); }}
                            >
                                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            </button>
                        )}
                        {/* Add-subtask button in left slot when no subtasks exist */}
                        {isFirstDataCol && !hasSubtasks && !isSubtask && subtaskCountRef.current !== undefined && (
                            onAddSubtask ? (
                                <button
                                    className="flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 mr-2 text-[#9e9e9e] hover:text-[#37352F] transition-colors opacity-0 group-hover:opacity-100"
                                    onClick={(e) => { e.stopPropagation(); onAddSubtask(row.original.id); }}
                                >
                                    <Plus size={11} />
                                </button>
                            ) : (
                                <span className="flex-shrink-0 w-3.5 mr-2" />
                            )
                        )}
                        {/* Completion checkbox — only in title column */}
                        {isFirstDataCol && (
                            <button
                                className="flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 ml-0 mr-1 rounded-[4px] border border-[#c0c0c0] hover:border-[#7a7a7a] transition-colors bg-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCellChange(
                                        row.original.id,
                                        'status',
                                        (row.original as any).status === 'completed' ? 'planned' : 'completed'
                                    );
                                }}
                            >
                                {isCompleted && <Check size={9} className="text-[#9e9e9e]" />}
                            </button>
                        )}
                        {/* Text */}
                        <div className={cn('w-full min-w-0 transition-[padding] duration-200', isFirstDataCol && onOpenRow && 'pr-2 group-hover:pr-[70px]')}>
                            <Cell
                                value={col.dataType === 'combinedTime' ? row.original : row.getValue(column.id)}
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.dataType}
                                secondaryText={col.dataType === 'text' && isFirstDataCol ? scheduleTimeRange : undefined}
                                options={col.options}
                                peopleOptions={col.peopleOptions}
                                ownerStatuses={col.dataType === 'people' && getOwnerStatuses ? getOwnerStatuses(row.original) : undefined}
                                onChange={onCellChange}
                                onCreateSubtask={col.dataType === 'subtask' ? onCreateSubtask : undefined}
                                autoFocus={focusRowIdRef.current === row.original.id && isFirstDataCol}
                                preventBlurOnEnter={isFirstDataCol && col.dataType === 'text' && isSubtask && !!onAddSubtask}
                                onEnter={
                                    isFirstDataCol && col.dataType === 'text'
                                        ? (isSubtask && onAddSubtask
                                            ? () => onAddSubtask(parentTaskId!)
                                            : onEnter)
                                        : undefined
                                }
                            />
                        </div>
                        {/* OPEN button — absolutely positioned, overlays the text on hover */}
                        {isFirstDataCol && onOpenRow && (
                            <button
                                className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 text-xs text-[#9e9e9e] hover:text-[#37352F] hover:bg-gray-100 rounded border border-gray-200 whitespace-nowrap bg-white"
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

        // Right-side actions column (delete on hover)
        const actionsColumn: ColumnDef<T> = {
            id: 'actions',
            header: () => null,
            cell: ({ row }) => {
                return (
                    <div className="flex items-center justify-end h-full opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        <button
                            className="flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-[#9e9e9e] hover:text-red-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); onDeleteRow?.(row.original.id); }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                );
            },
            size: 32,
            enableResizing: false,
        };

        return [...dataColumns, actionsColumn];
    }, [tableColumns, onCellChange, activeHeaderMenu, onHideColumn, onOpenRow, setActiveHeaderMenu, handleSort, handleRowActionClick, getOwnerStatuses, customColumns, onAddCustomColumn, onRemoveCustomColumn, onCreateSubtask, onAddSubtask, onToggleSubtasks, onDeleteRow]);
}
