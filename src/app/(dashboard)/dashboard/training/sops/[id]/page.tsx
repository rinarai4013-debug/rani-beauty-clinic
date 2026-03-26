'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, FileText, Calendar, AlertCircle, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { getSOPById, SOP_CATEGORIES, SOP_CATEGORY_COLORS } from '@/data/training/sops';

export default function SOPDetailPage() {
  const params = useParams();
  const sopId = params.id as string;
  const sop = getSOPById(sopId);

  if (!sop) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">SOP not found</h2>
        <p className="text-gray-400 mt-1">The SOP &ldquo;{sopId}&rdquo; does not exist.</p>
        <Link
          href="/dashboard/training/sops"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-[#C9A96E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to SOP Library
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back link & actions */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/training/sops"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> SOP Library
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* SOP header */}
      <div className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42] rounded-xl p-8 print:bg-white print:border print:border-gray-300 print:rounded-none">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white print:text-gray-700 print:bg-gray-100"
              style={{ backgroundColor: SOP_CATEGORY_COLORS[sop.category] }}
            >
              {SOP_CATEGORIES[sop.category]}
            </span>
            <h1 className="text-2xl font-bold text-white print:text-black font-['Playfair_Display'] mt-3">
              {sop.title}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 print:text-gray-600">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {sop.steps.length} steps
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Last updated:{' '}
                {new Date(sop.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="text-right print:hidden">
            <p className="text-xs text-gray-500">SOP ID</p>
            <p className="text-sm font-mono text-[#C9A96E]">{sop.id}</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:border-0 print:shadow-none">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 print:bg-white">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#C9A96E]" />
            Procedure Steps
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {sop.steps.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="px-6 py-5 hover:bg-gray-50/50 transition-colors print:hover:bg-white"
            >
              <div className="flex gap-4">
                <div className="shrink-0">
                  <span className="w-8 h-8 rounded-full bg-[#0F1D2C] text-[#C9A96E] flex items-center justify-center text-sm font-bold print:bg-gray-200 print:text-gray-700">
                    {step.step}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {step.description}
                  </p>
                  {step.notes && (
                    <div className="mt-2 flex gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{step.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        <p>Rani Beauty Clinic - Standard Operating Procedure</p>
        <p>{sop.title} | {sop.id} | Last updated: {sop.lastUpdated}</p>
        <p>401 Olympia Ave NE #101, Renton, WA 98056</p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/training/sops"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4" /> All SOPs
        </Link>
        <Link
          href="/dashboard/training"
          className="text-sm text-[#C9A96E] hover:underline"
        >
          Back to Training Center
        </Link>
      </div>
    </div>
  );
}
