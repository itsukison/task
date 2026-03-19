import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';

/**
 * Hook for managing calendar zoom state with pinch-to-zoom support
 *
 * Features:
 * - Pinch-to-zoom with Ctrl+Wheel
 * - Cursor-centered zooming (maintains position under cursor)
 * - Auto-scroll to 8 AM on initial mount
 * - Zoom range: 40px to 200px per hour
 */
export function useCalendarZoom(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [hourHeight, setHourHeight] = useState(64);
  const zoomAnchorRef = useRef<{ timeHours: number; offsetY: number } | null>(null);
  // Ref so the wheel handler always reads the current value without being in deps
  const hourHeightRef = useRef(hourHeight);
  useEffect(() => { hourHeightRef.current = hourHeight; }, [hourHeight]);

  // Scroll to 8 AM on mount (only if not zooming)
  useEffect(() => {
    if (containerRef.current && !zoomAnchorRef.current) {
      containerRef.current.scrollTop = 8 * hourHeightRef.current;
    }
  }, []); // Run once on mount

  // Handle Pinch-to-Zoom — registered once, no listener churn on zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        // Calculate anchor point before zoom using the ref (fresh value, no dep)
        const rect = container.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const scrollTop = container.scrollTop;
        const timeHours = (scrollTop + offsetY) / hourHeightRef.current;

        zoomAnchorRef.current = { timeHours, offsetY };

        const delta = -e.deltaY;
        setHourHeight((prev) => Math.max(40, Math.min(200, prev + delta * 0.5)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []); // empty deps — hourHeight read via ref, listener registered once

  // Restore scroll position after zoom to keep cursor centered
  useLayoutEffect(() => {
    if (containerRef.current && zoomAnchorRef.current) {
      const { timeHours, offsetY } = zoomAnchorRef.current;
      const newScrollTop = timeHours * hourHeight - offsetY;
      containerRef.current.scrollTop = newScrollTop;
      zoomAnchorRef.current = null;
    }
  }, [hourHeight]);

  const snapInterval = hourHeight >= 80 ? 5 : 15;

  const resetZoom = useCallback((startHour = 0) => {
    zoomAnchorRef.current = null;
    const defaultHeight = 64;
    setHourHeight(defaultHeight);

    const el = containerRef.current;
    if (el) {
      // Vertically center on current time (same logic as initial auto-center)
      const nowLocal = new Date();
      const minutesFromStart = Math.max(
        0,
        (nowLocal.getHours() - startHour) * 60 + nowLocal.getMinutes()
      );
      const topPx = minutesFromStart * (defaultHeight / 60);
      const containerHeight = el.clientHeight;
      const maxScrollTop = Math.max(0, el.scrollHeight - containerHeight);
      const desiredLineY = containerHeight / 2 - defaultHeight;
      el.scrollTop = Math.min(Math.max(0, topPx - desiredLineY), maxScrollTop);
    }
  }, [containerRef]);

  return { hourHeight, snapInterval, resetZoom };
}
