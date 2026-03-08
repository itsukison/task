'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { useRequireOrg } from '@/lib/auth/hooks';
import { AIContextProvider, useAI } from '@/lib/ai/AIContextProvider';
import { AIFloatingButton } from '@/components/ai/AIFloatingButton';
import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { loading } = useRequireOrg();
    const { agentViewMode } = useAI();

    // Show loading state while checking auth/org
    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-white">
                <div className="text-[#787774]">Loading...</div>
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
