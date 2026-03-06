'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Calendar, BarChart2, Settings, Menu, ChevronsLeft, Search, PlusCircle, FileText, LogOut, ChevronDown, Users, Plus, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarProps, ViewMode } from '@/lib/types';
import { useAuth } from '@/lib/auth/hooks';
import { useJoinRequests } from '@/lib/hooks/use-join-requests';
import { OrgSwitcherModal } from '@/components/organization/OrgSwitcherModal';
import { useLanguage } from '@/lib/i18n';

const topNavItems: { id: string; href: string; icon: any; label: string }[] = [
    { id: 'documents', href: '/documents', icon: FileText, label: 'Documents' },
    { id: 'workspace', href: '/workspace', icon: Calendar, label: 'Task Tracker' },
];

const secondaryNavItems: { id: string; href: string; icon: any; label: string }[] = [
    { id: 'progress', href: '/progress', icon: BarChart2, label: 'Goals & Progress' },
    { id: 'workflows', href: '/workflows', icon: Bot, label: 'Workflows' },
    { id: 'chat', href: '/chat', icon: Sparkles, label: 'AI Chat' },
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
    const { user, profile, currentOrg, organizations, signOut, switchOrganization, refreshOrganizations } = useAuth();
    const { t } = useLanguage();

    // State for local UI
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const [joinOrgModalOpen, setJoinOrgModalOpen] = useState(false);
    const [newOrgIds, setNewOrgIds] = useState<string[]>([]);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const orgMenuRef = useRef<HTMLDivElement>(null);

    // Filter "New" organizations (client-side specific feature)
    useEffect(() => {
        if (!user || organizations.length === 0) return;

        const storageKey = `taskos_seen_orgs_${user.id}`;
        try {
            const seenIdsJson = localStorage.getItem(storageKey);
            const currentIds = organizations.map(o => o.id);

            if (!seenIdsJson) {
                // First time load or new device - Assume all current are "seen" to avoid notification spam
                // UNLESS the array is length 1 (just joined?) - but safer to just sync.
                localStorage.setItem(storageKey, JSON.stringify(currentIds));
                setNewOrgIds([]);
            } else {
                const seenIds = JSON.parse(seenIdsJson) as string[];
                const newIds = currentIds.filter(id => !seenIds.includes(id));
                setNewOrgIds(newIds);

                // If we have just opened the menu, we should technically mark them as seen,
                // but we handle that in the menu open handler to keep the badge while viewing.
            }
        } catch (e) {
            console.error('Error accessing localStorage:', e);
        }
    }, [organizations, user]);

    // Handle marking orgs as seen when menu opens
    useEffect(() => {
        if (orgMenuOpen && user && newOrgIds.length > 0) {
            // When menu opens, update storage so they are not "new" next time
            // But we keep `newOrgIds` state populated so the "New" badges are visible during this interaction
            const storageKey = `taskos_seen_orgs_${user.id}`;
            const currentIds = organizations.map(o => o.id);
            localStorage.setItem(storageKey, JSON.stringify(currentIds));
        }
    }, [orgMenuOpen, user, organizations, newOrgIds.length]);

    // Realtime subscription for organization membership changes
    useEffect(() => {
        if (!user) return;

        // Import supabase here to avoid server component issues if any (though this file is 'use client')
        // We need to use the client one
        const { supabase } = require('@/lib/supabase');

        const channel = supabase
            .channel('org-membership-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'organization_members',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    // Refresh organizations when added to a new one
                    refreshOrganizations();
                }
            )
            .subscribe();

        return () => {
            // Only cleanup if user still exists (not during logout)
            if (user) {
                supabase.removeChannel(channel);
            }
        };
    }, [user, refreshOrganizations]);

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
    // const userInitials = ... (moved to helper)
    const userInitials = getInitials(profile?.display_name);
    const userName = profile?.display_name || 'User';
    const userEmail = profile?.email || '';
    const orgName = currentOrg?.name || 'Organization';
    const hasNewOrgs = newOrgIds.length > 0;

    // Pending requests for leaders
    const { requests } = useJoinRequests();
    const pendingCount = requests.length;

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
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    {/* Collapsed Badge (Leader Requests) */}
                    {!isOpen && pendingCount > 0 && currentOrg?.role === 'leader' && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#EB5757] rounded-full border-2 border-white" />
                    )}
                    {/* Collapsed Badge (New Org) - only show if not showing leader badge to avoid clutter, or offset it? 
                        Let's prioritize leader requests, or just show if either exists (but distinct implies blue vs red?)
                        User asked for notification "so they detect". Let's use blue for New Org to differentiate? 
                        Or standard red. Let's use Red for both.
                    */}
                    {!isOpen && hasNewOrgs && !(pendingCount > 0 && currentOrg?.role === 'leader') && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                </div>
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
                        onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                        className="px-3 py-3 hover:bg-[#EFEFED] transition-colors m-1 rounded-md flex items-center justify-between group/header cursor-pointer relative"
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-5 h-5 bg-accent rounded text-white flex-shrink-0 flex items-center justify-center text-[10px] font-bold">
                                {orgInitial}
                            </div>
                            <div className="text-sm font-medium text-[#37352F] truncate">{orgName}</div>
                            <ChevronDown size={14} className={cn(
                                "text-[#9B9A97] flex-shrink-0 transition-transform",
                                orgMenuOpen && "rotate-180"
                            )} />
                        </div>

                        {/* New Org Notification Badge (Outer) */}
                        {hasNewOrgs && !orgMenuOpen && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                        )}

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="text-gray-400 opacity-100 hover:text-gray-600 transition-opacity p-1 rounded hover:bg-gray-200 flex-shrink-0 ml-2"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                    </div>

                    {/* Organization Dropdown */}
                    {orgMenuOpen && (
                        <div className="absolute top-full left-1 right-1 mt-1 bg-white rounded-md shadow-lg border border-[#E9E9E7] py-1 mx-1 z-50">
                            {organizations.length > 0 && (
                                <>
                                    <div className="px-3 py-1.5 text-xs font-semibold text-[#9B9A97]">{t('settings.switch_org')}</div>
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
                                            <span className="truncate flex-1">{org.name}</span>

                                            {/* New Badge */}
                                            {newOrgIds.includes(org.id) && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold mr-1">
                                                    New
                                                </span>
                                            )}

                                            <span className="text-xs text-[#9B9A97]">{org.role}</span>
                                        </div>
                                    ))}
                                </>
                            )}
                            <div className={cn(
                                "pt-1",
                                organizations.length > 0 && "border-t border-[#E9E9E7] mt-1"
                            )}>
                                <div
                                    onClick={() => {
                                        setOrgMenuOpen(false);
                                        setJoinOrgModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-[#5F5E5B] hover:bg-[#EFEFED] transition-colors"
                                >
                                    <Plus size={16} className="text-[#9B9A97]" />
                                    <span>{t('settings.join_create_org')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions (Top Section) */}
                <div className="px-2 py-1 flex flex-col gap-0.5 mb-2">
                    <div className="flex items-center gap-2 px-3 py-1 text-sm text-[#9B9A97] rounded-md cursor-not-allowed opacity-60 mb-1 mt-1">
                        <Search size={16} />
                        <span className="flex-1">{t('navigation.search')}</span>
                        <span className="text-[10px] border border-[#E9E9E7] px-1.5 py-0.5 rounded text-[#9B9A97]">{t('navigation.soon')}</span>
                    </div>
                    {topNavItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-md transition-colors mb-0.5 relative group/link",
                                isActive(item.href)
                                    ? "bg-[#EFEFED] text-[#37352F] font-medium"
                                    : "text-[#5F5E5B] hover:bg-[#EFEFED]"
                            )}
                        >
                            <item.icon
                                size={16}
                                className={isActive(item.href) ? "text-[#37352F]" : "text-[#9B9A97]"}
                            />
                            <span className="flex-1">{t('navigation.' + item.id) === 'navigation.' + item.id ? item.label : t('navigation.' + item.id)}</span>
                        </Link>
                    ))}
                </div>

                {/* Navigation (Secondary Section) */}
                <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                    <div className="text-xs font-semibold text-[#9B9A97] px-3 py-2 mb-1">{t('navigation.favorites')}</div>
                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1 text-sm rounded-md transition-colors mb-0.5 relative group/link",
                                isActive(item.href)
                                    ? "bg-[#EFEFED] text-[#37352F] font-medium"
                                    : "text-[#5F5E5B] hover:bg-[#EFEFED]"
                            )}
                        >
                            <item.icon
                                size={16}
                                className={isActive(item.href) ? "text-[#37352F]" : "text-[#9B9A97]"}
                            />
                            <span className="flex-1">{t('navigation.' + item.id) === 'navigation.' + item.id ? item.label : t('navigation.' + item.id)}</span>

                            {/* Notification Badge for Settings */}
                            {item.id === 'settings' && pendingCount > 0 && currentOrg?.role === 'leader' && (
                                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#EB5757] text-white text-[10px] font-bold rounded-full">
                                    {pendingCount}
                                </span>
                            )}
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
                                    <span>{t('navigation.logout')}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Organization Switcher Modal */}
            <OrgSwitcherModal
                isOpen={joinOrgModalOpen}
                onClose={() => setJoinOrgModalOpen(false)}
            />
        </>
    );
}
