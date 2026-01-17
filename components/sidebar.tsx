'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BarChart2, Settings, Menu, ChevronsLeft, Search, PlusCircle, Home, LogOut, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarProps, ViewMode } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';

const navItems: { id: ViewMode; href: string; icon: typeof Calendar; label: string }[] = [
    { id: 'workspace', href: '/workspace', icon: Calendar, label: 'Task Tracker' },
    { id: 'progress', href: '/progress', icon: BarChart2, label: 'Goals & Progress' },
    { id: 'settings', href: '/settings', icon: Settings, label: 'Settings' },
];

/**
 * Get initials from a display name
 */
function getInitials(name: string | null | undefined): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, currentOrg, organizations, signOut, switchOrganization } = useAuth();

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const orgMenuRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
                setOrgMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleSwitchOrg = async (orgId: string) => {
        try {
            await switchOrganization(orgId);
            setOrgMenuOpen(false);
            // Refresh the page to reload data for the new org
            window.location.reload();
        } catch (error) {
            console.error('Error switching organization:', error);
        }
    };

    const orgInitial = currentOrg?.name?.[0]?.toUpperCase() || 'O';
    const userInitials = getInitials(profile?.display_name);
    const userName = profile?.display_name || 'User';
    const userEmail = profile?.email || '';
    const orgName = currentOrg?.name || 'Organization';
    const hasMultipleOrgs = organizations.length > 1;

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
                {/* Organization Switcher */}
                <div className="relative" ref={orgMenuRef}>
                    <div
                        onClick={() => hasMultipleOrgs && setOrgMenuOpen(!orgMenuOpen)}
                        className={cn(
                            "px-3 py-3 hover:bg-[#EFEFED] transition-colors m-1 rounded-md flex items-center justify-between group/header",
                            hasMultipleOrgs ? "cursor-pointer" : "cursor-default"
                        )}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-5 h-5 bg-accent rounded text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                {orgInitial}
                            </div>
                            <div className="text-sm font-medium text-[#37352F] truncate">{orgName}</div>
                            {hasMultipleOrgs && (
                                <ChevronDown size={14} className="text-[#9B9A97] flex-shrink-0" />
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="text-gray-400 opacity-0 group-hover/header:opacity-100 hover:text-gray-600 transition-opacity p-1 rounded hover:bg-gray-200 flex-shrink-0 ml-2"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                    </div>

                    {/* Organization Dropdown */}
                    {orgMenuOpen && hasMultipleOrgs && (
                        <div className="absolute top-full left-1 right-1 mt-1 bg-white rounded-md shadow-lg border border-[#E9E9E7] py-1 z-50">
                            <div className="px-3 py-1.5 text-xs font-semibold text-[#9B9A97]">Switch Organization</div>
                            {organizations.map((org) => (
                                <div
                                    key={org.id}
                                    onClick={() => handleSwitchOrg(org.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors",
                                        org.id === currentOrg?.id
                                            ? "bg-[#EFEFED] text-[#37352F]"
                                            : "text-[#5F5E5B] hover:bg-[#EFEFED]"
                                    )}
                                >
                                    <div className="w-5 h-5 bg-accent rounded text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                        {org.name[0]?.toUpperCase() || 'O'}
                                    </div>
                                    <span className="truncate">{org.name}</span>
                                    <span className="text-xs text-[#9B9A97] ml-auto">{org.role}</span>
                                </div>
                            ))}
                        </div>
                    )}
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
                </div>

                {/* User Section with Menu */}
                <div className="p-2 border-t border-[#E9E9E7] relative" ref={userMenuRef}>
                    <div
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#EFEFED] rounded-md cursor-pointer transition-colors"
                    >
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[10px]">
                            {userInitials}
                        </div>
                        <div className="text-sm font-medium text-[#37352F] truncate flex-1">{userName}</div>
                        <ChevronDown size={14} className={cn(
                            "text-[#9B9A97] transition-transform",
                            userMenuOpen && "rotate-180"
                        )} />
                    </div>

                    {/* User Dropdown Menu */}
                    {userMenuOpen && (
                        <div className="absolute bottom-full left-1 right-1 mb-1 bg-white rounded-lg shadow-md border border-[#E9E9E7] overflow-hidden z-50">
                            {/* User Info Header */}
                            <div className="px-3 py-3 bg-[#FAFAFA]">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
                                        {userInitials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-[#37352F] truncate">{userName}</div>
                                        <div className="text-xs text-[#9B9A97] truncate">{userEmail}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                                {currentOrg && (
                                    <div className="px-3 py-1.5 text-xs text-[#9B9A97]">
                                        <span className="capitalize">{currentOrg.role}</span> · {orgName}
                                    </div>
                                )}

                                <div
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-[#37352F] hover:bg-[#EFEFED] cursor-pointer transition-colors"
                                >
                                    <LogOut size={14} className="text-[#9B9A97]" />
                                    <span>Log out</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
