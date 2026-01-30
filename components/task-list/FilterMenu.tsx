'use client';

import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { TaskStatus } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

interface FilterMenuProps {
    selectedStatuses: TaskStatus[];
    position: { top: number; left: number };
    onToggleStatus: (status: TaskStatus) => void;
    onClearFilter: () => void;
    onClose: () => void;
}

const STATUS_OPTIONS: TaskStatus[] = ['planned', 'in_progress', 'overrun', 'completed'];

export function FilterMenu({
    selectedStatuses,
    position,
    onToggleStatus,
    onClearFilter,
    onClose
}: FilterMenuProps) {
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

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={menuRef}
            className="fixed bg-white shadow-xl rounded-lg border border-gray-200 py-1 w-[200px]"
            style={{ top: position.top, left: position.left, zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase border-b border-gray-100 mb-1">
                {t('common.filter_by_status')}
            </div>
            {STATUS_OPTIONS.map((status) => {
                const isChecked = selectedStatuses.includes(status);
                return (
                    <button
                        key={status}
                        className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-[#37352F] hover:bg-gray-50 transition-colors text-left"
                        onClick={() => onToggleStatus(status)}
                    >
                        <div className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center">
                            {isChecked && (
                                <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
                            )}
                        </div>
                        <span>{t(`tasks.status.${status}`)}</span>
                    </button>
                );
            })}
            {selectedStatuses.length > 0 && (
                <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                        className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => {
                            onClearFilter();
                            onClose();
                        }}
                    >
                        <X size={14} />
                        {t('common.clear_filter')}
                    </button>
                </>
            )}
        </div>,
        document.body
    );
}
