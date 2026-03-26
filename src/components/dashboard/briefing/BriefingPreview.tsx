'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Loader2, RefreshCw, Mail, FileText } from 'lucide-react';

interface BriefingPreviewProps {
  type: 'daily' | 'weekly' | 'monthly';
}

export default function BriefingPreview({ type }: BriefingPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/briefing?action=preview&type=${type}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHtml(data.html);
      setSubject(data.subject);
      setGeneratedAt(data.generatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F1D2C] flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div>
            <h3 className="font-heading text-rani-navy font-semibold capitalize">{type} Briefing Preview</h3>
            {generatedAt && (
              <p className="text-xs text-gray-500">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {html && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden mr-2">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'preview' ? 'bg-[#0F1D2C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('source')}
                className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'source' ? 'bg-[#0F1D2C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                Source
              </button>
            </div>
          )}
          <button
            onClick={loadPreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A96E] text-white text-sm font-medium rounded-lg hover:bg-[#B8944F] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {html ? 'Refresh' : 'Generate Preview'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!html && !loading && !error && (
          <div className="text-center py-16 text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Click &quot;Generate Preview&quot; to see the email</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#C9A96E] animate-spin" />
            <p className="text-sm text-gray-500">Generating {type} briefing...</p>
          </div>
        )}

        {html && !loading && (
          <div>
            {/* Subject line */}
            {subject && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Subject</p>
                <p className="text-sm font-medium text-gray-900">{subject}</p>
              </div>
            )}

            {/* Email preview */}
            {viewMode === 'preview' ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-[#F8F6F1]">
                <iframe
                  srcDoc={html}
                  className="w-full border-0"
                  style={{ height: '800px' }}
                  title={`${type} briefing preview`}
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <pre className="p-4 text-xs text-gray-700 bg-gray-50 overflow-auto max-h-[800px] whitespace-pre-wrap">
                  {html}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
