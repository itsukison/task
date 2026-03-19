import { useEffect } from 'react';
import { ChatMessage, PendingAction } from './types';

interface UseAISubscriptionsProps {
    currentSessionId: string | null;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useAISubscriptions({ currentSessionId, setMessages }: UseAISubscriptionsProps) {
    useEffect(() => {
        if (!currentSessionId) return;

        let channel: any;

        async function setupSubscription() {
            const supabaseImport = await import('@/lib/supabase/client');
            const supabase = supabaseImport.createClient();

            channel = supabase
                .channel(`chat_messages_${currentSessionId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'chat_messages',
                        filter: `session_id=eq.${currentSessionId}`,
                    },
                    (payload) => {
                        const newMsg = payload.new;
                        // Only add if it's an assistant message (background logs are assistant)
                        if (newMsg.role === 'assistant') {
                            setMessages((prev) => {
                                // Prevent duplicates if the message was added optimistically by the client
                                const isDuplicate = prev.some(
                                    (m) =>
                                        m.content === newMsg.content &&
                                        Math.abs(
                                            (m.timestamp || 0) -
                                            (newMsg.created_at ? new Date(newMsg.created_at).getTime() : 0)
                                        ) < 2000
                                );

                                if (!isDuplicate) {
                                    return [
                                        ...prev,
                                        {
                                            role: 'assistant',
                                            content: newMsg.content,
                                            timestamp: newMsg.created_at ? new Date(newMsg.created_at).getTime() : 0,
                                            action: newMsg.action as unknown as PendingAction | undefined,
                                        },
                                    ];
                                }
                                return prev;
                            });
                        }
                    }
                )
                .subscribe();
        }

        setupSubscription();

        return () => {
            if (channel) {
                channel.unsubscribe();
            }
        };
    }, [currentSessionId, setMessages]);
}
