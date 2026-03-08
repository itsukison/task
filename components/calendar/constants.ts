/**
 * Calendar constants and shared values
 */

// Array of 24 hours (0-23) for time column
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Fixed pixel width for each day column (drives fluid day count from divider drag)
export const FIXED_COLUMN_WIDTH = 160;

// Pre-create transparent drag image to prevent favicon from appearing during drag
export const transparentDragImage = new Image();
transparentDragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
