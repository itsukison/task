import { useCallback } from 'react';
import { PendingAction, ChatMessage } from '../types';
import { ActionContext, ActionCallbacks } from './types';
import { handleCreateTask, handleUpdateTask } from './task-actions';
import { handleRescheduleCalendar, handleScheduleTask, handleBatchSchedule } from './calendar-actions';
import { handleEditDocument, handleOrganizeDocuments } from './document-actions';
import { User } from '@supabase/supabase-js';

interface UseAIActionsProps {
    pendingAction: PendingAction | null;
    user: User | null;
    currentOrganization: { id: string } | null;
    selectedDate: Date | undefined;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setPendingAction: (action: PendingAction | null) => void;
    onTasksChange?: () => void | Promise<void>;
    onCalendarChange?: () => void | Promise<void>;
}

export function useAIActions({
    pendingAction,
    user,
    currentOrganization,
    selectedDate,
    setMessages,
    setPendingAction,
    onTasksChange,
    onCalendarChange,
}: UseAIActionsProps) {
    const confirmAction = useCallback(async () => {
        if (!pendingAction) return;

        console.log('✅ AI Context: Confirming action', pendingAction);

        const context: ActionContext = { user, currentOrganization, selectedDate };
        const callbacks: ActionCallbacks = {
            setMessages,
            setPendingAction,
            onTasksChange,
            onCalendarChange,
        };

        try {
            switch (pendingAction.type) {
                case 'create_task':
                    await handleCreateTask(pendingAction, context, callbacks);
                    break;
                case 'update_task':
                    await handleUpdateTask(pendingAction, context, callbacks);
                    break;
                case 'reschedule_calendar':
                    await handleRescheduleCalendar(pendingAction, context, callbacks);
                    break;
                case 'schedule_task':
                    await handleScheduleTask(pendingAction, context, callbacks);
                    break;
                case 'batch_schedule':
                    await handleBatchSchedule(pendingAction, context, callbacks);
                    break;
                case 'edit_document':
                    await handleEditDocument(pendingAction, context, callbacks);
                    break;
                case 'organize_documents':
                    await handleOrganizeDocuments(pendingAction, context, callbacks);
                    break;
                default:
                    console.warn('Unknown pending action type', pendingAction);
            }
        } catch (error) {
            console.error('Error executing AI action:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: '❌ Failed to execute action due to an unexpected error.',
                    timestamp: Date.now(),
                }
            ]);
        } finally {
            setPendingAction(null);
        }
    }, [pendingAction, user, currentOrganization, selectedDate, setMessages, setPendingAction, onTasksChange, onCalendarChange]);

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
    }, [setMessages, setPendingAction]);

    return { confirmAction, cancelAction };
}
