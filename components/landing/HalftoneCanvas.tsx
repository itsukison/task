'use client';

import React, { useRef, useEffect } from 'react';

interface HalftoneCanvasProps {
    width?: number;
    height?: number;
    dotSize?: number;
    /** Angle in degrees */
    angle?: number;
    /** CSS color string for the dots */
    color?: string;
    className?: string;
}

export const HalftoneCanvas: React.FC<HalftoneCanvasProps> = ({
    width = 800,
    height = 600,
    dotSize = 10,
    angle = 0,
    color = 'black',
    className
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Map function
    const map = (value: number, minA: number, maxA: number, minB: number, maxB: number) => {
        return ((value - minA) / (maxA - minA)) * (maxB - minB) + minB;
    };

    // Index calculator
    const positionToDataIndex = (x: number, y: number, w: number) => {
        return (y * w + x) * 4;
    };

    // Rotation helper
    const rotatePoint = ([x, y]: [number, number], [cx, cy]: [number, number], angleRad: number): [number, number] => {
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const dx = x - cx;
        const dy = y - cy;
        return [
            dx * cos - dy * sin + cx,
            dx * sin + dy * cos + cy
        ];
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Ensure canvas element dimensions match prop dimensions
        canvas.width = width;
        canvas.height = height;

        // 1. Setup Source Gradient (Invisible)
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext("2d");
        if (!sourceCtx) return;

        // Simple linear gradient for demonstration - can be customized or passed as prop later if needed
        // Black (0) -> Large dots, White (255) -> Small dots
        const gradient = sourceCtx.createLinearGradient(0, height, width, 0); // Diagonal gradient
        gradient.addColorStop(0, "black");
        gradient.addColorStop(0.5, "#888888"); // Midpoint
        gradient.addColorStop(1, "white");
        sourceCtx.fillStyle = gradient;
        sourceCtx.fillRect(0, 0, width, height);

        const sourceData = sourceCtx.getImageData(0, 0, width, height).data;

        // Clear target
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = color;

        // 2. Logic for Rotation
        // We need to cover the whole canvas even when rotated.
        // A simple brute force approach is to iterate a larger grid that definitely covers the canvas.
        const angleRad = (angle * Math.PI) / 180;
        const centerW = width / 2;
        const centerH = height / 2;

        // Calculate a bounding box big enough to cover the canvas at any rotation
        const diag = Math.sqrt(width * width + height * height);
        // Start from negative margin to ensure coverage
        const startX = centerW - diag;
        const endX = centerW + diag;
        const startY = centerH - diag;
        const endY = centerH + diag;

        for (let y = startY; y < endY; y += dotSize) {
            for (let x = startX; x < endX; x += dotSize) {
                // Rotate current grid point back to source coordinates to sample
                const [srcX, srcY] = rotatePoint([x, y], [centerW, centerH], -angleRad);

                // Sample only if within bounds
                if (srcX >= 0 && srcX <= width - 1 && srcY >= 0 && srcY <= height - 1) {
                    const sampleIdx = positionToDataIndex(Math.floor(srcX), Math.floor(srcY), width);
                    const brightness = sourceData[sampleIdx]; // R channel

                    // Invert: Darker source = Larger radius
                    // 0 (Black) -> Max Radius
                    // 255 (White) -> 0 Radius
                    const radius = map(brightness, 0, 255, dotSize / 1.5, 0); // Scaling factor 1.5 for slight gap

                    if (radius > 0.5) {
                        ctx.beginPath();
                        // Draw at the ROTATED (original grid) location [x, y]
                        // Use rotatePoint again effectively?
                        // No: The grid loop (x,y) IS the rotated grid relative to the screen if we treat the screen as fixed.
                        // Wait, effectively we are laying a "Rotated Grid" over the "Fixed Image".
                        // So we draw at [x,y] which is the grid point.
                        // BUT, if we want the GRID to appear rotated, we just draw at x,y.
                        // However we need to 'pick' the color from the unrotated image at the position that [x,y] lands on.
                        // Yes, logic above is correct.

                        ctx.arc(x, y, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }

    }, [width, height, dotSize, angle, color]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width: '100%', height: '100%' }} // CSS scaling
        />
    );
};
