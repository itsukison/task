'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/i18n';

export const BlogFooter: React.FC = () => {
    const { t } = useLanguage();
    
    return (
        <footer className="w-full bg-background border-t border-gray-100 py-12">
            <div className="max-w-[760px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all">
                        <Image src="/logo.png" alt={t('common.app_name') + " Logo"} width={20} height={20} />
                        <span className="font-semibold tracking-tight text-sm">{t('common.app_name')}</span>
                    </Link>
                    <span className="text-sm text-gray-400">
                        {t('landing.footer.copyright')}
                    </span>
                </div>
                
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-sm text-gray-500 hover:text-foreground transition-colors">
                        {t('navigation.home')}
                    </Link>
                    <Link href="/blog" className="text-sm text-gray-500 hover:text-foreground transition-colors">
                        {t('landing.footer.company_items.blog')}
                    </Link>
                    <Link href="/login" className="text-sm text-gray-500 hover:text-foreground transition-colors">
                        {t('landing.nav.login')}
                    </Link>
                    <Link href="/signup" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                        {t('landing.nav.get_started')}
                    </Link>
                </div>
            </div>
        </footer>
    );
};
