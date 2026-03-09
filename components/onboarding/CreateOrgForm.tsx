'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

interface CreateOrgFormProps {
    loading: boolean;
    onSubmit: (orgName: string) => Promise<void>;
}

export function CreateOrgForm({ loading, onSubmit }: CreateOrgFormProps) {
    const { t } = useLanguage();
    const [orgName, setOrgName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim()) return;
        await onSubmit(orgName);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-[#37352F] mb-1">
                    {t('onboarding.org_name_label')}
                </label>
                <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E9E9E7] rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-[#37352F]"
                    placeholder={t('onboarding.org_name_placeholder')}
                    disabled={loading}
                    autoFocus
                />
                <p className="mt-1 text-xs text-[#787774]">
                    {t('onboarding.leader_notice')}
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="w-full py-2 px-4 bg-accent hover:bg-accent-dark text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? t('onboarding.creating_btn') : t('onboarding.create_org_btn')}
            </button>
        </form>
    );
}
