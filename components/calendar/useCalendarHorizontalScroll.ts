'use client';

import { useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import { addDays, startOfWeek, subWeeks, addWeeks } from 'date-fns';

interface UseCalendarHorizontalScrollOptions {
    viewDate: Date;
    view: 'week' | 'day';
    scrollAlignment?: 'center' | 'left';
    onViewDateChange: (date: Date) => void;
    dayColumnWidth: number;
    occludedRightPx?: number;
}

export function useCalendarHorizontalScroll({
    viewDate,
    view,
    scrollAlignment = 'center',
    onViewDateChange,
    dayColumnWidth,
    occludedRightPx = 0,
}: UseCalendarHorizontalScrollOptions) {
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);

    // Track infinite scroll state
    const isInfiniteScrollingRef = useRef(false);
    const previousViewDateRef = useRef<Date | null>(null);

    // Track first visible column index (integer) for snap & resize stability
    const firstVisibleColRef = useRef(7);

    // Snap state
    const isSnappingRef = useRef(false);
    const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Resize state
    const isResizingRef = useRef(false);
    const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track if we've already centered on mount
    const hasCenteredRef = useRef(false);
    const previousScrollAlignmentRef = useRef<'center' | 'left'>(scrollAlignment);

    // Compute 3 weeks of days centered on viewDate
    const allDisplayedDays = useMemo(() => {
        if (view === 'day') return [viewDate];

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
    }, [viewDate, view]);

    // Helper: snap scroll position to nearest column boundary
    const snapToNearestColumn = useCallback((el: HTMLDivElement) => {
        const nearestCol = Math.round(el.scrollLeft / dayColumnWidth);
        const targetLeft = nearestCol * dayColumnWidth;

        if (Math.abs(el.scrollLeft - targetLeft) > 2) {
            isSnappingRef.current = true;
            el.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }

        firstVisibleColRef.current = nearestCol;

        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = el.scrollLeft;
        }
    }, [dayColumnWidth]);

    // Adjust scroll position when viewDate or scrollAlignment changes
    useLayoutEffect(() => {
        if (view === 'day') return;

        const el = bodyScrollRef.current;
        if (!el) return;

        // Handle infinite scroll adjustments
        if (isInfiniteScrollingRef.current && previousViewDateRef.current) {
            let colAdjustment = 0;
            if (viewDate < previousViewDateRef.current) {
                colAdjustment = 7;
            } else if (viewDate > previousViewDateRef.current) {
                colAdjustment = -7;
            }

            if (colAdjustment !== 0) {
                el.scrollLeft += colAdjustment * dayColumnWidth;
                firstVisibleColRef.current = el.scrollLeft / dayColumnWidth;

                if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = el.scrollLeft;
                }
            }

            isInfiniteScrollingRef.current = false;
        } else {
            const viewDateChanged =
                previousViewDateRef.current?.getTime() !== viewDate.getTime();
            const alignmentJustBecameCenter =
                previousScrollAlignmentRef.current !== 'center' && scrollAlignment === 'center';
            const needsCentering =
                !hasCenteredRef.current ||
                (scrollAlignment === 'center' && (alignmentJustBecameCenter || viewDateChanged));

            if (needsCentering) {
                let targetCol = 7;

                if (scrollAlignment === 'center') {
                    const effectiveWidth = Math.max(0, el.clientWidth - occludedRightPx);
                    const visibleCols = effectiveWidth > 0
                        ? Math.floor(effectiveWidth / dayColumnWidth)
                        : 7;
                    const centerOffset = Math.max(0, Math.floor(visibleCols / 2));
                    const dayIndex = (viewDate.getDay() + 6) % 7;
                    const absoluteIndex = 7 + dayIndex;
                    targetCol = Math.max(0, absoluteIndex - centerOffset);
                }

                el.scrollLeft = targetCol * dayColumnWidth;
                firstVisibleColRef.current = targetCol;
                hasCenteredRef.current = true;

                if (headerScrollRef.current) {
                    headerScrollRef.current.scrollLeft = el.scrollLeft;
                }
            }
        }

        previousViewDateRef.current = viewDate;
        previousScrollAlignmentRef.current = scrollAlignment;
    }, [viewDate, view, scrollAlignment, dayColumnWidth, occludedRightPx]);

    // Handle Resize: suppress snapping during active resize without re-anchoring scroll
    useEffect(() => {
        if (view === 'day') return;
        const el = bodyScrollRef.current;
        if (!el) return;

        const handleResize = () => {
            if (!el) return;

            // Suppress snap logic during and briefly after resize
            isResizingRef.current = true;
            isSnappingRef.current = false;
            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
            resizeTimeoutRef.current = setTimeout(() => {
                isResizingRef.current = false;
            }, 200);
            firstVisibleColRef.current = el.scrollLeft / dayColumnWidth;
        };

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(el);

        return () => {
            resizeObserver.disconnect();
        };
    }, [view, dayColumnWidth]);

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        };
    }, []);

    const handleBodyScroll = useCallback(() => {
        const body = bodyScrollRef.current;
        if (!body) return;

        if (headerScrollRef.current) {
            headerScrollRef.current.scrollLeft = body.scrollLeft;
        }

        if (isInfiniteScrollingRef.current || isResizingRef.current) return;

        const scrollLeft = body.scrollLeft;

        firstVisibleColRef.current = scrollLeft / dayColumnWidth;

        if (snapTimerRef.current) {
            clearTimeout(snapTimerRef.current);
            snapTimerRef.current = null;
        }

        if (isSnappingRef.current) {
            const nearestCol = Math.round(scrollLeft / dayColumnWidth);
            const targetLeft = nearestCol * dayColumnWidth;
            if (Math.abs(scrollLeft - targetLeft) <= 2) {
                isSnappingRef.current = false;
            }
            return;
        }

        const maxScrollLeft = Math.max(0, body.scrollWidth - body.clientWidth);
        const edgeBuffer = Math.max(dayColumnWidth * 0.75, body.clientWidth * 0.15);
        const leftThreshold = edgeBuffer;
        const rightThreshold = Math.max(0, maxScrollLeft - edgeBuffer);

        if (scrollLeft <= leftThreshold) {
            isInfiniteScrollingRef.current = true;
            onViewDateChange(subWeeks(viewDate, 1));
            return;
        } else if (scrollLeft >= rightThreshold) {
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
    }, [viewDate, onViewDateChange, snapToNearestColumn, dayColumnWidth]);

    return {
        allDisplayedDays,
        bodyScrollRef,
        headerScrollRef,
        handleBodyScroll,
    };
}
