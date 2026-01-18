'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth/hooks';
import { Search } from 'lucide-react';
import { CellProps } from '../types';
import { PeopleOption } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * People selector cell with multi-select dropdown
 * Displays selected users as avatars, allows adding/removing owners
 */
export function PeopleCell({ value, rowId, columnId, peopleOptions = [], onChange }: CellProps) {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Value should be an array of user IDs
    const selectedIds = Array.isArray(value) ? value as string[] : [];
    const selectedPeople = peopleOptions.filter(p => selectedIds.includes(p.id));

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
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

    const togglePerson = (person: PeopleOption) => {
        const newIds = selectedIds.includes(person.id)
            ? selectedIds.filter(id => id !== person.id)
            : [...selectedIds, person.id];
        onChange(rowId, columnId, newIds);
    };

    // Generate initials from display name
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="relative w-full h-full" ref={triggerRef}>
            <div
                className="w-full h-full px-2 py-1.5 cursor-pointer flex items-center gap-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedPeople.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                        {selectedPeople.map(person => (
                            <div
                                key={person.id}
                                className="flex items-center gap-2"
                                title={person.email}
                            >
                                <div className="w-5 h-5 rounded-full bg-[#f0f0f0] border border-[#e0e0e0] text-[#37352f] flex items-center justify-center text-[10px] font-medium">
                                    {getInitials(person.displayName)}
                                </div>
                                <span className="text-sm text-[#37352F]">{person.displayName}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-gray-300 text-sm">Empty</span>
                )}
            </div>

            {/* Portal dropdown to body to escape overflow:hidden */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 min-w-[260px] max-h-[300px] overflow-hidden flex flex-col"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                >
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search for people..."
                            className="w-full px-2 py-1.5 text-sm bg-transparent outline-none placeholder:text-gray-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="px-3 py-2 text-xs text-gray-500 font-medium bg-gray-50/50">
                        Select as many as you like
                    </div>

                    <div className="overflow-y-auto max-h-[200px] p-1">
                        {peopleOptions.length > 0 ? (
                            peopleOptions
                                .filter(p => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((person) => {
                                    const isSelected = selectedIds.includes(person.id);
                                    const isMe = user?.id === person.id;

                                    return (
                                        <div
                                            key={person.id}
                                            className={cn(
                                                "px-2 py-1.5 cursor-pointer rounded-sm flex items-center gap-2 mb-0.5 hover:bg-gray-100",
                                                // isSelected ? "bg-orange-50" : "hover:bg-gray-100" // REMOVED highlight
                                            )}
                                            onClick={() => togglePerson(person)}
                                        >
                                            {/* Avatar */}
                                            <div className="w-6 h-6 rounded-full bg-[#f0f0f0] text-[#37352f] flex items-center justify-center text-[10px] font-medium border border-[#e0e0e0]">
                                                {getInitials(person.displayName)}
                                            </div>

                                            {/* Name */}
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
                                })
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-400">No members available</div>
                        )}
                        {/* Empty search result */}
                        {peopleOptions.filter(p => p.displayName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && peopleOptions.length > 0 && (
                            <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
