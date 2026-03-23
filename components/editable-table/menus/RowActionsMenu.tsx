'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Link, ListPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RowActionsMenuProps } from '../types';
import { useLanguage } from '@/lib/i18n';

/**
 * Row context menu for duplicate/delete/copy actions
 */
export function RowActionsMenu({ rowId, position, onDuplicate, onDelete, onCopyLink, onClose, onAddSubtask }: RowActionsMenuProps) {
    const { t } = useLanguage();
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
        ...(onAddSubtask ? [{
            icon: <ListPlus size={16} />,
            label: t('common.add_subtask'),
            onClick: () => { onAddSubtask(); onClose(); },
        }] : []),
        {
            icon: <Copy size={16} />,
            label: t('common.duplicate'),
            onClick: () => { onDuplicate(); onClose(); },
            shortcut: '⌘D'
        },
        {
            icon: <Link size={16} />,
            label: t('common.copy_link'),
            onClick: () => { onCopyLink(); onClose(); }
        },
        { divider: true },
        {
            icon: <Trash2 size={16} />,
            label: t('common.delete'),
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
                        className={cn(
                            'w-full px-3 py-1.5 flex items-center gap-2 text-sm text-left',
                            'hover:bg-gray-50 transition-colors',
                            item.danger && 'text-red-600 hover:bg-red-50'
                        )}
                        onClick={item.onClick}
                    >
                        <span className={item.danger ? 'text-red-500' : 'text-[#757575]'}>{item.icon}</span>
                        <span className={cn('flex-1', item.danger ? 'text-red-600' : 'text-[#37352F]')}>{item.label}</span>
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
