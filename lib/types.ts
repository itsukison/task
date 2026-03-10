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
 * Schedule visibility enum derived from database schema
 */
export type ScheduleVisibility = Database['public']['Enums']['schedule_visibility'];

/**
 * Member role enum derived from database schema
 */
export type MemberRole = Database['public']['Enums']['member_role'];

/**
 * Assignment status enum for task owner assignments
 */
export type AssignmentStatus = Database['public']['Enums']['assignment_status'];

/**
 * Document type enum
 */
export type DocumentType = 'document' | 'uploaded_file' | 'link';

/**
 * Owner profile from JOIN with assignment status
 */
export interface OwnerProfile {
    id: string;
    display_name: string;
    email: string;
    status?: AssignmentStatus;    // Assignment status: pending or confirmed
    assignedBy?: string;          // User ID of who assigned this owner
}

/**
 * Status of an organization join request
 */
export type JoinRequestStatus = 'pending' | 'rejected';

/**
 * Join request structure
 */
export interface JoinRequest {
    id: string;
    organizationId: string;
    userId: string;
    status: JoinRequestStatus;
    createdAt: string;
    user?: OwnerProfile;  // Joined user profile
}

/**
 * Workflow entity for the canvas
 */
export interface Workflow {
    id: string;
    organizationId: string;
    createdBy: string;
    folderId: string | null;
    name: string;
    description: string | null;
    site: string | null;
    content: any; // Tiptap JSON content
    positionX: number | null;
    positionY: number | null;
    visibility: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * WorkflowFolder entity for organizing workflows
 */
export interface WorkflowFolder {
    id: string;
    organizationId: string;
    name: string;
    parentFolderId: string | null;
    positionX: number | null;
    positionY: number | null;
    visibility: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Folder entity for organizing documents
 */
export interface Folder {
    id: string;
    organizationId: string;
    createdBy: string;
    name: string;
    parentFolderId: string | null;
    positionX: number | null;
    positionY: number | null;
    width: number;
    height: number;
    isOpen: boolean;
    visibility: TaskVisibility;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Document entity for canvas documents
 */
export interface Document {
    id: string;
    organizationId: string;
    createdBy: string;
    folderId: string | null;
    title: string;
    content: any; // Tiptap JSON content
    type: DocumentType;

    // For uploaded files
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    fileType: string | null;

    // For external links
    linkUrl: string | null;
    previewImageUrl: string | null;
    previewMetadata: {
        title?: string;
        description?: string;
        favicon?: string;
        siteName?: string;
    } | null;

    // Canvas positioning
    positionX: number | null;
    positionY: number | null;
    width: number;
    height: number;

    visibility: TaskVisibility;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
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
    parentTaskId: string | null;   // Parent task ID for subtasks (maps from parent_task_id)
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

/**
 * Calendar block with additional owner information for multi-member view
 */
export interface MultiMemberBlock extends CalendarBlock {
    ownerName: string;
    ownerColor: string;
}

/**
 * Layout information for positioning a calendar block (Notion-style overlap handling)
 */
export interface BlockLayoutInfo {
    columnIndex: number;
    totalColumns: number;
    widthPercent: number;
    leftPercent: number;
}

// ============================================================================
// Editable Table Types
// ============================================================================

/**
 * Data types supported by editable table cells
 */
export type DataType = 'text' | 'number' | 'select' | 'people' | 'timerNumber' | 'combinedTime' | 'subtask' | 'document';

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
 * Person option with visibility and role information for member selection
 */
export interface PeopleOptionWithVisibility extends PeopleOption {
    scheduleVisibility: ScheduleVisibility;
    role: MemberRole;
}

/**
 * User-defined custom column configuration (subtask or document type)
 */
export interface CustomColumn {
    id: string;
    type: 'subtask' | 'document';
    label: string;
    order: number;
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
    options?: ColumnOption[]
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
    onAddRow: () => Promise<T | void> | T | void;
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
    // Pending assignment handling
    isPendingRow?: (row: T) => boolean;
    onAcceptRow?: (rowId: string) => void;
    onRejectRow?: (rowId: string) => void;
    // Owner statuses for display
    getOwnerStatuses?: (row: T) => Record<string, AssignmentStatus>;
    // Custom column management
    customColumns?: any[];
    onAddCustomColumn?: (type: 'subtask' | 'document') => void;
    onRemoveCustomColumn?: (columnId: string) => void;
    // Subtask creation callback (legacy, for subtask column cell)
    onCreateSubtask?: (parentTaskId: string, title: string) => void;
    // Inline subtask row actions
    onAddSubtask?: (parentId: string) => Promise<Task | void>;
    onToggleSubtasks?: (parentId: string) => void;
    expandedSubtaskParentIds?: Set<string>;
    subtaskCountMap?: Map<string, number>;
    // Row separator logic (Assigned vs Unassigned)
    isAssigned?: (row: T) => boolean;
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
    viewDate: Date;
    onViewDateChange: (date: Date) => void;
    startHour?: number;
    endHour?: number;
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: (initialData?: { scheduledDate?: Date | string, expectedTime?: number, title?: string, shouldOpenModal?: boolean }) => Promise<Task | void> | void;
    onDeleteTask: (taskId: string) => void;
    // Subtask creation callback (legacy)
    onCreateSubtask?: (parentTaskId: string, title: string) => void;
    // Inline subtask row creation
    onAddSubtask?: (parentTaskId: string, scheduledDate: string) => Promise<Task | void>;
    draggingTask: Task | null;
    onDragStart: (taskId: string | null) => void;
    // Calendar block CRUD callbacks
    onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
    onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
    onDeleteBlock?: (blockId: string) => void;
    // Multi-member schedule viewing
    selectedMemberIds?: string[];
    onSelectedMembersChange?: (memberIds: string[]) => void;
    multiMemberBlocks?: MultiMemberBlock[];
    // Interacting with blocks
    selectedBlockIds?: Set<string>;
    onSelectBlocks?: (blockIds: Set<string>) => void;
    onUpdateMultipleBlocks?: (deltaMinutes: number, blockIds: string[]) => void;
    // Pending assignment handling
    currentUserId?: string;
    onAcceptAssignment?: (taskId: string) => void;
    onRejectAssignment?: (taskId: string) => void;
    // AI preview objects
    previewTask?: Task | null;
    previewBlock?: CalendarBlock | null;
    // Optimistic UI
    optimisticBlock?: CalendarBlock | null;
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
    onContextMenu?: (e: React.MouseEvent, taskId: string | null, blockId: string | null, date: Date, xOffset?: number) => void;
    onAddTask?: (initialData?: { scheduledDate?: Date | string, expectedTime?: number, title?: string, shouldOpenModal?: boolean }) => Promise<Task | void> | void;
    onDeleteTask: (taskId: string) => void;
    view: 'week' | 'day';
    viewDate: Date;
    startHour?: number;
    endHour?: number;
    daysToShow?: number;  // Kept for backward-compat with calendar-old.tsx
    // Calendar toolbar controls
    onViewChange?: (view: 'week' | 'day') => void;
    onViewDateChange?: (date: Date) => void;
    scrollAlignment?: 'center' | 'left';
    onPrev?: () => void;
    onNext?: () => void;
    onToday?: () => void;
    // Calendar block CRUD callbacks
    onCreateBlock?: (taskId: string, startTime: Date, endTime: Date) => void;
    onUpdateBlock?: (blockId: string, startTime: Date, endTime: Date) => void;
    onDeleteBlock?: (blockId: string) => void;
    // Multi-member schedule viewing
    selectedMemberIds?: string[];
    onSelectedMembersChange?: (memberIds: string[]) => void;
    multiMemberBlocks?: MultiMemberBlock[];
    // Interacting with blocks
    selectedBlockIds?: Set<string>;
    onSelectBlocks?: (blockIds: Set<string>) => void;
    onUpdateMultipleBlocks?: (deltaMinutes: number, blockIds: string[]) => void;
    // AI preview
    previewBlock?: CalendarBlock | null;
    // Optimistic UI
    optimisticBlock?: CalendarBlock | null;
    // Fixed day column width used in week view
    dayColumnWidth?: number;
    // Emits the available width for day columns (excluding time column)
    onDayViewportWidthChange?: (width: number) => void;
    // Width of right-side task overlay occluding visible calendar area
    occludedRightPx?: number;
}

export interface TaskListProps {
    tasks: Task[];
    selectedDate: Date;
    searchQuery: string;
    filterRules: import('@/lib/utils/filterRules').FilterRule[];
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: (initialData?: { scheduledDate?: Date | string, expectedTime?: number, title?: string, shouldOpenModal?: boolean }) => Promise<Task | void> | void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask?: (taskId: string) => void;
    onDragStart: (taskId: string | null) => void;
    // Toolbar controls
    onSearchChange?: (query: string) => void;
    onFilterChange?: (rules: import('@/lib/utils/filterRules').FilterRule[]) => void;
    sortConfig?: SortConfig | null;
    onSortChange?: (sort: SortConfig | null) => void;
    hiddenColumns?: string[];
    onHideColumn?: (columnId: string) => void;
    // Subtask creation callback (legacy, used by subtask column cell)
    onCreateSubtask?: (parentTaskId: string, title: string) => void;
    // Inline subtask row creation from the + button / row menu
    onAddSubtask?: (parentTaskId: string, scheduledDate: string) => Promise<Task | void>;
    onShowColumn?: (columnId: string) => void;
    // Date filtering props
    calendarBlocks?: CalendarBlock[];
    viewMode?: 'week' | 'day';
    viewDate?: Date;
    // Pending assignment handling
    currentUserId?: string;
    onAcceptAssignment?: (taskId: string) => void;
    onRejectAssignment?: (taskId: string) => void;
    // AI preview
    previewTask?: Task | null;
    // Notify parent when user starts interacting with a different day section in expanded mode
    onFocusDayFromTaskView?: (date: Date) => void;
}

export interface TaskModalProps {
    task: Task | null;
    onClose: () => void;
    onUpdate: (updatedTask: Task) => void;
}
