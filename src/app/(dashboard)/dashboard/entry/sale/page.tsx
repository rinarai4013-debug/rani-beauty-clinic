'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea, FormToggle } from '@/components/dashboard/forms';
import BankMatchSuggestion from '@/components/dashboard/plaid/BankMatchSuggestion';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'laser-hair-removal', label: 'Laser Hair Removal' },
  { value: 'hydrafacial', label: 'Hydrafacial' },
  { value: 'rf-microneedling', label: 'RF Microneedling' },
  { value: 'glp1', label: 'GLP-1 Programs' },
  { value: 'sofwave', label: 'Sofwave' },
  { value: 'chemical-peel', label: 'Chemical Peels' },
  { value: 'vitamin-injection', label: 'Vitamin Injections' },
  { value: 'hrt', label: 'HRT' },
  { value: 'package', label: 'Package / Bundle' },
  { value: 'product', label: 'Product Sale' },
  { value: 'other', label: 'Other' },
];

const PROVIDERS = [
  { value: 'rina', label: 'Rina' },
  { value: 'mom', label: 'Mom' },
];

const PAYMENT_METHODS = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'debit', label: 'Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'cherry', label: 'Cherry Financing' },
  { value: 'affirm', label: 'Affirm' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'other', label: 'Other' },
];

export default function ManualSalePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [service, setService] = useState('');
  const [category, setCategory] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState('');
  const [isFinancing, setIsFinancing] = useState(false);
  const [notes, setNotes] = useState('');
  const [bankTransactionId, setBankTransactionId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;
    const serviceName = service || category;
    if (!confirm(`Log sale of $${amt.toLocaleString()} for ${serviceName}?`)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          serviceName: service,
          paymentMethod,
          provider,
          isFinancing,
          clientName,
          category,
          discount: parseFloat(discount) || 0,
          notes,
          bankTransactionId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log sale');
      }
      toast.success(`Sale logged! $${parseFloat(amount).toLocaleString()} +${Math.round((parseFloat(amount) || 0) / 10)} XP`);
      setClientName(''); setService(''); setCategory(''); setProvider('');
      setAmount(''); setPaymentMethod(''); setDiscount(''); setIsFinancing(false); setNotes('');
      setBankTransactionId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Manual Sale"
      subtitle="Log a sale not captured by Mangomint POS"
      icon={<DollarSign className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <FormField label="Client Name" required>
        <FormInput placeholder="e.g. Jennifer L." value={clientName} onChange={e => setClientName(e.target.value)} required />
      </FormField>

      <FormField label="Service" required>
        <FormInput placeholder="e.g. RF Microneedling Full Face - 3 Session Package" value={service} onChange={e => setService(e.target.value)} required />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" required>
          <FormSelect options={CATEGORIES} placeholder="Select category..." value={category} onChange={e => setCategory(e.target.value)} required />
        </FormField>
        <FormField label="Provider" required>
          <FormSelect options={PROVIDERS} placeholder="Select provider..." value={provider} onChange={e => setProvider(e.target.value)} required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Amount" required>
          <FormInput type="number" prefix="$" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" />
        </FormField>
        <FormField label="Discount Applied">
          <FormInput type="number" prefix="$" placeholder="0.00" value={discount} onChange={e => setDiscount(e.target.value)} min="0" step="0.01" />
        </FormField>
      </div>

      <FormField label="Payment Method" required>
        <FormSelect options={PAYMENT_METHODS} placeholder="Select method..." value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required />
      </FormField>

      <FormToggle checked={isFinancing} onChange={setIsFinancing} label="Financing Used" description="Client is paying via Cherry, Affirm, or other financing" />

      <FormField label="Notes">
        <FormTextarea placeholder="Any additional details..." value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>

      {/* Bank feed matching - matches deposits */}
      {parseFloat(amount) > 0 && (
        <BankMatchSuggestion
          amount={parseFloat(amount)}
          vendor={clientName}
          date={new Date().toISOString().split('T')[0]}
          matchType="sale"
          onMatch={(txId) => setBankTransactionId(txId)}
        />
      )}
    </FormShell>
  );
}
