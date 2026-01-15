'use client';

import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowUp, ArrowDown, EyeOff, PanelLeftClose, PanelRightClose, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { HeaderMenuProps } from '../types';
import { DataTypeIcon } from '../utils';

/**
 * Column header context menu with sorting and visibility controls
 */
export function HeaderMenu({ label, dataType, columnId, position, onSortAsc, onSortDesc, onHide, onClose }: HeaderMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [editingLabel, setEditingLabel] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const menuItems = [
        {
            icon: <ArrowUp size={16} />,
            label: 'Sort ascending',
            onClick: () => { onSortAsc(); onClose(); }
        },
        {
            icon: <ArrowDown size={16} />,
            label: 'Sort descending',
            onClick: () => { onSortDesc(); onClose(); }
        },
        { divider: true },
        {
            icon: <EyeOff size={16} />,
            label: 'Hide',
            onClick: () => { onHide(); onClose(); }
        },
        { divider: true },
        {
            icon: <PanelLeftClose size={16} />,
            label: 'Insert left',
            onClick: () => { onClose(); },
            disabled: true
        },
        {
            icon: <PanelRightClose size={16} />,
            label: 'Insert right',
            onClick: () => { onClose(); },
            disabled: true
        },
        {
            icon: <Trash2 size={16} />,
            label: 'Delete property',
            onClick: () => { onClose(); },
            disabled: true,
            danger: true
        },
    ];

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 w-[220px]"
            style={{ top: position.top, left: position.left, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Column name input */}
            <div className="px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <DataTypeIcon dataType={dataType} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="flex-1 bg-gray-100 rounded px-2 py-1 text-sm text-[#37352F] outline-none focus:ring-1 focus:ring-blue-300"
                    />
                </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
                {menuItems.map((item, index) =>
                    item.divider ? (
                        <div key={index} className="border-t border-gray-100 my-1" />
                    ) : (
                        <button
                            key={index}
                            className={clsx(
                                'w-full px-3 py-1.5 flex items-center gap-2 text-sm text-left',
                                'hover:bg-gray-50 transition-colors',
                                item.disabled && 'opacity-40 cursor-not-allowed',
                                item.danger && 'text-red-600'
                            )}
                            onClick={item.disabled ? undefined : item.onClick}
                            disabled={item.disabled}
                        >
                            <span className="text-[#757575]">{item.icon}</span>
                            <span className={item.danger ? 'text-red-600' : 'text-[#37352F]'}>{item.label}</span>
                        </button>
                    )
                )}
            </div>
        </div>,
        document.body
    );
}
