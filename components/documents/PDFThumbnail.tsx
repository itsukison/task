'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

// Configure worker - use local copy from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PDFThumbnailProps {
    url: string;
    className?: string;
}

export function PDFThumbnail({ url, className }: PDFThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function renderPDF() {
            if (!canvasRef.current) return;

            try {
                setLoading(true);
                setError(false);

                // Load PDF with timeout to prevent hanging
                const loadingTask = pdfjsLib.getDocument(url);
                const pdf = await Promise.race([
                    loadingTask.promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('PDF load timeout')), 10000)
                    )
                ]) as pdfjsLib.PDFDocumentProxy;

                if (cancelled) return;

                // Get first page
                const page = await pdf.getPage(1);

                if (cancelled) return;

                // Calculate scale for thumbnail (target height: 180px)
                const viewport = page.getViewport({ scale: 1 });
                const scale = 180 / viewport.height;
                const scaledViewport = page.getViewport({ scale });

                // Render to canvas
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) return;

                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                await page.render({
                    canvas: canvas,
                    canvasContext: context,
                    viewport: scaledViewport,
                }).promise;

                setLoading(false);
            } catch (err) {
                console.warn('PDF thumbnail render failed (non-critical):', err);
                if (!cancelled) {
                    setError(true);
                    setLoading(false);
                }
            }
        }

        renderPDF();

        return () => {
            cancelled = true;
        };
    }, [url]);

    if (error) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <FileText className="w-12 h-12 text-gray-400" />
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                </div>
            )}
            <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-90 hover:opacity-100'} transition-opacity`}
            />
        </div>
    );
}
