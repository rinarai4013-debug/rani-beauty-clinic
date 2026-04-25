'use client';

/**
 * MangomintEmbedWidget
 *
 * Embeds the Mangomint booking flow as an iframe. Used as the primary booking
 * mechanism on /book and every service landing page.
 *
 * Two modes:
 *   · full: shows the complete Mangomint booking flow (service selection first)
 *   · service: deep-links into a specific service or category (faster path)
 *
 * The iframe preserves the Rani visual frame (navy background, gold accents)
 * via a container that sits within the normal page layout.
 *
 * Mangomint-specific:
 *   · Company subdomain: ranibeautyclinic1
 *   · Base URL: https://booking.mangomint.com/ranibeautyclinic1
 *   · Widget supports ?serviceCategoryId= and ?serviceId= query params for deep-linking
 *   · Min viable iframe height: 800px on desktop, 1000px on mobile (Mangomint flow is vertical)
 */

import React, { useEffect, useRef, useState } from 'react';

export type MangomintEmbedMode = 'full' | 'service' | 'category';

export interface MangomintEmbedWidgetProps {
  /** Which flow to embed */
  mode?: MangomintEmbedMode;
  /** Mangomint service ID · only used when mode = 'service' */
  serviceId?: string;
  /** Mangomint category ID · only used when mode = 'category' */
  categoryId?: string;
  /** Optional CSS height override (e.g. '900px') */
  height?: string;
  /** Heading shown above the widget */
  heading?: string;
  /** Sub-heading shown above the widget */
  subheading?: string;
  /** Additional CSS classes on the container */
  className?: string;
  /** Fires when the iframe finishes its initial load · useful for analytics */
  onReady?: () => void;
}

const MANGOMINT_BASE = 'https://booking.mangomint.com/ranibeautyclinic1';

function buildSrc(mode: MangomintEmbedMode, serviceId?: string, categoryId?: string): string {
  if (mode === 'service' && serviceId) {
    return `${MANGOMINT_BASE}?serviceId=${encodeURIComponent(serviceId)}`;
  }
  if (mode === 'category' && categoryId) {
    return `${MANGOMINT_BASE}?serviceCategoryId=${encodeURIComponent(categoryId)}`;
  }
  return MANGOMINT_BASE;
}

export function MangomintEmbedWidget({
  mode = 'full',
  serviceId,
  categoryId,
  height,
  heading = 'Book your appointment',
  subheading = 'Select a service, time, and provider below. Confirmation lands in your inbox immediately.',
  className = '',
  onReady,
}: MangomintEmbedWidgetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const src = buildSrc(mode, serviceId, categoryId);

  useEffect(() => {
    // Listen for Mangomint-originated postMessage events (resize, ready, booking complete)
    // Mangomint emits { type: 'mangomint:ready' }, { type: 'mangomint:resize', height }, { type: 'mangomint:booking-complete', bookingId }
    function handle(e: MessageEvent) {
      if (e.origin !== 'https://booking.mangomint.com') return;
      const data = e.data as { type?: string; height?: number; bookingId?: string };
      if (data.type === 'mangomint:ready') {
        setIsLoading(false);
        onReady?.();
      }
      if (data.type === 'mangomint:resize' && data.height && frameRef.current) {
        // Mangomint asks for a specific height · honor it to avoid internal scrollbars
        frameRef.current.style.height = `${data.height}px`;
      }
      if (data.type === 'mangomint:booking-complete' && data.bookingId) {
        // Surface the booking ID to analytics (GA4 event, for example)
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'mangomint_booking_complete', {
            booking_id: data.bookingId,
            source: 'embedded_widget',
          });
        }
        // Navigate the parent to the confirmation page
        window.location.href = `/book/success?mm=${encodeURIComponent(data.bookingId)}`;
      }
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, [onReady]);

  const defaultHeight = typeof window !== 'undefined' && window.innerWidth < 768 ? '1000px' : '900px';

  return (
    <section
      className={`mangomint-embed-widget rounded-lg overflow-hidden shadow-lg bg-white ${className}`}
      aria-label="Mangomint booking widget"
    >
      {heading && (
        <div className="bg-[#0F1D2C] text-white px-6 py-5">
          <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)]">
            {heading}
          </h2>
          {subheading && (
            <p className="text-sm md:text-base text-gray-300 mt-2">{subheading}</p>
          )}
        </div>
      )}

      <div className="relative w-full">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[#FAF8F5] z-10"
            aria-live="polite"
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-600 text-sm">Loading booking calendar…</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          ref={frameRef}
          src={src}
          title="Rani Beauty Clinic · Book Appointment"
          className="w-full border-0 block"
          style={{ height: height || defaultHeight, minHeight: '800px' }}
          allow="payment; clipboard-read; clipboard-write"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation"
          loading="eager"
          onLoad={() => {
            // Fallback in case Mangomint doesn't emit a ready event within 3s
            setTimeout(() => setIsLoading(false), 3000);
          }}
        />
      </div>

      <div className="bg-[#FAF8F5] px-6 py-3 text-xs text-gray-600 text-center border-t border-gray-200">
        <strong className="font-semibold">All prices shown before Washington State sales tax (\u224810.1%).</strong>{' '}
        Memberships, packages, and deposits are taxable under WA RCW 82.04.050.
      </div>

      <div className="bg-[#FAF8F5] px-6 py-4 text-xs text-gray-500 text-center border-t border-gray-200">
        Having trouble with the booking widget?{' '}
        <button
          type="button"
          onClick={() => setIframeKey((k) => k + 1)}
          className="underline hover:text-[#C9A96E]"
        >
          Reload
        </button>
        {' \u00b7 '}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#C9A96E]"
        >
          Open in a new window
        </a>
        {' \u00b7 or call '}
        <a href="tel:+14255394440" className="underline hover:text-[#C9A96E]">
          425\u00b7539\u00b74440
        </a>
      </div>
    </section>
  );
}

export default MangomintEmbedWidget;
