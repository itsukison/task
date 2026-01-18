import { Database } from './database.types';

// ============================================================================
// Core Types - Single source of truth for all shared interfaces
// ============================================================================

/**
 * Task status enum derived from database schema
 */
export type TaskStatus = Database['public']['Enums']['task_status'];

/**
 * Task visibility enum derived from database schema
 */
export type TaskVisibility = Database['public']['Enums']['task_visibility'];

/**
 * Owner profile from JOIN
 */
export interface OwnerProfile {
    id: string;
    display_name: string;
    email: string;
}

/**
 * Task entity representing a schedulable work item
 * Uses camelCase for TypeScript ergonomics, maps from snake_case database columns
 */
export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    expectedTime: number;  // in minutes (maps from expected_time_minutes)
    actualTime: number;    // in minutes (maps from actual_time_minutes)
    visibility: TaskVisibility;
    owners: OwnerProfile[];  // Multiple owners from task_owners junction table
    ownerId: string;  // Deprecated, kept for backward compatibility with single-owner queries
    organizationId: string;
    scheduledDate: string | null;  // ISO date string (maps from scheduled_date)
    createdAt: string;
    updatedAt: string;
}

/**
 * Calendar block representing a scheduled time slot for a task
 */
export interface CalendarBlock {
    id: string;
    taskId: string;
    startTime: string;  // ISO string
    endTime: string;    // ISO string
    ownerId: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    task?: Task;        // Optional joined task object
}

// ============================================================================
// Editable Table Types
// ============================================================================

/**
 * Data types supported by editable table cells
 */
export type DataType = 'text' | 'number' | 'select' | 'people' | 'timerNumber';

/**
 * Option for select-type columns
 */
export interface ColumnOption {
    label: string;
    backgroundColor: string;
}

/**
 * Person option for people-type columns
 */
export interface PeopleOption {
    id: string;
    displayName: string;
    email: string;
}

/**
 * Configuration for a table column
 */
export interface TableColumn<T> {
    id: keyof T | string;
    label: string;
    dataType: DataType;
    width?: number;
    minWidth?: number;
    options?: ColumnOption[];
    peopleOptions?: PeopleOption[];
}

/**
 * Sort configuration state
 */
export interface SortConfig {
    columnId: string;
    direction: 'asc' | 'desc';
}

/**
 * Props for EditableTable component
 */
export interface EditableTableProps<T extends { id: string }> {
    data: T[];
    columns: TableColumn<T>[];
    onCellChange: (rowId: string, columnId: string, value: unknown) => void;
    onAddRow: () => void;
    onRowClick?: (row: T) => void;
    onOpenRow?: (rowId: string) => void;
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

/**
 * View modes for sidebar navigation
 */
export type ViewMode = 'workspace' | 'progress' | 'settings';

// ============================================================================
// Component Props Types
// ============================================================================

export interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentView?: ViewMode;  // Optional when using routing
}

export interface WorkspaceViewProps {
    tasks: Task[];
    calendarBlocks: CalendarBlock[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
    onDeleteTask: (taskId: string) => void;
    draggingTask: Task | null;
    onDragStart: (taskId: string | null) => void;
    // Calendar block CRUD callbacks
    onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
    onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
    onDeleteBlock?: (blockId: string) => void;
}

export interface CalendarProps {
    tasks: Task[];
    calendarBlocks: CalendarBlock[];
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    onTaskUpdate: (task: Task) => void;
    onTaskClick: (task: Task) => void;
    draggingTask: Task | null;
    onDragStart: (taskId: string | null) => void;
    onDeleteTask: (taskId: string) => void;
    view: 'week' | 'day';
    viewDate: Date;
    showWeekends?: boolean;
    // Calendar block CRUD callbacks
    onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
    onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
    onDeleteBlock?: (blockId: string) => void;
}

export interface TaskListProps {
    tasks: Task[];
    selectedDate: Date;
    searchQuery: string;
    filterStatus: TaskStatus | 'ALL';
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask?: (taskId: string) => void;
    onDragStart: (taskId: string | null) => void;
    // Date filtering props
    calendarBlocks?: CalendarBlock[];
    viewMode?: 'week' | 'day';
    viewDate?: Date;
}

export interface TaskModalProps {
    task: Task | null;
    onClose: () => void;
    onUpdate: (updatedTask: Task) => void;
}
