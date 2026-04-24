'use client';

/**
 * SignaturePad — Canvas-based e-signature capture
 *
 * Designed for in-clinic iPad use during Mastermind consultations.
 * Uses quadratic bezier curve interpolation for smooth, natural strokes.
 * Exports signature as base64 PNG data URL.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';

interface SignaturePadProps {
  onSign: (_dataUrl: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  lineColor?: string;
  lineWidth?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export default function SignaturePad({
  onSign,
  onClear,
  height = 200,
  lineColor = '#1a1a2e',
  lineWidth = 2.5,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const points = useRef<Point[]>([]);
  const strokeHistory = useRef<ImageData[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height });

  // ── Resize observer for responsive width ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const newWidth = Math.floor(rect.width);
      setCanvasSize({ width: newWidth, height });

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = newWidth * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth;
        }

        // Redraw last state if it exists
        if (strokeHistory.current.length > 0) {
          const lastState = strokeHistory.current[strokeHistory.current.length - 1];
          ctx?.putImageData(lastState, 0, 0);
        }
      }
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    updateSize();

    return () => observer.disconnect();
  }, [height, lineColor, lineWidth]);

  // ── Coordinate extraction (mouse + touch) ──
  const getPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        time: Date.now(),
      };
    },
    []
  );

  // ── Save canvas state for undo ──
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    strokeHistory.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    // Limit history to 50 strokes
    if (strokeHistory.current.length > 50) {
      strokeHistory.current.shift();
    }
  }, []);

  // ── Drawing with quadratic bezier interpolation ──
  const drawSmoothLine = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const pts = points.current;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (pts.length === 2) {
        // Just two points — draw a line
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        // Three or more points — use quadratic bezier curves
        ctx.moveTo(pts[0].x, pts[0].y);

        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }

        // Draw to the last point
        const last = pts[pts.length - 1];
        const secondLast = pts[pts.length - 2];
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
      }

      ctx.stroke();
    },
    [lineColor, lineWidth]
  );

  // ── Start stroke ──
  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      saveState();
      isDrawing.current = true;
      points.current = [getPoint(e)];
    },
    [getPoint, saveState]
  );

  // ── Continue stroke ──
  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      points.current.push(getPoint(e));

      // Clear and redraw the current stroke from the last saved state
      if (strokeHistory.current.length > 0) {
        const lastState = strokeHistory.current[strokeHistory.current.length - 1];
        ctx.putImageData(lastState, 0, 0);
      }

      // Scale context back after putImageData resets it
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      drawSmoothLine(ctx);
      ctx.restore();
    },
    [getPoint, drawSmoothLine]
  );

  // ── End stroke ──
  const handleEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Finalize the stroke onto the canvas
      if (strokeHistory.current.length > 0) {
        const lastState = strokeHistory.current[strokeHistory.current.length - 1];
        ctx.putImageData(lastState, 0, 0);
      }
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      drawSmoothLine(ctx);
      ctx.restore();

      // Save the completed stroke state
      strokeHistory.current[strokeHistory.current.length - 1] = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      points.current = [];
      setHasSignature(true);

      // Export and notify parent
      // Create a clean export canvas without DPR scaling artifacts
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasSize.width;
      exportCanvas.height = canvasSize.height;
      const exportCtx = exportCanvas.getContext('2d');
      if (exportCtx) {
        exportCtx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          0,
          canvasSize.width,
          canvasSize.height
        );
        onSign(exportCanvas.toDataURL('image/png'));
      }
    },
    [drawSmoothLine, onSign, canvasSize]
  );

  // ── Clear ──
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistory.current = [];
    points.current = [];
    setHasSignature(false);
    onClear?.();
  }, [onClear]);

  // ── Undo ──
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Remove the current stroke's saved state
    if (strokeHistory.current.length > 0) {
      strokeHistory.current.pop();
    }

    if (strokeHistory.current.length > 0) {
      const prevState = strokeHistory.current[strokeHistory.current.length - 1];
      ctx.putImageData(prevState, 0, 0);
      // Re-export
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasSize.width;
      exportCanvas.height = canvasSize.height;
      const exportCtx = exportCanvas.getContext('2d');
      if (exportCtx) {
        exportCtx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          0,
          canvasSize.width,
          canvasSize.height
        );
        onSign(exportCanvas.toDataURL('image/png'));
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onClear?.();
    }
  }, [canvasSize, onSign, onClear]);

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {/* Canvas */}
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          border: '2px solid #C9A96E',
          backgroundColor: '#F8F6F1',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
            touchAction: 'none', // Prevents scroll/zoom on iPad
            cursor: 'crosshair',
            display: 'block',
          }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Signature line */}
        <div
          className="absolute bottom-10 left-6 right-6"
          style={{ borderBottom: '1px solid #C9A96E', opacity: 0.5 }}
        />
        <p
          className="absolute bottom-3 left-0 right-0 text-center text-xs tracking-wider uppercase"
          style={{ color: '#C9A96E', fontFamily: 'Montserrat, sans-serif' }}
        >
          Sign Above
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!hasSignature}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: '#0F1D2C',
              backgroundColor: 'transparent',
              border: '1px solid #C9A96E',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSignature}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              color: '#0F1D2C',
              backgroundColor: 'transparent',
              border: '1px solid #C9A96E',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Clear
          </button>
        </div>
        {hasSignature && (
          <span
            className="text-xs"
            style={{ color: '#C9A96E', fontFamily: 'Montserrat, sans-serif' }}
          >
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
