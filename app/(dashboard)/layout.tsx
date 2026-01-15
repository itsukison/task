'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen w-screen bg-white text-gray-900 overflow-hidden relative">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <main className="flex-1 h-full overflow-hidden relative z-0">
                {children}
            </main>
        </div>
    );
}
