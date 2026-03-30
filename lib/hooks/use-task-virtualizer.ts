import { useRef, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { DaySection } from './use-task-sections';

interface UseTaskVirtualizerProps {
    daySections: DaySection[];
    selectedDateKey: string;
    selectedDate: Date;
    setAnchorDate: (date: Date) => void;
}

/**
 * Previously backed by @tanstack/react-virtual, but replaced with normal document flow.
 *
 * The virtualizer required accurate estimated heights for all 61 sections.  Sections
 * outside the overscan window are never mounted → never measured by ResizeObserver →
 * their estimated heights are used forever.  Any drift accumulates across dozens of
 * off-screen sections and produces large gaps / overlaps for sections currently on screen.
 *
 * 61 lightweight section shells is well within browser normal-flow performance.
 */
export function useTaskVirtualizer({
    daySections,
    selectedDateKey,
    selectedDate,
    setAnchorDate,
}: UseTaskVirtualizerProps) {
    const daySectionsScrollRef = useRef<HTMLDivElement>(null);
    const daySectionsViewportRef = useRef<HTMLDivElement>(null);
    const lastFocusedDayKeyRef = useRef<string | null>(null);

    const [scrollToDateKey, setScrollToDateKey] = useState<string | null>(null);

    // ─── Scroll-anchor: preserve the visual position of a row across
    //     React re-renders (e.g. subtask expand/collapse, row add/delete). ────────
    const scrollAnchorRef = useRef<{ querySelector: string; viewportTopBefore: number } | null>(null);
    const correctionRafRef = useRef<number | null>(null);

    const captureScrollAnchor = useCallback((querySelector: string) => {
        const scrollEl = daySectionsScrollRef.current;
        if (!scrollEl) return;
        const el = scrollEl.querySelector(querySelector) as HTMLElement | null;
        if (!el) return;
        const containerTop = scrollEl.getBoundingClientRect().top;
        scrollAnchorRef.current = {
            querySelector,
            viewportTopBefore: el.getBoundingClientRect().top - containerTop,
        };
    }, []);

    // Synchronous correction after every render so the anchored element doesn't jump.
    useLayoutEffect(() => {
        const anchor = scrollAnchorRef.current;
        const scrollEl = daySectionsScrollRef.current;
        if (!anchor || !scrollEl) return;
        const el = scrollEl.querySelector(anchor.querySelector) as HTMLElement | null;
        if (!el) {
            scrollAnchorRef.current = null;
            return;
        }
        const delta =
            el.getBoundingClientRect().top -
            scrollEl.getBoundingClientRect().top -
            anchor.viewportTopBefore;
        if (Math.abs(delta) > 0.5) {
            scrollEl.scrollTop += delta;
        }
    });

    // RAF-based correction for async height changes (e.g. after ResizeObserver fires
    // inside EditableTable rows).
    const prevScrollHeightRef = useRef(0);
    useLayoutEffect(() => {
        const scrollEl = daySectionsScrollRef.current;
        if (!scrollEl) return;
        const currentHeight = scrollEl.scrollHeight;
        if (currentHeight !== prevScrollHeightRef.current) {
            prevScrollHeightRef.current = currentHeight;
            if (scrollAnchorRef.current) {
                if (correctionRafRef.current !== null) cancelAnimationFrame(correctionRafRef.current);
                correctionRafRef.current = requestAnimationFrame(() => {
                    correctionRafRef.current = null;
                    const anchor = scrollAnchorRef.current;
                    const el2 = scrollEl.querySelector(anchor?.querySelector ?? '') as HTMLElement | null;
                    if (el2 && anchor) {
                        const delta =
                            el2.getBoundingClientRect().top -
                            scrollEl.getBoundingClientRect().top -
                            anchor.viewportTopBefore;
                        if (Math.abs(delta) > 0.5) scrollEl.scrollTop += delta;
                    }
                    scrollAnchorRef.current = null;
                });
            }
        }
    });

    // ─── Sync selected date → scroll position ────────────────────────────────────
    useEffect(() => {
        if (lastFocusedDayKeyRef.current === selectedDateKey) {
            lastFocusedDayKeyRef.current = null;
            return;
        }
        setAnchorDate(selectedDate);
        setScrollToDateKey(selectedDateKey);
    }, [selectedDate, selectedDateKey, setAnchorDate]);

    useEffect(() => {
        if (!scrollToDateKey) return;
        const scrollEl = daySectionsScrollRef.current;
        if (!scrollEl) return;

        // Scroll to the section with the matching data-date-key attribute.
        const target = scrollEl.querySelector(
            `[data-date-key="${scrollToDateKey}"]`
        ) as HTMLElement | null;
        if (target) {
            // Use scrollTop directly so behaviour matches the old virtualizer's 'auto' behaviour.
            const containerTop = scrollEl.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            // Subtract 24 to account for the pt-6 padding on the container
            scrollEl.scrollTop += (targetTop - containerTop) - 12;
        }
        setScrollToDateKey(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [daySections, scrollToDateKey]);

    return {
        daySectionsScrollRef,
        daySectionsViewportRef,
        lastFocusedDayKeyRef,
        captureScrollAnchor,
    };
}
