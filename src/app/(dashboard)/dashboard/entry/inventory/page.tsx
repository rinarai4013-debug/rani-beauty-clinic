'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea, FormRadioGroup } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const INVENTORY_CATEGORIES = [
  { value: 'skincare-products', label: 'Skincare Products' },
  { value: 'injectables', label: 'Injectables (GLP-1, B12, etc.)' },
  { value: 'device-consumables', label: 'Device Consumables (tips, cartridges)' },
  { value: 'chemicals', label: 'Chemical Peels & Solutions' },
  { value: 'disposables', label: 'Disposables (gloves, pads, etc.)' },
  { value: 'retail', label: 'Retail Products' },
  { value: 'other', label: 'Other' },
];

const ADJUSTMENT_TYPES = [
  { value: 'add', label: 'Add Stock', emoji: '📥' },
  { value: 'remove', label: 'Use / Remove', emoji: '📤' },
  { value: 'set', label: 'Set Count', emoji: '📊' },
];

const REASONS = [
  { value: 'restock', label: 'Restocked (delivery)' },
  { value: 'used', label: 'Used on client' },
  { value: 'expired', label: 'Expired / Damaged' },
  { value: 'audit', label: 'Physical count / Audit' },
  { value: 'returned', label: 'Returned to vendor' },
  { value: 'other', label: 'Other' },
];

export default function InventoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemName, setItemName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemName, sku, category, adjustmentType, quantity: parseInt(quantity) || 0, reason, notes }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update inventory');
      }
      toast.success('Inventory updated! +10 XP');
      setItemName(''); setSku(''); setCategory(''); setAdjustmentType('add');
      setQuantity(''); setReason(''); setNotes('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Inventory Adjustment"
      subtitle="Update stock counts for products and supplies"
      icon={<Package className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Item Name" required>
          <FormInput placeholder="e.g. Semaglutide 2.5mg vial" value={itemName} onChange={e => setItemName(e.target.value)} required />
        </FormField>
        <FormField label="SKU" hint="Optional product code">
          <FormInput placeholder="e.g. SEM-025-V" value={sku} onChange={e => setSku(e.target.value)} />
        </FormField>
      </div>

      <FormField label="Category" required>
        <FormSelect options={INVENTORY_CATEGORIES} placeholder="Select category..." value={category} onChange={e => setCategory(e.target.value)} required />
      </FormField>

      <FormField label="Adjustment Type" required>
        <FormRadioGroup value={adjustmentType} onChange={setAdjustmentType} options={ADJUSTMENT_TYPES} columns={3} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Quantity" required>
          <FormInput type="number" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" />
        </FormField>
        <FormField label="Reason" required>
          <FormSelect options={REASONS} placeholder="Why?" value={reason} onChange={e => setReason(e.target.value)} required />
        </FormField>
      </div>

      <FormField label="Notes">
        <FormTextarea placeholder="Additional details..." value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormShell>
  );
}
