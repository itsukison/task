'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronRight, ChevronLeft, Plus, Check, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableColumn, AssignmentStatus } from '@/lib/types';
import { Cell } from './cells';
import { DataTypeIcon } from './utils';
import { useLanguage } from '@/lib/i18n';
import { formatTimeRange } from '@/lib/utils/time-helpers';



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
    // Visual variant
    variant?: 'default' | 'minimal';
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
    variant = 'default',
}: UseTableColumnsProps<T>) {
    const { t } = useLanguage();
    // Refs for high-churn values so they don't trigger useMemo recomputation
    const focusRowIdRef = useRef(focusRowId);
    // Sync focusRowId during render so cells see the new value on the first render pass
    focusRowIdRef.current = focusRowId;
    const expandedRef = useRef(expandedSubtaskParentIds);
    const subtaskCountRef = useRef(subtaskCountMap);
    // Ref-ify all callback props to prevent column definition recomputation
    const onCellChangeRef = useRef(onCellChange);
    const onDeleteRowRef = useRef(onDeleteRow);
    const onAddSubtaskRef = useRef(onAddSubtask);
    const onToggleSubtasksRef = useRef(onToggleSubtasks);
    const onOpenRowRef = useRef(onOpenRow);
    const getOwnerStatusesRef = useRef(getOwnerStatuses);
    const onCreateSubtaskRef = useRef(onCreateSubtask);
    const setActiveHeaderMenuRef = useRef(setActiveHeaderMenu);
    const handleSortRef = useRef(handleSort);
    const onHideColumnRef = useRef(onHideColumn);
    const onEnterRef = useRef(onEnter);
    const handleRowActionClickRef = useRef(handleRowActionClick);
    const onRemoveCustomColumnRef = useRef(onRemoveCustomColumn);
    useEffect(() => {
        expandedRef.current = expandedSubtaskParentIds;
        subtaskCountRef.current = subtaskCountMap;
        onCellChangeRef.current = onCellChange;
        onDeleteRowRef.current = onDeleteRow;
        onAddSubtaskRef.current = onAddSubtask;
        onToggleSubtasksRef.current = onToggleSubtasks;
        onOpenRowRef.current = onOpenRow;
        getOwnerStatusesRef.current = getOwnerStatuses;
        onCreateSubtaskRef.current = onCreateSubtask;
        setActiveHeaderMenuRef.current = setActiveHeaderMenu;
        handleSortRef.current = handleSort;
        onHideColumnRef.current = onHideColumn;
        onEnterRef.current = onEnter;
        handleRowActionClickRef.current = handleRowActionClick;
        onRemoveCustomColumnRef.current = onRemoveCustomColumn;
    });

    return useMemo<ColumnDef<T>[]>(() => {
        // Data columns
        const dataColumns: ColumnDef<T>[] = tableColumns.map((col) => ({
            id: String(col.id),
            accessorKey: col.id,
            header: ({ column }) => {
                const isMenuOpen = activeHeaderMenu?.columnId === String(col.id);
                const isSorted = column.getIsSorted();

                const handleHeaderClick = (e: React.MouseEvent) => {
                    if (isMenuOpen) {
                        setActiveHeaderMenuRef.current(null);
                    } else {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setActiveHeaderMenuRef.current({
                            columnId: String(col.id),
                            position: { top: rect.bottom + 4, left: rect.left },
                            label: col.label,
                            dataType: col.dataType,
                            onSortAsc: () => handleSortRef.current(String(col.id), false),
                            onSortDesc: () => handleSortRef.current(String(col.id), true),
                            onHide: () => onHideColumnRef.current?.(String(col.id)),
                            onDelete: undefined
                        });
                    }
                };

                return (
                    <div className="relative">
                        <div
                            className={cn(
                                'flex items-center gap-1.5 px-2 py-2 h-[42px] cursor-pointer select-none font-medium text-[12px]',
                                isMenuOpen ? 'bg-[#ebebea] text-[#37352F]' : 'text-[#9e9e9e]'
                            )}
                            onClick={handleHeaderClick}
                        >
                            <DataTypeIcon dataType={col.dataType} />
                            <span className="whitespace-nowrap">{col.label}</span>
                            {isSorted === 'asc' && <ChevronUp size={14} />}
                            {isSorted === 'desc' && <ChevronDown size={14} />}
                        </div>
                    </div>
                );
            },

            cell: ({ row, column }) => {
                const isFirstDataCol = tableColumns.findIndex(c => String(c.id) === column.id) === 0;
                const parentTaskId = (row.original as any).parentTaskId as string | undefined;
                const isSubtask = !!parentTaskId;
                const isCompleted = isFirstDataCol && (row.original as any).status === 'completed';
                const scheduleTimeRange = isFirstDataCol && !isSubtask
                    ? formatTimeRange((row.original as any).startTime, (row.original as any).expectedTime) || '-'
                    : undefined;
                const hasSubtasks = isFirstDataCol && !isSubtask && (subtaskCountRef.current?.get(row.original.id) ?? 0) > 0;
                const isExpanded = isFirstDataCol && (expandedRef.current?.has(row.original.id) ?? false);

                return (
                    <div
                        className={cn(
                            'relative flex items-center w-full h-full',
                            variant === 'minimal' ? 'pl-0' : 'pl-0',
                            variant === 'minimal' && isFirstDataCol && col.dataType === 'text'
                                ? 'overflow-visible'
                                : 'overflow-hidden'
                        )}
                        style={isSubtask && isFirstDataCol ? { paddingLeft: variant === 'minimal' ? '40px' : '40px' } : undefined}
                    >
                        {/* Drag Handle Affordance */}
                        {isFirstDataCol && (
                            <div 
                                className={cn(
                                    "flex-shrink-0 flex items-center justify-center w-4 h-4 text-[#c0c0c0] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing",
                                    variant === 'minimal' ? "mr-[3px]" : "mr-0.5"
                                )}
                            >
                                <GripVertical size={14} />
                            </div>
                        )}
                        {/* Completion checkbox — only in title column */}
                        {isFirstDataCol && (
                            <button
                                className={cn(
                                    "flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 ml-0 mr-2 rounded-[4px] border transition-colors",
                                    isCompleted
                                        ? "bg-[#FF5500] border-[#FF5500]"
                                        : "bg-white border-[#c0c0c0] hover:border-[#7a7a7a]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCellChangeRef.current(
                                        row.original.id,
                                        'status',
                                        (row.original as any).status === 'completed' ? 'planned' : 'completed'
                                    );
                                }}
                            >
                                {isCompleted && <Check size={9} className="text-white" />}
                            </button>
                        )}
                        {/* Text */}
                        <div className={cn('w-full min-w-0', isFirstDataCol && 'pr-2')}>
                            <Cell
                                value={col.dataType === 'combinedTime' ? row.original : row.getValue(column.id)}
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.dataType}
                                secondaryText={col.dataType === 'text' && isFirstDataCol ? scheduleTimeRange : undefined}
                                options={col.options}
                                peopleOptions={col.peopleOptions}
                                ownerStatuses={col.dataType === 'people' && getOwnerStatusesRef.current ? getOwnerStatusesRef.current(row.original) : undefined}
                                onChange={onCellChangeRef.current}
                                onCreateSubtask={col.dataType === 'subtask' ? onCreateSubtaskRef.current : undefined}
                                autoFocus={focusRowIdRef.current === row.original.id && isFirstDataCol}
                                preventBlurOnEnter={isFirstDataCol && col.dataType === 'text' && isSubtask && !!onAddSubtaskRef.current}
                                hideNames={column.id === 'ownerIds'}
                                editMode={variant === 'minimal' && isFirstDataCol && col.dataType === 'text' ? 'pencil' : 'direct'}
                                onDeleteEmptyRow={isFirstDataCol && col.dataType === 'text' ? onDeleteRowRef.current : undefined}
                                onEnter={
                                    isFirstDataCol && col.dataType === 'text'
                                        ? (isSubtask && onAddSubtaskRef.current
                                            ? () => onAddSubtaskRef.current!(parentTaskId!)
                                            : onEnterRef.current)
                                        : undefined
                                }
                            />
                        </div>
                        {/* Right Slot Actions moved to actions column */}
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
                            setActiveHeaderMenuRef.current(null);
                        } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setActiveHeaderMenuRef.current({
                                columnId: col.id,
                                position: { top: rect.bottom + 4, left: rect.left },
                                label: col.label,
                                dataType: col.type,
                                onSortAsc: () => handleSortRef.current(col.id, false),
                                onSortDesc: () => handleSortRef.current(col.id, true),
                                onHide: () => onHideColumnRef.current?.(col.id),
                                onDelete: () => {
                                    if (onRemoveCustomColumnRef.current) {
                                        onRemoveCustomColumnRef.current(col.id);
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
                                    'flex items-center gap-1.5 px-2 py-2 h-[42px] cursor-pointer select-none font-medium text-[12px]',
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
                                value={(row.original as any)[col.id] || (col.type === 'subtask' ? [] : undefined)}
                                rowId={row.original.id}
                                columnId={column.id}
                                dataType={col.type}
                                options={col.options}
                                onChange={onCellChangeRef.current}
                                onCreateSubtask={col.type === 'subtask' ? onCreateSubtaskRef.current : undefined}
                            />
                        </div>
                    </div>
                ),
                size: 180,
                enableResizing: true,
                minSize: 140,
            });
        });

        // Right-side actions column (delete on hover)
        const actionsColumn: ColumnDef<T> = {
            id: 'actions',
            header: () => null,
            cell: ({ row }) => {
                const parentTaskId = (row.original as any).parentTaskId as string | undefined;
                const isSubtask = !!parentTaskId;
                const hasSubtasks = !isSubtask && (subtaskCountRef.current?.get(row.original.id) ?? 0) > 0;
                const isExpanded = expandedRef.current?.has(row.original.id) ?? false;
                return (
                    <div className="flex items-center justify-end h-full px-1 gap-0.5">
                        {isSubtask ? (
                            onAddSubtaskRef.current && (
                                <button
                                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 text-[#9e9e9e] hover:text-[#37352F] hover:bg-gray-100 rounded transition-all cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onAddSubtaskRef.current!(parentTaskId!); }}
                                >
                                    <Plus size={14} />
                                </button>
                            )
                        ) : hasSubtasks ? (
                            <button
                                className="flex items-center justify-center w-5 h-5 text-[#9e9e9e] hover:text-[#37352F] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onToggleSubtasksRef.current?.(row.original.id); }}
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            onAddSubtaskRef.current && (
                                <button
                                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 text-[#9e9e9e] hover:text-[#37352F] hover:bg-gray-100 rounded transition-all cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); onAddSubtaskRef.current!(row.original.id); }}
                                >
                                    <Plus size={14} />
                                </button>
                            )
                        )}
                        <button
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded hover:bg-red-50 text-[#9e9e9e] hover:text-red-400 transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onDeleteRowRef.current?.(row.original.id); }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                );
            },
            size: 56,
            enableResizing: false,
        };

        return [...dataColumns, actionsColumn];
    }, [tableColumns, activeHeaderMenu, customColumns]);
}
