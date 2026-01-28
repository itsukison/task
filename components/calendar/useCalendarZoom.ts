import { useState, useEffect, useRef, useLayoutEffect } from 'react';

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

  // Scroll to 8 AM on mount (only if not zooming)
  useEffect(() => {
    if (containerRef.current && !zoomAnchorRef.current) {
      containerRef.current.scrollTop = 8 * hourHeight;
    }
  }, []); // Run once on mount

  // Handle Pinch-to-Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        // Calculate anchor point before zoom
        const rect = container.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const scrollTop = container.scrollTop;
        const timeHours = (scrollTop + offsetY) / hourHeight;

        zoomAnchorRef.current = { timeHours, offsetY };

        const delta = -e.deltaY;
        setHourHeight((prev) => {
          const newHeight = Math.max(40, Math.min(200, prev + delta * 0.5));
          return newHeight;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [hourHeight]); // Add hourHeight dependency to ensure fresh state access in handler

  // Restore scroll position after zoom to keep cursor centered
  useLayoutEffect(() => {
    if (containerRef.current && zoomAnchorRef.current) {
      const { timeHours, offsetY } = zoomAnchorRef.current;
      const newScrollTop = timeHours * hourHeight - offsetY;
      containerRef.current.scrollTop = newScrollTop;
      zoomAnchorRef.current = null;
    }
  }, [hourHeight]);

  return { hourHeight };
}
