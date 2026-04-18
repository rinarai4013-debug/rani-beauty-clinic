'use client';

import { useState } from 'react';
import { Send, Users, Eye, AlertTriangle, Check, Phone, Mail } from 'lucide-react';
import DeliveryStatusBadge from './DeliveryStatusBadge';
import type { ClientPreferences, MessageChannel } from '@/types/communications';
import { renderTemplate } from '@/lib/communications/message-router';

interface BulkSendPreviewProps {
  recipients: ClientPreferences[];
  subject?: string;
  body: string;
  channel: MessageChannel | 'both';
  variables?: Record<string, string>;
  onConfirmSend: () => void;
  onCancel: () => void;
  isPromotional: boolean;
}

export default function BulkSendPreview({
  recipients,
  subject,
  body,
  channel,
  variables,
  onConfirmSend,
  onCancel,
  isPromotional,
}: BulkSendPreviewProps) {
  const [showAll, setShowAll] = useState(false);

  // Calculate delivery estimates
  const eligible = recipients.filter(r => {
    if (channel === 'sms') return r.smsOptIn && r.phone;
    if (channel === 'email') return r.emailOptIn && r.email;
    return (r.smsOptIn && r.phone) || (r.emailOptIn && r.email);
  });

  const optedOut = recipients.length - eligible.length;
  const rateLimited = eligible.filter(r => r.messagesToday >= 3).length;
  const promoBlocked = isPromotional
    ? eligible.filter(r => r.promotionalThisWeek >= 1).length
    : 0;

  const willSend = eligible.length - rateLimited - promoBlocked;

  // Generate sample personalized messages
  const samples = eligible.slice(0, 3).map(r => {
    const mergedVars = {
      clientName: r.clientName,
      ...variables,
    };
    return {
      client: r,
      renderedBody: renderTemplate(body, mergedVars),
      renderedSubject: subject ? renderTemplate(subject, mergedVars) : undefined,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-rani-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-rani-border bg-gray-50/50">
        <h3 className="text-sm font-body font-semibold text-rani-navy flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Bulk Send Preview
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Delivery Estimates */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <EstimateCard
            label="Total Recipients"
            value={recipients.length}
            icon={Users}
            color="text-rani-navy bg-rani-navy/5"
          />
          <EstimateCard
            label="Will Send"
            value={willSend}
            icon={Send}
            color="text-emerald-600 bg-emerald-50"
          />
          <EstimateCard
            label="Opted Out"
            value={optedOut}
            icon={AlertTriangle}
            color="text-amber-600 bg-amber-50"
          />
          <EstimateCard
            label="Rate Limited"
            value={rateLimited + promoBlocked}
            icon={AlertTriangle}
            color="text-red-500 bg-red-50"
          />
        </div>

        {/* Warnings */}
        {(rateLimited > 0 || promoBlocked > 0 || optedOut > 0) && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
            {optedOut > 0 && (
              <p className="text-[11px] font-body text-amber-700">
                {optedOut} recipient(s) have opted out and will not receive this message.
              </p>
            )}
            {rateLimited > 0 && (
              <p className="text-[11px] font-body text-amber-700">
                {rateLimited} recipient(s) have reached their daily message limit (3/day).
              </p>
            )}
            {promoBlocked > 0 && (
              <p className="text-[11px] font-body text-amber-700">
                {promoBlocked} recipient(s) already received a promotional message this week.
              </p>
            )}
          </div>
        )}

        {/* Sample Personalized Messages */}
        <div>
          <h4 className="text-[11px] font-body font-semibold uppercase tracking-wider text-rani-muted mb-2">
            Sample Personalized Messages
          </h4>
          <div className="space-y-2">
            {samples.map((sample, i) => (
              <div key={i} className="rounded-lg border border-rani-border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-body font-semibold text-rani-navy">{sample.client.clientName}</span>
                  <span className="flex items-center gap-1 text-[10px] font-body text-rani-muted">
                    {channel === 'sms' || sample.client.preferredChannel === 'sms'
                      ? <><Phone className="w-3 h-3" /> {sample.client.phone}</>
                      : <><Mail className="w-3 h-3" /> {sample.client.email}</>
                    }
                  </span>
                </div>
                {sample.renderedSubject && (
                  <p className="text-xs font-body font-semibold text-rani-text mb-1">
                    Subject: {sample.renderedSubject}
                  </p>
                )}
                <p className="text-xs font-body text-rani-text whitespace-pre-wrap">{sample.renderedBody}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recipient List */}
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] font-body font-medium text-rani-gold-accessible hover:text-rani-navy transition-colors"
          >
            {showAll ? 'Hide' : 'Show'} all {recipients.length} recipients
          </button>

          {showAll && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-rani-border">
              {recipients.map((r, i) => {
                const canSend = channel === 'sms' ? (r.smsOptIn && !!r.phone) :
                  channel === 'email' ? (r.emailOptIn && !!r.email) :
                  (r.smsOptIn && !!r.phone) || (r.emailOptIn && !!r.email);

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 border-b border-rani-border/30 last:border-0"
                  >
                    <span className="text-[11px] font-body text-rani-text">{r.clientName}</span>
                    {canSend ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <span className="text-[10px] font-body text-red-400">Opted out</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-rani-border/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-body font-medium text-rani-muted hover:text-rani-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmSend}
            disabled={willSend === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                       hover:bg-rani-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send to {willSend} Recipients
          </button>
        </div>
      </div>
    </div>
  );
}

function EstimateCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-1`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-body font-bold text-rani-navy">{value.toLocaleString()}</p>
      <p className="text-[10px] font-body text-rani-muted">{label}</p>
    </div>
  );
}
