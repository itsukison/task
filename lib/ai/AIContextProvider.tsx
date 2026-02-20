'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { usePathname } from 'next/navigation';
import {
    ChatMessage,
    AgentContext,
    PendingAction,
    ChatRequest,
    ChatResponse,
    DocumentContentCache,
} from './types';
import { Document } from '@/lib/types';
import { useWebMCPRegistration } from './use-webmcp';

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

    // New conversation management
    shouldShowNewConvoPrompt: boolean;
    startNewConversation: () => void;
    dismissNewConvoPrompt: () => void;

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

/**
 * Truncate conversation history to most recent N messages for token optimization
 * @param history - Full conversation history
 * @param maxMessages - Maximum number of recent messages to keep (default: 20)
 * @returns Truncated history with most recent messages
 */
function slidingWindowHistory(history: ChatMessage[], maxMessages: number = 20): ChatMessage[] {
    if (history.length <= maxMessages) {
        return history;
    }

    // Keep only the most recent N messages
    return history.slice(-maxMessages);
}

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within AIContextProvider');
    }
    return context;
}

export function AIContextProvider({ children, onTasksChange, onCalendarChange }: AIContextProviderProps) {
    const { user, currentOrg: currentOrganization } = useAuthContext();
    const { language } = useLanguage();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [documentContentCache, setDocumentContentCache] = useState<DocumentContentCache>({});
    const [lastNotificationAt, setLastNotificationAt] = useState<number>(0); // Track when to show "start new conversation" notification

    // Use ref to avoid messages dependency in useCallback
    const messagesRef = useRef<ChatMessage[]>([]);

    // Determine current page from pathname
    const currentPage = getCurrentPage(pathname);

    // Register WebMCP tools
    useWebMCPRegistration(currentOrganization?.id, user?.id, setPendingAction, setIsOpen);

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
                    language,
                };

                // Truncate conversation history to last 20 messages for token optimization
                // Full history remains in localStorage and UI state for display
                const request: ChatRequest = {
                    message: text,
                    context,
                    history: slidingWindowHistory(messagesRef.current),
                    documentCache: documentContentCache,
                };

                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request),
                    credentials: 'include',
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

                // Check if we should show "start new conversation" notification
                const totalMessages = messagesRef.current.length + 2; // +2 for user + assistant just added
                if (totalMessages >= 20 && (totalMessages - lastNotificationAt >= 20)) {
                    // Show notification at 20, 40, 60, 80, etc.
                    setLastNotificationAt(totalMessages);
                }

                if (data.pendingAction) {
                    console.log('📥 AI Context: Received pending action', data.pendingAction);
                    setPendingAction(data.pendingAction);
                }

                if (data.updatedCache) {
                    setDocumentContentCache(data.updatedCache);
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
        [user, currentOrganization, currentPage, selectedDocuments, documentContentCache]
    );

    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;

        console.log('✅ AI Context: Confirming action', pendingAction);

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
                console.log('📅 Creating calendar block for task', newTask.id, pendingAction.data.scheduledStartTime);
                const startTime = new Date(pendingAction.data.scheduledStartTime);
                const durationMs = (pendingAction.data.durationMinutes || pendingAction.data.expectedTime || 60) * 60000;
                const endTime = new Date(startTime.getTime() + durationMs);

                await supabase.from('calendar_blocks').insert({
                    organization_id: currentOrganization.id,
                    owner_id: user.id,
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
        } else if (pendingAction.type === 'edit_document') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            // Fetch current document to get content
            const { data: doc, error: fetchError } = await supabase
                .from('documents')
                .select('content, type')
                .eq('id', pendingAction.documentId)
                .single();

            if (fetchError || !doc) {
                console.error('Failed to fetch document:', fetchError);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Failed to fetch document: ${fetchError?.message || 'Not found'}`,
                        timestamp: Date.now(),
                    },
                ]);
                setPendingAction(null);
                return;
            }

            // Helper to extract text from Tiptap content
            const extractText = (content: any): string => {
                if (!content || !content.type) return '';
                let text = '';
                if (content.type === 'text') text += content.text || '';
                if (content.type === 'paragraph' || content.type === 'heading' || content.type === 'doc') {
                    if (content.content) {
                        content.content.forEach((child: any) => {
                            text += extractText(child);
                        });
                    }
                    if (content.type !== 'doc') text += '\n';
                }
                return text;
            };

            // Helper to convert plain text to Tiptap JSON
            const textToTiptap = (text: string): any => {
                const paragraphs = text.split('\n').filter(p => p.trim());
                return {
                    type: 'doc',
                    content: paragraphs.map(p => ({
                        type: 'paragraph',
                        content: [{ type: 'text', text: p }]
                    }))
                };
            };

            // Compute new content based on edit type
            const currentText = extractText(doc.content);
            let newText = '';

            switch (pendingAction.editType) {
                case 'rewrite':
                    newText = pendingAction.newContent;
                    break;
                case 'append':
                    newText = currentText + '\n\n' + pendingAction.newContent;
                    break;
                case 'prepend':
                    newText = pendingAction.newContent + '\n\n' + currentText;
                    break;
                case 'replace_section':
                    if (pendingAction.targetText) {
                        newText = currentText.replace(pendingAction.targetText, pendingAction.newContent);
                    }
                    break;
            }

            const newContent = textToTiptap(newText);

            // Update document
            const { error: updateError } = await supabase
                .from('documents')
                .update({ content: newContent })
                .eq('id', pendingAction.documentId);

            if (updateError) {
                console.error('Failed to update document:', updateError);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Failed to update document: ${updateError.message}`,
                        timestamp: Date.now(),
                    },
                ]);
                setPendingAction(null);
                return;
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Document edited successfully',
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'edit_document' }
                },
            ]);

            // Dispatch event for document updates
            window.dispatchEvent(new CustomEvent('ai-documents-changed'));
        } else if (pendingAction.type === 'organize_documents') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            if (!currentOrganization || !user) return;

            // Execute each operation in the plan
            for (const op of pendingAction.operations) {
                let folderId = op.folderId;

                // Create folder if it doesn't exist
                if (!folderId) {
                    const { data: newFolder, error: folderError } = await supabase
                        .from('folders')
                        .insert({
                            organization_id: currentOrganization.id,
                            created_by: user.id,
                            name: op.folderName,
                            parent_folder_id: pendingAction.currentFolderId,
                            visibility: 'team',
                        } as any)
                        .select()
                        .single();

                    if (folderError || !newFolder) {
                        console.error('Failed to create folder:', folderError);
                        setMessages((prev) => [
                            ...prev,
                            {
                                role: 'assistant',
                                content: `❌ Failed to create folder "${op.folderName}": ${folderError?.message}`,
                                timestamp: Date.now(),
                            },
                        ]);
                        setPendingAction(null);
                        return;
                    }

                    folderId = newFolder.id;
                }

                // Move documents into folder
                for (const docId of op.documentIds) {
                    const { error: moveError } = await supabase
                        .from('documents')
                        .update({ folder_id: folderId })
                        .eq('id', docId);

                    if (moveError) {
                        console.error('Failed to move document:', moveError);
                        // Continue with other documents even if one fails
                    }
                }
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `✅ Organized ${pendingAction.preview.totalMoves} documents into ${pendingAction.operations.length} folder(s)`,
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'organize_documents' }
                },
            ]);

            // Dispatch event for document updates
            window.dispatchEvent(new CustomEvent('ai-documents-changed'));
        } else if (pendingAction.type === 'schedule_task') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            if (!currentOrganization || !user) return;

            // Create calendar block
            const { error: blockError } = await supabase
                .from('calendar_blocks')
                .insert({
                    organization_id: currentOrganization.id,
                    owner_id: user.id,
                    task_id: pendingAction.taskId,
                    start_time: pendingAction.startTime,
                    end_time: pendingAction.endTime,
                } as any);

            if (blockError) {
                console.error('Failed to create calendar block:', blockError);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `❌ Failed to schedule task: ${blockError.message}`,
                        timestamp: Date.now(),
                    },
                ]);
                setPendingAction(null);
                return;
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Scheduled "${pendingAction.taskTitle}" for ${pendingAction.preview.dateFormatted} at ${pendingAction.preview.timeFormatted}`,
                    timestamp: Date.now(),
                    action: { ...pendingAction, type: 'schedule_task' }
                },
            ]);

            // Trigger UI refresh via callbacks or custom event
            if (onCalendarChange) {
                await onCalendarChange();
            } else {
                window.dispatchEvent(new CustomEvent('ai-calendar-changed'));
            }
        } else if (pendingAction.type === 'batch_schedule') {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            if (!currentOrganization || !user) return;

            // Execute all schedule operations
            const schedules = pendingAction.data.schedules;
            let successCount = 0;
            let failCount = 0;

            for (const schedule of schedules) {
                const { error: blockError } = await supabase
                    .from('calendar_blocks')
                    .insert({
                        organization_id: currentOrganization.id,
                        owner_id: user.id,
                        task_id: schedule.taskId,
                        start_time: schedule.startTime,
                        end_time: schedule.endTime,
                    } as any);

                if (blockError) {
                    console.error(`Failed to schedule task ${schedule.taskId}:`, blockError);
                    failCount++;
                } else {
                    successCount++;
                }
            }

            if (failCount > 0) {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `Scheduled ${successCount} tasks, but failed to schedule ${failCount} tasks.`,
                        timestamp: Date.now(),
                        action: { ...pendingAction, type: 'batch_schedule' }
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: `✅ Successfully scheduled ${successCount} tasks for ${pendingAction.data.date}`,
                        timestamp: Date.now(),
                        action: { ...pendingAction, type: 'batch_schedule' }
                    },
                ]);
            }

            // Trigger UI refresh via callbacks or custom event
            if (onCalendarChange) {
                await onCalendarChange();
            } else {
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
        setDocumentContentCache({});
        setLastNotificationAt(0); // Reset notification tracking
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
        shouldShowNewConvoPrompt: messages.length >= lastNotificationAt && lastNotificationAt > 0,
        startNewConversation: clearHistory,
        dismissNewConvoPrompt: () => setLastNotificationAt(0),
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
