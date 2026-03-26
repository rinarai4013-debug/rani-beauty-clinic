'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Check, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import type { ConsentTemplate, SignedConsent } from '@/types/compliance';

interface ConsentBuilderProps {
  templates: ConsentTemplate[];
  recentConsents: SignedConsent[];
}

export default function ConsentBuilder({ templates, recentConsents }: ConsentBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ConsentTemplate | null>(null);
  const [search, setSearch] = useState('');
  const [patientName, setPatientName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const filteredTemplates = templates.filter((t) =>
    t.treatmentName.toLowerCase().includes(search.toLowerCase()) ||
    t.treatmentCategory.toLowerCase().includes(search.toLowerCase())
  );

  const categoryGroups = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.treatmentCategory]) acc[t.treatmentCategory] = [];
    acc[t.treatmentCategory].push(t);
    return acc;
  }, {} as Record<string, ConsentTemplate[]>);

  const categoryLabels: Record<string, string> = {
    injectable: 'Injectables',
    laser: 'Laser & Energy',
    skin: 'Skin Treatments',
    wellness: 'Wellness',
    body: 'Body',
    photography: 'Photography',
    consultation: 'Consultation',
  };

  // Canvas drawing handlers
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0F1D2C';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rani-gold/10 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-rani-gold" />
          </div>
          <div>
            <h2 className="text-lg font-body font-bold text-rani-navy">Consent Builder</h2>
            <p className="text-xs font-body text-rani-muted">
              {templates.length} consent templates available
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border overflow-hidden">
          <div className="p-4 border-b border-rani-border/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rani-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search consents..."
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-rani-cream/60 border border-rani-border/50 text-sm font-body text-rani-navy placeholder:text-rani-muted/50 focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
              />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {Object.entries(categoryGroups).map(([category, templates]) => (
              <div key={category}>
                <div className="px-4 py-2 bg-rani-cream/40">
                  <h3 className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">
                    {categoryLabels[category] || category}
                  </h3>
                </div>
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left px-4 py-3 text-sm font-body transition-colors border-b border-rani-border/10 ${
                      selectedTemplate?.id === t.id
                        ? 'bg-rani-gold/10 text-rani-navy font-medium'
                        : 'text-rani-text hover:bg-rani-cream/30'
                    }`}
                  >
                    {t.treatmentName}
                    <span className="text-[10px] text-rani-muted ml-2">v{t.version}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Consent Form */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedTemplate ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-8 text-center">
              <FileSignature className="w-10 h-10 text-rani-muted mx-auto mb-3" />
              <p className="text-sm font-body text-rani-muted">Select a consent template to begin</p>
            </div>
          ) : (
            <>
              {/* Patient Info */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy mb-3">
                  {selectedTemplate.treatmentName} - Informed Consent
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-body font-medium text-rani-muted block mb-1">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-body font-medium text-rani-muted block mb-1">Provider Name</label>
                    <input
                      type="text"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30"
                    />
                  </div>
                </div>
              </div>

              {/* Risks & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                  <h4 className="text-xs font-body font-semibold uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Risks
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTemplate.risks.map((risk, i) => (
                      <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                  <h4 className="text-xs font-body font-semibold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Benefits
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTemplate.benefits.map((benefit, i) => (
                      <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Contraindications & Aftercare */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                  <h4 className="text-xs font-body font-semibold uppercase tracking-wider text-amber-600 mb-3">
                    Contraindications
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTemplate.contraindications.map((item, i) => (
                      <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                  <h4 className="text-xs font-body font-semibold uppercase tracking-wider text-blue-600 mb-3">
                    Aftercare Instructions
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedTemplate.aftercare.map((item, i) => (
                      <li key={i} className="text-xs font-body text-rani-text flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                <label className="text-xs font-body font-medium text-rani-muted block mb-2">Additional Notes</label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-rani-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-rani-gold/30 resize-none"
                  placeholder="Any additional notes for this patient..."
                />
              </div>

              {/* Signature */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
                <h4 className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted mb-3">
                  Patient Signature
                </h4>
                <div className="border border-rani-border rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    className="w-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={clearSignature}
                    className="text-xs font-body text-rani-muted hover:text-red-500 transition-colors"
                  >
                    Clear Signature
                  </button>
                  <button
                    onClick={() => setSigned(true)}
                    className="px-4 py-2 bg-rani-navy text-white rounded-lg text-sm font-body font-medium hover:bg-[#1a2d42] transition-colors"
                  >
                    Save Consent
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
