import { User } from '@supabase/supabase-js';
import { ChatMessage, PendingAction } from '../types';

export interface ActionContext {
    user: User | null;
    currentOrganization: { id: string } | null;
    selectedDate: Date | undefined;
}

export interface ActionCallbacks {
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setPendingAction: (action: PendingAction | null) => void;
    onTasksChange?: () => void | Promise<void>;
    onCalendarChange?: () => void | Promise<void>;
}
