'use client';

import { useState, FormEvent } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CONCERN_OPTIONS = [
  { value: 'aging-skin', label: 'Fine Lines & Wrinkles' },
  { value: 'hyperpigmentation', label: 'Uneven Tone / Hyperpigmentation' },
  { value: 'dull-skin', label: 'Dullness' },
  { value: 'acne', label: 'Acne / Scarring' },
  { value: 'skin-laxity', label: 'Skin Laxity / Sagging' },
  { value: 'large-pores', label: 'Large Pores / Texture' },
  { value: 'sun-damage', label: 'Sun Damage' },
  { value: 'unwanted-hair', label: 'Unwanted Hair' },
  { value: 'body-contouring', label: 'Body Contouring' },
];

const SKIN_TYPES = ['normal', 'dry', 'oily', 'combination', 'sensitive'] as const;

const BUDGET_OPTIONS = [
  { value: 'starter', label: 'Under $1,000' },
  { value: 'moderate', label: '$1,000 - $2,500' },
  { value: 'premium', label: '$2,500 - $5,000' },
  { value: 'investment', label: '$5,000+' },
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'ASAP' },
  { value: 'event', label: 'Upcoming Event' },
  { value: 'gradual', label: 'Gradual Improvement' },
  { value: 'ongoing', label: 'Ongoing Maintenance' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export default function NewConsultationModal({ open, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');
  const [skinType, setSkinType] = useState<string>('combination');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [budget, setBudget] = useState('moderate');
  const [timeline, setTimeline] = useState('gradual');
  const [previousTreatments, setPreviousTreatments] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const toggleConcern = (c: string) => {
    setConcerns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    if (concerns.length === 0) {
      setError('Select at least one concern');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append(
        'data',
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          age: age || undefined,
          gender,
          skinType,
          concerns,
          goals: concerns.map(c => {
            if (c === 'aging-skin') return 'anti-aging';
            if (c === 'hyperpigmentation') return 'pigment-correction';
            if (c === 'dull-skin') return 'brightening';
            if (c === 'acne') return 'acne-treatment';
            if (c === 'skin-laxity') return 'skin-tightening';
            return c;
          }),
          budget,
          timeline,
          previousTreatments: previousTreatments
            ? previousTreatments.split(',').map((t) => t.trim())
            : [],
          medicalHistory: medicalNotes || 'None',
          medications: 'None',
          allergies: 'None',
        })
      );

      const res = await fetch('/api/consultation/submit', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');

      const sessionId = json.data.sessionId;

      // Auto-generate the plan
      await fetch('/api/mastermind/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      // Auto-generate simulation
      await fetch('/api/mastermind/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      onCreated(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto"
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#E8E4DF]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C9A96E]" />
                  <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C]">
                    New Consultation
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-[#0F1D2C]/40" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Client Info */}
                <fieldset className="space-y-3">
                  <legend className="font-body text-xs font-semibold text-[#0F1D2C]/50 uppercase tracking-wider mb-2">
                    Client Info
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="First Name *"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Last Name *"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      min={18}
                      max={100}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                    />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] focus:outline-none focus:border-[#C9A96E] transition-colors bg-white"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non-binary">Non-binary</option>
                    </select>
                    <select
                      value={skinType}
                      onChange={(e) => setSkinType(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] focus:outline-none focus:border-[#C9A96E] transition-colors bg-white"
                    >
                      {SKIN_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t[0].toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* Concerns */}
                <fieldset className="space-y-2">
                  <legend className="font-body text-xs font-semibold text-[#0F1D2C]/50 uppercase tracking-wider mb-2">
                    Concerns *
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {CONCERN_OPTIONS.map((c) => {
                      const selected = concerns.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => toggleConcern(c.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
                            selected
                              ? 'bg-[#C9A96E] text-white'
                              : 'bg-[#F8F6F1] text-[#0F1D2C]/60 hover:bg-[#C9A96E]/10 hover:text-[#C9A96E]'
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Budget & Timeline */}
                <fieldset className="space-y-3">
                  <legend className="font-body text-xs font-semibold text-[#0F1D2C]/50 uppercase tracking-wider mb-2">
                    Budget & Timeline
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] focus:outline-none focus:border-[#C9A96E] transition-colors bg-white"
                    >
                      {BUDGET_OPTIONS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] focus:outline-none focus:border-[#C9A96E] transition-colors bg-white"
                    >
                      {TIMELINE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* History */}
                <fieldset className="space-y-3">
                  <legend className="font-body text-xs font-semibold text-[#0F1D2C]/50 uppercase tracking-wider mb-2">
                    History (Optional)
                  </legend>
                  <input
                    type="text"
                    placeholder="Previous treatments (e.g. botox, hydrafacial)"
                    value={previousTreatments}
                    onChange={(e) => setPreviousTreatments(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                  />
                  <textarea
                    placeholder="Medical notes, allergies, medications..."
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DF] text-sm font-body text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:border-[#C9A96E] transition-colors resize-none"
                  />
                </fieldset>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-[#E8E4DF] space-y-3">
                {error && (
                  <p className="font-body text-xs text-red-500 text-center">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0F1D2C] text-white font-body text-sm font-semibold hover:bg-[#0F1D2C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Session & Running Aura Scan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Start Consultation
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
