'use client';

import React from 'react';
import { List, FileText } from 'lucide-react';

interface AddColumnMenuProps {
    onAddSubtask: () => void;
    onAddDocument: () => void;
    canAddMore: boolean;
}

/**
 * Dropdown menu for adding custom columns (Subtask or Document type)
 */
export function AddColumnMenu({ onAddSubtask, onAddDocument, canAddMore }: AddColumnMenuProps) {
    return (
        <div className="bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 min-w-[160px]">
            {!canAddMore && (
                <div className="px-3 py-2 text-xs text-[#9B9A97]">
                    Maximum 2 custom columns
                </div>
            )}
            {canAddMore && (
                <>
                    <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors duration-200 text-left"
                        onClick={onAddSubtask}
                    >
                        <List size={14} className="text-[#9B9A97]" />
                        <span>Subtask</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#37352F] hover:bg-[#EFEFED] transition-colors duration-200 text-left"
                        onClick={onAddDocument}
                    >
                        <FileText size={14} className="text-[#9B9A97]" />
                        <span>Document</span>
                    </button>
                </>
            )}
        </div>
    );
}
