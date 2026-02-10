'use client';

import Image from 'next/image';
import { SettingSection } from '@/components/ui/settings-primitives';
import { useLanguage } from '@/lib/i18n';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'connected' | 'disconnected' | 'coming_soon';
}

export function IntegrationsSection() {
    const { t } = useLanguage();

    const integrations: Integration[] = [
        {
            id: 'notion',
            name: t('integrations.notion_name'),
            description: t('integrations.notion_desc'),
            icon: '/notion.png',
            status: 'coming_soon'
        },
        {
            id: 'teams',
            name: t('integrations.teams_name'),
            description: t('integrations.teams_desc'),
            icon: '/Microsoft_Teams.png',
            status: 'coming_soon'
        },
        {
            id: 'slack',
            name: t('integrations.slack_name'),
            description: t('integrations.slack_desc'),
            icon: '/Slack_icon_2019.svg.png',
            status: 'coming_soon'
        }
    ];

    return (
        <SettingSection title={t('integrations.title')}>
            <div className="space-y-1">
                {integrations.map((integration) => (
                    <div
                        key={integration.id}
                        className="flex items-center justify-between py-3 group"
                    >
                        <div className="flex items-center gap-4 flex-1 mr-4">
                            {/* Icon Container */}
                            <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white border border-[#E9E9E7] rounded-lg shadow-xs overflow-hidden p-1.5">
                                <Image
                                    src={integration.icon}
                                    alt={integration.name}
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>

                            {/* Text Info */}
                            <div>
                                <div className="text-sm font-medium text-[#37352F]">
                                    {integration.name}
                                </div>
                                <div className="text-xs text-[#787774] mt-0.5">
                                    {integration.description}
                                </div>
                            </div>
                        </div>

                        {/* Action Request */}
                        <div className="flex-shrink-0">
                            <button
                                disabled={true}
                                className="px-3 py-1.5 text-xs font-medium text-[#787774] bg-[#F7F6F3] border border-[#E9E9E7] rounded cursor-not-allowed opacity-80"
                            >
                                {t('integrations.coming_soon')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </SettingSection>
    );
}
