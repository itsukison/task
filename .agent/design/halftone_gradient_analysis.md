# Halftone Gradient Analysis & Implementation Guide

## 1. Core Concept
A **Halftone Gradient** simulates continuous tone through the use of dots, varying either in size or in spacing, to generate a gradient-like effect. 

The technique observed analyzes a **source grayscale image** (or gradient) and procedurally generates a pattern of dots where:
- **Darker Source Areas** → Larger dots (closer to max radius).
- **Lighter Source Areas** → Smaller dots (closer to 0 radius).
- **Grid Structure** → Dots are placed on a fixed grid (screen), which can be rotated.

---

## 2. Implementation Strategy (HTML5 Canvas)

The most performance-efficient way to generate dynamic halftones in the browser is using the HTML5 `<canvas>` API. The process involves two canvases:
1.  **Source Canvas**: Hidden canvas containing the gradient map/image (luminance reference).
2.  **Target Canvas**: Visible canvas where the dots are drawn.

### Core Algorithm Steps:
1.  **Draw Source**: Render a `linear-gradient` (black to white) onto the Source Canvas.
2.  **Get Image Data**: Extract pixel data (`context.getImageData()`) to access raw RGBA values.
3.  **Grid Iteration**: Loop through the canvas width/height with a step size (e.g., `PIXELS_PER_DOT`).
4.  **Sampling**: For each grid point `(x, y)`:
    *   Read the pixel luminance (R, G, or B value) from the Source Canvas data.
    *   Normalize the value (0–255).
5.  **Radius Mapping**: Map the inverted luminance to a circle radius.
    *   `Value 0 (Black)` → `Max Radius`
    *   `Value 255 (White)` → `0 Radius`
6.  **Render**: `context.arc(x, y, radius, ...)` on the Target Canvas.

---

## 3. Code Implementation

### Helper Functions

```javascript
// Map a value from one range to another
const map = (value, minA, maxA, minB, maxB) => {
  return ((value - minA) / (maxA - minA)) * (maxB - minB) + minB;
};

// Calculate index in flattened Uint8ClampedArray (RGBA)
const positionToDataIndex = (x, y, width) => {
  return (y * width + x) * 4;
};
```

### Basic Halftone Generation

```javascript
const generateHalftone = (width, height, dotSize = 10) => {
    // 1. Setup Source Gradient
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = height;
    const sourceCtx = sourceCanvas.getContext("2d");
    
    // Create a generic linear gradient (Black -> White)
    const gradient = sourceCtx.createLinearGradient(0, height / 2, width, height / 2);
    gradient.addColorStop(0, "black");
    gradient.addColorStop(1, "white");
    sourceCtx.fillStyle = gradient;
    sourceCtx.fillRect(0, 0, width, height);
    
    // 2. Setup Target
    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = width;
    targetCanvas.height = height;
    const targetCtx = targetCanvas.getContext("2d");
    
    // 3. Process
    const sourceData = sourceCtx.getImageData(0, 0, width, height).data;
    
    for (let y = 0; y < height; y += dotSize) {
        for (let x = 0; x < width; x += dotSize) {
            const index = positionToDataIndex(x, y, width);
            const brightness = sourceData[index]; // Red channel is sufficient for grayscale
            
            // Map brightness: Darker (0) = Larger Radius
            const radius = map(brightness, 0, 255, dotSize / 2, 0);
            
            if (radius > 0.5) { // Optimization: Don't draw tiny/invisible dots
                targetCtx.beginPath();
                targetCtx.arc(x, y, radius, 0, Math.PI * 2);
                targetCtx.fillStyle = "black"; 
                targetCtx.fill();
            }
        }
    }
    
    return targetCanvas;
};
```

---

## 4. Advanced: Screen Rotation (Angled Halftones)

High-quality halftones often use angled screens (e.g., 45°) to look more organic and less like a grid.

**Logic Change:**
Instead of iterating `x, y` directly, we iterate over a **rotated coordinate system** that covers the entire bounding box of the canvas.

```javascript
/* 
 * Rotate a point around a pivot 
 */
const rotatePoint = ([x, y], [cx, cy], angleRad) => {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = x - cx;
    const dy = y - cy;
    return [
        dx * cos - dy * sin + cx,
        dx * sin + dy * cos + cy
    ];
};

/*
 * Angled Halftone Loop Pseudo-code
 */
const renderAngledHalftone = (angleDegrees) => {
    const angle = (angleDegrees * Math.PI) / 180;
    
    // 1. Calculate bounding box to ensure coverage after rotation
    // ... (Calculate minX, maxX, minY, maxY of rotated canvas corners) ...
    
    // 2. Iterate through the EXPANDED grid
    for (let y = minY; y < maxY; y += dotSize) {
        for (let x = minX; x < maxX; x += dotSize) {
            
            // 3. Rotate CURRENT grid point back to SOURCE coordinates
            // to find which pixel to sample
            const [srcX, srcY] = rotatePoint([x, y], [centerW, centerH], -angle);
            
            // Check if processed point is inside actual canvas bounds
            if (srcX >= 0 && srcX <= width && srcY >= 0 && srcY <= height) {
                const sampleIdx = positionToDataIndex(Math.floor(srcX), Math.floor(srcY), width);
                const val = sourceData[sampleIdx];
                
                // 4. Draw dot at the ORIGINAL (rotated) grid location [x, y]
                const radius = map(val, 0, 255, dotSize/2, 0);
                // ... draw arc at x, y ...
            }
        }
    }
};
```

## 5. CSS/SVG Alternatives (Static)
If runtime generation is not needed, an **SVG Pattern** is more performant but less flexible for complex gradients. CSS `radial-gradient` masks can also be used but are tricky to vary in size dynamically per-pixel without thousands of DOM elements.

**Recommendation:** For the "Tasklanding" hero section effect, use the **Canvas 2D** method described above that supports dynamic inputs and simple integration.
