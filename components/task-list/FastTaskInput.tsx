'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface FastTaskInputProps {
    initialValue: string;
    onSave: (value: string) => void;
    onCancel: () => void;
    onEnterKey?: () => void;
    onDeleteEmpty?: () => void;
    autoFocus?: boolean;
    placeholder?: string;
}

export const FastTaskInput = React.memo(function FastTaskInput({
    initialValue,
    onSave,
    onCancel,
    onEnterKey,
    onDeleteEmpty,
    placeholder,
}: FastTaskInputProps) {
    const { t } = useLanguage();
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isComposingRef = useRef(false);
    const commitedRef = useRef(false);
    const minHeightPx = 28;

    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus({ preventScroll: true });
        ta.selectionStart = ta.value.length;
        ta.selectionEnd = ta.value.length;
        // Auto-resize on mount
        ta.style.height = 'auto';
        ta.style.height = `${Math.max(ta.scrollHeight, minHeightPx)}px`;
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.max(e.target.scrollHeight, minHeightPx)}px`;
    }, []);

    const commit = useCallback((val: string) => {
        if (commitedRef.current) return;
        commitedRef.current = true;
        if (val.trim() === '' && onDeleteEmpty) {
            onDeleteEmpty();
        } else {
            onSave(val);
        }
    }, [onSave, onDeleteEmpty]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (isComposingRef.current) return;
            e.preventDefault();
            commitedRef.current = true;
            onSave(value);
            onEnterKey?.();
        } else if (e.key === 'Escape') {
            commitedRef.current = true;
            onCancel();
        }
    }, [value, onSave, onEnterKey, onCancel]);

    const handleBlur = useCallback(() => {
        // Small delay to allow button clicks to fire first
        setTimeout(() => {
            commit(value);
        }, 50);
    }, [value, commit]);

    return (
        <div className="relative w-full flex items-start">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; }}
                placeholder={placeholder ?? t('common.add_task_placeholder')}
                className="w-full border border-transparent px-2 py-1 outline-none text-[#172b4d] text-[14px] bg-white rounded-[3px] shadow-[0_0_0_2px_#f97316] resize-none overflow-hidden min-h-[28px] leading-tight placeholder:text-[#a5adba] placeholder:italic"
                rows={1}
                spellCheck={false}
            />
            <div className="absolute right-0 top-full mt-1 flex shadow-[0_4px_8px_-2px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)] rounded-[3px] bg-white z-20 overflow-hidden border border-[#dfe1e6]">
                <button
                    onMouseDown={(e) => {
                        e.preventDefault();
                        commitedRef.current = true;
                        onSave(value);
                    }}
                    className="p-1.5 hover:bg-[#f4f5f7] text-[#42526e] transition-colors"
                >
                    <Check size={16} />
                </button>
                <button
                    onMouseDown={(e) => {
                        e.preventDefault();
                        commitedRef.current = true;
                        onCancel();
                    }}
                    className="p-1.5 hover:bg-[#f4f5f7] text-[#42526e] transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
});
