'use client';

import { useState, DragEvent } from 'react';
import { Layers } from 'lucide-react';
import type { PlanPhase } from '@/lib/plan-builder/types';
import DraggableServiceItem from './DraggableServiceItem';

interface PhaseDropZoneProps {
  phase: PlanPhase;
  onRemove: (_id: string) => void;
  onSetQty: (_id: string, _qty: number) => void;
  onSetNotes: (_id: string, _notes: string) => void;
  onMoveToPhase: (_id: string, _phase: 1 | 2 | 3) => void;
  onReorder: (_phase: 1 | 2 | 3, _fromIndex: number, _toIndex: number) => void;
}

export default function PhaseDropZone({
  phase,
  onRemove,
  onSetQty,
  onSetNotes,
  onMoveToPhase,
  onReorder,
}: PhaseDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const phaseSubtotal = phase.services.reduce(
    (sum, s) => sum + s.service.price * s.quantity * s.service.sessions,
    0
  );

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    // Only set false if we actually leave the container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);

    const raw = e.dataTransfer.getData('application/plan-builder-item');
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as { id: string; phase: number; index: number };

      if (data.phase === phase.id) {
        // Reorder within same phase - find drop target index
        const dropTarget = (e.target as HTMLElement).closest('[data-service-index]');
        const toIndex = dropTarget
          ? parseInt(dropTarget.getAttribute('data-service-index') || '0', 10)
          : phase.services.length - 1;
        if (data.index !== toIndex) {
          onReorder(phase.id, data.index, toIndex);
        }
      } else {
        // Move to this phase
        onMoveToPhase(data.id, phase.id);
      }
    } catch {
      // Invalid drag data
    }
  }

  const phaseColors: Record<number, string> = {
    1: 'border-blue-200 bg-blue-50/30',
    2: 'border-amber-200 bg-amber-50/30',
    3: 'border-green-200 bg-green-50/30',
  };

  const phaseBadgeColors: Record<number, string> = {
    1: 'bg-blue-100 text-blue-700',
    2: 'bg-amber-100 text-amber-700',
    3: 'bg-green-100 text-green-700',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed p-4 transition-all ${
        isDragOver
          ? 'border-[#C9A96E] bg-[#C9A96E]/5 scale-[1.01]'
          : phaseColors[phase.id] || 'border-gray-200 bg-gray-50/30'
      }`}
    >
      {/* Phase header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-md text-xs font-bold ${
              phaseBadgeColors[phase.id] || 'bg-gray-100 text-gray-700'
            }`}
          >
            Phase {phase.id}
          </span>
          <h3 className="text-sm font-semibold text-[#0F1D2C]">{phase.label}</h3>
        </div>
        {phaseSubtotal > 0 && (
          <span className="text-sm font-bold text-[#0F1D2C] tabular-nums">
            ${phaseSubtotal.toLocaleString()}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">{phase.description}</p>

      {/* Service list */}
      {phase.services.length > 0 ? (
        <div className="space-y-2">
          {phase.services.map((svc, idx) => (
            <div key={svc.id} data-service-index={idx}>
              <DraggableServiceItem
                service={svc}
                index={idx}
                onRemove={onRemove}
                onSetQty={onSetQty}
                onSetNotes={onSetNotes}
                onMoveToPhase={onMoveToPhase}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <Layers className="h-6 w-6 mb-2 opacity-40" />
          <p className="text-xs text-center">
            Drag services here or click + from catalog
          </p>
        </div>
      )}
    </div>
  );
}
