'use client';

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { FormShell, FormField, FormSelect, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const ROOMS = [
  { value: 'room-1', label: 'Room 1 (Rina)' },
  { value: 'room-2', label: 'Room 2 (Mom)' },
  { value: 'lobby', label: 'Lobby / Reception' },
  { value: 'storage', label: 'Storage Room' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'other', label: 'Other Area' },
];

const ISSUE_TYPES = [
  { value: 'equipment', label: 'Equipment', emoji: '🔌' },
  { value: 'cleanliness', label: 'Cleanliness', emoji: '🧹' },
  { value: 'supply', label: 'Supply Needed', emoji: '📦' },
  { value: 'damage', label: 'Damage', emoji: '⚠️' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', emoji: '🟢' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'high', label: 'Urgent', emoji: '🔴' },
];

export default function RoomIssuePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [room, setRoom] = useState('');
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/room-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, issue: `[${issueType}] ${description}`, severity, action: actionTaken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to report issue');
      }
      toast.success('Room issue reported! +10 XP');
      setRoom(''); setIssueType(''); setSeverity('medium'); setDescription(''); setActionTaken('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Report Room Issue"
      subtitle="Flag equipment, supply, or facility problems"
      icon={<Wrench className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <FormField label="Room / Area" required>
        <FormSelect options={ROOMS} placeholder="Select room..." value={room} onChange={e => setRoom(e.target.value)} required />
      </FormField>

      <FormField label="Issue Type" required>
        <FormRadioGroup value={issueType} onChange={setIssueType} options={ISSUE_TYPES} columns={3} />
      </FormField>

      <FormField label="Severity" required>
        <FormRadioGroup value={severity} onChange={setSeverity} options={SEVERITIES} columns={3} />
      </FormField>

      <FormField label="Description" required>
        <FormTextarea placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} required rows={3} />
      </FormField>

      <FormField label="Action Taken" hint="What was done so far?">
        <FormTextarea placeholder="e.g. Turned off device, contacted vendor support..." value={actionTaken} onChange={e => setActionTaken(e.target.value)} rows={2} />
      </FormField>
    </FormShell>
  );
}
