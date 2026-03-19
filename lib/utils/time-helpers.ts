export const formatTimeRange = (startTime: unknown, expectedTime: unknown): string | undefined => {
    if (typeof startTime !== 'string') return undefined;

    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) return undefined;

    const durationMinutes = typeof expectedTime === 'number' ? expectedTime : Number(expectedTime);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return undefined;

    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);
    const formatPart = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    return `${formatPart(startDate)}–${formatPart(endDate)}`;
};
