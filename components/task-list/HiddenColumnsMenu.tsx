import React from 'react';
import { Eye } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface HiddenColumnsMenuProps {
    hiddenColumns: string[];
    columnLabels: Record<string, string>; // Map of columnId -> label
    onShowColumn: (columnId: string) => void;
    onClose: () => void;
}

export function HiddenColumnsMenu({
    hiddenColumns,
    columnLabels,
    onShowColumn,
    onClose
}: HiddenColumnsMenuProps) {
    const { t } = useLanguage();

    return (
        <div
            className="bg-white shadow-lg rounded-lg border border-gray-200 py-1 w-[200px]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-3 py-1.5 text-xs font-semibold text-[#9e9e9e] uppercase">
                {t('common.show_column')}
            </div>
            {hiddenColumns.map((columnId) => (
                <button
                    key={columnId}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-sm text-[#37352F] hover:bg-gray-50 transition-colors text-left"
                    onClick={() => {
                        onShowColumn(columnId);
                        onClose();
                    }}
                >
                    <Eye size={16} className="text-[#757575]" />
                    <span>{columnLabels[columnId] || columnId}</span>
                </button>
            ))}
        </div>
    );
}
