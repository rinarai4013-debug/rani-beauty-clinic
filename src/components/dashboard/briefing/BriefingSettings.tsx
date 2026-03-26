'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Send, Loader2, Check, AlertTriangle } from 'lucide-react';

interface BriefingSettingsProps {
  onSendTest: (type: 'daily' | 'weekly' | 'monthly') => void;
}

export default function BriefingSettings({ onSendTest }: BriefingSettingsProps) {
  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('info@ranibeautyclinic.com');
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ type: string; success: boolean; message: string } | null>(null);

  const handleSendTest = async (type: 'daily' | 'weekly' | 'monthly') => {
    setSendingTest(type);
    setTestResult(null);
    try {
      const res = await fetch('/api/dashboard/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-test', type }),
      });
      const data = await res.json();
      setTestResult({
        type,
        success: data.success,
        message: data.success ? `${type} briefing sent successfully` : (data.error || 'Failed to send'),
      });
      onSendTest(type);
    } catch (err) {
      setTestResult({
        type,
        success: false,
        message: err instanceof Error ? err.message : 'Failed to send test briefing',
      });
    } finally {
      setSendingTest(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#0F1D2C] flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#C9A96E]" />
        </div>
        <div>
          <h3 className="font-heading text-rani-navy font-semibold">Briefing Settings</h3>
          <p className="text-xs text-gray-500">Configure automated email briefings</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C9A96E] focus:border-[#C9A96E] outline-none"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Active Briefings</label>

          {/* Daily */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Daily Briefing</p>
              <p className="text-xs text-gray-500">Every day at 6:00 AM PST</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSendTest('daily')}
                disabled={!!sendingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C9A96E] border border-[#C9A96E] rounded-lg hover:bg-[#C9A96E] hover:text-white transition-colors disabled:opacity-50"
              >
                {sendingTest === 'daily' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Test
              </button>
              <button
                onClick={() => setDailyEnabled(!dailyEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${dailyEnabled ? 'bg-[#C9A96E]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${dailyEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Weekly */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Weekly Rollup</p>
              <p className="text-xs text-gray-500">Every Monday at 6:00 AM PST</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSendTest('weekly')}
                disabled={!!sendingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C9A96E] border border-[#C9A96E] rounded-lg hover:bg-[#C9A96E] hover:text-white transition-colors disabled:opacity-50"
              >
                {sendingTest === 'weekly' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Test
              </button>
              <button
                onClick={() => setWeeklyEnabled(!weeklyEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${weeklyEnabled ? 'bg-[#C9A96E]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${weeklyEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* Monthly */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Monthly Summary</p>
              <p className="text-xs text-gray-500">1st of each month at 6:00 AM PST</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSendTest('monthly')}
                disabled={!!sendingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C9A96E] border border-[#C9A96E] rounded-lg hover:bg-[#C9A96E] hover:text-white transition-colors disabled:opacity-50"
              >
                {sendingTest === 'monthly' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Test
              </button>
              <button
                onClick={() => setMonthlyEnabled(!monthlyEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${monthlyEnabled ? 'bg-[#C9A96E]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${monthlyEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              testResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {testResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {testResult.message}
          </motion.div>
        )}

        {/* Schedule info */}
        <div className="bg-[#F8F6F1] rounded-lg p-4 border border-[#E8E3DA]">
          <p className="text-xs font-medium text-[#C9A96E] uppercase tracking-wider mb-2">Cron Schedule</p>
          <code className="text-xs text-gray-600 font-mono block">0 14 * * * (14:00 UTC = 6:00 AM PST)</code>
          <p className="text-xs text-gray-500 mt-2">
            Powered by Vercel Cron. Daily briefings send every day. Weekly rollups send on Mondays. Monthly summaries send on the 1st.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
