'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/lib/auth/auth-context';
import { usePathname } from 'next/navigation';
import {
    ChatMessage,
    AgentContext,
    PendingAction,
    ChatRequest,
    ChatResponse,
} from './types';
import { Document } from '@/lib/types';

interface AIContextValue {
    // State
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: ChatMessage[];
    isLoading: boolean;

    // Context awareness
    selectedDocuments: Document[];
    setSelectedDocuments: (docs: Document[]) => void;
    currentPage: 'documents' | 'workspace' | 'progress' | 'settings';
    selectedDate?: Date;
    setSelectedDate?: (date: Date) => void;

    // Pending action awaiting confirmation
    pendingAction: PendingAction | null;
    confirmAction: () => Promise<void>;
    cancelAction: () => void;

    // Actions
    sendMessage: (text: string) => Promise<void>;
    clearHistory: () => void;

    // Refetch callbacks (optional, for UI updates)
    onTasksChange?: () => void | Promise<void>;
    onCalendarChange?: () => void | Promise<void>;
}

interface AIContextProviderProps {
    children: React.ReactNode;
    onTasksChange?: () => void | Promise<void>;
    onCalendarChange?: () => void | Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within AIContextProvider');
    }
    return context;
}

export function AIContextProvider({ children, onTasksChange, onCalendarChange }: AIContextProviderProps) {
    const { user, currentOrg: currentOrganization } = useAuthContext();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

    // Use ref to avoid messages dependency in useCallback
    const messagesRef = useRef<ChatMessage[]>([]);

    // Determine current page from pathname
    const currentPage = getCurrentPage(pathname);

    // Load messages from localStorage
    useEffect(() => {
        if (user && currentOrganization) {
            const key = `ai_chat_${currentOrganization.id}_${user.id}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                try {
                    setMessages(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to load chat history', e);
                }
            }
        }
    }, [user, currentOrganization]);

    // Save messages to localStorage
    useEffect(() => {
        if (user && currentOrganization && messages.length > 0) {
            const key = `ai_chat_${currentOrganization.id}_${user.id}`;
            localStorage.setItem(key, JSON.stringify(messages));
        }
    }, [messages, user, currentOrganization]);

    // Sync messages ref to avoid circular dependency in useCallback
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!user || !currentOrganization) return;

            const userMessage: ChatMessage = {
                role: 'user',
                content: text,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setPendingAction(null); // Clear any pending action

            try {
                // Build context
                const formatDateToLocalISO = (date: Date): string => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                const context: AgentContext = {
                    currentPage,
                    userId: user.id,
                    organizationId: currentOrganization.id,
                    selectedDocuments: currentPage === 'documents' ? selectedDocuments : undefined,
                    selectedDate: selectedDate ? formatDateToLocalISO(selectedDate) : undefined,
                };

                const request: ChatRequest = {
                    message: text,
                    context,
                    history: messagesRef.current,
                };

                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request),
                });

                const data: ChatResponse = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: Date.now(),
                };

                setMessages((prev) => [...prev, assistantMessage]);

                if (data.pendingAction) {
                    setPendingAction(data.pendingAction);
                }
            } catch (error) {
                console.error('Chat error:', error);
                const errorMessage: ChatMessage = {
                    role: 'assistant',
                    content: 'AI unavailable, please try again',
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        },
        [user, currentOrganization, currentPage, selectedDocuments]
    );

    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;

        // Execute the action based on type
        if (pendingAction.type === 'create_task') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            if (!currentOrganization || !user) return;

            // Create the task first
            // Database constraint requires expected_time_minutes > 0, so use duration or default to 30
            const expectedTimeMinutes = pendingAction.data.expectedTime ||
                pendingAction.data.durationMinutes ||
                30;

            // Format selectedDate as fallback for scheduled_date
            const formatDateToLocalISO = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Use AI-provided date, or fall back to selected calendar date, or use today's date
            const scheduledDateValue = pendingAction.data.scheduledDate ||
                (selectedDate ? formatDateToLocalISO(selectedDate) : null);

            const { data: newTask, error: taskError } = await supabase.from('tasks').insert({
                organization_id: currentOrganization.id,
                owner_id: user.id,
                created_by: user.id,
                title: pendingAction.data.title,
                description: pendingAction.data.description || null,
                status: (pendingAction.data.status || 'planned') as any,
                expected_time_minutes: expectedTimeMinutes,
                actual_time_minutes: 0,
                visibility: 'team',
                scheduled_date: scheduledDateValue,
            } as any).select().single();

            if (taskError) {
                const errorMessage = taskError.message || 'Unknown error';
                const errorCode = (taskError as any).code || '';

                console.error('Failed to create task:', {
                    message: errorMessage,
                    code: errorCode,
                    details: (taskError as any).details,
                    fullError: taskError
                });

                let userMessage = '❌ Failed to create task. ';
                if (errorCode === '23503') {
                    userMessage += 'Invalid reference data.';
                } else if (errorMessage.includes('permission')) {
                    userMessage += 'You do not have permission to create tasks.';
                } else {
                    userMessage += `Error: ${errorMessage}`;
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: userMessage,
                        timestamp: Date.now(),
                    },
                ]);
                setPendingAction(null);
                return;
            }

            // Add creator as initial owner (matching useTasks pattern)
            if (newTask) {
                const { error: ownerError } = await supabase
                    .from('task_owners')
                    .insert({
                        task_id: newTask.id,
                        user_id: user.id,
                        organization_id: currentOrganization.id,
                        status: 'confirmed',
                        assigned_by: user.id,
                    });

                if (ownerError) {
                    console.error('Failed to add initial owner:', ownerError);
                    // Don't fail the operation, just log
                }
            }

            // If scheduled, create a calendar block
            if (pendingAction.data.scheduledStartTime && newTask) {
                const startTime = new Date(pendingAction.data.scheduledStartTime);
                const durationMs = (pendingAction.data.durationMinutes || pendingAction.data.expectedTime || 60) * 60000;
                const endTime = new Date(startTime.getTime() + durationMs);

                await supabase.from('calendar_blocks').insert({
                    organization_id: currentOrganization.id,
                    task_id: newTask.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                } as any);

                // Trigger calendar refresh since we created a block
                if (onCalendarChange) {
                    await onCalendarChange();
                } else {
                    // Fallback: dispatch custom event
                    window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
                }
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Task created successfully',
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'create_task' } // Persist action
                },
            ]);

            // Trigger UI refresh via callbacks or custom event
            if (onTasksChange) {
                await onTasksChange();
            } else {
                // Fallback: dispatch custom event for workspace to listen
                window.dispatchEvent(new CustomEvent('ai-tasks-changed'));
            }
        } else if (pendingAction.type === 'update_task') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            const updates: any = {};
            if (pendingAction.data.title) updates.title = pendingAction.data.title;
            if (pendingAction.data.description !== undefined)
                updates.description = pendingAction.data.description;
            if (pendingAction.data.status) updates.status = pendingAction.data.status as any;
            if (pendingAction.data.expectedTime)
                updates.expected_time_minutes = pendingAction.data.expectedTime;

            if (pendingAction.data.taskId) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update(updates)
                    .eq('id', pendingAction.data.taskId);

                if (updateError) {
                    console.error('Failed to update task:', updateError);
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: `❌ Failed to update task: ${updateError.message}`,
                            timestamp: Date.now(),
                        },
                    ]);
                    setPendingAction(null);
                    return;
                }
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Task updated successfully',
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'update_task' } // Persist action
                },
            ]);

            // Trigger UI refresh via callbacks or custom event
            if (onTasksChange) {
                await onTasksChange();
            } else {
                // Fallback: dispatch custom event for workspace to listen
                window.dispatchEvent(new CustomEvent('ai-tasks-changed'));
            }
        } else if (pendingAction.type === 'reschedule_calendar') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            // Convert to Date objects to ensure proper timezone handling
            // This matches the pattern used in task creation (line 264)
            const newStartTime = new Date(pendingAction.data.newStartTime);
            const newEndTime = new Date(pendingAction.data.newEndTime);

            await supabase
                .from('calendar_blocks')
                .update({
                    start_time: newStartTime.toISOString(),
                    end_time: newEndTime.toISOString(),
                })
                .eq('id', pendingAction.data.blockId);

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Calendar block rescheduled successfully',
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'reschedule_calendar' } // Persist action
                },
            ]);

            // Trigger UI refresh via callbacks or custom event
            if (onCalendarChange) {
                await onCalendarChange();
            } else {
                // Fallback: dispatch custom event
                window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
            }
        }

        setPendingAction(null);
    }, [pendingAction, currentOrganization, user, selectedDate, onTasksChange, onCalendarChange]);

    const cancelAction = useCallback(() => {
        setPendingAction(null);
        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: 'Action cancelled.',
                timestamp: Date.now(),
            },
        ]);
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setPendingAction(null);
        if (user && currentOrganization) {
            const key = `ai_chat_${currentOrganization.id}_${user.id}`;
            localStorage.removeItem(key);
        }
    }, [user, currentOrganization]);

    const value: AIContextValue = {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        selectedDocuments,
        setSelectedDocuments,
        currentPage,
        selectedDate,
        setSelectedDate,
        pendingAction,
        confirmAction,
        cancelAction,
        sendMessage,
        clearHistory,
        onTasksChange,
        onCalendarChange,
    };

    return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

function getCurrentPage(pathname: string): 'documents' | 'workspace' | 'progress' | 'settings' {
    if (pathname.includes('/documents')) return 'documents';
    if (pathname.includes('/progress')) return 'progress';
    if (pathname.includes('/settings')) return 'settings';
    return 'workspace';
}
