'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CellProps } from '../types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Combined time cell showing actual/estimated time with integrated timer
 * Displays: [Timer Button] actual / estimated min
 * Timer controls actual time, both values are inline editable
 */
function CombinedTimeCellInner({ value, rowId, columnId, onChange }: CellProps) {
    // Value is expected to be the row object with actualTime and expectedTime
    const row = value as any;
    // Data might come as camelCase (transformed) or snake_case (raw DB)
    const actualTime = typeof row?.actualTime === 'number' ? row.actualTime : (typeof row?.actual_time_minutes === 'number' ? row.actual_time_minutes : 0);
    const expectedTime = typeof row?.expectedTime === 'number' ? row.expectedTime : (typeof row?.expected_time_minutes === 'number' ? row.expected_time_minutes : 0);

    const [isRunning, setIsRunning] = useState(false);
    const [localActual, setLocalActual] = useState(actualTime);
    const [localExpected, setLocalExpected] = useState(expectedTime);
    const localExpectedRef = useRef(localExpected);
    const localActualRef = useRef(localActual);
    const isSelectingRef = useRef(false);
    const [editingField, setEditingField] = useState<'actual' | 'expected' | null>(null);

    // Keep refs in sync for closure access
    useEffect(() => { localExpectedRef.current = localExpected; }, [localExpected]);
    useEffect(() => { localActualRef.current = localActual; }, [localActual]);
    const actualInputRef = useRef<HTMLInputElement>(null);
    const expectedInputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<number | null>(null);

    // Sync local values when props change (unless running or editing)
    useEffect(() => {
        if (!isRunning && !editingField) {
            setLocalActual(actualTime);
            setLocalExpected(expectedTime);
        }
    }, [actualTime, expectedTime, isRunning, editingField]);

    // Initialize from local storage
    useEffect(() => {
        const timerKey = `timer_${rowId}_actualTime`;
        const savedState = localStorage.getItem(timerKey);

        if (savedState) {
            try {
                const { isRunning: savedRunning, startTime, startBaseValue } = JSON.parse(savedState);

                if (savedRunning && startTime && typeof startBaseValue === 'number') {
                    const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
                    const newValue = startBaseValue + elapsedMinutes;

                    setLocalActual(newValue);
                    setIsRunning(true);

                    if (newValue !== actualTime) {
                        onChange(rowId, 'actualTime', newValue);
                    }
                }
            } catch (e) {
                console.error('Failed to parse timer state', e);
            }
        }
    }, [rowId]);

    // Timer interval — only restarts when isRunning or rowId changes, not on every tick
    useEffect(() => {
        if (!isRunning) return;
        timerRef.current = window.setInterval(() => {
            const timerKey = `timer_${rowId}_actualTime`;
            const savedState = localStorage.getItem(timerKey);
            if (!savedState) return;
            const { startTime, startBaseValue } = JSON.parse(savedState);
            const newValue = startBaseValue + Math.floor((Date.now() - startTime) / 60000);
            if (newValue !== localActualRef.current) {
                localActualRef.current = newValue;
                setLocalActual(newValue);
                // DB write deferred to pause
            }
        }, 10000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning, rowId]);

    // Flush to DB on tab close while running
    useEffect(() => {
        if (!isRunning) return;
        const flush = () => onChange(rowId, 'actualTime', localActualRef.current);
        window.addEventListener('beforeunload', flush);
        return () => window.removeEventListener('beforeunload', flush);
    }, [isRunning, rowId, onChange]);

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();

        const timerKey = `timer_${rowId}_actualTime`;

        if (isRunning) {
            // Pause
            setIsRunning(false);
            localStorage.removeItem(timerKey);
            onChange(rowId, 'actualTime', localActual);
        } else {
            // Start
            setIsRunning(true);
            localStorage.setItem(timerKey, JSON.stringify({
                isRunning: true,
                startTime: Date.now(),
                startBaseValue: localActual
            }));
        }
    };

    const handleActualBlur = () => {
        setEditingField(null);
        onChange(rowId, 'actualTime', localActual);
    };

    const handleExpectedBlur = () => {
        // Delay blur to allow preset clicks to register before the popover closes and input unmounts
        setTimeout(() => {
            if (isSelectingRef.current) {
                isSelectingRef.current = false;
                return;
            }
            setEditingField((prev) => prev === 'expected' ? null : prev);
            onChange(rowId, 'expectedTime', localExpectedRef.current);
        }, 150);
    };

    const handlePresetSelect = (preset: number) => {
        isSelectingRef.current = true;
        localExpectedRef.current = preset;
        setLocalExpected(preset);
        onChange(rowId, 'expectedTime', preset);
        setEditingField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, field: 'actual' | 'expected') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'actual') {
                actualInputRef.current?.blur();
            } else {
                expectedInputRef.current?.blur();
            }
        } else if (e.key === 'Escape') {
            if (field === 'actual') {
                setLocalActual(actualTime);
            } else {
                setLocalExpected(expectedTime);
            }
            setEditingField(null);
        }
    };

    return (
        <div className="relative w-full h-full group flex items-center justify-start gap-0.5 px-1 py-1.5">
            {/* Timer button - visible on hover or when running */}
            <button
                className={cn(
                    'flex items-center justify-center w-4 h-4 rounded transition-opacity flex-shrink-0',
                    isRunning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                )}
                onClick={handlePlayPause}
                title={isRunning ? 'Pause timer' : 'Start timer'}
            >
                {isRunning ? (
                    <Pause size={10} className="text-accent fill-current" />
                ) : (
                    <Play size={10} className="text-[#9e9e9e]" />
                )}
            </button>

            {/* Combined time display: actual / expected min */}
            <div className="flex items-center gap-1 font-mono text-sm">
                {/* Actual time */}
                {editingField === 'actual' && !isRunning ? (
                    <input
                        ref={actualInputRef}
                        type="number"
                        value={localActual}
                        onChange={(e) => setLocalActual(parseFloat(e.target.value) || 0)}
                        onBlur={handleActualBlur}
                        onKeyDown={(e) => handleKeyDown(e, 'actual')}
                        className="w-12 bg-transparent border-none outline-none text-[#37352F] text-right"
                        autoFocus
                    />
                ) : (
                    <span
                        className={cn(
                            'cursor-text text-right min-w-[2ch]',
                            isRunning ? 'text-accent font-medium' : 'text-[#37352F]'
                        )}
                        onClick={() => !isRunning && setEditingField('actual')}
                    >
                        {localActual}
                    </span>
                )}

                {/* Separator */}
                <span className="text-[#9B9A97]">/</span>

                {/* Expected time */}
                {editingField === 'expected' ? (
                    <Popover open={true} onOpenChange={(open) => !open && setEditingField(null)}>
                        <PopoverTrigger asChild>
                                <input
                                    ref={expectedInputRef}
                                    type="text"
                                    value={localExpected}
                                    onChange={(e) => {
                                        // Allow clearing input
                                        if (e.target.value === '') {
                                            setLocalExpected(0);
                                            localExpectedRef.current = 0;
                                            return;
                                        }
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val)) {
                                            setLocalExpected(val);
                                            localExpectedRef.current = val;
                                        }
                                    }}
                                    onBlur={handleExpectedBlur}
                                    onKeyDown={(e) => handleKeyDown(e, 'expected')}
                                    className="w-12 bg-transparent border-none outline-none text-[#37352F]"
                                    autoFocus
                                />
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-32 p-1 border shadow-lg rounded-md bg-white z-50"
                            align="start"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <div className="flex flex-col gap-0.5">
                                {[5, 15, 30, 60].map((preset) => (
                                    <button
                                        key={preset}
                                        className="text-left w-full px-2 py-1.5 text-sm text-[#37352F] hover:bg-[#F2F1EE] rounded transition-colors"
                                        onClick={() => handlePresetSelect(preset)}
                                    >
                                        {preset} min
                                    </button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <span
                        className="cursor-text text-[#37352F] min-w-[2ch]"
                        onClick={() => setEditingField('expected')}
                    >
                        {localExpected}
                    </span>
                )}

                {/* Unit */}
                <span className="text-[#9B9A97] ml-1">min</span>
            </div>
        </div>
    );
}

export const CombinedTimeCell = React.memo(
    CombinedTimeCellInner,
    (prev, next) => {
        const p = prev.value as any, n = next.value as any;
        return prev.rowId === next.rowId &&
            p?.actualTime === n?.actualTime &&
            p?.expectedTime === n?.expectedTime &&
            prev.onChange === next.onChange;
    }
);
