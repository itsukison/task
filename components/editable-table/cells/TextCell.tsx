'use client';

import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { CellProps } from '../types';
import { useLanguage } from '@/lib/i18n';

/**
 * Text cell with inline editing (Notion/Jira style).
 * Switches from a truncated input to an auto-growing textarea in-place.
 */
export const TextCell = React.memo(function TextCell({
    value,
    rowId,
    columnId,
    onChange,
    autoFocus,
    onEnter,
    secondaryText,
    preventBlurOnEnter,
    placeholder,
    editMode = 'direct',
    onDeleteEmptyRow,
}: CellProps) {
    const { t } = useLanguage();
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const [isTextareaMode, setIsTextareaMode] = useState(false);
    const isPencilMode = editMode === 'pencil';
    const [isEditing, setIsEditing] = useState(!isPencilMode || !!autoFocus);

    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const shouldFocusAtEndRef = useRef(false);
    const initialValueRef = useRef(String(value ?? ''));
    const isNewRowRef = useRef(false);
    const ignoreNextBlurRef = useRef(false);

    // Refs to avoid stale closures in async callbacks
    const localValueRef = useRef(localValue);
    useEffect(() => { localValueRef.current = localValue; }, [localValue]);

    // Sync external value changes into local state, but skip when the user is
    // actively focused (prevents real-time refetches from destroying edits/cursor)
    useEffect(() => {
        if (document.activeElement === inputRef.current ||
            document.activeElement === textareaRef.current) return;
        setLocalValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (autoFocus && String(value ?? '').trim() === '') {
            isNewRowRef.current = true;
        }
        if (String(value ?? '').trim() !== '') {
            isNewRowRef.current = false;
        }
    }, [autoFocus, value]);

    // Auto-focus for newly created rows
    useEffect(() => {
        if (!autoFocus) return;
        if (isPencilMode) {
            setIsEditing(true);
        } else if (inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [autoFocus, isPencilMode]);

    useEffect(() => {
        if (isPencilMode && isEditing && inputRef.current && !isTextareaMode) {
            const el = inputRef.current;
            el.focus({ preventScroll: true });
            requestAnimationFrame(() => {
                try {
                    el.setSelectionRange(el.value.length, el.value.length);
                } catch {
                    // Ignore if input isn't ready for selection yet.
                }
            });
        }
    }, [isEditing, isPencilMode, isTextareaMode]);

    useLayoutEffect(() => {
        if (!shouldFocusAtEndRef.current) return;
        if (isPencilMode && isEditing && !isTextareaMode && inputRef.current) {
            const el = inputRef.current;
            el.focus({ preventScroll: true });
            try {
                el.setSelectionRange(el.value.length, el.value.length);
                shouldFocusAtEndRef.current = false;
            } catch {
                // Keep flag set to retry when element is ready.
            }
            return;
        }
        if (isTextareaMode && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus({ preventScroll: true });
            try {
                ta.setSelectionRange(ta.value.length, ta.value.length);
                shouldFocusAtEndRef.current = false;
            } catch {
                // Keep flag set to retry when element is ready.
            }
        }
    }, [isPencilMode, isEditing, isTextareaMode]);

    // --- Commit helpers ---

    const commitValue = useCallback(() => {
        if (isNewRowRef.current && localValueRef.current.trim() !== '') {
            isNewRowRef.current = false;
        }
        if (localValueRef.current !== String(value ?? '')) {
            onChange(rowId, columnId, localValueRef.current);
        }
    }, [value, onChange, rowId, columnId]);

    const handleEmptyNewRow = useCallback(() => {
        if (isNewRowRef.current && localValueRef.current.trim() === '') {
            onDeleteEmptyRow?.(rowId);
            return true;
        }
        return false;
    }, [onDeleteEmptyRow, rowId]);

    // --- Switch to textarea mode ---

    const enterTextareaMode = useCallback(() => {
        initialValueRef.current = localValueRef.current;
        setIsTextareaMode(true);
    }, []);

    const exitTextareaMode = useCallback(() => {
        setIsTextareaMode(false);
    }, []);

    // When textarea appears, focus it and place cursor at end
    useEffect(() => {
        if (isTextareaMode && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus({ preventScroll: true });
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    textareaRef.current.setSelectionRange(
                        textareaRef.current.value.length,
                        textareaRef.current.value.length
                    );
                }
            });
        }
    }, [isTextareaMode]);

    // Auto-resize textarea height as content changes; always fill at least the cell height
    useEffect(() => {
        if (isTextareaMode && textareaRef.current) {
            const ta = textareaRef.current;
            const cell = ta.closest('[data-editing]') as HTMLElement | null;
            const cellH = cell?.clientHeight ?? 0;
            ta.style.height = 'auto';
            ta.style.height = `${Math.max(ta.scrollHeight, cellH - 2)}px`;
        }
    }, [localValue, isTextareaMode]);

    // --- Input handlers ---

    const handleInputFocus = () => {
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) el.setSelectionRange(el.value.length, el.value.length);
        });
        enterTextareaMode();
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            if (ignoreNextBlurRef.current) {
                ignoreNextBlurRef.current = false;
                return;
            }
            const active = document.activeElement;
            if (active === inputRef.current || active === textareaRef.current) {
                return;
            }
            exitTextareaMode();
            if (handleEmptyNewRow()) {
                if (isPencilMode) setIsEditing(false);
                return;
            }
            commitValue();
            if (isPencilMode) setIsEditing(false);
        }, 50);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            commitValue();
            if (!preventBlurOnEnter) inputRef.current?.blur();
            onEnter?.();
            if (isPencilMode) setIsEditing(false);
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            exitTextareaMode();
            inputRef.current?.blur();
            if (isPencilMode) setIsEditing(false);
        }
    };

    // --- Textarea handlers ---

    const handleTextareaBlur = () => {
        setTimeout(() => {
            if (ignoreNextBlurRef.current) {
                ignoreNextBlurRef.current = false;
                return;
            }
            const active = document.activeElement;
            if (active === inputRef.current || active === textareaRef.current) return;
            exitTextareaMode();
            if (handleEmptyNewRow()) {
                if (isPencilMode) setIsEditing(false);
                return;
            }
            commitValue();
            if (isPencilMode) setIsEditing(false);
        }, 50);
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            exitTextareaMode();
            commitValue();
            if (!preventBlurOnEnter) {
                textareaRef.current?.blur();
                inputRef.current?.blur();
            }
            onEnter?.();
            if (isPencilMode) setIsEditing(false);
        } else if (e.key === 'Escape') {
            setLocalValue(initialValueRef.current);
            exitTextareaMode();
            inputRef.current?.blur();
            if (isPencilMode) setIsEditing(false);
        }
    };

    const handleConfirm = () => {
        exitTextareaMode();
        if (handleEmptyNewRow()) {
            if (isPencilMode) setIsEditing(false);
            return;
        }
        commitValue();
        if (isPencilMode) setIsEditing(false);
        ignoreNextBlurRef.current = true;
        textareaRef.current?.blur();
        inputRef.current?.blur();
    };

    const handleCancel = () => {
        setLocalValue(initialValueRef.current);
        exitTextareaMode();
        if (isPencilMode) setIsEditing(false);
        if (isNewRowRef.current && initialValueRef.current.trim() === '') {
            onDeleteEmptyRow?.(rowId);
            return;
        }
        ignoreNextBlurRef.current = true;
        textareaRef.current?.blur();
        inputRef.current?.blur();
    };

    // --- Render ---

    return (
        <div
            className="w-full h-full self-stretch px-2 py-1.5 flex flex-col justify-center relative"
            data-editing={isPencilMode && (isEditing || isTextareaMode) ? 'true' : 'false'}
        >
            {isPencilMode && !isEditing ? (
                <>
                    <div className="inline-flex items-center gap-1.5 max-w-full min-w-0">
                        <div className="min-w-0 max-w-[calc(100%-20px)] truncate text-[#424242] text-sm leading-tight">
                            {localValue || (placeholder ?? t('common.empty'))}
                        </div>

                    </div>
                    {secondaryText && (
                        <div className="mt-0.5 truncate text-[11px] text-[#787774] leading-tight">
                            {secondaryText}
                        </div>
                    )}
                </>
            ) : isTextareaMode ? (
                <>
                    {/* Invisible mirror of previous layout preserves exact row height */}
                    {isPencilMode ? (
                        <>
                            <div className="invisible inline-flex items-center gap-1.5 max-w-full min-w-0" aria-hidden="true">
                                <div className="min-w-0 max-w-[calc(100%-20px)] truncate text-[#424242] text-sm leading-tight">
                                    {localValue || (placeholder ?? '')}
                                </div>
                                <div className="h-5 w-5 flex-shrink-0" />
                            </div>
                            {secondaryText && (
                                <div className="invisible mt-0.5 truncate text-[11px] text-[#787774] leading-tight" aria-hidden="true">
                                    {secondaryText}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={localValue}
                                readOnly
                                tabIndex={-1}
                                className="w-full truncate bg-transparent border-none outline-none text-[#424242] text-sm leading-tight invisible group-data-[subtask='true']:h-6 group-data-[subtask='true']:leading-6"
                            />
                            {secondaryText && (
                                <div className="mt-0.5 truncate text-[11px] text-[#787774] leading-tight invisible">
                                    {secondaryText}
                                </div>
                            )}
                        </>
                    )}
                    {/* Absolutely positioned editor overlays rows below */}
                    <div
                        className="absolute left-0 top-px w-full z-[50]"
                        style={{ minHeight: 'calc(100% - 2px)' }}
                        onMouseDown={(e) => { if (e.target !== textareaRef.current) e.preventDefault(); }}
                    >
                        <textarea
                            ref={textareaRef}
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            onBlur={handleTextareaBlur}
                            onKeyDown={handleTextareaKeyDown}
                            rows={1}
                            placeholder={placeholder ?? t('common.empty')}
                            className="w-full resize-none border-none outline-none text-[#424242] text-sm leading-tight pl-1 pr-2 py-1.5 placeholder:text-gray-300 placeholder:italic ring-2 ring-orange-400/50 rounded-[6px] bg-white shadow-sm"
                        />
                        {isPencilMode && (
                            <div className="flex justify-end gap-1.5 pt-1 pr-0">
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleConfirm}
                                    className="h-6 w-6 rounded-md border border-[#cfcfcf] bg-[#f7f7f7] hover:bg-white flex items-center justify-center text-[#777777] shadow-sm"
                                    aria-label="Confirm edit"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleCancel}
                                    className="h-6 w-6 rounded-md border border-[#cfcfcf] bg-[#f7f7f7] hover:bg-white flex items-center justify-center text-[#777777] shadow-sm"
                                    aria-label="Cancel edit"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <input
                        ref={inputRef}
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        placeholder={placeholder ?? t('common.empty')}
                        className={`w-full truncate bg-transparent border-none outline-none text-[#424242] text-sm placeholder:text-gray-300 placeholder:italic ${isPencilMode ? 'h-5 leading-5' : 'leading-tight'} group-data-[subtask='true']:h-6 group-data-[subtask='true']:leading-6`}
                    />
                    {secondaryText && (
                        <div className="mt-0.5 truncate text-[11px] text-[#787774] leading-tight">
                            {secondaryText}
                        </div>
                    )}
                </>
            )}
        </div>
    );
});
