'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export default function AuthCodeError() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-[#37352F]">{t('auth.verification_failed_title')}</h1>
                    <p className="text-[#787774]">
                        {t('auth.verification_failed_subtitle')}
                    </p>
                </div>

                <div className="bg-[#F7F6F3] p-4 rounded-lg text-left text-sm text-[#787774] space-y-2">
                    <p className="font-medium text-[#37352F]">{t('auth.verification_failed_instruction_title')}</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>{t('auth.verification_failed_instruction_1')}</li>
                        <li>{t('auth.verification_failed_instruction_2')}</li>
                        <li>{t('auth.verification_failed_instruction_3')}</li>
                    </ol>
                </div>

                <div className="pt-4">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-[#f35513] hover:text-[#e04e11] transition-colors"
                    >
                        {t('auth.return_to_login')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
