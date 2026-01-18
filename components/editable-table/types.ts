'use client';

import { DataType, ColumnOption, PeopleOption } from '@/lib/types';

// ============================================================================
// Internal Component Types - Used only within editable-table module
// ============================================================================

/**
 * Props for cell components (TextCell, NumberCell, SelectCell, PeopleCell, TimerNumberCell)
 */
export interface CellProps {
    value: unknown;
    rowId: string;
    columnId: string;
    dataType: DataType;
    options?: ColumnOption[];
    peopleOptions?: PeopleOption[];
    onChange: (rowId: string, columnId: string, value: unknown) => void;
}

/**
 * Props for the header menu component
 */
export interface HeaderMenuProps {
    label: string;
    dataType: DataType;
    columnId: string;
    position: { top: number; left: number };
    onSortAsc: () => void;
    onSortDesc: () => void;
    onHide: () => void;
    onClose: () => void;
}

/**
 * Props for the row actions menu component
 */
export interface RowActionsMenuProps {
    rowId: string;
    position: { top: number; left: number };
    onDuplicate: () => void;
    onDelete: () => void;
    onCopyLink: () => void;
    onClose: () => void;
}
