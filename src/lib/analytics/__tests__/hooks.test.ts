import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const trackAnalyticsEvent = vi.fn();

vi.mock('@/lib/analytics/events', () => ({
  trackAnalyticsEvent,
}));

import {
  useTimeOnPage,
  usePhoneLinkTracking,
  useServicePageTracking,
} from '@/lib/analytics/hooks';

describe('analytics/hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    document.body.innerHTML = '';
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useTimeOnPage', () => {
    it('fires milestone events at 30, 60, 120, and 300 seconds', () => {
      renderHook(() => useTimeOnPage());

      act(() => {
        vi.advanceTimersByTime(300_000);
      });

      expect(trackAnalyticsEvent.mock.calls).toEqual([
        ['time_on_page', { seconds: 30 }],
        ['time_on_page', { seconds: 60 }],
        ['time_on_page', { seconds: 120 }],
        ['time_on_page', { seconds: 300 }],
      ]);
    });

    it('pauses elapsed time while the tab is hidden', () => {
      let hidden = false;
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => hidden,
      });

      renderHook(() => useTimeOnPage());

      act(() => {
        hidden = true;
        document.dispatchEvent(new Event('visibilitychange'));
        vi.advanceTimersByTime(60_000);
      });

      expect(trackAnalyticsEvent).not.toHaveBeenCalled();

      act(() => {
        hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        vi.advanceTimersByTime(30_000);
      });

      expect(trackAnalyticsEvent).toHaveBeenCalledWith('time_on_page', {
        seconds: 30,
      });
    });
  });

  describe('usePhoneLinkTracking', () => {
    it('tracks tel links clicked from the navbar', () => {
      document.body.innerHTML = `
        <nav>
          <a href="tel:4255394440"><span>Call</span></a>
        </nav>
      `;

      renderHook(() => usePhoneLinkTracking());

      act(() => {
        document.querySelector('span')!.dispatchEvent(
          new MouseEvent('click', { bubbles: true })
        );
      });

      expect(trackAnalyticsEvent).toHaveBeenCalledWith('phone_click', {
        phone_number: '4255394440',
        click_location: 'navbar',
      });
    });

    it('tracks tel links clicked from a custom CTA section', () => {
      document.body.innerHTML = `
        <div data-cta-location="footer_banner">
          <a href="tel:4255394440">Call us</a>
        </div>
      `;

      renderHook(() => usePhoneLinkTracking());

      act(() => {
        document.querySelector('a')!.dispatchEvent(
          new MouseEvent('click', { bubbles: true })
        );
      });

      expect(trackAnalyticsEvent).toHaveBeenCalledWith('phone_click', {
        phone_number: '4255394440',
        click_location: 'footer_banner',
      });
    });
  });

  describe('useServicePageTracking', () => {
    it('fires a service page view once on first mount', () => {
      renderHook(() => useServicePageTracking('Sofwave', 'skin-tightening'));

      expect(trackAnalyticsEvent).toHaveBeenCalledWith('service_page_view', {
        service_name: 'Sofwave',
        service_category: 'skin-tightening',
      });
    });

    it('does not fire again after rerender because the ref is latched', () => {
      const { rerender } = renderHook(
        ({ name, category }) => useServicePageTracking(name, category),
        {
          initialProps: {
            name: 'HydraFacial',
            category: 'facial',
          },
        }
      );

      rerender({
        name: 'PRX-T33',
        category: 'peel',
      });

      expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
    });
  });
});
