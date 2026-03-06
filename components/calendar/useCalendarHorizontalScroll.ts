'use client';

import { useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { addDays, startOfWeek, subWeeks, addWeeks } from 'date-fns';

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
    const previousViewDateRef = useRef<Date | null>(null);

    // Track first visible column index (integer) for snap & resize stability
    const daysPerWeek = daysToShow;
    const firstVisibleColRef = useRef(daysPerWeek);

    // Snap state
    const isSnappingRef = useRef(false);
    const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track known-good container width to detect resize-triggered scroll clamps
    const stableWidthRef = useRef(0);
    const isResizingRef = useRef(false);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track if we've already centered on mount
    const hasCenteredRef = useRef(false);

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
            for (let i = 0; i < 7; i++) {
                days.push(addDays(weekStart, i));
            }
        }

        return days;
    }, [viewDate, view, daysToShow]);

    // Helper: calculate target column for centering
    const calculateTargetColumn = useCallback(() => {
        // Calculate 0-based day index within week (Mon=0, Sun=6)
        const dayIndex = (viewDate.getDay() + 6) % 7;
        // viewDate is in center week (index 7-13)
        const absoluteIndex = 7 + dayIndex;
        // Center offset based on daysToShow
        const centerOffset = Math.floor((daysToShow - 1) / 2);
        return Math.max(0, absoluteIndex - centerOffset);
    }, [viewDate, daysToShow]);

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

        if (Math.abs(el.scrollLeft - targetLeft) > 2) {
            isSnappingRef.current = true;
            el.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }

        firstVisibleColRef.current = nearestCol;

        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = el.scrollLeft;
        }
    }, [getColumnWidth]);

    // Adjust scroll position when viewDate or scrollAlignment changes
    useLayoutEffect(() => {
        if (view === 'day') return;

        const el = bodyScrollRef.current;
        if (!el) return;

        const containerWidth = el.clientWidth;
        if (containerWidth <= 0) return;

        // Handle infinite scroll adjustments
        if (isInfiniteScrollingRef.current && previousViewDateRef.current) {
            let colAdjustment = 0;
            if (viewDate < previousViewDateRef.current) {
                colAdjustment = daysPerWeek;
            } else if (viewDate > previousViewDateRef.current) {
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
            // Check if we need to center (first render OR scrollAlignment changed to 'center')
            const needsCentering = !hasCenteredRef.current || scrollAlignment === 'center';

            if (needsCentering) {
                const colWidth = getColumnWidth(containerWidth);
                let targetCol = 7;

                if (scrollAlignment === 'center') {
                    targetCol = calculateTargetColumn();
                }

                el.scrollLeft = targetCol * colWidth;
                firstVisibleColRef.current = targetCol;
                stableWidthRef.current = containerWidth;
                hasCenteredRef.current = true;

                if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = el.scrollLeft;
                }
            }
        }

        previousViewDateRef.current = viewDate;
    }, [viewDate, view, daysPerWeek, scrollAlignment, getColumnWidth, calculateTargetColumn]);

    // Handle Resize: Maintain same visible columns
    useEffect(() => {
        if (view === 'day') return;
        const el = bodyScrollRef.current;
        if (!el) return;

        const handleResize = () => {
            if (!el) return;
            const newWidth = el.clientWidth;
            if (newWidth <= 0) return;

            isResizingRef.current = true;
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                isResizingRef.current = false;
            }, 200);

            const colWidth = getColumnWidth(newWidth);
            el.scrollLeft = firstVisibleColRef.current * colWidth;
            stableWidthRef.current = newWidth;

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

        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = body.scrollLeft;
        }

        if (isInfiniteScrollingRef.current || isResizingRef.current) return;

        const width = body.clientWidth;
        const scrollLeft = body.scrollLeft;
        if (width <= 0) return;

        const colWidth = getColumnWidth(width);

        if (Math.abs(stableWidthRef.current - width) < 1) {
            firstVisibleColRef.current = Math.round(scrollLeft / colWidth);
        } else {
            stableWidthRef.current = width;
        }

        if (snapTimerRef.current) {
            clearTimeout(snapTimerRef.current);
            snapTimerRef.current = null;
        }

        if (isSnappingRef.current) {
            const nearestCol = Math.round(scrollLeft / colWidth);
            const targetLeft = nearestCol * colWidth;
            if (Math.abs(scrollLeft - targetLeft) <= 2) {
                isSnappingRef.current = false;
            }
            return;
        }

        // Thresholds must scale with daysPerWeek.
        // The virtual grid is always 21 columns (3 weeks × 7 days). For a 7-day view
        // the total scroll width is 3× the container; for a 3-day view it is 7×.
        // Using fixed 0.4/2.6 multipliers (correct for daysPerWeek=7) fires a false
        // "load next week" event on initial centering whenever today lands past column 7
        // in a narrow view (e.g. Friday in a 3-day view → column 10 → 3.33× container).
        // Scaling by 7/daysPerWeek keeps the trigger point at ≈40% into each buffer week.
        const leftThreshold = width * 2.8 / daysPerWeek;
        const rightThreshold = width * 18.2 / daysPerWeek;

        if (scrollLeft < leftThreshold) {
            isInfiniteScrollingRef.current = true;
            onViewDateChange(subWeeks(viewDate, 1));
            return;
        } else if (scrollLeft > rightThreshold) {
            isInfiniteScrollingRef.current = true;
            onViewDateChange(addWeeks(viewDate, 1));
            return;
        }

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
