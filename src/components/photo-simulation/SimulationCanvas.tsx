'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TREATMENT_PRESETS } from '@/lib/photo-simulation/filter-presets';
import { applyFilterChain, FilterStep } from '@/lib/photo-simulation/filters';
import { GripVertical } from 'lucide-react';

interface SimulationCanvasProps {
  photo: File | string;
  selectedPresets: string[];
  intensity: number; // 0-1
}

const MAX_CANVAS_WIDTH = 600;

/**
 * Before/after split-view simulation canvas.
 * Draws the original photo on the left and the filtered version on the right,
 * with a draggable divider.
 */
export default function SimulationCanvas({
  photo,
  selectedPresets,
  intensity,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dividerPos, setDividerPos] = useState(0.5); // 0-1, position of divider
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageRef.current = img;

      // Calculate canvas size respecting max width and container
      const containerWidth = containerRef.current?.clientWidth || MAX_CANVAS_WIDTH;
      const maxWidth = Math.min(containerWidth, MAX_CANVAS_WIDTH);
      const scale = maxWidth / img.width;
      const width = Math.round(img.width * Math.min(scale, 1));
      const height = Math.round(img.height * Math.min(scale, 1));

      setCanvasSize({ width, height });
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    if (typeof photo === 'string') {
      img.src = photo;
    } else {
      const url = URL.createObjectURL(photo);
      img.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [photo]);

  // Draw original on before canvas
  useEffect(() => {
    if (!imageRef.current || canvasSize.width === 0) return;
    const canvas = beforeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.drawImage(imageRef.current, 0, 0, canvasSize.width, canvasSize.height);
  }, [canvasSize]);

  // Apply filters on after canvas
  useEffect(() => {
    if (!imageRef.current || canvasSize.width === 0) return;
    const canvas = afterCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Draw original first
    ctx.drawImage(imageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    // Build filter chain from selected presets, scaled by intensity
    const filterSteps: FilterStep[] = [];
    for (const presetKey of selectedPresets) {
      const preset = TREATMENT_PRESETS[presetKey];
      if (preset) {
        for (const step of preset.filters) {
          filterSteps.push({
            filter: step.filter,
            intensity: step.intensity * intensity,
          });
        }
      }
    }

    if (filterSteps.length > 0) {
      applyFilterChain(ctx, canvasSize.width, canvasSize.height, filterSteps);
    }
  }, [canvasSize, selectedPresets, intensity]);

  // Composite before/after onto display canvas with split
  useEffect(() => {
    if (canvasSize.width === 0) return;
    const display = displayCanvasRef.current;
    const before = beforeCanvasRef.current;
    const after = afterCanvasRef.current;
    if (!display || !before || !after) return;

    const ctx = display.getContext('2d');
    if (!ctx) return;

    display.width = canvasSize.width;
    display.height = canvasSize.height;

    const splitX = Math.round(canvasSize.width * dividerPos);

    // Draw before (left side)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, splitX, canvasSize.height);
    ctx.clip();
    ctx.drawImage(before, 0, 0);
    ctx.restore();

    // Draw after (right side)
    ctx.save();
    ctx.beginPath();
    ctx.rect(splitX, 0, canvasSize.width - splitX, canvasSize.height);
    ctx.clip();
    ctx.drawImage(after, 0, 0);
    ctx.restore();

    // Divider line
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, canvasSize.height);
    ctx.strokeStyle = '#C9A96E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    // Before label
    if (splitX > 50) {
      const beforeMetrics = ctx.measureText('Before');
      ctx.fillStyle = 'rgba(15, 29, 44, 0.6)';
      ctx.fillRect(8, canvasSize.height - 30, beforeMetrics.width + 12, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Before', 14, canvasSize.height - 16);
    }

    // After label
    if (canvasSize.width - splitX > 50) {
      const afterMetrics = ctx.measureText('After');
      ctx.fillStyle = 'rgba(15, 29, 44, 0.6)';
      ctx.fillRect(
        canvasSize.width - afterMetrics.width - 20,
        canvasSize.height - 30,
        afterMetrics.width + 12,
        20,
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(
        'After',
        canvasSize.width - afterMetrics.width - 14,
        canvasSize.height - 16,
      );
    }
  }, [canvasSize, dividerPos, selectedPresets, intensity]);

  // Draggable divider handling
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = displayCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const dividerX = dividerPos;

      // Only start drag if clicking near the divider (within 20px)
      if (Math.abs(x - dividerX) < 0.05) {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    },
    [dividerPos],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const canvas = displayCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      setDividerPos(x);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#F8F6F1] rounded-xl">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#0F1D2C]/50">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden canvases for before/after processing */}
      <canvas ref={beforeCanvasRef} className="hidden" />
      <canvas ref={afterCanvasRef} className="hidden" />

      {/* Visible composite canvas */}
      <div className="relative rounded-xl overflow-hidden shadow-lg border border-[#0F1D2C]/10">
        <canvas
          ref={displayCanvasRef}
          className="w-full h-auto cursor-ew-resize"
          style={{ maxWidth: `${canvasSize.width}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* Draggable divider handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
          style={{ left: `${dividerPos * 100}%` }}
        >
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full
              bg-[#C9A96E] shadow-lg transition-transform
              ${isDragging ? 'scale-110' : 'scale-100'}
            `}
          >
            <GripVertical className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {/* No effects selected hint */}
      {selectedPresets.length === 0 && (
        <p className="text-center text-xs text-[#0F1D2C]/40 mt-2">
          Select treatment effects below to see the simulation
        </p>
      )}
    </div>
  );
}
