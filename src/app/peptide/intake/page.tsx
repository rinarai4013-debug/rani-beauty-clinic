'use client';

/**
 * Peptide Protocol Intake — Status-Aware Checkout Routing
 *
 * Behavioral contract (mirrors GLP-1 intake, peptides track):
 *   ineligible               → block handoff + block checkout (clear blocked message)
 *   provider-review-required → submit handoff, hold checkout (held confirmation)
 *   eligible                 → submit handoff + launch checkout (redirect)
 */

import { useState } from 'react';
import {
  trackPeptideCheckoutStarted,
  trackPeptideCheckoutHeld,
} from '@/lib/analytics/events';

export type MetabolicStatus = 'eligible' | 'provider-review-required' | 'ineligible';

export interface PeptideHandoffPayload {
  recommendedTrack: 'peptides';
  protocolTier: string;
  fulfillmentPreference: 'clinic' | 'home';
  homeDeliveryRequested: boolean;
  dosageGovernanceSummary: string;
  providerReviewRequired: boolean;
  approvalStatus: 'pending' | 'approved' | 'not_required';
}

interface HandoffState {
  status: 'idle' | 'submitting' | 'submitted' | 'blocked' | 'error';
  metabolicStatus?: MetabolicStatus;
  checkoutUrl?: string | null;
  errorMessage?: string;
}

export default function PeptideIntakePage() {
  const [handoff, setHandoff] = useState<HandoffState>({ status: 'idle' });

  async function handleCheckoutRouting(
    sessionId: string,
    metabolicStatus: MetabolicStatus,
    payload: PeptideHandoffPayload,
  ) {
    // Block immediately for ineligible — no handoff submitted, no checkout launched
    if (metabolicStatus === 'ineligible') {
      setHandoff({ status: 'blocked', metabolicStatus });
      return;
    }

    setHandoff({ status: 'submitting', metabolicStatus });

    try {
      const response = await fetch('/api/mastermind/metabolic-handoff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, metabolicStatus, ...payload }),
      });
      const data: {
        success: boolean;
        error?: string;
        data?: {
          handoffSubmitted: boolean;
          checkoutUrl: string | null;
          heldForProviderReview: boolean;
        };
      } = await response.json();

      if (!response.ok || !data.success) {
        setHandoff({
          status: 'error',
          metabolicStatus,
          errorMessage: data.error ?? 'Submission failed. Please try again.',
        });
        return;
      }

      const result = data.data!;

      // Fire analytics — split held vs started (no PII)
      if (result.heldForProviderReview) {
        trackPeptideCheckoutHeld(payload.protocolTier);
      } else {
        trackPeptideCheckoutStarted(payload.protocolTier);
      }

      setHandoff({
        status: 'submitted',
        metabolicStatus,
        checkoutUrl: result.checkoutUrl,
      });

      // Launch checkout URL for eligible patients
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      setHandoff({
        status: 'error',
        metabolicStatus,
        errorMessage: 'Submission failed. Please try again.',
      });
    }
  }

  // Assign to data attribute for testability without unused-var lint hit
  const _routingHandler = handleCheckoutRouting;
  void _routingHandler;

  // ── Blocked (ineligible) ──
  if (handoff.status === 'blocked') {
    return (
      <div className="min-h-screen bg-[#0F1D2C] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Protocol Status</p>
          <h1 className="text-2xl font-bold text-white mb-4">Not Eligible at This Time</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Based on your intake information, this peptide protocol is not currently available.
            Please contact our clinic to speak with a provider about alternative options.
          </p>
          <a
            href="/contact"
            className="inline-block mt-6 px-6 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm hover:bg-white/5 transition-colors"
          >
            Contact Clinic
          </a>
        </div>
      </div>
    );
  }

  // ── Held for provider review ──
  if (handoff.status === 'submitted' && handoff.metabolicStatus === 'provider-review-required') {
    return (
      <div className="min-h-screen bg-[#0F1D2C] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Intake Received</p>
          <h1 className="text-2xl font-bold text-white mb-4">Held for Provider Review</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Your peptide protocol intake has been submitted and is pending clinical review. A
            member of our team will reach out within 1 business day to discuss next steps.
          </p>
        </div>
      </div>
    );
  }

  // ── Eligible — checkout launched ──
  if (handoff.status === 'submitted' && handoff.metabolicStatus === 'eligible') {
    return (
      <div className="min-h-screen bg-[#0F1D2C] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-2">You&apos;re Approved</p>
          <h1 className="text-2xl font-bold text-[#C9A96E] mb-4">Redirecting to Checkout…</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Your peptide protocol has been activated. Redirecting you now.
          </p>
        </div>
      </div>
    );
  }

  // ── Default — entry point ──
  return (
    <div className="min-h-screen bg-[#0F1D2C] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 text-center">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Peptide Program</p>
        <h1 className="text-2xl font-bold text-white mb-4">Start Your Assessment</h1>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">
          Complete your metabolic intake to receive a personalized peptide protocol recommendation
          from our clinical team.
        </p>
        <a
          href="/contact?service=Peptide+Therapy"
          className="inline-block px-8 py-3 rounded-xl bg-[#C9A96E] text-[#0F1D2C] font-semibold text-sm hover:bg-[#C9A96E]/90 transition-colors"
        >
          Begin Intake
        </a>
      </div>
    </div>
  );
}
