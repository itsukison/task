import { useState, useRef, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { ChatMessage, PendingAction, DocumentContentCache, AgentContext, ChatRequest, ChatResponse } from './types';
import { Document } from '@/lib/types';

/**
 * Truncate conversation history to most recent N messages for token optimization
 */
function slidingWindowHistory(history: ChatMessage[], maxMessages: number = 20): ChatMessage[] {
    if (history.length <= maxMessages) {
        return history;
    }
    return history.slice(-maxMessages);
}

interface UseAIChatProps {
    user: User | null;
    currentOrganization: { id: string } | null;
    currentPage: 'documents' | 'workspace' | 'progress' | 'settings';
    selectedDocuments: Document[];
    selectedDate?: Date;
    language: 'en' | 'ja';
}

export function useAIChat({
    user,
    currentOrganization,
    currentPage,
    selectedDocuments,
    selectedDate,
    language
}: UseAIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [documentContentCache, setDocumentContentCache] = useState<DocumentContentCache>({});
    const [lastNotificationAt, setLastNotificationAt] = useState<number>(0);

    const abortControllerRef = useRef<AbortController | null>(null);
    const messagesRef = useRef<ChatMessage[]>([]);

    // Sync messages ref to avoid circular dependency in useCallback
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Load latest session from Supabase on mount
    useEffect(() => {
        async function loadLatestSession() {
            if (!user || !currentOrganization) return;
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            const storedSessionId = localStorage.getItem('taskos_ai_current_session_id');

            if (storedSessionId === 'new') {
                setIsLoading(false);
                return;
            }

            let session;
            if (storedSessionId && storedSessionId !== 'new') {
                const { data } = await supabase
                    .from('chat_sessions')
                    .select('id')
                    .eq('id', storedSessionId)
                    .eq('user_id', user.id)
                    .single();
                session = data;
            }

            if (!session) {
                const { data: latestSession } = await supabase
                    .from('chat_sessions')
                    .select('id')
                    .eq('organization_id', currentOrganization.id)
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();
                session = latestSession;
            }

            if (session) {
                setCurrentSessionId(session.id);
                localStorage.setItem('taskos_ai_current_session_id', session.id);
                const { data: history } = await supabase
                    .from('chat_messages')
                    .select('role, content, action, created_at')
                    .eq('session_id', session.id)
                    .order('created_at', { ascending: true });

                if (history && history.length > 0) {
                    const typedHistory = history.map(msg => ({
                        role: msg.role as 'user' | 'assistant',
                        content: msg.content,
                        action: msg.action as unknown as PendingAction | undefined,
                        timestamp: msg.created_at ? new Date(msg.created_at).getTime() : 0,
                    }));
                    setMessages(typedHistory);
                }
            }
        }

        loadLatestSession();
    }, [user, currentOrganization]);

    const loadSession = useCallback(async (sessionId: string) => {
        if (!user || !currentOrganization) return;

        setIsLoading(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        try {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            setCurrentSessionId(sessionId);
            localStorage.setItem('taskos_ai_current_session_id', sessionId);

            const { data: history } = await supabase
                .from('chat_messages')
                .select('role, content, action, created_at')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (history) {
                const typedHistory = history.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content,
                    action: msg.action as unknown as PendingAction | undefined,
                    timestamp: msg.created_at ? new Date(msg.created_at).getTime() : 0,
                }));
                setMessages(typedHistory);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error('Failed to load session:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, currentOrganization]);

    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsLoading(false);
        }
    }, []);

    const sendMessage = useCallback(
        async (text: string, mentionedWorkflow?: { id: string; name: string }) => {
            if (!user || !currentOrganization) return;

            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            let sessionId = currentSessionId;

            if (!sessionId) {
                const titlePreview = text.split(" ").slice(0, 5).join(" ").substring(0, 30);
                const { data: newSession } = await supabase
                    .from('chat_sessions')
                    .insert({
                        organization_id: currentOrganization.id,
                        user_id: user.id,
                        title: titlePreview + (text.length > 30 ? '...' : '')
                    })
                    .select('id')
                    .single();

                if (newSession) {
                    sessionId = newSession.id;
                    setCurrentSessionId(newSession.id);
                    localStorage.setItem('taskos_ai_current_session_id', newSession.id);
                }
            } else {
                await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
            }

            const userMessage: ChatMessage = {
                role: 'user',
                content: text,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setPendingAction(null);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            if (sessionId) {
                supabase.from('chat_messages').insert({
                    session_id: sessionId,
                    role: 'user',
                    content: text
                }).then(); // fire and forget
            }

            try {
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
                    mentionedWorkflow: mentionedWorkflow ?? undefined,
                };

                const request: ChatRequest = {
                    message: text,
                    context,
                    history: slidingWindowHistory(messagesRef.current),
                    documentCache: documentContentCache,
                    sessionId: sessionId ?? undefined,
                };

                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(request),
                    credentials: 'include',
                    signal: abortControllerRef.current?.signal,
                });

                const data: ChatResponse = await response.json();

                if (data.error) {
                    throw new Error(data.error);
                }

                const assistantMessage: ChatMessage = {
                    role: 'assistant',
                    content: data.message,
                    timestamp: Date.now(),
                    action: data.pendingAction
                };

                setMessages((prev) => [...prev, assistantMessage]);

                if (sessionId) {
                    supabase.from('chat_messages').insert({
                        session_id: sessionId,
                        role: 'assistant',
                        content: data.message,
                        action: (data.pendingAction as any) || null
                    }).then();
                }

                const totalMessages = messagesRef.current.length + 2; 
                if (totalMessages >= 20 && (totalMessages - lastNotificationAt >= 20)) {
                    setLastNotificationAt(totalMessages);
                }

                if (data.pendingAction) {
                    console.log('📥 AI Context: Received pending action', data.pendingAction);
                    setPendingAction(data.pendingAction);
                }

                if (data.updatedCache) {
                    setDocumentContentCache(data.updatedCache);
                }
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    console.log('AI Generation stopped by user');
                    return;
                }
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
        [user, currentOrganization, currentSessionId, currentPage, selectedDocuments, documentContentCache, selectedDate, language, lastNotificationAt]
    );

    const clearHistory = useCallback(() => {
        setMessages([]);
        setPendingAction(null);
        setCurrentSessionId(null);
        localStorage.setItem('taskos_ai_current_session_id', 'new');
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
    }, []);

    // Check if we should show "start new conversation" notification
    const shouldShowNewConvoPrompt = messages.length >= 20 && (messages.length - lastNotificationAt >= 0) && lastNotificationAt > 0;

    const startNewConversation = useCallback(() => {
        clearHistory();
        setLastNotificationAt(0);
    }, [clearHistory]);

    const dismissNewConvoPrompt = useCallback(() => {
        // Move trigger forward so it doesn't show again immediately
        setLastNotificationAt(prev => prev + 20);
    }, []);

    return {
        messages,
        setMessages,
        currentSessionId,
        setCurrentSessionId,
        isLoading,
        setIsLoading,
        pendingAction,
        setPendingAction,
        documentContentCache,
        setDocumentContentCache,
        loadSession,
        sendMessage,
        stopGeneration,
        clearHistory,
        shouldShowNewConvoPrompt,
        startNewConversation,
        dismissNewConvoPrompt,
    };
}
