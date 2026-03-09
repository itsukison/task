'use client';

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface PendingRequestCardProps {
    orgName: string;
    onCancel?: () => void; // Optional cancel action
}

export function PendingRequestCard({ orgName }: PendingRequestCardProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-[#E9E9E7] shadow-sm max-w-md w-full mx-auto text-center animate-in fade-in transition-all">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                <Clock className="text-accent w-6 h-6" />
            </div>

            <h2 className="text-xl font-semibold text-[#37352F] mb-3">
                {t('onboarding.request_sent_title', { orgName })}
            </h2>

            <p className="text-[#787774] mb-8 leading-relaxed">
                {t('onboarding.request_pending_desc')}
            </p>

            <div className="text-xs text-[#9B9A97] bg-[#F7F6F3] py-2 px-4 rounded-full">
                {t('onboarding.status_pending')}
            </div>
        </div>
    );
}
