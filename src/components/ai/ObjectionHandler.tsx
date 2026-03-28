'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import type { CopilotObjectionHandler } from '@/types/ai-treatment';

interface ObjectionHandlerProps {
  handlers: CopilotObjectionHandler[];
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  price: { label: 'Price', color: 'bg-green-50 text-green-700 border-green-200' },
  pain: { label: 'Pain', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  downtime: { label: 'Downtime', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  think_about_it: { label: 'Hesitation', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  competitor: { label: 'Competitor', color: 'bg-red-50 text-red-700 border-red-200' },
  skepticism: { label: 'Skepticism', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  timing: { label: 'Timing', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

export default function ObjectionHandler({ handlers }: ObjectionHandlerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-2">
      {handlers.map((handler, i) => {
        const cat = CATEGORY_LABELS[handler.category] || { label: handler.category, color: 'bg-gray-50 text-gray-700 border-gray-200' };
        const isExpanded = expanded === `${i}`;
        const id = `handler-${i}`;

        return (
          <div key={i} className="border border-[#F8F6F1] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : `${i}`)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F8F6F1]/30 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <MessageCircle className="w-4 h-4 text-[#C9A96E] flex-shrink-0" />
                <div>
                  <span className="text-sm font-montserrat font-medium text-[#0F1D2C]">
                    &ldquo;{handler.objection}&rdquo;
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
                    {cat.label}
                  </span>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-[#0F1D2C]/40" /> : <ChevronDown className="w-4 h-4 text-[#0F1D2C]/40" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <div className="bg-[#C9A96E]/5 rounded-lg p-3 relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-montserrat text-[#C9A96E] font-semibold uppercase">Response ({handler.technique})</span>
                        <button
                          onClick={() => handleCopy(handler.response, id)}
                          className="text-[#0F1D2C]/30 hover:text-[#C9A96E] transition-colors"
                          title="Copy response"
                        >
                          {copied === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-sm font-montserrat text-[#0F1D2C]/70 italic">{handler.response}</p>
                    </div>
                    <div className="bg-[#F8F6F1]/50 rounded-lg p-3">
                      <span className="text-xs font-montserrat text-[#0F1D2C]/50 font-semibold uppercase">Follow-Up</span>
                      <p className="text-sm font-montserrat text-[#0F1D2C]/70 mt-1">{handler.followUp}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
