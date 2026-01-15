'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CellProps } from '../types';

/**
 * Number input cell with right-aligned formatting
 */
export function NumberCell({ value, rowId, columnId, onChange }: CellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(String(value ?? ''));
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(String(value ?? ''));
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        const numValue = parseInt(localValue) || 0;
        if (numValue !== value) {
            onChange(rowId, columnId, numValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setLocalValue(String(value ?? ''));
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="number"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent border-none outline-none text-[#424242] text-sm px-2 py-1.5 text-right font-mono"
            />
        );
    }

    return (
        <div
            className="w-full h-full px-2 py-1.5 cursor-text text-[#424242] text-sm text-right font-mono"
            onClick={() => setIsEditing(true)}
        >
            {localValue || '0'}
        </div>
    );
}
