'use client';

import { SettingsForm } from '@/components/settings/SettingsForm';
import { useLanguage } from '@/lib/i18n';

export default function SettingsPage() {
    const { t } = useLanguage();
    return (
        <div className="h-full overflow-y-auto">
            <div className="pt-12 px-8 pb-16 max-w-xl mx-auto">
                {/* Header */}
                <h1 className="text-3xl font-bold text-[#37352F] mb-6 tracking-tight">{t('common.settings_title')}</h1>

                {/* Settings Form */}
                <SettingsForm />
            </div>
        </div>
    );
}
