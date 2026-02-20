'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CellProps } from '../types';

/**
 * Text input cell with inline editing
 */
export function TextCell({ value, rowId, columnId, onChange, autoFocus, onEnter }: CellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize isEditing/autoFocus on mount if requested
    useEffect(() => {
        if (autoFocus) {
            setIsEditing(true);
        }
    }, [autoFocus]);

    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (autoFocus) {
                // If auto-focused (new row), don't select all text, just place cursor at end (though it's empty usually)
                // But select() is fine too if it's new.
                // Actually, for a new task, it's empty, so select() does nothing harmful.
            } else {
                inputRef.current.select();
            }
        }
    }, [isEditing, autoFocus]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== String(value ?? '')) {
            onChange(rowId, columnId, localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            // Commit change first
            if (localValue !== String(value ?? '')) {
                onChange(rowId, columnId, localValue);
            }
            setIsEditing(false);

            // Trigger onEnter callback if provided (e.g., create new row)
            if (onEnter) {
                // We use a small timeout to ensure the state update has processed and potential re-renders happen
                // before creating the next row, though usually sync call is fine.
                // However, avoiding race conditions with blur event.
                // e.preventDefault() to prevent normal newline if it were a textarea, but it's input.
                e.preventDefault();
                onEnter();
            }
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none text-[#424242] text-sm px-2 py-1.5"
            />
        );
    }

    return (
        <div
            className="w-full h-full px-2 py-1.5 cursor-text text-[#424242] text-sm truncate"
            onClick={() => setIsEditing(true)}
        >
            {localValue || <span className="text-gray-300 italic">Empty</span>}
        </div>
    );
}

