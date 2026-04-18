'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Shield,
  TrendingUp,
  Repeat,
  Zap,
  Anchor,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import type { PlanPhase, GeneratedPackage, BuilderClient } from '@/lib/plan-builder/types';
import { generateProviderNotes, type ProviderNotes as ProviderNotesType } from '@/lib/plan-builder/provider-notes';

interface ProviderNotesProps {
  phases: [PlanPhase, PlanPhase, PlanPhase];
  client: BuilderClient | null;
  packages: GeneratedPackage[];
}

export default function ProviderNotes({ phases, client, packages }: ProviderNotesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalServices = phases.reduce((sum, p) => sum + p.services.length, 0);
  const notes = useMemo<ProviderNotesType | null>(() => {
    if (totalServices === 0) return null;
    return generateProviderNotes(phases, client, packages);
  }, [phases, client, packages, totalServices]);

  if (!notes) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0F1D2C] flex items-center justify-center">
            <Target className="h-3.5 w-3.5 text-[#C9A96E]" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-[#0F1D2C]">Provider Notes</h3>
            <p className="text-[10px] text-gray-400">Consultation strategy</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Consult Angle */}
              <NoteSection
                icon={<Target className="h-3.5 w-3.5" />}
                title="Consultation Angle"
                color="text-[#C9A96E]"
                bgColor="bg-[#C9A96E]/10"
              >
                <p className="text-xs text-gray-600 leading-relaxed">{notes.consultAngle}</p>
              </NoteSection>

              {/* Quick Win + Anchor — compact row */}
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start gap-2 p-2.5 bg-emerald-50 rounded-lg">
                  <Zap className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Quick Win</p>
                    <p className="text-xs text-gray-600 mt-0.5">{notes.quickWinService}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg">
                  <Anchor className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Anchor Service</p>
                    <p className="text-xs text-gray-600 mt-0.5">{notes.anchorService}</p>
                  </div>
                </div>
              </div>

              {/* Likely Objections */}
              <NoteSection
                icon={<Shield className="h-3.5 w-3.5" />}
                title="Likely Objections"
                color="text-amber-600"
                bgColor="bg-amber-50"
              >
                <div className="space-y-3">
                  {notes.likelyObjections.map((obj, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-[#0F1D2C] mb-1">
                        &ldquo;{obj.objection}&rdquo;
                      </p>
                      <div className="flex items-start gap-1.5">
                        <ArrowRight className="h-3 w-3 text-rani-gold-accessible mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-gray-500 leading-relaxed">{obj.response}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </NoteSection>

              {/* High Converting Package */}
              <NoteSection
                icon={<DollarSign className="h-3.5 w-3.5" />}
                title="Package Strategy"
                color="text-rani-gold-accessible"
                bgColor="bg-[#C9A96E]/10"
              >
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{notes.highConvertingPackage}</p>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">If they hesitate:</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{notes.entryOfferFallback}</p>
                </div>
              </NoteSection>

              {/* Upsell Path */}
              <NoteSection
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                title="Upsell Path"
                color="text-purple-600"
                bgColor="bg-purple-50"
              >
                <p className="text-xs text-gray-600 leading-relaxed">{notes.upsellPath}</p>
              </NoteSection>

              {/* Maintenance Pathway */}
              <NoteSection
                icon={<Repeat className="h-3.5 w-3.5" />}
                title="Maintenance Pathway"
                color="text-teal-600"
                bgColor="bg-teal-50"
              >
                <p className="text-xs text-gray-600 leading-relaxed">{notes.maintenancePathway}</p>
              </NoteSection>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section Wrapper ────────────────────────────────────────────────

function NoteSection({
  icon,
  title,
  color,
  bgColor,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${bgColor} ${color}`}>
          {icon}
        </div>
        <h4 className="text-xs font-semibold text-[#0F1D2C]">{title}</h4>
      </div>
      {children}
    </div>
  );
}
