'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { FormShell, FormField, FormSelect, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const STAFF_MEMBERS = [
  { value: 'rina', label: 'Rina (CEO / Lead Provider)' },
  { value: 'mom', label: 'Mom (Provider)' },
  { value: 'front-desk', label: 'Front Desk' },
];

const NOTE_CATEGORIES = [
  { value: 'performance', label: 'Performance', emoji: '📈' },
  { value: 'attendance', label: 'Attendance', emoji: '📅' },
  { value: 'training', label: 'Training', emoji: '📚' },
  { value: 'recognition', label: 'Recognition', emoji: '🌟' },
  { value: 'issue', label: 'Issue', emoji: '⚠️' },
];

const SEVERITIES = [
  { value: 'positive', label: 'Positive', emoji: '👍' },
  { value: 'neutral', label: 'Neutral', emoji: '➡️' },
  { value: 'concern', label: 'Concern', emoji: '⚠️' },
];

export default function StaffNotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffMember, setStaffMember] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('neutral');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/staff-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffName: staffMember, message: `[${category}/${severity}] ${note}`, action: '' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save staff note');
      }
      toast.success('Staff note saved! +10 XP');
      setStaffMember(''); setCategory(''); setSeverity('neutral'); setNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Staff Note"
      subtitle="Record performance, training, or recognition notes"
      icon={<ClipboardList className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <FormField label="Staff Member" required>
        <FormSelect options={STAFF_MEMBERS} placeholder="Select team member..." value={staffMember} onChange={e => setStaffMember(e.target.value)} required />
      </FormField>

      <FormField label="Category" required>
        <FormRadioGroup value={category} onChange={setCategory} options={NOTE_CATEGORIES} columns={3} />
      </FormField>

      <FormField label="Tone">
        <FormRadioGroup value={severity} onChange={setSeverity} options={SEVERITIES} columns={3} />
      </FormField>

      <FormField label="Note" required>
        <FormTextarea placeholder="Details about the note..." value={note} onChange={e => setNote(e.target.value)} required rows={4} />
      </FormField>
    </FormShell>
  );
}
