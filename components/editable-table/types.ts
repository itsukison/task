'use client';

import { DataType, ColumnOption, PeopleOption, AssignmentStatus } from '@/lib/types';

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
    secondaryText?: string;
    options?: ColumnOption[];
    peopleOptions?: PeopleOption[];
    ownerStatuses?: Record<string, AssignmentStatus>;  // Map of owner ID to assignment status
    onChange: (rowId: string, columnId: string, value: unknown) => void;
    // Callback to create a subtask that appears in the main table
    onCreateSubtask?: (parentTaskId: string, title: string) => void;
    // Auto-focus this cell on mount
    autoFocus?: boolean;
    // Callback when Enter is pressed in the cell
    onEnter?: () => void;
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
    onDelete?: () => void;
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
    onAddSubtask?: () => void;
}
