'use client';

import { useAI } from '@/lib/ai/AIContextProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import Image from 'next/image';
import {
    Languages,
    Search,
    ListTodo,
    ClipboardList,
    Calendar,
    Sparkles,
    Bot,
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
    const { t } = useLanguage();

    const documentPresets = [
        { icon: Bot, label: t('ai.suggestion_personalize'), action: t('ai.suggestion_personalize') },
        { icon: Languages, label: t('ai.suggestion_translate'), action: t('ai.suggestion_translate') },
        { icon: Search, label: t('ai.suggestion_analyze'), action: t('ai.suggestion_analyze') },
        { icon: ListTodo, label: t('ai.suggestion_tracker'), action: t('ai.suggestion_tracker') },
    ];

    const workspacePresets = [
        { icon: ClipboardList, label: t('ai.suggestion_show_tasks'), action: t('ai.suggestion_show_tasks') },
        { icon: Calendar, label: t('ai.suggestion_check_calendar'), action: t('ai.suggestion_check_calendar') },
        { icon: Sparkles, label: t('ai.suggestion_create_task'), action: t('ai.suggestion_create_task') },
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
