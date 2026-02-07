'use client';

import { useAI } from '@/lib/ai/AIContextProvider';
import Image from 'next/image';
import {
    Languages,
    Search,
    ListTodo,
    ClipboardList,
    Calendar,
    Sparkles,
    Bot,
    PenTool
} from 'lucide-react';

const AILogoIcon = ({ className }: { className?: string }) => (
    <div className={`relative ${className}`}>
        <Image
            src="/logo.png"
            alt="AI"
            fill
            className="object-contain"
        />
    </div>
);

export function AIPresetActions({ onAction }: { onAction: (action: string) => void }) {
    const { currentPage } = useAI();

    const documentPresets = [
        { icon: Bot, label: 'Personalize your Notion AI', action: 'Help me personalize my workspace' },
        { icon: Languages, label: 'Translate this page', action: 'Translate these documents' },
        { icon: Search, label: 'Analyze for insights', action: 'Analyze these documents and provide insights' },
        { icon: ListTodo, label: 'Create a task tracker', action: 'Help me create a task tracking system' },
    ];

    const workspacePresets = [
        { icon: ClipboardList, label: 'Show my tasks', action: 'Show me all my tasks' },
        { icon: Calendar, label: 'What\'s on my calendar?', action: 'What events do I have on my calendar today?' },
        { icon: Sparkles, label: 'Create a task', action: 'Help me create a new task' },
    ];

    const presets = currentPage === 'documents' ? documentPresets : workspacePresets;

    return (
        <div className="flex flex-col gap-1">
            {presets.map((preset, idx) => (
                <button
                    key={idx}
                    onClick={() => onAction(preset.action)}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[#EFEFED] group"
                >
                    <preset.icon className="h-4 w-4 text-[#787774] group-hover:text-[#37352F] transition-colors" />
                    <span className="text-sm text-[#37352F]">{preset.label}</span>
                </button>
            ))}
        </div>
    );
}
