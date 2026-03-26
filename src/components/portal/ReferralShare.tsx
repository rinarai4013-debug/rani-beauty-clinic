'use client';

import { useState } from 'react';
import { Copy, MessageSquare, Mail, Check, Gift } from 'lucide-react';
import type { ReferralShareContent } from '@/lib/referral/engine';

interface ReferralShareProps {
  shareContent: ReferralShareContent;
  totalReferred: number;
  totalEarned: number;
}

export default function ReferralShare({
  shareContent,
  totalReferred,
  totalEarned,
}: ReferralShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareContent.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareContent.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareContent.smsText)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent(shareContent.emailSubject)}&body=${encodeURIComponent(shareContent.emailBody)}`,
      '_blank'
    );
  };

  return (
    <div className="space-y-6">
      {/* Referral code card */}
      <div className="rounded-2xl bg-gradient-to-br from-rani-navy to-rani-navy-light p-6 text-white text-center">
        <Gift className="mx-auto h-8 w-8 text-rani-gold mb-3" />
        <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Your Referral Code</p>
        <p className="font-heading text-3xl font-bold tracking-[4px] text-rani-gold">
          {shareContent.referralCode}
        </p>
        <p className="mt-3 text-sm text-white/50">
          Share with friends &mdash; you both earn rewards
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white border border-rani-border p-4 text-center">
          <p className="text-2xl font-heading font-bold text-rani-navy">{totalReferred}</p>
          <p className="text-xs text-rani-muted mt-1">Friends Referred</p>
        </div>
        <div className="rounded-xl bg-white border border-rani-border p-4 text-center">
          <p className="text-2xl font-heading font-bold text-rani-navy">
            ${totalEarned}
          </p>
          <p className="text-xs text-rani-muted mt-1">Rewards Earned</p>
        </div>
      </div>

      {/* Share link */}
      <div>
        <label className="block text-xs font-medium text-rani-muted uppercase tracking-wider mb-2">
          Share Link
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-rani-cream border border-rani-border px-4 py-3 text-sm text-rani-text truncate font-mono">
            {shareContent.shareUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-rani-navy text-rani-gold hover:bg-rani-navy-light'
            }`}
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Share buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleSMS}
          className="flex items-center justify-center gap-2 rounded-xl border border-rani-border bg-white px-4 py-3 text-sm font-medium text-rani-navy hover:border-rani-gold/40 hover:bg-rani-cream/30 transition-all"
        >
          <MessageSquare className="h-4 w-4 text-rani-gold" />
          Share via SMS
        </button>
        <button
          onClick={handleEmail}
          className="flex items-center justify-center gap-2 rounded-xl border border-rani-border bg-white px-4 py-3 text-sm font-medium text-rani-navy hover:border-rani-gold/40 hover:bg-rani-cream/30 transition-all"
        >
          <Mail className="h-4 w-4 text-rani-gold" />
          Share via Email
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-rani-cream/50 border border-rani-border p-5">
        <h4 className="font-heading text-sm font-semibold text-rani-navy mb-3">
          How It Works
        </h4>
        <ol className="space-y-2.5">
          {[
            'Share your unique referral link with a friend',
            'Your friend books and completes their first treatment',
            'You earn $50 in treatment credit + 500 loyalty points',
            'Your friend gets $25 off their first visit',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-rani-text/80">
              <span className="flex-shrink-0 h-5 w-5 rounded-full bg-rani-navy text-[10px] text-rani-gold font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
