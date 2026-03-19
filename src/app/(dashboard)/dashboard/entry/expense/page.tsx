'use client';

import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea, FormToggle } from '@/components/dashboard/forms';
import BankMatchSuggestion from '@/components/dashboard/plaid/BankMatchSuggestion';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  { value: 'payroll', label: 'Payroll & Contractors' },
  { value: 'ad-spend', label: 'Ad Spend (Meta + Google)' },
  { value: 'inventory', label: 'Inventory & Supplies' },
  { value: 'rent', label: 'Rent + Utilities' },
  { value: 'device-rental', label: 'Device Rentals' },
  { value: 'software', label: 'Software & Tools' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'training', label: 'Training & Education' },
  { value: 'marketing', label: 'Marketing Materials' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_SOURCES = [
  { value: 'business-card', label: 'Business Credit Card' },
  { value: 'business-checking', label: 'Business Checking' },
  { value: 'personal-card', label: 'Personal Card (Reimburse)' },
  { value: 'cash', label: 'Cash' },
  { value: 'auto-pay', label: 'Auto-Pay / Subscription' },
];

export default function AddExpensePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [paymentSource, setPaymentSource] = useState('');
  const [notes, setNotes] = useState('');
  const [bankTransactionId, setBankTransactionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      toast.error('Expense date cannot be in the future');
      return;
    }
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      toast.error('Amount must be greater than $0');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount) || 0,
          vendor,
          category,
          paymentMethod: paymentSource,
          date,
          isFixed,
          isRecurring,
          notes,
          bankTransactionId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log expense');
      }
      toast.success('Expense logged! +10 XP');
      setVendor(''); setCategory(''); setAmount(''); setIsFixed(false);
      setIsRecurring(false); setPaymentSource(''); setNotes('');
      setBankTransactionId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Add Expense"
      subtitle="Track vendor payments, supplies, and overhead"
      icon={<Receipt className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date" required>
          <FormInput type="date" value={date} onChange={e => setDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
        </FormField>
        <FormField label="Vendor" required>
          <FormInput placeholder="e.g. Olympia Pharmacy" value={vendor} onChange={e => setVendor(e.target.value)} required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" required>
          <FormSelect options={EXPENSE_CATEGORIES} placeholder="Select category..." value={category} onChange={e => setCategory(e.target.value)} required />
        </FormField>
        <FormField label="Amount" required>
          <FormInput type="number" prefix="$" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" />
        </FormField>
      </div>

      <FormField label="Payment Source" required>
        <FormSelect options={PAYMENT_SOURCES} placeholder="How was this paid?" value={paymentSource} onChange={e => setPaymentSource(e.target.value)} required />
      </FormField>

      <div className="space-y-2">
        <FormToggle checked={isFixed} onChange={setIsFixed} label="Fixed Cost" description="Predictable monthly expense (rent, insurance, leases)" />
        <FormToggle checked={isRecurring} onChange={setIsRecurring} label="Recurring" description="This expense repeats monthly" />
      </div>

      <FormField label="Notes">
        <FormTextarea placeholder="Details about the expense..." value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>

      {/* Bank feed matching */}
      {parseFloat(amount) > 0 && (
        <BankMatchSuggestion
          amount={parseFloat(amount)}
          vendor={vendor}
          date={date}
          matchType="expense"
          onMatch={(txId) => setBankTransactionId(txId)}
        />
      )}
    </FormShell>
  );
}
