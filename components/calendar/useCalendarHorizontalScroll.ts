'use client';

import { useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { addDays, startOfWeek, subWeeks, addWeeks, isSameDay } from 'date-fns';

interface UseCalendarHorizontalScrollOptions {
    viewDate: Date;
    view: 'week' | 'day';
    daysToShow?: number;
    scrollAlignment?: 'center' | 'left';
    onViewDateChange: (date: Date) => void;
}

export function useCalendarHorizontalScroll({
    viewDate,
    view,
    daysToShow = 5,
    scrollAlignment = 'center',
    onViewDateChange,
}: UseCalendarHorizontalScrollOptions) {
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    // Track infinite scroll state
    const isInfiniteScrollingRef = useRef(false);
    const previousViewDateRef = useRef(viewDate);

    // Track first visible column index (integer) for snap & resize stability
    // daysPerWeek controls how many columns are visible at once
    const daysPerWeek = daysToShow;
    const firstVisibleColRef = useRef(daysPerWeek);

    // Snap state
    const isSnappingRef = useRef(false);
    const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track known-good container width to detect resize-triggered scroll clamps
    const stableWidthRef = useRef(0);
    const isResizingRef = useRef(false);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Compute 3 weeks of days centered on viewDate
    const allDisplayedDays = useMemo(() => {
        if (view === 'day') return [viewDate];

        // Current week is the center week
        const currentWeekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
        const prevWeekStart = subWeeks(currentWeekStart, 1);
        const nextWeekStart = addWeeks(currentWeekStart, 1);

        const weeks = [prevWeekStart, currentWeekStart, nextWeekStart];
        const days: Date[] = [];

        for (const weekStart of weeks) {
            // Always generate all 7 days (Mon-Sun) per week
            for (let i = 0; i < 7; i++) {
                days.push(addDays(weekStart, i));
            }
        }

        return days;
    }, [viewDate, view, daysToShow]);

    // Helper: get column width from container
    const getColumnWidth = useCallback((containerWidth: number) => {
        return containerWidth / daysPerWeek;
    }, [daysPerWeek]);

    // Helper: snap scroll position to nearest column boundary
    const snapToNearestColumn = useCallback((el: HTMLDivElement) => {
        const width = el.clientWidth;
        if (width <= 0) return;

        const colWidth = getColumnWidth(width);
        const nearestCol = Math.round(el.scrollLeft / colWidth);
        const targetLeft = nearestCol * colWidth;

        // Only snap if not already aligned (2px tolerance)
        if (Math.abs(el.scrollLeft - targetLeft) > 2) {
            isSnappingRef.current = true;
            el.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }

        // Update tracked column index
        firstVisibleColRef.current = nearestCol;

        // Sync header
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = el.scrollLeft;
        }
    }, [getColumnWidth]);

    // Adjust scroll position after render when viewDate changes
    useLayoutEffect(() => {
        if (view === 'day') return;

        const el = bodyScrollRef.current;
        if (!el) return;

        const containerWidth = el.clientWidth;
        if (containerWidth <= 0) return;

        // Check infinite scroll update
        if (isInfiniteScrollingRef.current) {
            let colAdjustment = 0;
            if (viewDate < previousViewDateRef.current) {
                // Scrolled left → prepended a week → shift right by daysPerWeek columns
                colAdjustment = daysPerWeek;
            } else if (viewDate > previousViewDateRef.current) {
                // Scrolled right → appended a week → shift left by daysPerWeek columns
                colAdjustment = -daysPerWeek;
            }

            if (colAdjustment !== 0) {
                const colWidth = getColumnWidth(containerWidth);
                el.scrollLeft += colAdjustment * colWidth;
                firstVisibleColRef.current = Math.round(el.scrollLeft / colWidth);
                stableWidthRef.current = containerWidth;

                if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = el.scrollLeft;
                }
            }

            isInfiniteScrollingRef.current = false;
        } else {
            // External update of viewDate (not via scroll) implies reset
            if (!isSameDay(viewDate, previousViewDateRef.current)) {
                const colWidth = getColumnWidth(containerWidth);
                let targetCol = 7; // Default: Start of center week (Monday)

                if (scrollAlignment === 'center') {
                    // Center the specific viewDate in the viewport
                    // viewDate is in the center week (index 7 to 13)
                    // Calculate 0-based index of day within the week (Mon=0, Sun=6)
                    const dayIndex = (viewDate.getDay() + 6) % 7;
                    const absoluteIndex = 7 + dayIndex;

                    // We want absoluteIndex to be in the middle of daysToShow
                    // ScrollLeft should be: Absolute - Floor(Viewport / 2)
                    const centerOffset = Math.floor((daysToShow - 1) / 2);
                    targetCol = Math.max(0, absoluteIndex - centerOffset);
                } else {
                    // 'left' alignment: strictly align Monday to left edge
                    targetCol = 7;
                }

                el.scrollLeft = targetCol * colWidth;
                firstVisibleColRef.current = targetCol;
                stableWidthRef.current = containerWidth;

                if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = el.scrollLeft;
                }
            }
        }

        previousViewDateRef.current = viewDate;
    }, [viewDate, view, allDisplayedDays, daysPerWeek, getColumnWidth]);

    // Handle Resize: Maintain same visible columns
    useEffect(() => {
        if (view === 'day') return;
        const el = bodyScrollRef.current;
        if (!el) return;

        const handleResize = () => {
            if (!el) return;
            const newWidth = el.clientWidth;
            if (newWidth <= 0) return;

            // Lock scroll updates
            isResizingRef.current = true;
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                isResizingRef.current = false;
            }, 200);

            const colWidth = getColumnWidth(newWidth);
            // Restore position based on tracked column index — same dates stay visible
            el.scrollLeft = firstVisibleColRef.current * colWidth;

            // Mark the new width as stable so handleBodyScroll accepts it
            stableWidthRef.current = newWidth;

            // Update header too
            if (headerScrollRef.current) {
                headerScrollRef.current.scrollLeft = el.scrollLeft;
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        };
    }, [view, getColumnWidth]);

    // Initial center scroll
    useEffect(() => {
        if (view === 'day') return;
        const el = bodyScrollRef.current;
        if (el) {
            // Center reliably on mount if at 0
            if (el.scrollLeft === 0 && el.clientWidth > 0) {
                const colWidth = getColumnWidth(el.clientWidth);
                const targetCol = daysPerWeek;
                el.scrollLeft = targetCol * colWidth;
                firstVisibleColRef.current = targetCol;
                stableWidthRef.current = el.clientWidth;
                if (headerScrollRef.current) headerScrollRef.current.scrollLeft = el.scrollLeft;
            }
        }
    }, [daysPerWeek, getColumnWidth]);

    // Clean up snap timer on unmount
    useEffect(() => {
        return () => {
            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
            }
        };
    }, []);

    const handleBodyScroll = useCallback(() => {
        const body = bodyScrollRef.current;
        if (!body) return;

        // Sync header
        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = body.scrollLeft;
        }

        if (isInfiniteScrollingRef.current || isResizingRef.current) return;

        const width = body.clientWidth;
        const scrollLeft = body.scrollLeft;
        if (width <= 0) return;

        const colWidth = getColumnWidth(width);

        // Only update column index if the container width hasn't changed.
        // During resize, the browser clamps scrollLeft BEFORE ResizeObserver fires,
        // which would corrupt firstVisibleColRef with the wrong column index.
        if (Math.abs(stableWidthRef.current - width) < 1) {
            firstVisibleColRef.current = Math.round(scrollLeft / colWidth);
        } else {
            // If mismatch, assume resize is happening and don't update column index
            stableWidthRef.current = width;
        }

        // --- Debounced snap-to-column ---
        // Clear any pending snap timer
        if (snapTimerRef.current) {
            clearTimeout(snapTimerRef.current);
            snapTimerRef.current = null;
        }

        // If we're in the middle of a programmatic snap, check if we've arrived
        if (isSnappingRef.current) {
            const nearestCol = Math.round(scrollLeft / colWidth);
            const targetLeft = nearestCol * colWidth;
            if (Math.abs(scrollLeft - targetLeft) <= 2) {
                isSnappingRef.current = false;
            }
            return; // Don't trigger new snaps or infinite scroll during a snap animation
        }

        // Trigger infinite scroll thresholds
        if (scrollLeft < width * 0.4) {
            isInfiniteScrollingRef.current = true;
            onViewDateChange(subWeeks(viewDate, 1));
            return; // Don't schedule snap during infinite scroll
        } else if (scrollLeft > width * 2.6) {
            isInfiniteScrollingRef.current = true;
            onViewDateChange(addWeeks(viewDate, 1));
            return; // Don't schedule snap during infinite scroll
        }

        // Schedule snap after scroll settles (150ms of no scroll events)
        snapTimerRef.current = setTimeout(() => {
            snapTimerRef.current = null;
            if (!isInfiniteScrollingRef.current && bodyScrollRef.current) {
                snapToNearestColumn(bodyScrollRef.current);
            }
        }, 150);
    }, [viewDate, onViewDateChange, getColumnWidth, snapToNearestColumn]);

    return {
        allDisplayedDays,
        bodyScrollRef,
        headerScrollRef,
        handleBodyScroll,
        daysPerWeek,
    };
}
