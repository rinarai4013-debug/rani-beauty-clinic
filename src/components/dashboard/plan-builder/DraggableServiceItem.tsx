'use client';

import { useState, DragEvent } from 'react';
import { GripVertical, X, Minus, Plus, StickyNote, ArrowRightLeft } from 'lucide-react';
import type { SelectedService } from '@/lib/plan-builder/types';

interface DraggableServiceItemProps {
  service: SelectedService;
  index: number;
  onRemove: (id: string) => void;
  onSetQty: (id: string, qty: number) => void;
  onSetNotes: (id: string, notes: string) => void;
  onMoveToPhase: (id: string, phase: 1 | 2 | 3) => void;
}

export default function DraggableServiceItem({
  service,
  index,
  onRemove,
  onSetQty,
  onSetNotes,
  onMoveToPhase,
}: DraggableServiceItemProps) {
  const [showNotes, setShowNotes] = useState(!!service.notes);
  const [showPhaseMenu, setShowPhaseMenu] = useState(false);

  const lineTotal = service.service.price * service.quantity * service.service.sessions;

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData(
      'application/plan-builder-item',
      JSON.stringify({ id: service.id, phase: service.phase, index })
    );
    e.dataTransfer.effectAllowed = 'move';
  }

  const otherPhases = ([1, 2, 3] as const).filter((p) => p !== service.phase);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group bg-white border border-gray-100 rounded-lg p-3 hover:border-[#C9A96E]/30 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />

        {/* Service name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0F1D2C] truncate">
            {service.service.name}
          </p>
          <p className="text-xs text-gray-400">
            ${service.service.price.toLocaleString()} x {service.service.sessions} session{service.service.sessions > 1 ? 's' : ''}
          </p>
        </div>

        {/* Quantity spinner */}
        <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg border border-gray-200">
          <button
            onClick={() => onSetQty(service.id, service.quantity - 1)}
            disabled={service.quantity <= 1}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#0F1D2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-6 text-center text-sm font-semibold text-[#0F1D2C]">
            {service.quantity}
          </span>
          <button
            onClick={() => onSetQty(service.id, service.quantity + 1)}
            disabled={service.quantity >= 10}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#0F1D2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Line total */}
        <span className="text-sm font-bold text-[#0F1D2C] w-20 text-right tabular-nums">
          ${lineTotal.toLocaleString()}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
              showNotes || service.notes
                ? 'text-[#C9A96E] bg-[#C9A96E]/10'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Toggle notes"
          >
            <StickyNote className="h-3.5 w-3.5" />
          </button>

          {/* Move to phase */}
          <div className="relative">
            <button
              onClick={() => setShowPhaseMenu(!showPhaseMenu)}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Move to phase"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
            {showPhaseMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                {otherPhases.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      onMoveToPhase(service.id, p);
                      setShowPhaseMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-[#F8F6F1] transition-colors"
                  >
                    Phase {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onRemove(service.id)}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable notes */}
      {showNotes && (
        <div className="mt-2 pl-6">
          <textarea
            value={service.notes}
            onChange={(e) => onSetNotes(service.id, e.target.value)}
            placeholder="Add notes for this service..."
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] resize-none transition-colors"
          />
        </div>
      )}
    </div>
  );
}
