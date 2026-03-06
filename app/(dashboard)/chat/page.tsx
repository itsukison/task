'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useAI } from '@/lib/ai/AIContextProvider';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n';
import { Send, Check, ArrowUp } from 'lucide-react';
import { AIPresetActions } from '@/components/ai/AIPresetActions';
import { PendingActionPreview } from '@/components/ai/PendingActionPreview';
import { WorkflowMentionPopup } from '@/components/ai/WorkflowMentionPopup';
import { ChatHistoryPopover } from '@/components/ai/ChatHistoryPopover';
import { AuthRequiredCard } from '@/components/ai/AuthRequiredCard';
import { BrowserLivePreview } from '@/components/ai/BrowserLivePreview';

export default function ChatPage() {
    const {
        messages,
        isLoading,
        sendMessage,
        stopGeneration,
        pendingAction,
        clearHistory,
        loadSession,
    } = useAI();
    const { t } = useLanguage();
    const { user, currentOrg } = useAuthContext();

    const [input, setInput] = useState('');
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<{ id: string; name: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, pendingAction, isLoading]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input.trim(), selectedWorkflow ?? undefined);
        setInput('');
        setMentionQuery(null);
        setSelectedWorkflow(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

        const words = val.split(/[\s\n]+/);
        const lastWord = words[words.length - 1];

        if (lastWord && lastWord.startsWith('@')) {
            setMentionQuery(lastWord.substring(1));
        } else {
            setMentionQuery(null);
        }
    };

    const handleMentionSelect = (workflow: any) => {
        const words = input.split(/([\ \n]+)/);
        for (let i = words.length - 1; i >= 0; i--) {
            if (words[i].startsWith('@')) {
                words[i] = `@${workflow.name} `;
                break;
            }
        }
        setInput(words.join(''));
        setMentionQuery(null);
        // Store the structured workflow so the backend can surface execute_workflow
        setSelectedWorkflow({ id: workflow.id, name: workflow.name });
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            {/* Top Right Actions */}
            <div className="absolute top-4 right-4 z-10">
                <ChatHistoryPopover
                    currentOrgId={currentOrg?.id}
                    currentUserId={user?.id}
                    onNewChat={clearHistory}
                    onSelectChat={(id) => {
                        console.log('Selected chat', id);
                        if (id !== 'curr') {
                            loadSession(id);
                        }
                    }}
                />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar pb-32" ref={scrollRef}>
                <div className="max-w-4xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20">
                            <div className="h-20 w-20 rounded-full bg-white shadow-sm border border-[#E9E9E7] flex items-center justify-center mb-6">
                                <div className="relative h-10 w-10">
                                    <Image
                                        src="/logo.png"
                                        alt="AI Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-[#37352F] mb-12">
                                {t('ai.greeting')}
                            </h3>
                            <div className="w-full max-w-2xl">
                                <AIPresetActions onAction={sendMessage} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1 w-full`}
                                >
                                    {msg.action && (
                                        <div className="w-full max-w-3xl mb-2 rounded-xl overflow-hidden border border-[#E9E9E7]">
                                            <div className="opacity-60 pointer-events-none grayscale-[0.5]">
                                                <PendingActionPreview existingAction={msg.action} />
                                            </div>
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-3xl rounded-2xl px-5 py-4 ${msg.role === 'user'
                                            ? 'bg-[#F7F7F5] text-[#37352F]'
                                            : 'bg-white text-[#37352F]'
                                            }`}
                                    >
                                        {msg.action ? (
                                            <div className="flex items-center gap-3 text-[#454B4E]">
                                                <div className="flex items-center justify-center p-1 rounded-full bg-[#E3F2E7] text-[#1F5434]">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                                <p className="text-base">{msg.content}</p>
                                            </div>
                                        ) : (() => {
                                            // Detect structured AUTH_REQUIRED messages
                                            try {
                                                const parsed = JSON.parse(msg.content);
                                                if (parsed?.type === 'AUTH_REQUIRED') {
                                                    return (
                                                        <AuthRequiredCard
                                                            service={parsed.service}
                                                            connectUrl={parsed.connectUrl}
                                                            executionId={parsed.executionId}
                                                            expiresAt={parsed.expiresAt}
                                                        />
                                                    );
                                                }
                                                if (parsed?.type === 'BROWSER_LIVE') {
                                                    return (
                                                        <BrowserLivePreview
                                                            connectUrl={parsed.connectUrl}
                                                            interactiveUrl={parsed.interactiveUrl}
                                                            sessionId={parsed.sessionId}
                                                        />
                                                    );
                                                }
                                            } catch { }
                                            return <p className="whitespace-pre-wrap text-base leading-relaxed">{msg.content}</p>;
                                        })()}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-1.5 px-5 py-4">
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#9B9A97]" />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#9B9A97] [animation-delay:0.2s]" />
                                        <div className="h-2 w-2 animate-bounce rounded-full bg-[#9B9A97] [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}

                            {pendingAction && (
                                <div className="max-w-3xl">
                                    <PendingActionPreview />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
                <div className="max-w-4xl mx-auto w-full relative">
                    {mentionQuery !== null && (
                        <div className="absolute w-[300px]" style={{ bottom: '100%', left: 0, marginBottom: '8px' }}>
                            <WorkflowMentionPopup
                                query={mentionQuery}
                                onSelect={handleMentionSelect}
                                position={{ top: 0, left: 0 }} // Managed by wrapper div absolutely
                            />
                        </div>
                    )}
                    <div className="relative flex flex-col bg-[#F7F7F5] border border-[#E9E9E7] rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-black/5 focus-within:border-[#D4D4D2] transition-all">

                        {/* Workflow pill row — shown above textarea when a workflow is selected */}
                        {selectedWorkflow && (
                            <div className="flex items-center gap-2 px-4 pt-3">
                                <div className="flex items-center gap-1.5 rounded-md bg-[#FFF0E8] border border-[#FF8C5A]/30 px-2 py-0.5 text-xs text-[#d76c33] font-medium">
                                    <span>⚡</span>
                                    <span className="truncate max-w-[200px]">{selectedWorkflow.name}</span>
                                    <button
                                        onClick={() => setSelectedWorkflow(null)}
                                        className="ml-0.5 hover:text-[#c4612c] leading-none text-sm"
                                        aria-label="Remove workflow"
                                    >×</button>
                                </div>
                            </div>
                        )}

                        <div className="relative flex items-center">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={t('ai.input_placeholder')}
                                className="w-full bg-transparent border-none rounded-2xl py-4 pl-5 pr-14 text-[15px] text-[#37352F] placeholder:text-[#9B9A97] focus:ring-0 resize-none h-[56px] min-h-[56px] max-h-[200px] overflow-y-auto"
                                rows={1}
                            />
                            {isLoading ? (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        stopGeneration();
                                    }}
                                    className="absolute right-3 p-2 h-8 w-8 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all bg-[#F7F7F5] hover:bg-[#E9E9E7] group"
                                    aria-label="Stop generation"
                                >
                                    <div className="h-3 w-3 bg-[#37352F] rounded-[2px] animate-pulse group-hover:scale-90 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className={`absolute right-3 p-2 h-8 w-8 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all ${input.trim()
                                        ? 'bg-[#d76c33] text-white shadow-sm hover:bg-[#c4612c]'
                                        : 'bg-[#d76c33]/50 text-white cursor-not-allowed'
                                        }`}
                                    aria-label="Send message"
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-xs text-[#9B9A97]">AI can make mistakes. Consider verifying important information.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
