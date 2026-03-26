'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const SOURCES = [
  { value: 'google', label: 'Google' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk-in', label: 'Walk-In' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'other', label: 'Other' },
];

const INTERESTS = [
  { value: 'skin-rejuvenation', label: 'Skin Rejuvenation', emoji: '✨' },
  { value: 'hair-removal', label: 'Hair Removal', emoji: '💫' },
  { value: 'body-contouring', label: 'Body Contouring', emoji: '🔥' },
  { value: 'weight-loss', label: 'Weight Loss (GLP-1)', emoji: '💪' },
  { value: 'hormones', label: 'Hormones & HRT', emoji: '🧬' },
  { value: 'vitamins', label: 'Vitamin Injections', emoji: '💉' },
  { value: 'anti-aging', label: 'Anti-Aging', emoji: '🌟' },
  { value: 'consultation', label: 'General Consult', emoji: '📋' },
];

const TIMING = [
  { value: 'asap', label: 'ASAP' },
  { value: '1-2-weeks', label: '1-2 Weeks' },
  { value: 'exploring', label: 'Just Exploring' },
];

const BUDGETS = [
  { value: 'under-200', label: 'Under $200' },
  { value: '200-500', label: '$200-500' },
  { value: '500-1000', label: '$500-1K' },
  { value: '1000+', label: '$1,000+' },
];

export default function AddLeadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [campaign, setCampaign] = useState('');
  const [interest, setInterest] = useState('');
  const [timing, setTiming] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
    return digits;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formatPhone(phone);
    if (cleanPhone.length !== 10) {
      toast.error('Phone number must be 10 digits');
      return;
    }
    setIsSubmitting(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      const res = await fetch('/api/dashboard/entry/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone: cleanPhone, email, source, campaign, interest, timing, budget, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add lead');
      }
      toast.success('Lead added! +25 XP');
      setFullName(''); setPhone(''); setEmail(''); setSource(''); setCampaign('');
      setInterest(''); setTiming(''); setBudget(''); setNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Add New Lead"
      subtitle="Log a prospect from calls, DMs, or walk-ins"
      icon={<UserPlus className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name" required>
          <FormInput placeholder="e.g. Sarah Mitchell" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </FormField>
        <FormField label="Phone" required>
          <FormInput type="tel" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} required />
        </FormField>
      </div>

      <FormField label="Email">
        <FormInput type="email" placeholder="sarah@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Lead Source" required>
          <FormSelect options={SOURCES} placeholder="Select source..." value={source} onChange={e => setSource(e.target.value)} required />
        </FormField>
        <FormField label="Campaign" hint="Optional - ad campaign name">
          <FormInput placeholder="e.g. Spring GLP-1 Promo" value={campaign} onChange={e => setCampaign(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Interest Area" required>
        <FormRadioGroup value={interest} onChange={setInterest} options={INTERESTS} columns={4} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Timing">
          <FormRadioGroup value={timing} onChange={setTiming} options={TIMING} columns={3} />
        </FormField>
        <FormField label="Budget Range">
          <FormRadioGroup value={budget} onChange={setBudget} options={BUDGETS} columns={4} />
        </FormField>
      </div>

      <FormField label="Notes">
        <FormTextarea placeholder="Any details about the lead..." value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormShell>
  );
}
