'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Link, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { RowActionsMenuProps } from '../types';

/**
 * Row context menu for duplicate/delete/copy actions
 */
export function RowActionsMenu({ rowId, position, onDuplicate, onDelete, onCopyLink, onClose }: RowActionsMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const menuItems = [
        {
            icon: <Copy size={16} />,
            label: 'Duplicate',
            onClick: () => { onDuplicate(); onClose(); },
            shortcut: '⌘D'
        },
        {
            icon: <Link size={16} />,
            label: 'Copy link',
            onClick: () => { onCopyLink(); onClose(); }
        },
        { divider: true },
        {
            icon: <Trash2 size={16} />,
            label: 'Delete',
            onClick: () => { onDelete(); onClose(); },
            shortcut: 'Del',
            danger: true
        },
    ];

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 w-[200px]"
            style={{ top: position.top, left: position.left, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            {menuItems.map((item, index) =>
                item.divider ? (
                    <div key={index} className="border-t border-gray-100 my-1" />
                ) : (
                    <button
                        key={index}
                        className={clsx(
                            'w-full px-3 py-1.5 flex items-center gap-2 text-sm text-left',
                            'hover:bg-gray-50 transition-colors',
                            item.danger && 'text-red-600 hover:bg-red-50'
                        )}
                        onClick={item.onClick}
                    >
                        <span className={item.danger ? 'text-red-500' : 'text-[#757575]'}>{item.icon}</span>
                        <span className={clsx('flex-1', item.danger ? 'text-red-600' : 'text-[#37352F]')}>{item.label}</span>
                        {item.shortcut && (
                            <span className="text-[#9e9e9e] text-xs">{item.shortcut}</span>
                        )}
                    </button>
                )
            )}
        </div>,
        document.body
    );
}
