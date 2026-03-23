'use client';

import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Workflow, WorkflowFolder } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

interface WorkflowContextMenuProps {
    item: Workflow | WorkflowFolder;
    type: 'workflow' | 'folder';
    position: { x: number; y: number };
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onChangeVisibility: (visibility: 'private' | 'team') => void;
}

export function WorkflowContextMenu({
    item,
    position,
    onClose,
    onRename,
    onDelete,
    onChangeVisibility,
}: WorkflowContextMenuProps) {
    const { t } = useLanguage();
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-50 min-w-[180px]"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
            >
                <button
                    onClick={() => { onRename(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <Edit size={16} className="text-[#9B9A97]" />
                    <span>{t('common.rename')}</span>
                </button>

                <div className="h-px bg-[#E9E9E7] my-1" />

                <div className="px-3 py-1 text-xs font-semibold text-[#9B9A97]">{t('common.visibility')}</div>
                <button
                    onClick={() => { onChangeVisibility('private'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <EyeOff size={16} className="text-[#9B9A97]" />
                    <span>{t('common.private')}</span>
                    {item.visibility === 'private' && <span className="ml-auto text-[#FF5500]">✓</span>}
                </button>
                <button
                    onClick={() => { onChangeVisibility('team'); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <Eye size={16} className="text-[#9B9A97]" />
                    <span>{t('common.team')}</span>
                    {item.visibility === 'team' && <span className="ml-auto text-[#FF5500]">✓</span>}
                </button>

                <div className="h-px bg-[#E9E9E7] my-1" />

                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EB5757] hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={16} />
                    <span>{t('common.delete')}</span>
                </button>
            </div>
        </>
    );
}
