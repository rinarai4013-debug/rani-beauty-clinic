'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { FormShell, FormField, FormInput, FormSelect, FormTextarea } from '@/components/dashboard/forms';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { value: 'google', label: 'Google' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'other', label: 'Other' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
            star <= value
              ? 'border-yellow-400 bg-yellow-50 text-yellow-500'
              : 'border-rani-border text-rani-border hover:border-yellow-300 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function AddReviewPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientName, setClientName] = useState('');
  const [platform, setPlatform] = useState('');
  const [starRating, setStarRating] = useState(5);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/entry/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, starRating, reviewerName, reviewText, reviewUrl, clientName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to log review');
      }
      toast.success(starRating === 5 ? 'Five-star review! +50 XP' : 'Review logged! +25 XP');
      setClientName(''); setPlatform(''); setStarRating(5);
      setReviewerName(''); setReviewText(''); setReviewUrl('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Add Review"
      subtitle="Log client reviews from Google, Yelp, or social"
      icon={<Star className="w-5 h-5" />}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Client Name" hint="Match to existing client if possible">
          <FormInput placeholder="e.g. Sarah M." value={clientName} onChange={e => setClientName(e.target.value)} />
        </FormField>
        <FormField label="Reviewer Name" required hint="As shown on the platform">
          <FormInput placeholder="e.g. Sarah Mitchell" value={reviewerName} onChange={e => setReviewerName(e.target.value)} required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Platform" required>
          <FormSelect options={PLATFORMS} placeholder="Select platform..." value={platform} onChange={e => setPlatform(e.target.value)} required />
        </FormField>
        <FormField label="Star Rating" required>
          <StarRating value={starRating} onChange={setStarRating} />
        </FormField>
      </div>

      <FormField label="Review Text" required>
        <FormTextarea placeholder="Paste the review text here..." value={reviewText} onChange={e => setReviewText(e.target.value)} required rows={4} />
      </FormField>

      <FormField label="Review URL" hint="Link to the review">
        <FormInput type="url" placeholder="https://..." value={reviewUrl} onChange={e => setReviewUrl(e.target.value)} />
      </FormField>
    </FormShell>
  );
}
