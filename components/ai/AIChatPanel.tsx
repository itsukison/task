'use client';

import {
    X, Send, RotateCcw, Sparkles,
    ChevronDown, SquarePen, Sidebar, Minus,
    Paperclip, Globe, ArrowUp, Check
} from 'lucide-react';
import { useAI } from '@/lib/ai/AIContextProvider';
import { useState, useRef, useEffect } from 'react';
import { AIPresetActions } from './AIPresetActions';
import { PendingActionPreview } from './PendingActionPreview';

export function AIChatPanel() {
    const {
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        sendMessage,
        clearHistory,
        selectedDocuments,
        currentPage,
        pendingAction,
    } = useAI();

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input.trim());
        setInput('');
    };

    const handlePresetAction = (action: string) => {
        sendMessage(action);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[440px] h-[500px] max-h-[calc(100vh-48px)] rounded-2xl border border-[accent-color] bg-white shadow-xl overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <div className="flex items-center gap-1 text-[#37352F] cursor-pointer hover:bg-[#EFEFED] px-1.5 py-1 rounded transition-colors">
                    <span className="text-sm font-medium">New AI chat</span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#787774]" />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={clearHistory}
                        className="p-1 text-[#37352F] hover:bg-[#EFEFED] rounded transition-colors"
                        title="New chat"
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
                                <Sparkles className="h-8 w-8 text-[#FF5500]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#37352F]">
                                What's our quest today?
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
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                                    )}
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
            <div className="p-4 pt-2">
                <div className="relative flex flex-col rounded-2xl border border-[#E9E9E7] bg-white shadow-sm focus-within:ring-1 focus-within:ring-[#FF5500] transition-shadow">

                    {/* Top Row: Context Chips */}
                    <div className="flex items-center gap-2 px-3 pt-3">
                        <button className="flex h-6 w-6 items-center justify-center rounded-full border border-[#E9E9E7] text-[#787774] hover:bg-[#F7F7F5]">
                            <span className="text-xs">@</span>
                        </button>

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
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Ask, search, or make anything..."
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

                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${input.trim()
                                ? 'bg-[#FF5500] text-white shadow-sm hover:bg-[#e04b00]'
                                : 'bg-[#F7F7F5] text-[#9B9A97]'
                                }`}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
