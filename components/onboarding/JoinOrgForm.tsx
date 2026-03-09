'use client';

import React, { useState } from 'react';
import { isValidInviteCodeFormat } from '@/lib/utils/invite-codes';
import { useLanguage } from '@/lib/i18n';

interface JoinOrgFormProps {
    loading: boolean;
    onSubmit: (inviteCode: string) => Promise<void>;
    onError: (message: string) => void;
}

export function JoinOrgForm({ loading, onSubmit, onError }: JoinOrgFormProps) {
    const { t } = useLanguage();
    const [inviteCode, setInviteCode] = useState('');

    // Format invite code as user types (XXX-XXX-XXX)
    const handleInviteCodeChange = (value: string) => {
        // Remove non-alphanumeric characters
        const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Add dashes at appropriate positions
        let formatted = '';
        for (let i = 0; i < cleaned.length && i < 9; i++) {
            if (i === 3 || i === 6) {
                formatted += '-';
            }
            formatted += cleaned[i];
        }

        setInviteCode(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidInviteCodeFormat(inviteCode)) {
            onError(t('onboarding.invite_code_error'));
            return;
        }

        await onSubmit(inviteCode);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-[#37352F] mb-1">
                    {t('onboarding.invite_code_label')}
                </label>
                <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => handleInviteCodeChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E9E9E7] rounded focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-[#37352F] font-mono text-center tracking-wider"
                    placeholder={t('onboarding.invite_code_placeholder')}
                    disabled={loading}
                    autoFocus
                    maxLength={11}
                />
                <p className="mt-1 text-xs text-[#787774]">
                    {t('onboarding.invite_code_help')}
                </p>
            </div>

            <button
                type="submit"
                disabled={loading || inviteCode.length < 11}
                className="w-full py-2 px-4 bg-accent hover:bg-accent-dark text-white font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? t('onboarding.joining_btn') : t('onboarding.join_org_btn')}
            </button>
        </form>
    );
}
