'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/hooks';
import { PeopleOption, AssignmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PeopleAvatarProps {
    ownerIds: string[];
    orgMembers: PeopleOption[];
    ownerStatuses: Record<string, AssignmentStatus>;
    onChange: (ownerIds: string[]) => void;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export const PeopleAvatar = React.memo(function PeopleAvatar({
    ownerIds,
    orgMembers,
    ownerStatuses,
    onChange,
}: PeopleAvatarProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const selectedPeople = useMemo(() => {
        const people = orgMembers.filter(p => ownerIds.includes(p.id));
        return people.sort((a, b) => {
            if (a.id === user?.id) return -1;
            if (b.id === user?.id) return 1;
            return 0;
        });
    }, [orgMembers, ownerIds, user?.id]);

    const sortedOptions = useMemo(() => {
        return [...orgMembers].sort((a, b) => {
            if (a.id === user?.id) return -1;
            if (b.id === user?.id) return 1;
            return 0;
        });
    }, [orgMembers, user?.id]);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const DROPDOWN_WIDTH = 240;
            let left = rect.left;
            if (left + DROPDOWN_WIDTH > screenWidth - 20) {
                left = rect.right - DROPDOWN_WIDTH;
                if (left < 10) left = 10;
            }
            setDropdownPos({ top: rect.bottom + 4, left });
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const togglePerson = useCallback((personId: string) => {
        const newIds = ownerIds.includes(personId)
            ? ownerIds.filter(id => id !== personId)
            : [...ownerIds, personId];
        onChange(newIds);
    }, [ownerIds, onChange]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    }, []);

    const peopleIcon = (
        <div className="w-5 h-5 rounded-full bg-[#dfe1e6] flex items-center justify-center text-[#5e6c84]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" />
            </svg>
        </div>
    );

    return (
        <div ref={triggerRef}>
            <div
                className={cn(
                    "flex items-center justify-center gap-0.5 cursor-pointer transition-all px-1 py-0.5 rounded-full",
                    isOpen ? "bg-orange-50 ring-1 ring-orange-200" : "hover:opacity-80"
                )}
                onClick={handleClick}
            >
                {selectedPeople.length === 0 && peopleIcon}
                {selectedPeople.length === 1 && selectedPeople.map(person => {
                    const isPending = ownerStatuses[person.id] === 'pending';
                    return (
                        <div
                            key={person.id}
                            className={cn(isPending && "opacity-50")}
                            title={isPending ? `${person.displayName} (pending)` : person.displayName}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                                isPending
                                    ? "bg-gray-100 border border-dashed border-gray-300 text-gray-400"
                                    : "bg-[#f0f0f0] border border-[#e0e0e0] text-[#37352f]"
                            )}>
                                {getInitials(person.displayName)}
                            </div>
                        </div>
                    );
                })}
                {selectedPeople.length > 1 && (
                    <div className="flex items-center gap-0.5">
                        {peopleIcon}
                        <span className="text-[10px] pr-0.5 font-semibold text-[#5e6c84]">
                            {selectedPeople.length}
                        </span>
                    </div>
                )}
            </div>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 w-[240px] max-h-[300px] overflow-hidden flex flex-col z-[9999]"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search..."
                            className="w-full px-2 py-1.5 text-sm bg-transparent outline-none placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-[200px] p-1">
                        {sortedOptions
                            .filter(p => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(person => {
                                const isSelected = ownerIds.includes(person.id);
                                const isMe = user?.id === person.id;
                                return (
                                    <div
                                        key={person.id}
                                        className="px-2 py-1.5 cursor-pointer rounded-sm flex items-center gap-2 mb-0.5 hover:bg-gray-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePerson(person.id);
                                        }}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-[#f0f0f0] text-[#37352f] flex items-center justify-center text-[10px] font-medium border border-[#e0e0e0]">
                                            {getInitials(person.displayName)}
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm text-[#37352F]">
                                                {person.displayName} {isMe && <span className="text-gray-400">(You)</span>}
                                            </span>
                                            {isSelected && (
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    <path d="M10 3L4.5 8.5L2 6" stroke="#FF5500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});
