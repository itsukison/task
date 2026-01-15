import { Database } from './database.types';

// ============================================================================
// Core Types - Single source of truth for all shared interfaces
// ============================================================================

/**
 * Task status enum derived from database schema
 */
export type TaskStatus = Database['public']['Enums']['task_status'];

/**
 * Task entity representing a schedulable work item
 */
export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    expectedTime: number;  // in minutes
    actualTime: number;    // in minutes
    owner: string;
}

/**
 * Calendar block representing a scheduled time slot for a task
 */
export interface CalendarBlock {
    id: string;
    taskId: string;
    startTime: string;  // ISO string
    endTime: string;    // ISO string
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
}

export interface TaskListProps {
    tasks: Task[];
    selectedDate: Date;
    searchQuery: string;
    filterStatus: TaskStatus | 'ALL';
    onTaskClick: (task: Task) => void;
    onUpdateTask: (task: Task) => void;
    onAddTask: () => void;
    onDragStart: (taskId: string | null) => void;
}

export interface TaskModalProps {
    task: Task | null;
    onClose: () => void;
    onUpdate: (updatedTask: Task) => void;
}
