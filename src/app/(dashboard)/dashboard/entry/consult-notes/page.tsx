'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const CONSULT_TYPES = [
  { value: 'initial', label: 'Initial', emoji: '🆕' },
  { value: 'follow_up', label: 'Follow-Up', emoji: '🔄' },
  { value: 'package_review', label: 'Package Review', emoji: '📦' },
  { value: 'upgrade', label: 'Upgrade', emoji: '⬆️' },
];

const OUTCOMES = [
  { value: 'booked_package', label: 'Booked Package' },
  { value: 'thinking', label: 'Thinking About It' },
  { value: 'needs_financing', label: 'Needs Financing' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'no_show', label: 'No Show' },
];

const PRIORITIES = [
  { value: 'high', label: 'High', emoji: '🔴' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'low', label: 'Low', emoji: '🟢' },
];

export default function ConsultNotesPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [consultType, setConsultType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [planPresented, setPlanPresented] = useState('');
  const [objections, setObjections] = useState('');
  const [priority, setPriority] = useState('medium');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/consult-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, consultType, outcome, planPresented, objections, priority, followUpDate, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save consult notes');
      }
      toast.success(outcome === 'booked_package' ? 'Consult closed! +100 XP' : 'Consult notes saved! +25 XP');
      setClientName(''); setConsultType(''); setOutcome(''); setPlanPresented('');
      setObjections(''); setPriority('medium'); setFollowUpDate(''); setNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Consult Notes"
      subtitle="Record consultation outcomes and follow-ups"
      icon={<FileText className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <FormField label="Client Name" required>
        <FormInput placeholder="e.g. Amanda K." value={clientName} onChange={e => setClientName(e.target.value)} required />
      </FormField>

      <FormField label="Consult Type" required>
        <FormRadioGroup value={consultType} onChange={setConsultType} options={CONSULT_TYPES} columns={4} />
      </FormField>

      <FormField label="Outcome" required>
        <FormSelect options={OUTCOMES} placeholder="Select outcome..." value={outcome} onChange={e => setOutcome(e.target.value)} required />
      </FormField>

      <FormField label="Treatment Plan Presented" required>
        <FormTextarea placeholder="e.g. 3x RF Microneedling + Hydrafacial package - $2,400" value={planPresented} onChange={e => setPlanPresented(e.target.value)} required />
      </FormField>

      <FormField label="Objections / Concerns">
        <FormTextarea placeholder="Price, timing, wants to consult spouse..." value={objections} onChange={e => setObjections(e.target.value)} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Follow-Up Priority">
          <FormRadioGroup value={priority} onChange={setPriority} options={PRIORITIES} columns={3} />
        </FormField>
        <FormField label="Next Follow-Up Date">
          <FormInput type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Additional Notes">
        <FormTextarea placeholder="Any other details..." value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormShell>
  );
}
