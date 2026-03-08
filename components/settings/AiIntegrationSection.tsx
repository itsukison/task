'use client';

import { useState } from 'react';
import { Download, Bot } from 'lucide-react';
import { SettingSection, SettingRow, SelectDropdown } from '@/components/ui/settings-primitives';
import { useLanguage } from '@/lib/i18n';
import { useAI } from '@/lib/ai/AIContextProvider';

export function AiIntegrationSection() {
    const { t } = useLanguage();
    const { agentViewMode, setAgentViewMode } = useAI();
    const [downloading, setDownloading] = useState(false);

    const handleDownloadSkill = async () => {
        setDownloading(true);
        try {
            // Fetch the SKILL.md content via API
            const response = await fetch('/api/agent/skill');
            if (!response.ok) throw new Error('Failed to fetch skill file');

            const text = await response.text();

            // Create a blob and trigger download
            const blob = new Blob([text], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SKILL.md';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading skill file:', error);
            // In a real app, you might want to show a toast notification here
        } finally {
            setDownloading(false);
        }
    };

    const betaBadge = (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-600 border border-amber-200 leading-none">
            {t('settings.ai_beta')}
        </span>
    );

    return (
        <SettingSection title={t('settings.ai_integration')} badge={betaBadge}>
            <div className="opacity-50 pointer-events-none select-none">
                <SettingRow
                    title={t('settings.ai_agent_view_mode')}
                    description={t('settings.ai_agent_view_mode_desc')}
                >
                    <SelectDropdown
                        value={agentViewMode}
                        options={[
                            { value: 'chat', label: t('settings.ai_view_chat') },
                            { value: 'floating', label: t('settings.ai_view_floating') },
                        ]}
                        onChange={(val) => setAgentViewMode(val as 'chat' | 'floating')}
                    />
                </SettingRow>

                <div className="flex flex-col gap-3 pt-2">
                    <p className="text-sm text-[#787774] leading-relaxed">
                        {t('settings.ai_description')}
                    </p>
                    <button
                        disabled
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 mt-2 bg-white border border-[#E9E9E7] rounded-lg text-sm font-medium text-[#37352F] cursor-not-allowed"
                    >
                        <Download size={16} className="text-[#787774]" />
                        <span>{t('settings.ai_download')}</span>
                        <Bot size={16} className="ml-auto text-accent" />
                    </button>
                </div>
            </div>
        </SettingSection>
    );
}
