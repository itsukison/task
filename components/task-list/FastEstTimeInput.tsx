'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const PRESETS = [5, 15, 30, 60];

interface FastEstTimeInputProps {
    value: number;
    onChange: (value: number) => void;
}

export const FastEstTimeInput = React.memo(function FastEstTimeInput({
    value,
    onChange,
}: FastEstTimeInputProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string>(String(value));
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const isSelectingRef = useRef(false);

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(String(value));
        }
    }, [value, isEditing]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
        if (isEditing && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 2, left: rect.left });
        }
    }, [isEditing]);

    const commitValue = useCallback((val: string) => {
        const parsed = parseInt(val.replace(/\D/g, ''), 10) || 0;
        onChange(parsed);
        setIsEditing(false);
    }, [onChange]);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            if (isSelectingRef.current) {
                isSelectingRef.current = false;
                return;
            }
            commitValue(localValue);
        }, 150);
    }, [localValue, commitValue]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitValue(localValue);
        } else if (e.key === 'Escape') {
            setLocalValue(String(value));
            setIsEditing(false);
        }
    }, [localValue, value, commitValue]);

    if (!isEditing) {
        return (
            <div
                ref={containerRef}
                className="w-[44px] h-[24px] px-1 rounded-[3px] bg-transparent hover:bg-[#ebecf0] text-[#42526e] text-[12px] text-center font-semibold cursor-pointer flex items-center justify-center transition-all"
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            >
                <span>{value}</span>
                <span className="text-[10px] text-[#9B9A97] ml-0.5">m</span>
            </div>
        );
    }

    return (
        <>
            <div ref={containerRef}>
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value.replace(/\D/g, ''))}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    className="w-[38px] h-[24px] px-0.5 rounded-[3px] bg-white text-[#42526e] text-[12px] text-center font-semibold outline-none ring-1 ring-orange-400 shadow-sm transition-all"
                />
            </div>
            {typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed bg-white shadow-lg rounded-md border border-gray-200 w-24 p-1 z-[9999]"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    {PRESETS.map((preset) => (
                        <button
                            key={preset}
                            className="text-left w-full px-2 py-1.5 text-sm text-[#37352F] hover:bg-[#F2F1EE] rounded transition-colors cursor-pointer"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.stopPropagation();
                                isSelectingRef.current = true;
                                onChange(preset);
                                setIsEditing(false);
                            }}
                        >
                            {preset} min
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
});
