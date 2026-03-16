'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { FormShell, FormField, FormInput, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const NOTE_CATEGORIES = [
  { value: 'strategy', label: 'Strategy', emoji: '🎯' },
  { value: 'blocker', label: 'Blocker', emoji: '🚧' },
  { value: 'opportunity', label: 'Opportunity', emoji: '💡' },
  { value: 'team', label: 'Team', emoji: '👥' },
  { value: 'finance', label: 'Finance', emoji: '💰' },
  { value: 'marketing', label: 'Marketing', emoji: '📣' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', emoji: '🔴' },
  { value: 'high', label: 'High', emoji: '🟠' },
  { value: 'medium', label: 'Medium', emoji: '🟡' },
  { value: 'low', label: 'Low', emoji: '🟢' },
];

export default function CEONotePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [actionItems, setActionItems] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/ceo-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `[${category}] ${title}: ${content}`, priority, action: actionItems }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save note');
      }
      toast.success('CEO note captured! +15 XP');
      setCategory(''); setPriority('medium'); setTitle(''); setContent(''); setActionItems('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="CEO Note"
      subtitle="Capture strategy, blockers, and opportunities"
      icon={<Brain className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <FormField label="Category" required>
        <FormRadioGroup value={category} onChange={setCategory} options={NOTE_CATEGORIES} columns={4} />
      </FormField>

      <FormField label="Priority" required>
        <FormRadioGroup value={priority} onChange={setPriority} options={PRIORITIES} columns={4} />
      </FormField>

      <FormField label="Title" required>
        <FormInput placeholder="e.g. Need to hire a part-time esthetician by May" value={title} onChange={e => setTitle(e.target.value)} required />
      </FormField>

      <FormField label="Details" required>
        <FormTextarea placeholder="Full context and thinking..." value={content} onChange={e => setContent(e.target.value)} required rows={4} />
      </FormField>

      <FormField label="Action Items" hint="What needs to happen next?">
        <FormTextarea placeholder="1. Research Indeed postings for med spa estheticians&#10;2. Update job description&#10;3. Post by end of week" value={actionItems} onChange={e => setActionItems(e.target.value)} rows={3} />
      </FormField>
    </FormShell>
  );
}
