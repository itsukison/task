'use client';

import { Edit, Trash2, Eye, EyeOff, FolderInput } from 'lucide-react';
import { Document as DocumentType, Folder } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface DocumentContextMenuProps {
    item: DocumentType | Folder;
    type: 'document' | 'folder';
    position: { x: number; y: number };
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onChangeVisibility: (visibility: 'private' | 'team' | 'leaders_only') => void;
    onMoveToFolder?: () => void;
}

export function DocumentContextMenu({
    item,
    type,
    position,
    onClose,
    onRename,
    onDelete,
    onChangeVisibility,
    onMoveToFolder,
}: DocumentContextMenuProps) {
    const { t } = useLanguage();

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Context Menu */}
            <div
                className="fixed bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 z-50 min-w-[200px]"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <button
                    onClick={() => {
                        onRename();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <Edit size={16} className="text-[#9B9A97]" />
                    <span>{t('documents.rename')}</span>
                </button>

                {onMoveToFolder && (
                    <button
                        onClick={() => {
                            onMoveToFolder();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                    >
                        <FolderInput size={16} className="text-[#9B9A97]" />
                        <span>{t('documents.move_to_folder')}</span>
                    </button>
                )}

                <div className="h-px bg-[#E9E9E7] my-1" />

                {/* Visibility options */}
                <div className="px-3 py-1 text-xs font-semibold text-[#9B9A97]">{t('documents.visibility')}</div>
                <button
                    onClick={() => {
                        onChangeVisibility('private');
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <EyeOff size={16} className="text-[#9B9A97]" />
                    <span>{t('documents.private')}</span>
                    {item.visibility === 'private' && (
                        <span className="ml-auto text-[#FF5500]">✓</span>
                    )}
                </button>
                <button
                    onClick={() => {
                        onChangeVisibility('team');
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <Eye size={16} className="text-[#9B9A97]" />
                    <span>{t('documents.team')}</span>
                    {item.visibility === 'team' && (
                        <span className="ml-auto text-[#FF5500]">✓</span>
                    )}
                </button>
                <button
                    onClick={() => {
                        onChangeVisibility('leaders_only');
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors"
                >
                    <Eye size={16} className="text-[#9B9A97]" />
                    <span>{t('documents.leaders_only')}</span>
                    {item.visibility === 'leaders_only' && (
                        <span className="ml-auto text-[#FF5500]">✓</span>
                    )}
                </button>

                <div className="h-px bg-[#E9E9E7] my-1" />

                <button
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#EB5757] hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={16} />
                    <span>{t('documents.delete')}</span>
                </button>
            </div>
        </>
    );
}
