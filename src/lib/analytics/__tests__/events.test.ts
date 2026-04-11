import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  env: {
    NODE_ENV: 'test',
  },
}));

import {
  trackAnalyticsEvent,
  trackCTAClick,
  trackPhoneClick,
  trackBookingOpen,
  trackChatOpen,
  trackOutboundClick,
} from '@/lib/analytics/events';

describe('analytics/events', () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      '',
      '/services/sofwave?utm_source=meta&utm_medium=cpc&utm_campaign=spring-refresh'
    );
    document.title = 'Sofwave Lift';
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1440,
    });
    (window as any).gtag = vi.fn();
    (window as any).fbq = vi.fn();
    (window as any).dataLayer = { push: vi.fn() };
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it('enriches analytics events with page, device, and UTM context', () => {
    trackAnalyticsEvent('plan_checkout_completed' as any, {
      service_name: 'Sofwave',
      value: 2750,
    });

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'plan_checkout_completed',
      expect.objectContaining({
        page_path: '/services/sofwave',
        page_title: 'Sofwave Lift',
        page_type: 'service_page',
        device_type: 'desktop',
        utm_source: 'meta',
        utm_medium: 'cpc',
        utm_campaign: 'spring-refresh',
        service_name: 'Sofwave',
        value: 2750,
      })
    );

    expect((window as any).dataLayer.push).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'plan_checkout_completed',
        page_type: 'service_page',
      })
    );
  });

  it('maps supported events to Meta Pixel standard events', () => {
    trackAnalyticsEvent('plan_checkout_completed' as any, {
      service_name: 'Sofwave',
      value: 2750,
      currency: 'USD',
    });

    expect((window as any).fbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({
        content_name: 'Sofwave',
        content_category: 'service_page',
        value: 2750,
        currency: 'USD',
      })
    );
  });

  it('tracks CTA clicks with the expected payload', () => {
    trackCTAClick('Book Consultation', 'hero', '/get-started');

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'cta_click',
      expect.objectContaining({
        cta_text: 'Book Consultation',
        cta_location: 'hero',
        cta_destination: '/get-started',
      })
    );
  });

  it('tracks phone clicks with the clinic phone number', () => {
    trackPhoneClick('navbar');

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'phone_click',
      expect.objectContaining({
        phone_number: '(425) 539-4440',
        click_location: 'navbar',
      })
    );
  });

  it('tracks booking widget opens with the trigger location', () => {
    trackBookingOpen('hero');

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'booking_widget_opened',
      expect.objectContaining({
        trigger_location: 'hero',
      })
    );
  });

  it('tracks chat opens with the trigger location', () => {
    trackChatOpen('floating_button');

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'chat_opened',
      expect.objectContaining({
        trigger_location: 'floating_button',
      })
    );
  });

  it('tracks outbound clicks and extracts the target domain', () => {
    trackOutboundClick('https://qualiphyrx.com/glp-1', 'Start GLP-1');

    expect((window as any).gtag).toHaveBeenCalledWith(
      'event',
      'outbound_click',
      expect.objectContaining({
        click_url: 'https://qualiphyrx.com/glp-1',
        click_text: 'Start GLP-1',
        link_domain: 'qualiphyrx.com',
      })
    );
  });

  it('ignores invalid outbound URLs without throwing', () => {
    expect(() => trackOutboundClick('not-a-url', 'Broken Link')).not.toThrow();
    expect((window as any).gtag).not.toHaveBeenCalled();
  });
});
