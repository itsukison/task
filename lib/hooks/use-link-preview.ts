import { useState } from 'react';

export interface LinkPreviewData {
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
}

/**
 * Hook to fetch link preview metadata
 * Note: This is a simplified version. For production, you should create
 * an API route to fetch metadata server-side to avoid CORS issues.
 */
export function useLinkPreview() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPreview = async (url: string): Promise<LinkPreviewData> => {
        setLoading(true);
        setError(null);

        try {
            // For now, we'll return basic data extracted from the URL
            // In production, create an API route like /api/link-preview
            // that uses a service like Open Graph scraper or similar

            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');

            // Simplified preview data
            const previewData: LinkPreviewData = {
                title: hostname,
                description: url,
                siteName: hostname,
                favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
            };

            return previewData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preview';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchPreview,
        loading,
        error,
    };
}
