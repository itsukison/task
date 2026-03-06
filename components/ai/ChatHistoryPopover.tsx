'use client';

import React, { useState, useEffect } from 'react';
import { History, Plus, Trash2 } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { createClient } from '@/lib/supabase/client';

export interface ChatSessionMeta {
    id: string;
    title: string;
    updatedAt: number;
}

interface ChatHistoryPopoverProps {
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    currentOrgId?: string;
    currentUserId?: string;
}

export function ChatHistoryPopover({ onNewChat, onSelectChat, currentOrgId, currentUserId }: ChatHistoryPopoverProps) {
    const [open, setOpen] = useState(false);
    const [conversations, setConversations] = useState<ChatSessionMeta[]>([]);
    const supabase = createClient();

    useEffect(() => {
        if (!open || !currentOrgId || !currentUserId) return;

        const fetchSessions = async () => {
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('id, title, updated_at')
                .eq('organization_id', currentOrgId)
                .eq('user_id', currentUserId)
                .order('updated_at', { ascending: false });

            if (data && !error) {
                setConversations(data.map(session => ({
                    id: session.id,
                    title: session.title,
                    updatedAt: session.updated_at ? new Date(session.updated_at).getTime() : 0
                })));
            }
        };

        fetchSessions();
    }, [open, currentOrgId, currentUserId]);

    const formatRelativeTime = (timestamp: number) => {
        const diffInMs = Date.now() - timestamp;
        const diffInMins = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMins / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        if (diffInHours > 0) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
        if (diffInMins > 0) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
        return 'just now';
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
        if (!error) {
            setConversations(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onNewChat}
                className="p-1.5 text-[#37352F] hover:bg-[#EFEFED] rounded-md transition-colors"
                title="New Chat"
            >
                <Plus className="w-4 h-4" />
            </button>

            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        className="p-1.5 text-[#37352F] hover:bg-[#EFEFED] rounded-md transition-colors data-[state=open]:bg-[#EFEFED]"
                        title="Chat History"
                    >
                        <History className="w-4 h-4" />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        className="w-[480px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-[#E9E9E7] p-2 flex flex-col z-50 overflow-hidden font-sans"
                        align="end"
                        sideOffset={8}
                    >
                        <div className="px-3 pb-2 pt-1">
                            <input
                                type="text"
                                placeholder="Select a conversation"
                                className="w-full text-[15px] outline-none placeholder-[#9B9A97] text-[#37352F] bg-transparent"
                            />
                        </div>

                        <div className="overflow-y-auto max-h-[500px] custom-scrollbar flex flex-col gap-0.5">
                            <div className="mt-2 mb-1 px-3 text-xs font-medium text-[#9B9A97]">Recent Conversations</div>
                            {conversations.length === 0 && (
                                <div className="px-3 py-4 text-sm text-[#9B9A97] text-center">No history found.</div>
                            )}
                            {conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className="flex items-center justify-between px-3 py-2 bg-[#F7F7F5] rounded-lg group cursor-pointer hover:bg-[#EFEFED]"
                                    onClick={() => {
                                        onSelectChat(conv.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className="text-sm font-medium text-[#37352F] truncate">{conv.title}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-[#9B9A97]">{formatRelativeTime(conv.updatedAt)}</span>
                                        <button
                                            className="text-[#9B9A97] hover:text-[#EB5757] opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleDelete(e, conv.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
