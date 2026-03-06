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

    return (
        <SettingSection title="AI Integration">
            <SettingRow
                title="Agent View Mode"
                description="Choose how you want to interact with the AI assistant."
            >
                <SelectDropdown
                    value={agentViewMode}
                    options={[
                        { value: 'chat', label: 'Chat Page (Default)' },
                        { value: 'floating', label: 'Floating Widget' },
                    ]}
                    onChange={(val) => setAgentViewMode(val as 'chat' | 'floating')}
                />
            </SettingRow>

            <div className="flex flex-col gap-3 pt-2">
                <p className="text-sm text-[#787774] leading-relaxed">
                    Chrono is fully compatible with AI Agents via the Browser Model Context Protocol (WebMCP).
                    Provide this Skill document to your AI Agent (like OpenClaw) to securely expose Chrono's capabilities directly to the agent.
                </p>
                <button
                    onClick={handleDownloadSkill}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 mt-2 bg-white border border-[#E9E9E7] rounded-lg text-sm font-medium text-[#37352F] hover:bg-[#F7F7F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {downloading ? (
                        <span className="w-4 h-4 border-2 border-[#37352F] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Download size={16} className="text-[#787774]" />
                    )}
                    <span>Download Agent Skill (SKILL.md)</span>
                    <Bot size={16} className="ml-auto text-accent" />
                </button>
            </div>
        </SettingSection>
    );
}
