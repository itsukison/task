'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CellProps } from '../types';

/**
 * Timer-enabled number cell for tracking actual time
 * Displays number value with play/pause button on hover
 */
export function TimerNumberCell({ value, rowId, columnId, onChange }: CellProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [localValue, setLocalValue] = useState<number>(typeof value === 'number' ? value : 0);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number | null>(null);

    // Sync local value when props change (unless running, where local state rules)
    useEffect(() => {
        if (!isRunning) {
            setLocalValue(typeof value === 'number' ? value : 0);
        }
    }, [value, isRunning]);

    // Initialize from local storage
    useEffect(() => {
        const timerKey = `timer_${rowId}_${columnId}`;
        const savedState = localStorage.getItem(timerKey);

        if (savedState) {
            try {
                const { isRunning: savedRunning, startTime, startBaseValue } = JSON.parse(savedState);

                if (savedRunning && startTime && typeof startBaseValue === 'number') {
                    // Calculate elapsed time since start
                    const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
                    const newValue = startBaseValue + elapsedMinutes;

                    setLocalValue(newValue);
                    setIsRunning(true);

                    // Immediately notify parent of the updated value if it changed
                    if (newValue !== value) {
                        onChange(rowId, columnId, newValue);
                    }
                }
            } catch (e) {
                console.error('Failed to parse timer state', e);
            }
        }
    }, [rowId, columnId]);

    // Timer interval
    useEffect(() => {
        if (isRunning) {
            timerRef.current = window.setInterval(() => {
                const timerKey = `timer_${rowId}_${columnId}`;
                const savedState = localStorage.getItem(timerKey);

                if (savedState) {
                    const { startTime, startBaseValue } = JSON.parse(savedState);
                    const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
                    const newValue = startBaseValue + elapsedMinutes;

                    // Only update if the value actually changed to prevent flickering
                    if (newValue !== localValue) {
                        setLocalValue(newValue);
                        // Update database
                        onChange(rowId, columnId, newValue);
                    }
                }
            }, 10000); // Check every 10 seconds to reduce flickering
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, rowId, columnId, onChange, localValue]);

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();

        const timerKey = `timer_${rowId}_${columnId}`;

        if (isRunning) {
            // Pause
            setIsRunning(false);
            localStorage.removeItem(timerKey);
            // Ensure final value is saved
            onChange(rowId, columnId, localValue);
        } else {
            // Start
            setIsRunning(true);
            // Save state: start time and the value at start
            localStorage.setItem(timerKey, JSON.stringify({
                isRunning: true,
                startTime: Date.now(),
                startBaseValue: localValue
            }));
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        // Save manual edit
        onChange(rowId, columnId, localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            // Revert
            setLocalValue(typeof value === 'number' ? value : 0);
            setIsEditing(false);
        }
    };

    // UI helper: format number or placeholder
    const displayValue = localValue;

    return (
        <div className="relative w-full h-full group flex items-center">
            {isEditing && !isRunning ? (
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(parseFloat(e.target.value) || 0)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full h-full bg-transparent border-none outline-none text-[#37352F] text-sm px-2 py-1.5 text-right font-mono"
                    autoFocus
                />
            ) : (
                <div
                    className="w-full h-full px-2 py-1.5 text-sm cursor-text flex items-center justify-between gap-2"
                    onClick={() => !isRunning && setIsEditing(true)}
                >
                    {/* Timer button - visible on hover or when running, aligned to left */}
                    <button
                        className={`flex items-center justify-center w-6 h-6 rounded transition-opacity ${isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                        onClick={handlePlayPause}
                        title={isRunning ? 'Pause timer' : 'Start timer'}
                    >
                        {isRunning ? (
                            <Pause size={12} className="text-[#FF5500] fill-current" />
                        ) : (
                            <Play size={12} className="text-[#9e9e9e]" />
                        )}
                    </button>

                    {/* Number display with "min" unit, aligned to right */}
                    <span className={cn(
                        "font-mono text-right flex-1",
                        isRunning ? 'text-[#FF5500] font-medium' : 'text-[#37352F]'
                    )}>
                        {displayValue} min
                    </span>
                </div>
            )}
        </div>
    );
}
