'use client';

import Image from 'next/image';

import {
    X, Send, RotateCcw, Sparkles,
    ChevronDown, SquarePen, Sidebar, Minus,
    Paperclip, Globe, ArrowUp, Check
} from 'lucide-react';
import { useAI } from '@/lib/ai/AIContextProvider';
import { useAuthContext } from '@/lib/auth/auth-context';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useState, useRef, useEffect } from 'react';
import { AIPresetActions } from './AIPresetActions';
import { PendingActionPreview } from './PendingActionPreview';
import { NewConversationPrompt } from './NewConversationPrompt';
import { WorkflowMentionPopup } from './WorkflowMentionPopup';
import { ChatHistoryPopover } from './ChatHistoryPopover';

export function AIChatPanel() {
    const {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        sendMessage,
        stopGeneration,
        clearHistory,
        loadSession,
        selectedDocuments,
        currentPage,
        pendingAction,
    } = useAI();
    const { t } = useLanguage();
    const { user, currentOrg } = useAuthContext();

    const [input, setInput] = useState('');
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<{ id: string; name: string } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input.trim(), selectedWorkflow ?? undefined);
        setInput('');
        setMentionQuery(null);
        setSelectedWorkflow(null); // clear after send
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

        // MVP Check: see if the caret is currently editing a word starting with @ 
        // For simplicity, we just look at the last word
        const words = val.split(/[\s\n]+/);
        const lastWord = words[words.length - 1];

        if (lastWord && lastWord.startsWith('@')) {
            setMentionQuery(lastWord.substring(1));
        } else {
            setMentionQuery(null);
        }
    };

    const handleMentionSelect = (workflow: any) => {
        // Replace the last word starting with @ with the selected workflow name
        const words = input.split(/([\s\n]+)/); // maintain whitespace
        for (let i = words.length - 1; i >= 0; i--) {
            if (words[i].startsWith('@')) {
                words[i] = `@${workflow.name} `;
                break;
            }
        }
        setInput(words.join(''));
        setMentionQuery(null);
        // Store the structured workflow reference for the backend
        setSelectedWorkflow({ id: workflow.id, name: workflow.name });
    };

    const handlePresetAction = (action: string) => {
        sendMessage(action);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[440px] h-[500px] max-h-[calc(100vh-48px)] rounded-2xl border border-[accent-color] bg-white shadow-xl overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <ChatHistoryPopover
                    currentOrgId={currentOrg?.id}
                    currentUserId={user?.id}
                    onNewChat={clearHistory}
                    onSelectChat={(id) => {
                        if (id !== 'curr') {
                            loadSession(id);
                        }
                    }}
                />
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearHistory}
                        className="p-1 text-[#37352F] hover:bg-[#EFEFED] rounded transition-colors"
                        title={t('ai.new_chat')}
                    >
                        <SquarePen className="h-4 w-4" />
                    </button>
                    <button
                        className="p-1 text-[#37352F] hover:bg-[#EFEFED] rounded transition-colors"
                        title="Open in full page"
                    >
                        <Sidebar className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 text-[#37352F] hover:bg-[#EFEFED] rounded transition-colors"
                        title="Close"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col h-full pt-8">
                        {/* Welcome State */}
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="h-16 w-16 rounded-full bg-white shadow-sm border border-[#E9E9E7] flex items-center justify-center">
                                <div className="relative h-8 w-8">
                                    <Image
                                        src="/logo.png"
                                        alt="AI Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#37352F]">
                                {t('ai.greeting')}
                            </h3>
                        </div>
                        <AIPresetActions onAction={handlePresetAction} />
                    </div>
                ) : (
                    <div className="space-y-1 pb-2">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
                            >
                                {msg.action && (
                                    <div className="w-full max-w-[90%] mb-1 rounded-lg overflow-hidden border border-[#E9E9E7]">
                                        <div className="opacity-60 pointer-events-none grayscale-[0.5]">
                                            <PendingActionPreview existingAction={msg.action} />
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`max-w-[90%] rounded-lg px-3 py-2 ${msg.role === 'user'
                                        ? 'bg-[#F7F7F5] text-[#37352F]'
                                        : 'bg-white text-[#37352F]'
                                        }`}
                                >
                                    {msg.action ? (
                                        <div className="flex items-center gap-2 text-[#454B4E]">
                                            <div className="flex items-center justify-center p-0.5 rounded-full bg-[#E3F2E7] text-[#1F5434]">
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    ) : (() => {
                                        try {
                                            const parsed = JSON.parse(msg.content);
                                            if (parsed?.type === 'BROWSER_LIVE') {
                                                return (
                                                    <a
                                                        href={parsed.interactiveUrl || parsed.connectUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm underline text-blue-500"
                                                    >
                                                        🖥 Live browser session — open in new tab →
                                                    </a>
                                                );
                                            }
                                        } catch { }
                                        return <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>;
                                    })()}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-1 px-3 py-2">
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9A97]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9A97] [animation-delay:0.2s]" />
                                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#9B9A97] [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        {pendingAction && (
                            <div className="-mt-4">
                                <PendingActionPreview />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Wrapper */}
            <div className="p-4 pt-2 relative">

                {/* Workflow @mention popup anchored to the input area */}
                {mentionQuery !== null && (
                    <WorkflowMentionPopup
                        query={mentionQuery}
                        onSelect={handleMentionSelect}
                        position={{ top: 0, left: 16 }} // Trigger render, CSS absolute handles actual positioning 
                    />
                )}

                <div className="relative flex flex-col rounded-2xl border border-[#E9E9E7] bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#FF5500] transition-shadow">

                    {/* Top Row: Context Chips */}
                    <div className="flex items-center gap-2 px-3 pt-3 flex-wrap">
                        <button className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E9E9E7] text-[#787774] hover:bg-[#F7F7F5]">
                            <span className="text-xs">@</span>
                        </button>

                        {/* Active Workflow Chip */}
                        {selectedWorkflow && (
                            <div className="flex items-center gap-1.5 rounded-md bg-[#FFF0E8] border border-[#FF8C5A]/30 px-2 py-0.5 text-xs text-[#d76c33] font-medium">
                                <span>⚡</span>
                                <span className="truncate max-w-[120px]">{selectedWorkflow.name}</span>
                                <button
                                    onClick={() => setSelectedWorkflow(null)}
                                    className="ml-0.5 hover:text-[#c4612c] leading-none"
                                    aria-label="Remove workflow"
                                >×</button>
                            </div>
                        )}

                        {currentPage === 'documents' && selectedDocuments.length > 0 ? (
                            selectedDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-1.5 rounded-md bg-[#F7F7F5] px-2 py-0.5 text-xs text-[#37352F]">
                                    <span>📄</span>
                                    <span className="truncate max-w-[100px]">{doc.title}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-1.5 rounded-md bg-[#F7F7F5] px-2 py-0.5 text-xs text-[#37352F]">
                                <span>💻</span>
                                <span>Workspace</span>
                            </div>
                        )}
                    </div>

                    {/* Middle: Input Field */}
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={t('ai.input_placeholder')}
                        disabled={isLoading}
                        className="w-full resize-none border-none bg-transparent px-3 py-3 text-sm placeholder-[#9B9A97] focus:outline-none min-h-[40px] max-h-[200px]"
                        rows={1}
                    />

                    {/* Bottom Row: Actions & Send */}
                    <div className="flex items-center justify-between px-2 pb-2">
                        <div className="flex items-center gap-1">
                            <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#787774] hover:bg-[#F7F7F5] transition-colors">
                                <Paperclip className="h-3.5 w-3.5" />
                            </button>
                            <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#787774] hover:bg-[#F7F7F5] transition-colors">
                                <span>Auto</span>
                            </button>
                            <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#787774] hover:bg-[#F7F7F5] transition-colors">
                                <Globe className="h-3.5 w-3.5" />
                                <span>All sources</span>
                            </button>
                        </div>

                        {isLoading ? (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    stopGeneration();
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full transition-all bg-[#F7F7F5] hover:bg-[#E9E9E7] group"
                                aria-label="Stop generation"
                            >
                                <div className="h-3 w-3 bg-[#37352F] rounded-[2px] animate-pulse group-hover:scale-90 transition-transform" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${input.trim()
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
            </div>

            {/* New Conversation Prompt */}
            <NewConversationPrompt />
        </div >
    );
}
