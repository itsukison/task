'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    isDangerous = false,
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    const { t } = useLanguage();
    if (!isOpen) return null;

    const displayConfirmLabel = confirmLabel || t('common.confirm');
    const displayCancelLabel = cancelLabel || t('common.cancel');

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px] transition-all duration-300"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div
                    className="bg-white rounded-lg shadow-xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9E9E7]">
                        <h2 className="text-lg font-semibold text-[#37352F]">
                            {title}
                        </h2>
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="p-1 text-[#9B9A97] hover:text-[#37352F] transition-colors rounded hover:bg-[#EFEFED]"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-sm text-[#787774] leading-relaxed">
                            {description}
                        </p>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={onCancel}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-sm font-medium text-[#5F5E5B] hover:bg-[#EFEFED] rounded transition-colors"
                            >
                                {displayCancelLabel}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`
                                    px-3 py-1.5 text-sm font-medium text-white rounded shadow-sm transition-colors
                                    ${isDangerous
                                        ? 'bg-[#E03E3E] hover:bg-[#C93535]'
                                        : 'bg-[#2383E2] hover:bg-[#1C6CB8]'
                                    }
                                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {isLoading ? t('common.processing') : displayConfirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
