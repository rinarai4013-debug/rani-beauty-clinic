'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, FileText, Shield, Stethoscope } from 'lucide-react';
import type { TreatmentProtocol } from '@/types/ai-treatment';

interface ProtocolViewerProps {
  protocol: TreatmentProtocol;
}

export default function ProtocolViewer({ protocol }: ProtocolViewerProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const Section = ({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) => {
    const isOpen = openSections.has(id);
    return (
      <div className="border-b border-[#F8F6F1] last:border-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#F8F6F1]/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#C9A96E]" />
            <span className="font-montserrat font-semibold text-[#0F1D2C]">{title}</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#0F1D2C]/40" /> : <ChevronDown className="w-4 h-4 text-[#0F1D2C]/40" />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#F8F6F1] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d40] p-6">
        <div className="flex items-center gap-2 text-[#C9A96E] text-xs font-montserrat mb-1">
          <span className="uppercase tracking-wide">{protocol.category.replace(/_/g, ' ')}</span>
          <span>v{protocol.version}</span>
        </div>
        <h2 className="text-2xl font-playfair text-white">{protocol.name}</h2>
        <div className="flex gap-4 mt-3 text-sm text-white/70 font-montserrat">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{protocol.technique.duration} min</span>
          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />${protocol.pricing.basePrice}{protocol.pricing.priceRange ? `–$${protocol.pricing.priceRange.max}` : ''}</span>
        </div>
      </div>

      {/* Sections */}
      <Section id="overview" title="Indications" icon={FileText}>
        <ul className="space-y-1">
          {protocol.indication.map((ind, i) => (
            <li key={i} className="flex items-start gap-2 text-sm font-montserrat text-[#0F1D2C]/70">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              {ind}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="contraindications" title="Contraindications" icon={Shield}>
        <div className="mb-3">
          <h5 className="text-xs font-montserrat font-semibold text-red-600 mb-2 uppercase">Absolute</h5>
          <ul className="space-y-1">
            {protocol.contraindications.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-montserrat text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        {protocol.relativeContraindications.length > 0 && (
          <div>
            <h5 className="text-xs font-montserrat font-semibold text-amber-600 mb-2 uppercase">Relative / Caution</h5>
            <ul className="space-y-1">
              {protocol.relativeContraindications.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-montserrat text-amber-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="precare" title="Pre-Care Instructions" icon={FileText}>
        <ol className="space-y-2">
          {protocol.preCare.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm font-montserrat text-[#0F1D2C]/70">
              <span className="text-[#C9A96E] font-semibold">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="technique" title="Technique" icon={Stethoscope}>
        <ol className="space-y-3 mb-4">
          {protocol.technique.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm font-montserrat text-[#0F1D2C]/70">
              <span className="bg-[#C9A96E]/10 text-[#C9A96E] w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        {protocol.technique.keyTechniques.length > 0 && (
          <div className="bg-[#F8F6F1]/50 rounded-lg p-3">
            <h5 className="text-xs font-montserrat font-semibold text-[#0F1D2C] mb-2">Clinical Pearls</h5>
            <ul className="space-y-1">
              {protocol.technique.keyTechniques.map((t, i) => (
                <li key={i} className="text-xs font-montserrat text-[#0F1D2C]/60">• {t}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="postcare" title="Post-Care Instructions" icon={CheckCircle}>
        <ol className="space-y-2">
          {protocol.postCare.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm font-montserrat text-[#0F1D2C]/70">
              <span className="text-[#C9A96E] font-semibold">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Section>

      <Section id="results" title="Expected Results" icon={FileText}>
        <div className="space-y-3 text-sm font-montserrat">
          <div><strong className="text-[#0F1D2C]">Immediately:</strong> <span className="text-[#0F1D2C]/70">{protocol.expectedResults.immediatePost}</span></div>
          <div><strong className="text-[#0F1D2C]">1 Week:</strong> <span className="text-[#0F1D2C]/70">{protocol.expectedResults.oneWeek}</span></div>
          <div><strong className="text-[#0F1D2C]">1 Month:</strong> <span className="text-[#0F1D2C]/70">{protocol.expectedResults.oneMonth}</span></div>
          <div><strong className="text-[#0F1D2C]">3 Months:</strong> <span className="text-[#0F1D2C]/70">{protocol.expectedResults.threeMonths}</span></div>
          <div className="bg-[#C9A96E]/5 rounded-lg p-3 mt-3">
            <div><strong>Onset:</strong> {protocol.expectedResults.onsetTime}</div>
            <div><strong>Peak:</strong> {protocol.expectedResults.peakTime}</div>
            <div><strong>Duration:</strong> {protocol.expectedResults.duration}</div>
          </div>
        </div>
      </Section>

      {/* Pricing footer */}
      <div className="p-4 bg-[#F8F6F1]/30 border-t border-[#F8F6F1]">
        <div className="flex items-center justify-between text-sm font-montserrat">
          <div>
            <span className="text-[#0F1D2C]/50">ICD-10: </span>
            <span className="text-[#0F1D2C]/70">{protocol.icd10Codes.join(', ')}</span>
          </div>
          <div className="text-[#0F1D2C]/50">Last updated: {protocol.lastUpdated}</div>
        </div>
      </div>
    </div>
  );
}
