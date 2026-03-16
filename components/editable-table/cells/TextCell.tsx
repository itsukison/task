'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CellProps } from '../types';

/**
 * Text input cell with two UX improvements:
 *   1. Focus always places cursor at end of text.
 *   2. When text overflows the cell width while focused, a portal popover
 *      appears below (or above if near the viewport bottom) so the user can
 *      see and edit the full value without truncation.
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
}: CellProps) {
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const [showPopover, setShowPopover] = useState(false);
    const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Refs to avoid stale closures in async callbacks
    const localValueRef = useRef(localValue);
    const showPopoverRef = useRef(false);
    useEffect(() => { localValueRef.current = localValue; }, [localValue]);
    useEffect(() => { showPopoverRef.current = showPopover; }, [showPopover]);

    // Sync external value changes into local state
    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    // Auto-focus for newly created rows
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [autoFocus]);

    // --- Commit helpers ---

    const commitValue = useCallback(() => {
        if (localValueRef.current !== String(value ?? '')) {
            onChange(rowId, columnId, localValueRef.current);
        }
    }, [value, onChange, rowId, columnId]);

    // --- Popover helpers ---

    const openPopover = useCallback(() => {
        const el = inputRef.current;
        if (!el) return;

        // Measure the full cell container (for top/bottom/right edge)
        // and the input itself (for left edge, to preserve checkbox/chevron space)
        const cell = (el.closest('[data-table-cell]') ?? el) as HTMLElement;
        const cellRect = cell.getBoundingClientRect();
        const inputRect = el.getBoundingClientRect();

        // Start the overlay where the TextCell's own container starts (px-2 = 8px left of input)
        const left = inputRect.left - 8;
        let width = cellRect.right - left;
        const minH = cellRect.height;

        // --- 1. VERTICAL OVERFLOW ADJUSTMENT ---
        // Represents how many pixels the frame bleeds above/below the cell.
        // Change to 0 for no vertical overflow, or 1 for a very subtle frame overlap.
        const verticalOverflow = 1; // Originally this was 2

        // --- 2. RIGHT BORDER GAP ADJUSTMENT ---
        // Adds extra pixels to the width to completely cover the cell's right border.
        // Try 1 or 2 depending on the thickness of your table borders.
        const rightBorderOverlap = 1; 

        // Apply right border overlap
        width = width + rightBorderOverlap;

        const estimatedExpandedH = 110;
        const spaceBelow = window.innerHeight - cellRect.bottom;
        const growsDown = spaceBelow >= estimatedExpandedH - minH + 8;

        setPopoverStyle(growsDown
            ? { 
                top: cellRect.top - verticalOverflow, 
                left, 
                width, 
                minHeight: minH + (verticalOverflow * 2) 
              }
            : { 
                bottom: window.innerHeight - cellRect.bottom - verticalOverflow, 
                left, 
                width, 
                minHeight: minH + (verticalOverflow * 2) 
              }
        );
        setShowPopover(true);
    }, []);
    // When popover becomes visible, move focus + cursor to end of textarea
    useEffect(() => {
        if (showPopover && textareaRef.current) {
            const ta = textareaRef.current;
            ta.focus({ preventScroll: true });
            ta.setSelectionRange(ta.value.length, ta.value.length);
        }
    }, [showPopover]);

    // Auto-resize textarea height as content changes
    useEffect(() => {
        if (showPopover && textareaRef.current) {
            const ta = textareaRef.current;
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
        }
    }, [localValue, showPopover]);

    // --- Input handlers ---

    const handleInputFocus = () => {
        // Always move cursor to end (covers both click and Tab-in)
        requestAnimationFrame(() => {
            const el = inputRef.current;
            if (el) el.setSelectionRange(el.value.length, el.value.length);
        });
        openPopover();
    };

    const handleInputBlur = () => {
        // Delay so we can check whether focus moved to the popover textarea
        setTimeout(() => {
            if (textareaRef.current && document.activeElement === textareaRef.current) {
                return; // Textarea will own saving
            }
            if (showPopoverRef.current) setShowPopover(false);
            commitValue();
        }, 0);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            commitValue();
            if (!preventBlurOnEnter) inputRef.current?.blur();
            onEnter?.();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setShowPopover(false);
            inputRef.current?.blur();
        }
    };

    // --- Textarea (popover) handlers ---

    const handleTextareaBlur = () => {
        setTimeout(() => {
            // If focus went back to the input, let input handle saving
            if (inputRef.current && document.activeElement === inputRef.current) return;
            setShowPopover(false);
            commitValue();
        }, 0);
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            setShowPopover(false);
            commitValue();
            if (!preventBlurOnEnter) {
                textareaRef.current?.blur();
                inputRef.current?.blur();
            }
            onEnter?.();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setShowPopover(false);
            inputRef.current?.blur();
        }
    };

    // --- Render ---

    const popover = (
        <div
            className="fixed z-[9999] bg-white rounded-md shadow border border-[#d4d4d4]"
            style={popoverStyle}
            // Prevent clicks inside the popover from blurring the textarea
            onMouseDown={(e) => { if (e.target !== textareaRef.current) e.preventDefault(); }}
        >
            <textarea
                ref={textareaRef}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleTextareaBlur}
                onKeyDown={handleTextareaKeyDown}
                rows={1}
                className="w-full px-2 py-1.5 resize-none bg-transparent border-none outline-none text-[#424242] text-sm leading-tight"
            />
        </div>
    );

    return (
        <div className="w-full h-full px-2 py-1.5 flex flex-col justify-center">
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                placeholder="Empty"
                className="w-full truncate bg-transparent border-none outline-none text-[#424242] text-sm leading-tight placeholder:text-gray-300 placeholder:italic"
            />
            {secondaryText && (
                <div className="mt-0.5 truncate text-[11px] text-[#787774] leading-tight">
                    {secondaryText}
                </div>
            )}
            {showPopover && typeof document !== 'undefined' && createPortal(popover, document.body)}
        </div>
    );
});
