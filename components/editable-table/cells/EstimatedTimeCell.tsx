'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CellProps } from '../types';

const PRESETS = [5, 15, 30, 60];

/**
 * Estimated time cell with dropdown presets and enter-to-save.
 */
export function EstimatedTimeCell({ value, rowId, columnId, onChange }: CellProps) {
    const numericValue = typeof value === 'number' ? value : (parseInt(String(value ?? ''), 10) || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<number | string>(numericValue);
    const localValueRef = useRef<number | string>(localValue);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSelectingRef = useRef(false);

    useEffect(() => {
        localValueRef.current = localValue;
    }, [localValue]);

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(numericValue);
        }
    }, [numericValue, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const commitValue = (next: number | string) => {
        const parsed = typeof next === 'string' ? (parseInt(next, 10) || 0) : next;
        setLocalValue(parsed);
        onChange(rowId, columnId, parsed);
    };

    const handleBlur = () => {
        setTimeout(() => {
            if (isSelectingRef.current) {
                isSelectingRef.current = false;
                return;
            }
            setIsEditing(false);
            commitValue(localValueRef.current);
        }, 150);
    };

    const handlePresetSelect = (preset: number) => {
        isSelectingRef.current = true;
        setIsEditing(false);
        commitValue(preset);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setLocalValue(numericValue);
            setIsEditing(false);
        }
    };

    if (!isEditing) {
        return (
            <div
                className="w-full h-full px-2 py-1.5 cursor-pointer text-[#424242] text-sm text-center font-mono"
                onClick={() => setIsEditing(true)}
            >
                <span className="inline-flex items-baseline gap-1 justify-center w-full">
                    <span>{numericValue}</span>
                    <span className="text-[10px] text-[#9B9A97]">min</span>
                </span>
            </div>
        );
    }

    return (
        <Popover open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
            <PopoverTrigger asChild>
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full bg-transparent border-none outline-none text-[#424242] text-sm px-2 py-1.5 text-center font-mono"
                />
            </PopoverTrigger>
            <PopoverContent
                className="w-32 p-1 border shadow-lg rounded-md bg-white z-50"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex flex-col gap-0.5">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset}
                            className="text-left w-full px-2 py-1.5 text-sm text-[#37352F] hover:bg-[#F2F1EE] rounded transition-colors cursor-pointer"
                            onClick={() => handlePresetSelect(preset)}
                        >
                            {preset} min
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
