'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';
import { AuthProvider } from '@/lib/auth/auth-context';
import { useRequireOrg } from '@/lib/auth/hooks';

function DashboardContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { loading } = useRequireOrg();

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
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DashboardContent>{children}</DashboardContent>
        </AuthProvider>
    );
}
