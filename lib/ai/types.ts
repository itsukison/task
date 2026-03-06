import { Task, CalendarBlock } from '@/lib/types';
import { translateAI } from './translation-helper';
import { Language } from '@/lib/i18n/types';

// ============================================================================
// Document Content Cache
// ============================================================================

export interface DocumentContentCache {
    [documentId: string]: {
        content: string;
        fetchedAt: number;
    };
}

// ============================================================================
// Chat Message Types
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    role: ChatRole;
    content: string;
    timestamp?: number;
    action?: PendingAction; // For persisting actions in history
}

export interface ChatSession {
    id: string;
    title: string;
    updatedAt: number;
    isActive?: boolean;
}

// ============================================================================
// Agent Context
// ============================================================================

export interface AgentContext {
    // Current page
    currentPage: 'documents' | 'workspace' | 'progress' | 'settings';

    // User & organization
    userId: string;
    organizationId: string;

    // Selected documents (for documents page)
    selectedDocuments?: any[]; // Using any[] to avoid circular imports

    // Workspace data (for workspace page)
    tasks?: Task[];
    calendarBlocks?: CalendarBlock[];
    selectedDate?: string; // ISO date string (YYYY-MM-DD)
    language: 'en' | 'ja';

    // Workflow mention (for OpenClaw execution)
    mentionedWorkflow?: { id: string; name: string };
}

// ============================================================================
// Tool Calling Types (OpenAI-compatible)
// ============================================================================

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string; // JSON string
    };
}

export interface ToolResult {
    tool_call_id: string;
    output: string;
}

// ============================================================================
// Pending Actions (for confirmations)
// ============================================================================

export type PendingActionType = 'create_task' | 'update_task' | 'delete_task' | 'reschedule_calendar' | 'edit_document' | 'organize_documents' | 'schedule_task' | 'batch_schedule';

export interface PendingTaskAction {
    type: 'create_task' | 'update_task' | 'delete_task';
    data: {
        title?: string;
        description?: string;
        status?: string;
        expectedTime?: number;
        taskId?: string; // For update/delete
        scheduledDate?: string; // ISO date string (YYYY-MM-DD)
        scheduledStartTime?: string; // ISO string for scheduled tasks
        durationMinutes?: number; // Duration for calendar block
    };
    preview: string; // Human-readable preview for UI
}

export interface PendingCalendarAction {
    type: 'reschedule_calendar';
    data: {
        blockId: string;
        newStartTime: string; // ISO string
        newEndTime: string;
    };
    preview: {
        originalBlock: CalendarBlock;
        suggestedBlock: CalendarBlock;
    };
}

export interface PendingScheduleAction {
    type: 'schedule_task';
    taskId: string;
    taskTitle: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    duration: number;  // minutes
    preview: {
        dateFormatted: string; // "Monday, Feb 10"
        timeFormatted: string; // "2:00 PM - 3:30 PM"
        durationFormatted: string; // "1h 30m"
    };
}

export interface PendingBatchScheduleAction {
    type: 'batch_schedule';
    data: {
        date: string;
        schedules: Array<{
            taskId: string;
            taskTitle: string;
            startTime: string;
            endTime: string;
        }>;
    };
    preview: string; // Summary text
}

export interface PendingDocumentEditAction {
    type: 'edit_document';
    documentId: string;
    editType: 'rewrite' | 'append' | 'prepend' | 'replace_section';
    newContent: string;
    targetText?: string;
    preview: {
        documentTitle: string;
        beforeContent: string;
        afterContent: string;
        editType: string;
    };
}

export interface PendingOrganizeAction {
    type: 'organize_documents';
    currentFolderId: string | null;
    operations: Array<{
        folderName: string;
        folderId: string | null; // null means create new
        documentIds: string[];
        documentTitles: string[];
    }>;
    preview: {
        foldersToCreate: string[];
        totalMoves: number;
        movesSummary: string; // "5 documents → 3 folders"
    };
}

export type PendingAction = PendingTaskAction | PendingCalendarAction | PendingDocumentEditAction | PendingOrganizeAction | PendingScheduleAction | PendingBatchScheduleAction;

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ChatRequest {
    message: string;
    context: AgentContext;
    history: ChatMessage[];
    documentCache?: DocumentContentCache;
    sessionId?: string; // For streaming workflow logs back
}

export interface ChatResponse {
    message: string;
    pendingAction?: PendingAction;
    updatedCache?: DocumentContentCache;
    error?: string;
}

// ============================================================================
// Document Size Validation
// ============================================================================

export const MAX_DOCUMENT_CHARS = 100000; // ~25k tokens

export function validateDocumentSize(content: string): { valid: boolean; error?: string } {
    if (content.length > MAX_DOCUMENT_CHARS) {
        return {
            valid: false,
            error: 'Document too large, please select a smaller one',
        };
    }
    return { valid: true };
}

// ============================================================================
// Error Types
// ============================================================================

export class AIError extends Error {
    constructor(
        message: string,
        public userMessage: string,
        public code?: string
    ) {
        super(message);
        this.name = 'AIError';
    }
}

export function handleAIError(error: unknown, language: Language = 'en'): string {
    if (error instanceof AIError) {
        return error.userMessage;
    }

    if (error instanceof Error) {
        // Check for specific error patterns
        if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            return translateAI(language, 'ai.error_timeout');
        }
        if (error.message.includes('rate limit')) {
            return translateAI(language, 'ai.error_rate_limit');
        }
        if (error.message.includes('401') || error.message.includes('invalid api key')) {
            console.error('Invalid Moonshot API key:', error);
            return translateAI(language, 'ai.error_auth');
        }
    }

    console.error('Unexpected AI error:', error);
    return translateAI(language, 'ai.error_generic');
}
