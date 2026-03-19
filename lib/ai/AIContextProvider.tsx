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
import { Json } from '@/lib/database.types';
import { useAIActions } from './actions';
import { useAIChat } from './useAIChat';
import { useAISubscriptions } from './useAISubscriptions';
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
    sendMessage: (text: string, mentionedWorkflow?: { id: string; name: string }) => Promise<void>;
    stopGeneration: () => void;
    clearHistory: () => void;
    loadSession: (sessionId: string) => Promise<void>;

    // New conversation management
    shouldShowNewConvoPrompt: boolean;
    startNewConversation: () => void;
    dismissNewConvoPrompt: () => void;

    // View mode management
    agentViewMode: 'chat' | 'floating';
    setAgentViewMode: (mode: 'chat' | 'floating') => void;

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
    const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [agentViewMode, setAgentViewModeState] = useState<'chat' | 'floating'>('chat');

    // Determine current page from pathname
    const currentPage = getCurrentPage(pathname);

    const {
        messages,
        setMessages,
        currentSessionId,
        isLoading,
        pendingAction,
        setPendingAction,
        documentContentCache,
        loadSession,
        sendMessage,
        stopGeneration,
        clearHistory,
        shouldShowNewConvoPrompt,
        startNewConversation,
        dismissNewConvoPrompt,
    } = useAIChat({
        user,
        currentOrganization,
        currentPage,
        selectedDocuments,
        selectedDate,
        language
    });

    useAISubscriptions({ currentSessionId, setMessages });

    // Register WebMCP tools
    useWebMCPRegistration(currentOrganization?.id, user?.id, setPendingAction, setIsOpen);

    // Initial View Mode load
    useEffect(() => {
        const storedViewMode = localStorage.getItem('taskos_ai_view_mode') as 'chat' | 'floating' | null;
        if (storedViewMode) {
            setAgentViewModeState(storedViewMode);
        }
    }, []);

    const setAgentViewMode = useCallback((mode: 'chat' | 'floating') => {
        setAgentViewModeState(mode);
        localStorage.setItem('taskos_ai_view_mode', mode);
    }, []);

    const { confirmAction, cancelAction } = useAIActions({
        pendingAction,
        user,
        currentOrganization,
        selectedDate,
        setMessages,
        setPendingAction,
        onTasksChange,
        onCalendarChange
    });

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
        stopGeneration,
        clearHistory,
        loadSession,
        shouldShowNewConvoPrompt,
        startNewConversation,
        dismissNewConvoPrompt,
        agentViewMode,
        setAgentViewMode,
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
