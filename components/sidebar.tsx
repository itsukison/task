'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, BarChart2, Settings, Menu, ChevronsLeft, Search, PlusCircle, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarProps, ViewMode } from '@/lib/types';

const navItems: { id: ViewMode; href: string; icon: typeof Calendar; label: string }[] = [
    { id: 'workspace', href: '/workspace', icon: Calendar, label: 'Task Tracker' },
    { id: 'progress', href: '/progress', icon: BarChart2, label: 'Goals & Progress' },
    { id: 'settings', href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    return (
        <>
            {/* Floating Toggle Button (Visible when closed) */}
            <div
                className={cn(
                    "fixed top-3 left-3 z-50 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
                    !isOpen
                        ? "opacity-100 translate-x-0 pointer-events-auto"
                        : "opacity-0 -translate-x-4 pointer-events-none"
                )}
            >
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Sidebar Container */}
            <div
                className={cn(
                    "h-screen bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col",
                    "transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
                    "relative group overflow-hidden whitespace-nowrap flex-shrink-0",
                    isOpen
                        ? "w-[270px] opacity-100 translate-x-0"
                        : "w-0 opacity-0 -translate-x-4 border-r-0"
                )}
            >
                {/* Workspace Switcher / User */}
                <div className="px-3 py-3 hover:bg-[#EFEFED] cursor-pointer transition-colors m-1 rounded-md flex items-center justify-between group/header">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-5 h-5 bg-accent rounded text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                            T
                        </div>
                        <div className="text-sm font-medium text-[#37352F] truncate">TaskOS Workspace</div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 opacity-0 group-hover/header:opacity-100 hover:text-gray-600 transition-opacity p-1 rounded hover:bg-gray-200 flex-shrink-0 ml-2"
                    >
                        <ChevronsLeft size={18} />
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="px-2 py-1 flex flex-col gap-0.5 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors">
                        <Search size={16} />
                        <span>Search</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors">
                        <Home size={16} />
                        <span>Home</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors">
                        <PlusCircle size={16} />
                        <span>New Page</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="text-xs font-semibold text-[#9B9A97] px-3 py-2 mb-1">Favorites</div>
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-md transition-colors mb-0.5",
                                isActive(item.href)
                                    ? "bg-[#EFEFED] text-[#37352F] font-medium"
                                    : "text-[#5F5E5B] hover:bg-[#EFEFED]"
                            )}
                        >
                            <item.icon
                                size={16}
                                className={isActive(item.href) ? "text-[#37352F]" : "text-[#9B9A97]"}
                            />
                            {item.label}
                        </Link>
                    ))}

                    <div className="mt-6 text-xs font-semibold text-[#9B9A97] px-3 py-2 mb-1">Private</div>
                    <div className="flex items-center gap-2.5 px-3 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors mb-0.5">
                        <span className="text-lg leading-none">📄</span>
                        <span>Marketing Sync</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-3 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors mb-0.5">
                        <span className="text-lg leading-none">🚀</span>
                        <span>Q3 Roadmap</span>
                    </div>
                </div>

                {/* Bottom Action */}
                <div className="p-2 border-t border-[#E9E9E7]">
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[10px]">
                            JS
                        </div>
                        <div className="text-sm font-medium text-[#37352F]">John Smith</div>
                    </div>
                </div>
            </div>
        </>
    );
}
