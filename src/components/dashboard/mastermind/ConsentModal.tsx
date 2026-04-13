'use client';

/**
 * ConsentModal — Full-screen informed consent flow
 *
 * Presents consent text, collects individual acknowledgments via checkboxes,
 * captures e-signature via SignaturePad, and returns a complete ConsentRecord.
 * Designed for iPad use in-clinic during Mastermind consultations.
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import SignaturePad from './SignaturePad';
import { renderConsentTemplate } from '@/lib/mastermind/consent-templates';
import { sanitizeTrustedHtml } from '@/lib/security/sanitize-html';
import type { ConsentRecord, ConsentTemplate } from '@/types/consent';

interface ConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConsent: (record: ConsentRecord) => void;
  template: ConsentTemplate;
  patientName: string;
  patientEmail: string;
  sessionId: string;
  treatmentNames?: string[];
  totalCost?: number;
  providerName?: string;
}

export default function ConsentModal({
  open,
  onClose,
  onConsent,
  template,
  patientName,
  patientEmail,
  sessionId,
  treatmentNames = [],
  totalCost,
  providerName,
}: ConsentModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens with new template
  useEffect(() => {
    if (open) {
      setCheckedItems({});
      setSignatureDataUrl(null);
      setIsSubmitting(false);
      scrollRef.current?.scrollTo(0, 0);
    }
  }, [open, template.type]);

  // Render the consent text with variables
  const renderedBody = useMemo(
    () =>
      renderConsentTemplate(template, {
        patientName,
        treatmentList: treatmentNames.length > 0 ? treatmentNames.join(', ') : undefined,
        totalCost: totalCost
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCost)
          : undefined,
        providerName,
      }),
    [template, patientName, treatmentNames, totalCost, providerName]
  );
  const sanitizedTitle = useMemo(() => sanitizeTrustedHtml(template.title), [template.title]);
  const sanitizedRenderedBody = useMemo(() => sanitizeTrustedHtml(renderedBody), [renderedBody]);

  // Check if all acknowledgments are checked
  const allChecked = useMemo(() => {
    if (!template.acknowledgments || template.acknowledgments.length === 0) return true;
    return template.acknowledgments.every((_, i) => checkedItems[i] === true);
  }, [checkedItems, template.acknowledgments]);

  const canSubmit = allChecked && signatureDataUrl !== null && !isSubmitting;

  const handleCheckChange = useCallback((index: number, checked: boolean) => {
    setCheckedItems((prev) => ({ ...prev, [index]: checked }));
  }, []);

  const handleSign = useCallback((dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  const handleClearSignature = useCallback(() => {
    setSignatureDataUrl(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !signatureDataUrl) return;
    setIsSubmitting(true);

    const record: ConsentRecord = {
      id: `consent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      sessionId,
      patientName,
      patientEmail,
      consentType: template.type,
      consentText: sanitizedRenderedBody,
      treatmentNames: treatmentNames.length > 0 ? treatmentNames : undefined,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      witnessName: providerName,
    };

    onConsent(record);
  }, [
    canSubmit,
    signatureDataUrl,
    sessionId,
    patientName,
    patientEmail,
    template.type,
    renderedBody,
    sanitizedRenderedBody,
    treatmentNames,
    providerName,
    onConsent,
  ]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 29, 44, 0.85)' }}
    >
      <div
        className="relative flex flex-col w-full h-full max-w-4xl max-h-[100dvh] md:max-h-[95dvh] md:rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#F8F6F1' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            backgroundColor: '#0F1D2C',
            borderBottom: '2px solid #C9A96E',
          }}
        >
          <div>
            <h2
              className="text-lg font-semibold text-white"
              style={{ fontFamily: 'Playfair Display, serif' }}
              dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
            />
            <p
              className="text-xs mt-0.5"
              style={{ color: '#C9A96E', fontFamily: 'Montserrat, sans-serif' }}
            >
              Rani Beauty Clinic &mdash; Informed Consent
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-2"
            aria-label="Close consent form"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          {/* Consent text */}
          <div
            className="prose prose-sm max-w-none mb-8"
            style={{
              color: '#0F1D2C',
              fontFamily: 'Montserrat, sans-serif',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedRenderedBody }}
          />

          {/* Acknowledgment checkboxes */}
          {template.acknowledgments && template.acknowledgments.length > 0 && (
            <div
              className="mb-8 p-5 rounded-xl"
              style={{
                backgroundColor: 'white',
                border: '1px solid #C9A96E',
              }}
            >
              <h3
                className="text-sm font-semibold mb-4 uppercase tracking-wider"
                style={{
                  color: '#0F1D2C',
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Please confirm each item below
              </h3>
              <div className="space-y-3">
                {template.acknowledgments.map((text, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[index] || false}
                      onChange={(e) => handleCheckChange(index, e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded flex-shrink-0"
                      style={{
                        accentColor: '#C9A96E',
                      }}
                    />
                    <span
                      className="text-sm leading-relaxed group-hover:text-black transition-colors"
                      style={{
                        color: checkedItems[index] ? '#0F1D2C' : '#666',
                        fontFamily: 'Montserrat, sans-serif',
                      }}
                    >
                      {text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Signature section */}
          <div
            className="mb-6 p-5 rounded-xl"
            style={{
              backgroundColor: 'white',
              border: '1px solid #C9A96E',
            }}
          >
            <h3
              className="text-sm font-semibold mb-1 uppercase tracking-wider"
              style={{
                color: '#0F1D2C',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Electronic Signature
            </h3>
            <p
              className="text-xs mb-4"
              style={{
                color: '#888',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              By signing below, I acknowledge that I have read, understood, and agree to the terms
              described above. This electronic signature has the same legal effect as a handwritten
              signature.
            </p>
            <SignaturePad
              onSign={handleSign}
              onClear={handleClearSignature}
              height={180}
            />
          </div>

          {/* Patient info summary */}
          <div
            className="mb-4 text-xs"
            style={{
              color: '#888',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            <p>
              <strong>Patient:</strong> {patientName} ({patientEmail})
            </p>
            <p>
              <strong>Session:</strong> {sessionId}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Footer with submit */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            backgroundColor: 'white',
            borderTop: '1px solid #e5e0d8',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-lg transition-all"
            style={{
              color: '#0F1D2C',
              border: '1px solid #ccc',
              fontFamily: 'Montserrat, sans-serif',
            }}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!allChecked && (
              <span
                className="text-xs"
                style={{ color: '#C9A96E', fontFamily: 'Montserrat, sans-serif' }}
              >
                Please check all acknowledgments
              </span>
            )}
            {allChecked && !signatureDataUrl && (
              <span
                className="text-xs"
                style={{ color: '#C9A96E', fontFamily: 'Montserrat, sans-serif' }}
              >
                Please sign above
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSubmit ? '#C9A96E' : '#d4c9b0',
                color: '#0F1D2C',
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              {isSubmitting ? 'Processing...' : 'I Agree & Sign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
