'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface HistoryEntry {
  id: string;
  type: string;
  status: string;
  message: string;
  date: string;
}

export default function BriefingHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/briefing?action=history');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const typeColors: Record<string, string> = {
    daily: 'bg-blue-100 text-blue-700',
    weekly: 'bg-purple-100 text-purple-700',
    monthly: 'bg-amber-100 text-amber-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0F1D2C] flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div>
            <h3 className="font-heading text-rani-navy font-semibold">Briefing History</h3>
            <p className="text-xs text-gray-500">Last 30 briefings sent</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {loading && (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 mx-auto mb-2 text-[#C9A96E] animate-spin" />
            <p className="text-sm text-gray-500">Loading history...</p>
          </div>
        )}

        {error && (
          <div className="p-4 m-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No briefings sent yet</p>
          </div>
        )}

        {history.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {entry.status === 'sent' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-gray-900 truncate">{entry.message}</p>
                <p className="text-xs text-gray-500">
                  {entry.date ? new Date(entry.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }) : 'Unknown date'}
                </p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${typeColors[entry.type] || 'bg-gray-100 text-gray-600'}`}>
              {entry.type}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
