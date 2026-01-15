'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CellProps } from '../types';

/**
 * Dropdown select cell with portal-based dropdown
 */
export function SelectCell({ value, rowId, columnId, options = [], onChange }: CellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const selectedOption = options.find(opt => opt.label === value);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 4,
                left: rect.left,
            });
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

    const handleSelect = (opt: typeof options[0]) => {
        onChange(rowId, columnId, opt.label);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full h-full" ref={triggerRef}>
            <div
                className="w-full h-full px-2 py-1.5 cursor-pointer flex items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: selectedOption.backgroundColor, color: '#37352F' }}
                    >
                        {selectedOption.label}
                    </span>
                ) : (
                    <span className="text-gray-300 text-sm">Select...</span>
                )}
            </div>

            {/* Portal dropdown to body to escape overflow:hidden */}
            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 min-w-[160px] max-h-[200px] overflow-auto"
                    style={{ top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.label}
                            className="px-3 py-1.5 cursor-pointer hover:bg-gray-50 flex items-center"
                            onClick={() => handleSelect(opt)}
                        >
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: opt.backgroundColor, color: '#37352F' }}
                            >
                                {opt.label}
                            </span>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </div>
    );
}
