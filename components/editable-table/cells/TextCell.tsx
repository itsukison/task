'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CellProps } from '../types';

/**
 * Text input cell — always rendered as <input> so the browser handles
 * cursor placement at click position naturally (no div→input swap, no select()).
 */
export const TextCell = React.memo(function TextCell({ value, rowId, columnId, onChange, autoFocus, onEnter, secondaryText }: CellProps) {
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    // Auto-focus when a new row is created (e.g. after pressing Enter).
    // preventScroll avoids the browser jumping to an off-screen input if the
    // row happens to be outside the visible virtualizer range on mount.
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [autoFocus]);

    const handleBlur = () => {
        if (localValue !== String(value ?? '')) {
            onChange(rowId, columnId, localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (localValue !== String(value ?? '')) {
                onChange(rowId, columnId, localValue);
            }
            inputRef.current?.blur();
            onEnter?.();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            inputRef.current?.blur();
        }
    };

    return (
        <div className="w-full h-full px-2 py-1.5 flex flex-col justify-center">
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Empty"
                className="w-full truncate bg-transparent border-none outline-none text-[#424242] text-sm leading-tight placeholder:text-gray-300 placeholder:italic"
            />
            {secondaryText && (
                <div className="mt-0.5 truncate text-[11px] text-[#787774] leading-tight">
                    {secondaryText}
                </div>
            )}
        </div>
    );
});
