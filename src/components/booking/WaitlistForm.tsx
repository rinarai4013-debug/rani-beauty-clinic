'use client';

import { useState } from 'react';
import type { WaitlistEntry } from '@/lib/booking/types';

interface WaitlistFormProps {
  serviceId: string;
  serviceName: string;
  onSubmit: (data: Partial<WaitlistEntry>) => Promise<void>;
  onClose: () => void;
}

export default function WaitlistForm({ serviceId, serviceName, onSubmit, onClose }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    timePreference: [] as string[],
    preferredProviderId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        serviceId,
        serviceName,
        clientId: `client-${Date.now()}`,
        timePreference: formData.timePreference as WaitlistEntry['timePreference'],
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTimePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      timePreference: prev.timePreference.includes(pref)
        ? prev.timePreference.filter(p => p !== pref)
        : [...prev.timePreference, pref],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-[#0F1D2C] font-[family-name:var(--font-heading)] mb-2">
          Join the Waitlist
        </h2>
        <p className="text-sm text-[#6B7280] mb-6">
          We will notify you as soon as a spot opens for {serviceName}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            required
            value={formData.clientName}
            onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4DF] focus:border-[#C9A96E] focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={formData.clientEmail}
            onChange={e => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4DF] focus:border-[#C9A96E] focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Phone"
            required
            value={formData.clientPhone}
            onChange={e => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#E8E4DF] focus:border-[#C9A96E] focus:outline-none"
          />

          <div>
            <label className="block text-sm font-medium text-[#0F1D2C] mb-2">Preferred Times</label>
            <div className="flex flex-wrap gap-2">
              {['morning', 'afternoon', 'evening', 'weekend'].map(pref => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => toggleTimePreference(pref)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.timePreference.includes(pref)
                      ? 'bg-[#C9A96E] text-white'
                      : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#E8E4DF]'
                  }`}
                >
                  {pref.charAt(0).toUpperCase() + pref.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-[#E8E4DF] text-[#6B7280] font-medium hover:border-[#0F1D2C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-[#C9A96E] text-white font-bold hover:bg-[#b89558] disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Join Waitlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
