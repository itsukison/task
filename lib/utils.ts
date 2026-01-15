import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes conditionally.
 * Combines clsx for conditional classes with tailwind-merge to handle conflicts.
 * 
 * @example
 * cn("px-2 py-1", isActive && "bg-blue-500", className)
 * cn("text-sm", { "font-bold": isBold, "text-red-500": hasError })
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format minutes to human-readable time string
 * @example formatMinutes(90) => "1h 30m"
 */
export function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format minutes to decimal hours
 * @example formatMinutesToHours(90) => "1.5h"
 */
export function formatMinutesToHours(minutes: number): string {
    return `${(minutes / 60).toFixed(1)}h`;
}
