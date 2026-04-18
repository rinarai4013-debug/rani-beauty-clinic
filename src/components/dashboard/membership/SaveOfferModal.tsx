'use client';

import { useState } from 'react';
import { X, Gift, Shield, ArrowDown, Pause, CreditCard, Sparkles } from 'lucide-react';
import type { SaveOfferType, CancellationReason } from '@/lib/membership/billing';

interface SaveOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
  clientName: string;
  tier: string;
  reason: CancellationReason;
  offers: {
    type: SaveOfferType;
    label: string;
    description: string;
    value: number;
  }[];
  onAcceptOffer: (memberId: string, offerType: SaveOfferType) => void;
  onProceedCancel: (memberId: string) => void;
}

const OFFER_ICONS: Record<SaveOfferType, typeof Gift> = {
  free_upgrade_month: Sparkles,
  credit_bonus: CreditCard,
  price_lock: Shield,
  downgrade_offer: ArrowDown,
  pause_offer: Pause,
};

export default function SaveOfferModal({
  isOpen,
  onClose,
  memberId,
  clientName,
  tier,
  reason,
  offers,
  onAcceptOffer,
  onProceedCancel,
}: SaveOfferModalProps) {
  const [selectedOffer, setSelectedOffer] = useState<SaveOfferType | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-rani-border">
          <div>
            <h2 className="text-lg font-heading font-semibold text-rani-navy">Retain {clientName}</h2>
            <p className="text-xs font-body text-rani-muted mt-1">
              {clientName} wants to cancel their {tier} membership
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-rani-cream transition-colors">
            <X className="w-5 h-5 text-rani-muted" />
          </button>
        </div>

        {/* Reason */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs font-body text-amber-700">
            <span className="font-semibold">Reason:</span>{' '}
            {reason.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
          </p>
        </div>

        {/* Save Offers */}
        <div className="p-6 space-y-3">
          <h3 className="text-sm font-heading font-semibold text-rani-navy mb-3">Available Save Offers</h3>

          {offers.map((offer) => {
            const Icon = OFFER_ICONS[offer.type] || Gift;
            const isSelected = selectedOffer === offer.type;

            return (
              <button
                key={offer.type}
                onClick={() => setSelectedOffer(offer.type)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-rani-gold bg-amber-50'
                    : 'border-rani-border hover:border-rani-gold/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-rani-gold/20' : 'bg-rani-cream'}`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-rani-gold-accessible' : 'text-rani-muted'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-body font-semibold text-rani-navy">{offer.label}</h4>
                      {offer.value > 0 && (
                        <span className="text-xs font-body font-bold text-rani-gold-accessible">${offer.value} value</span>
                      )}
                    </div>
                    <p className="text-xs font-body text-rani-muted mt-1">{offer.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-rani-border flex gap-3">
          <button
            onClick={() => selectedOffer && onAcceptOffer(memberId, selectedOffer)}
            disabled={!selectedOffer}
            className={`flex-1 py-2.5 rounded-lg text-sm font-body font-semibold transition-colors ${
              selectedOffer
                ? 'bg-rani-gold text-white hover:bg-rani-gold/90'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Apply Save Offer
          </button>
          <button
            onClick={() => onProceedCancel(memberId)}
            className="px-4 py-2.5 rounded-lg text-sm font-body font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Proceed with Cancellation
          </button>
        </div>
      </div>
    </div>
  );
}
