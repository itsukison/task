'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    Column,
} from '@tanstack/react-table';
import {
    ChevronUp, ChevronDown, GripVertical, Plus, AlignLeft, Hash, CircleDot,
    ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, Settings2, ChevronRight,
    PanelLeftClose, PanelRightClose, Trash2, Copy, Link, Square
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// Types
// ============================================================================

export type DataType = 'text' | 'number' | 'select';

export interface ColumnOption {
    label: string;
    backgroundColor: string;
}

export interface TableColumn<T> {
    id: keyof T | string;
    label: string;
    dataType: DataType;
    width?: number;
    minWidth?: number;
    options?: ColumnOption[];
}

export interface SortConfig {
    columnId: string;
    direction: 'asc' | 'desc';
}

export interface EditableTableProps<T extends { id: string }> {
    data: T[];
    columns: TableColumn<T>[];
    onCellChange: (rowId: string, columnId: string, value: unknown) => void;
    onAddRow: () => void;
    onRowClick?: (row: T) => void;
    onDragStart?: (rowId: string) => void;
    onDragEnd?: () => void;
    // Row actions
    onDeleteRow?: (rowId: string) => void;
    onDuplicateRow?: (rowId: string) => void;
    // External sort control
    sorting?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
    // Column visibility
    hiddenColumns?: string[];
    onHideColumn?: (columnId: string) => void;
}

// ============================================================================
// Cell Components
// ============================================================================

interface CellProps {
    value: unknown;
    rowId: string;
    columnId: string;
    dataType: DataType;
    options?: ColumnOption[];
    onChange: (rowId: string, columnId: string, value: unknown) => void;
}

function TextCell({ value, rowId, columnId, onChange }: CellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== String(value ?? '')) {
            onChange(rowId, columnId, localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none text-[#424242] text-sm px-2 py-1.5"
            />
        );
    }

    return (
        <div
            className="w-full h-full px-2 py-1.5 cursor-text text-[#424242] text-sm truncate"
            onClick={() => setIsEditing(true)}
        >
            {localValue || <span className="text-gray-300 italic">Empty</span>}
        </div>
    );
}

function NumberCell({ value, rowId, columnId, onChange }: CellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const numValue = parseInt(localValue) || 0;
        if (numValue !== value) {
            onChange(rowId, columnId, numValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none text-[#424242] text-sm px-2 py-1.5 text-right font-mono"
            />
        );
    }

    return (
        <div
            className="w-full h-full px-2 py-1.5 cursor-text text-[#424242] text-sm text-right font-mono"
            onClick={() => setIsEditing(true)}
        >
            {localValue || '0'}
        </div>
    );
}

function SelectCell({ value, rowId, columnId, options = [], onChange }: CellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const selectedOption = options.find(opt => opt.label === value);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
            });
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (opt: ColumnOption) => {
        onChange(rowId, columnId, opt.label);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full h-full" ref={triggerRef}>
            <div
                className="w-full h-full px-2 py-1.5 cursor-pointer flex items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: selectedOption.backgroundColor, color: '#37352F' }}
                    >
                        {selectedOption.label}
                    </span>
                ) : (
                    <span className="text-gray-300 text-sm">Select...</span>
                )}
            </div>

            {/* Portal dropdown to body to escape overflow:hidden */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[160px] max-h-[200px] overflow-auto"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.label}
                            className="px-3 py-1.5 cursor-pointer hover:bg-gray-50 flex items-center"
                            onClick={() => handleSelect(opt)}
                        >
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: opt.backgroundColor, color: '#37352F' }}
                            >
                                {opt.label}
                            </span>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}

function Cell(props: CellProps) {
    switch (props.dataType) {
        case 'text':
            return <TextCell {...props} />;
        case 'number':
            return <NumberCell {...props} />;
        case 'select':
            return <SelectCell {...props} />;
        default:
            return <TextCell {...props} />;
    }
}

// ============================================================================
// Header Components
// ============================================================================

function DataTypeIcon({ dataType }: { dataType: DataType }) {
    switch (dataType) {
        case 'text':
            return <AlignLeft size={14} className="text-[#9e9e9e]" />;
        case 'number':
            return <Hash size={14} className="text-[#9e9e9e]" />;
        case 'select':
            return <CircleDot size={14} className="text-[#9e9e9e]" />;
        default:
            return <AlignLeft size={14} className="text-[#9e9e9e]" />;
    }
}

// ============================================================================
// Header Menu Component
// ============================================================================

interface HeaderMenuProps {
    label: string;
    dataType: DataType;
    columnId: string;
    onSortAsc: () => void;
    onSortDesc: () => void;
    onHide: () => void;
    onClose: () => void;
}

function HeaderMenu({ label, dataType, columnId, onSortAsc, onSortDesc, onHide, onClose }: HeaderMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [editingLabel, setEditingLabel] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const menuItems = [
        {
            icon: <ArrowUp size={16} />,
            label: 'Sort ascending',
            onClick: () => { onSortAsc(); onClose(); }
        },
        {
            icon: <ArrowDown size={16} />,
            label: 'Sort descending',
            onClick: () => { onSortDesc(); onClose(); }
        },
        { divider: true },
        {
            icon: <EyeOff size={16} />,
            label: 'Hide',
            onClick: () => { onHide(); onClose(); }
        },
        { divider: true },
        {
            icon: <PanelLeftClose size={16} />,
            label: 'Insert left',
            onClick: () => { onClose(); },
            disabled: true
        },
        {
            icon: <PanelRightClose size={16} />,
            label: 'Insert right',
            onClick: () => { onClose(); },
            disabled: true
        },
        {
            icon: <Trash2 size={16} />,
            label: 'Delete property',
            onClick: () => { onClose(); },
            disabled: true,
            danger: true
        },
    ];

    return (
        <div
            ref={menuRef}
            className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[220px]"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Column name input */}
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <DataTypeIcon dataType={dataType} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="flex-1 bg-gray-100 rounded px-2 py-1 text-sm text-[#37352F] outline-none focus:ring-1 focus:ring-blue-300"
                    />
                </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
                {menuItems.map((item, index) =>
                    item.divider ? (
                        <div key={index} className="border-t border-gray-100 my-1" />
                    ) : (
                        <button
                            key={index}
                            className={clsx(
                                'w-full px-3 py-1.5 flex items-center gap-2 text-sm text-left',
                                'hover:bg-gray-50 transition-colors',
                                item.disabled && 'opacity-40 cursor-not-allowed',
                                item.danger && 'text-red-600'
                            )}
                            onClick={item.disabled ? undefined : item.onClick}
                            disabled={item.disabled}
                        >
                            <span className="text-[#757575]">{item.icon}</span>
                            <span className={item.danger ? 'text-red-600' : 'text-[#37352F]'}>{item.label}</span>
                        </button>
                    )
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Row Actions Menu Component
// ============================================================================

interface RowActionsMenuProps {
    rowId: string;
    position: { top: number; left: number };
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
    onClose: () => void;
}

function RowActionsMenu({ rowId, position, onDuplicate, onDelete, onCopyLink, onClose }: RowActionsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuItems = [
        {
            icon: <Copy size={16} />,
            label: 'Duplicate',
            onClick: () => { onDuplicate(); onClose(); },
            shortcut: '⌘D'
        },
        {
            icon: <Link size={16} />,
            label: 'Copy link',
            onClick: () => { onCopyLink(); onClose(); }
        },
        { divider: true },
        {
            icon: <Trash2 size={16} />,
            label: 'Delete',
            onClick: () => { onDelete(); onClose(); },
            shortcut: 'Del',
            danger: true
        },
    ];

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 w-[200px]"
            style={{ top: position.top, left: position.left, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            {menuItems.map((item, index) =>
                item.divider ? (
                    <div key={index} className="border-t border-gray-100 my-1" />
                ) : (
                    <button
                        key={index}
                        className={clsx(
                            'w-full px-3 py-1.5 flex items-center gap-2 text-sm text-left',
                            'hover:bg-gray-50 transition-colors',
                            item.danger && 'text-red-600 hover:bg-red-50'
                        )}
                        onClick={item.onClick}
                    >
                        <span className={item.danger ? 'text-red-500' : 'text-[#757575]'}>{item.icon}</span>
                        <span className={clsx('flex-1', item.danger ? 'text-red-600' : 'text-[#37352F]')}>{item.label}</span>
                        {item.shortcut && (
                            <span className="text-[#9e9e9e] text-xs">{item.shortcut}</span>
                        )}
                    </button>
                )
            )}
        </div>,
        document.body
    );
}

// ============================================================================
// Main Table Component
// ============================================================================

export default function EditableTable<T extends { id: string }>({
    data,
    columns: tableColumns,
    onCellChange,
    onAddRow,
    onRowClick,
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
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<string | null>(null);
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
                const isMenuOpen = activeHeaderMenu === String(col.id);
                const isSorted = column.getIsSorted();

                return (
                    <div className="relative">
                        <div
                            className={clsx(
                                'flex items-center gap-1.5 px-2 py-2 h-[42px] cursor-pointer select-none font-medium text-sm',
                                isMenuOpen ? 'bg-[#ebebea] text-[#37352F]' : 'text-[#9e9e9e]'
                            )}
                            onClick={() => setActiveHeaderMenu(isMenuOpen ? null : String(col.id))}
                        >
                            <DataTypeIcon dataType={col.dataType} />
                            <span>{col.label}</span>
                            {isSorted === 'asc' && <ChevronUp size={14} />}
                            {isSorted === 'desc' && <ChevronDown size={14} />}
                        </div>

                        {isMenuOpen && (
                            <HeaderMenu
                                label={col.label}
                                dataType={col.dataType}
                                columnId={String(col.id)}
                                onSortAsc={() => handleSort(String(col.id), false)}
                                onSortDesc={() => handleSort(String(col.id), true)}
                                onHide={() => onHideColumn?.(String(col.id))}
                                onClose={() => setActiveHeaderMenu(null)}
                            />
                        )}
                    </div>
                );
            },
            cell: ({ row, column }) => (
                <Cell
                    value={row.getValue(column.id)}
                    rowId={row.original.id}
                    columnId={column.id}
                    dataType={col.dataType}
                    options={col.options}
                    onChange={onCellChange}
                />
            ),
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
    }, [tableColumns, onCellChange, activeHeaderMenu, onHideColumn]);

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
        <div className="w-full overflow-auto">
            <div className="inline-block min-w-full">
                {/* Header */}
                <div className="border-b border-[#e0e0e0]">
                    {table.getHeaderGroups().map(headerGroup => (
                        <div key={headerGroup.id} className="flex">
                            {headerGroup.headers.map(header => (
                                <div
                                    key={header.id}
                                    className={clsx(
                                        'relative border-l border-[#e0e0e0] first:border-l-0',
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
                            {row.getVisibleCells().map(cell => (
                                <div
                                    key={cell.id}
                                    className="border-l border-[#e0e0e0] first:border-l-0 flex items-center"
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

                {/* Add Row Button */}
                <div
                    className="flex items-center gap-1.5 px-2 py-2 text-[#9e9e9e] text-sm cursor-pointer hover:bg-[#f5f5f5] transition-colors border-b border-[#e0e0e0]"
                    onClick={onAddRow}
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
