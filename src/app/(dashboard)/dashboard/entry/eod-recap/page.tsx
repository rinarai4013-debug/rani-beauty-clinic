'use client';

import { useState } from 'react';
import { Moon } from 'lucide-react';
import { FormShell, FormField, FormInput, FormTextarea } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

export default function EODRecapPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalRevenue, setTotalRevenue] = useState('');
  const [totalClients, setTotalClients] = useState('');
  const [highlights, setHighlights] = useState('');
  const [issues, setIssues] = useState('');
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [tomorrowPriorities, setTomorrowPriorities] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const recap = `Revenue: $${totalRevenue || '0'} | Clients: ${totalClients || '0'} | ${highlights}`;
      const allIssues = [issues, inventoryNotes, tomorrowPriorities].filter(Boolean).join(' | ');
      const res = await fetch('/api/dashboard/entry/eod-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recap, highlights, issues: allIssues, date }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save recap');
      }
      toast.success('EOD recap saved! +50 XP - Great day!');
      setTotalRevenue(''); setTotalClients(''); setHighlights('');
      setIssues(''); setInventoryNotes(''); setTomorrowPriorities('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="End-of-Day Recap"
      subtitle="Wrap up the day with a quick summary"
      icon={<Moon className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField label="Date" required>
          <FormInput type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </FormField>
        <FormField label="Total Revenue" required>
          <FormInput type="number" prefix="$" placeholder="0.00" value={totalRevenue} onChange={e => setTotalRevenue(e.target.value)} required min="0" step="0.01" />
        </FormField>
        <FormField label="Total Clients" required>
          <FormInput type="number" placeholder="0" value={totalClients} onChange={e => setTotalClients(e.target.value)} required min="0" />
        </FormField>
      </div>

      <FormField label="Today's Highlights" required hint="What went well? Wins, big sales, happy clients">
        <FormTextarea placeholder="e.g. Booked a $2,400 RF Microneedling package for Amanda K. Got a 5-star Google review from Sarah M." value={highlights} onChange={e => setHighlights(e.target.value)} required rows={3} />
      </FormField>

      <FormField label="Issues / Concerns" hint="Anything that needs attention">
        <FormTextarea placeholder="e.g. Cutera laser showing error code E-12 intermittently..." value={issues} onChange={e => setIssues(e.target.value)} rows={2} />
      </FormField>

      <FormField label="Inventory Notes" hint="Low stock, restocking needs">
        <FormTextarea placeholder="e.g. Running low on Hydrafacial tips - 3 remaining" value={inventoryNotes} onChange={e => setInventoryNotes(e.target.value)} rows={2} />
      </FormField>

      <FormField label="Tomorrow's Priorities" hint="Top 3 things to focus on">
        <FormTextarea placeholder="1. Follow up with Michelle T. re: laser package\n2. Restock B12 vials\n3. Review new lead from Instagram" value={tomorrowPriorities} onChange={e => setTomorrowPriorities(e.target.value)} rows={3} />
      </FormField>
    </FormShell>
  );
}
