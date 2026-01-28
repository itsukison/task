'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/hooks';
import { Search, Lock, ChevronDown } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"
import { PeopleOptionWithVisibility } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MemberSelectorProps {
    members: PeopleOptionWithVisibility[];
    selectedMemberIds: string[];
    onSelectedMembersChange: (memberIds: string[]) => void;
    compact?: boolean;
    showAllOption?: boolean;
}

export function MemberSelector({
    members,
    selectedMemberIds,
    onSelectedMembersChange,
    compact = false,
    showAllOption = false,
}: MemberSelectorProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedMembers = members.filter(m => selectedMemberIds.includes(m.id));
    const currentUserSelected = selectedMemberIds.includes(user?.id || '');
    const otherSelectedCount = selectedMembers.filter(m => m.id !== user?.id).length;

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const DROPDOWN_WIDTH = 280; // min-w-[280px]

            let left = rect.left;

            // If dropdown overflows the right screen edge, align top-right instead of top-left
            // 20px buffer for scrollbar/margin
            if (left + DROPDOWN_WIDTH > screenWidth - 20) {
                left = rect.right - DROPDOWN_WIDTH;
                // Ensure it doesn't go off-screen to the left either
                if (left < 10) left = 10;
            }

            setDropdownPos({
                top: rect.bottom + 4,
                left,
            });
            // Focus search input
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setSearchQuery(''); // Reset search on close
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleMember = (member: PeopleOptionWithVisibility) => {
        // Don't allow toggling private members
        if (member.scheduleVisibility === 'private' && member.id !== user?.id) {
            return;
        }

        const newIds = selectedMemberIds.includes(member.id)
            ? selectedMemberIds.filter(id => id !== member.id)
            : [...selectedMemberIds, member.id];
        onSelectedMembersChange(newIds);
    };

    // Generate initials from display name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    // Check if member is selectable
    const isSelectable = (member: PeopleOptionWithVisibility) => {
        // Own schedule is always selectable
        if (member.id === user?.id) return true;
        // Private schedules are not selectable
        return member.scheduleVisibility !== 'private';
    };

    // Get current user's role to determine visibility
    const currentUserMember = members.find(m => m.id === user?.id);
    const isLeader = currentUserMember?.role === 'leader';

    // Filter members based on visibility rules
    const visibleMembers = members.filter(member => {
        // Always show own profile
        if (member.id === user?.id) return true;
        // Show team visible schedules
        if (member.scheduleVisibility === 'team') return true;
        // Show leaders_only if current user is a leader
        if (member.scheduleVisibility === 'leaders_only' && isLeader) return true;
        // Show private schedules but dim them
        if (member.scheduleVisibility === 'private') return true;
        return false;
    });

    const filteredMembers = visibleMembers.filter(m =>
        m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        if (a.id === user?.id) return -1;
        if (b.id === user?.id) return 1;
        return 0;
    });

    // Check if all selectable members are selected
    const selectableMembers = visibleMembers.filter(m => isSelectable(m));
    const isAllSelected = selectableMembers.length > 0 && selectableMembers.every(m => selectedMemberIds.includes(m.id));

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            // Select all selectable members
            const allIds = selectableMembers.map(m => m.id);
            onSelectedMembersChange(allIds);
        } else {
            // Deselect all
            onSelectedMembersChange([]);
        }
    };

    // Compact trigger label
    const getCompactLabel = () => {
        if (selectedMembers.length === 0) return 'Select';
        if (currentUserSelected) {
            return otherSelectedCount > 0 ? `You + ${otherSelectedCount}` : 'You';
        }
        return selectedMembers.length === 1
            ? selectedMembers[0].displayName.split(' ')[0]
            : `${selectedMembers.length} members`;
    };

    // Helper for trigger rendering
    const maxVisibleAvatars = 3;
    const isAllVisibleSelected = isAllSelected; // Alias for clarity

    // Determine what to show in trigger
    let triggerContent;

    if (compact) {
        // Compact behavior (Calendar)
        triggerContent = (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#37352F] bg-white border border-[#E9E9E7] rounded-md hover:bg-gray-50 transition-colors"
            >
                {selectedMembers.length > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#f0f0f0] text-[#37352f] flex items-center justify-center text-[9px] font-medium">
                        {getInitials(selectedMembers[0].displayName)}
                    </div>
                )}
                <span>{getCompactLabel()}</span>
                <ChevronDown size={12} className={cn('text-[#787774] transition-transform', isOpen && 'rotate-180')} />
            </button>
        );
    } else {
        // Full width behavior (Global Filter) - AVATAR STACK
        triggerContent = (
            <div
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E9E9E7] rounded-md cursor-pointer hover:bg-gray-50 transition-colors h-9 min-w-[120px]"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center">
                        {selectedMembers.length === 0 ? (
                            <span className="text-sm text-gray-400">Select</span>
                        ) : isAllVisibleSelected ? (
                            <span className="text-sm text-[#37352F] font-medium">All Members</span>
                        ) : (
                            <div className="flex -space-x-2.5 items-center">
                                {selectedMembers.slice(0, maxVisibleAvatars).map(member => (
                                    <div
                                        key={member.id}
                                        className="w-6 h-6 rounded-full bg-[#f0f0f0] border-2 border-white text-[#37352f] flex items-center justify-center text-[10px] font-medium shadow-sm z-10"
                                        title={member.displayName}
                                    >
                                        {getInitials(member.displayName)}
                                    </div>
                                ))}
                                {selectedMembers.length > maxVisibleAvatars && (
                                    <div
                                        className="w-6 h-6 rounded-full bg-[#f0f0f0] border-2 border-white text-[#787774] flex items-center justify-center text-[9px] font-medium shadow-sm z-0 relative"
                                    >
                                        +{selectedMembers.length - maxVisibleAvatars}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <ChevronDown size={14} className={cn('text-[#787774] transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={triggerRef}>
            {triggerContent}

            {/* Portal dropdown to body to escape overflow:hidden */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 min-w-[280px] max-h-[400px] overflow-hidden flex flex-col"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                >
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100 flex items-center gap-2">
                        <Search size={14} className="text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search members..."
                            className="flex-1 px-1 py-1.5 text-sm bg-transparent outline-none placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="px-3 py-1.5 text-xs text-gray-500 font-medium bg-gray-50/50">
                        {showAllOption ? (
                            <div className="flex items-center space-x-2 py-0.5">
                                <Checkbox
                                    id="select-all"
                                    checked={isAllSelected}
                                    onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                                    className="h-3.5 w-3.5"
                                />
                                <label
                                    htmlFor="select-all"
                                    className="text-[11px] font-medium text-[#37352F] cursor-pointer select-none"
                                >
                                    Select all
                                </label>
                            </div>
                        ) : (
                            "Select members to view their schedules"
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-[300px] p-1">
                        {filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => {
                                const isSelected = selectedMemberIds.includes(member.id);
                                const isMe = user?.id === member.id;
                                const selectable = isSelectable(member);

                                return (
                                    <div
                                        key={member.id}
                                        className={cn(
                                            "px-2 py-1.5 rounded-sm flex items-center gap-2 mb-0.5",
                                            selectable ? "cursor-pointer hover:bg-gray-100" : "cursor-not-allowed opacity-50",
                                        )}
                                        onClick={() => selectable && toggleMember(member)}
                                        title={!selectable ? "Schedule is private" : undefined}
                                    >
                                        {/* Avatar */}
                                        <div className="w-6 h-6 rounded-full bg-[#f0f0f0] text-[#37352f] flex items-center justify-center text-[10px] font-medium border border-[#e0e0e0]">
                                            {getInitials(member.displayName)}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 flex items-center justify-between min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm text-[#37352F] truncate">
                                                    {member.displayName}
                                                </span>
                                                {isMe && <span className="text-xs text-gray-400">(You)</span>}
                                                {!selectable && (
                                                    <Lock size={12} className="text-gray-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            {isSelected && selectable && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-400">
                                {searchQuery ? 'No results found' : 'No members available'}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
