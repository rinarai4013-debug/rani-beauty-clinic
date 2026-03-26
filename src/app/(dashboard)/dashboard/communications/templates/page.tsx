'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { TemplateLibrary } from '@/components/dashboard/communications';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useTemplates } from '@/hooks/useDashboardData';
import type { MessageTemplate } from '@/types/communications';

export default function TemplatesPage() {
  const { data, isLoading, error, mutate } = useTemplates();
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  const templateData = data as { templates: MessageTemplate[] } | undefined;
  const templates = templateData?.templates ?? [];

  const handleEdit = useCallback((id: string) => {
    // In a full implementation, this would open an edit modal
    console.log('Edit template:', id);
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      await fetch('/api/dashboard/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', templateId: id }),
      });
      mutate();
    } catch {
      // Error handling
    }
  }, [mutate]);

  return (
    <DashboardErrorBoundary pageName="Templates">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Template Library
          </h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Browse, create, and manage message templates
          </p>
        </div>

        {error ? (
          <InlineError message="Failed to load templates" onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-rani-border p-4">
                <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-36 mb-2" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <TemplateLibrary
            templates={templates}
            onEdit={handleEdit}
            onPreview={setPreviewTemplate}
            onCreateNew={() => {}}
            onDuplicate={handleDuplicate}
          />
        )}

        {/* Preview Modal */}
        <AnimatePresence>
          {previewTemplate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
              onClick={() => setPreviewTemplate(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl border border-rani-border p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-body font-semibold text-rani-navy">{previewTemplate.name}</h3>
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-rani-muted" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-body text-rani-muted">
                    <span className="capitalize">{previewTemplate.category.replace('_', ' ')}</span>
                    <span className="text-rani-border">|</span>
                    <span>{previewTemplate.channel === 'both' ? 'SMS + Email' : previewTemplate.channel.toUpperCase()}</span>
                  </div>
                  {previewTemplate.subject && (
                    <div>
                      <label className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Subject</label>
                      <p className="text-sm font-body text-rani-text">{previewTemplate.subject}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Body</label>
                    <div className="mt-1 p-3 rounded-lg bg-gray-50 border border-rani-border">
                      <p className="text-sm font-body text-rani-text whitespace-pre-wrap">{previewTemplate.body}</p>
                    </div>
                  </div>
                  {previewTemplate.variables.length > 0 && (
                    <div>
                      <label className="text-[10px] font-body font-semibold uppercase tracking-wider text-rani-muted">Variables</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {previewTemplate.variables.map(v => (
                          <span key={v} className="px-2 py-0.5 rounded text-[10px] font-body font-medium bg-rani-gold/10 text-rani-navy">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardErrorBoundary>
  );
}
