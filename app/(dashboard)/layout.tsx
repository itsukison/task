'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/sidebar';
import { useRequireOrg } from '@/lib/auth/hooks';
import { AIContextProvider, useAI } from '@/lib/ai/AIContextProvider';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLanguage } from '@/lib/i18n';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const sidebarStorageKey = 'taskos_sidebar_open';
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window === 'undefined') return true;
        try {
            const stored = localStorage.getItem(sidebarStorageKey);
            if (stored === 'true' || stored === 'false') {
                return stored === 'true';
            }
        } catch (error) {
            console.error('Error reading sidebar state from localStorage:', error);
        }
        return true;
    });
    const { blocking } = useRequireOrg();
    const { agentViewMode } = useAI();
    const { t } = useLanguage();

    useEffect(() => {
        try {
            localStorage.setItem(sidebarStorageKey, String(sidebarOpen));
        } catch (error) {
            console.error('Error saving sidebar state to localStorage:', error);
        }
    }, [sidebarOpen, sidebarStorageKey]);

    // Show loading state while checking auth/org
    if (blocking) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-white">
                <div className="text-[#787774]">{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden relative">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <main className="flex-1 h-full overflow-hidden relative z-0">
                {children}
            </main>
            {/* AI Components */}
            {agentViewMode === 'floating' && (
                <>
                    <AIFloatingButton />
                    <AIChatPanel />
                </>
            )}
        </div>
    );
}



// ... (DashboardContent implementation remains same) ...

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <AIContextProvider>
                <DashboardContent>{children}</DashboardContent>
            </AIContextProvider>
        </ErrorBoundary>
    );
}
