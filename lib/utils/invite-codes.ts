/**
 * Invite code utilities for organization joining
 * Format: XXX-XXX-XXX (uppercase alphanumeric, no confusing characters)
 */

// Characters that are easy to read and type (no 0/O, 1/I/L confusion)
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a random invite code in XXX-XXX-XXX format
 */
export function generateInviteCode(): string {
    const generateSegment = () => {
        let segment = '';
        for (let i = 0; i < 3; i++) {
            segment += CHARSET[Math.floor(Math.random() * CHARSET.length)];
        }
        return segment;
    };

    return `${generateSegment()}-${generateSegment()}-${generateSegment()}`;
}

/**
 * Validate invite code format
 * Returns true if format is valid (does not check if code exists in DB)
 */
export function isValidInviteCodeFormat(code: string): boolean {
    // Format: XXX-XXX-XXX where X is from CHARSET
    const pattern = /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/;
    return pattern.test(code.toUpperCase());
}

/**
 * Normalize invite code (uppercase, trim whitespace)
 */
export function normalizeInviteCode(code: string): string {
    return code.trim().toUpperCase();
}
