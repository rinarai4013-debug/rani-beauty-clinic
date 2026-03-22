'use client';

import React from 'react';

/**
 * SVG face positioning guide overlay.
 * Shows an oval cutout with positioning hints for optimal photo capture.
 */
export default function FaceFrameGuide() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <svg
        viewBox="0 0 400 500"
        className="w-full h-full max-w-[300px] max-h-[380px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Semi-transparent background */}
        <defs>
          <mask id="face-cutout">
            <rect width="400" height="500" fill="white" />
            <ellipse cx="200" cy="220" rx="110" ry="145" fill="black" />
          </mask>
        </defs>

        {/* Overlay with cutout */}
        <rect
          width="400"
          height="500"
          fill="#0F1D2C"
          opacity="0.25"
          mask="url(#face-cutout)"
        />

        {/* Oval guide border */}
        <ellipse
          cx="200"
          cy="220"
          rx="110"
          ry="145"
          fill="none"
          stroke="#C9A96E"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          opacity="0.6"
        />

        {/* Hint text: Center your face */}
        <text
          x="200"
          y="410"
          textAnchor="middle"
          fill="#0F1D2C"
          fontSize="14"
          fontFamily="system-ui, sans-serif"
          fontWeight="500"
          opacity="0.6"
        >
          Center your face
        </text>

        {/* Secondary hints */}
        <text
          x="200"
          y="435"
          textAnchor="middle"
          fill="#0F1D2C"
          fontSize="11"
          fontFamily="system-ui, sans-serif"
          opacity="0.4"
        >
          Good lighting &middot; Neutral expression
        </text>

        {/* Small crosshair at center */}
        <line
          x1="195"
          y1="220"
          x2="205"
          y2="220"
          stroke="#C9A96E"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="200"
          y1="215"
          x2="200"
          y2="225"
          stroke="#C9A96E"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
