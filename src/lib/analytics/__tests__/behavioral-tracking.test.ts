import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  initBehavioralTracking,
  calculateIntentScore,
} from '@/lib/analytics/behavioral-tracking';

let mutationCallback: MutationCallback | null = null;

class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
}

class MutationObserverMock {
  disconnect = vi.fn();

  constructor(cb: MutationCallback) {
    mutationCallback = cb;
  }

  observe() {}
}

describe('analytics/behavioral-tracking', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    mutationCallback = null;

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      writable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 500,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    });

    (window as any).clarity = vi.fn();
    (window as any).gtag = vi.fn();
    (window as any).dataLayer = { push: vi.fn() };

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock as any);
    vi.stubGlobal('MutationObserver', MutationObserverMock as any);

    window.localStorage.clear();
    window.sessionStorage.clear();
    document.body.innerHTML = `
      <section id="hero">
        <button>Book Consultation</button>
      </section>
    `;
    window.history.replaceState({}, '', '/services/sofwave?utm_source=meta');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('tags device, visitor, and page context during initialization', () => {
    const cleanup = initBehavioralTracking();

    expect((window as any).clarity).toHaveBeenCalledWith('set', 'device_type', 'desktop');
    expect((window as any).clarity).toHaveBeenCalledWith('set', 'visitor_type', 'new');
    expect((window as any).clarity).toHaveBeenCalledWith('set', 'page_path', '/services/sofwave');
    expect((window as any).dataLayer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'session_start_enriched',
        device_type: 'desktop',
        visitor_type: 'new',
        landing_page: '/services/sofwave',
      })
    );

    cleanup();
  });

  it('classifies a fresh low-engagement visit as a bounce', () => {
    const cleanup = initBehavioralTracking();

    expect(calculateIntentScore()).toEqual(
      expect.objectContaining({
        score: 0,
        segment: 'bounce',
        ctaInteractions: 0,
        scrollDepthMax: 0,
      })
    );

    cleanup();
  });

  it('classifies a long, deep, multi-page session with CTA clicks as high intent', () => {
    const cleanup = initBehavioralTracking();
    const button = document.querySelector('button') as HTMLButtonElement;

    window.sessionStorage.setItem('rani_page_count', '3');

    window.scrollY = 1500;
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);

    for (let i = 0; i < 3; i++) {
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          clientX: 25,
          clientY: 25,
        })
      );
    }

    vi.advanceTimersByTime(181_000);

    expect(calculateIntentScore()).toEqual(
      expect.objectContaining({
        score: 100,
        segment: 'high_intent',
        pageCount: 3,
        ctaInteractions: 3,
        scrollDepthMax: 100,
      })
    );

    cleanup();
  });

  it('tracks booking widget opens when a Mangomint iframe is injected', () => {
    const cleanup = initBehavioralTracking();
    const iframe = document.createElement('iframe');
    iframe.src = 'https://widget.mangomint.com/booking';

    mutationCallback?.(
      [
        {
          addedNodes: [iframe],
        } as unknown as MutationRecord,
      ],
      {} as MutationObserver
    );

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'booking_widget_opened',
      expect.objectContaining({
        source: 'mangomint',
        page_url: '/services/sofwave',
      })
    );
    expect((window as any).clarity).toHaveBeenCalledWith(
      'set',
      'booking_attempt',
      'mangomint_opened'
    );

    cleanup();
  });
});
