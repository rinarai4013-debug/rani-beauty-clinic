/**
 * Behavioral Intelligence Engine
 *
 * Captures attention, confusion, hesitation, and intent signals.
 * Feeds data into Clarity custom tags, GA4 events, and GTM dataLayer.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScrollDepthMilestone {
  depth: number;
  timestamp: number;
  timeOnPage: number;
}

interface RageClickEvent {
  element: string;
  selector: string;
  count: number;
  timestamp: number;
  pageUrl: string;
}

interface HesitationEvent {
  element: string;
  selector: string;
  hoverDurationMs: number;
  didClick: boolean;
  timestamp: number;
}

interface AttentionZone {
  sectionId: string;
  visibleDurationMs: number;
  scrollBackCount: number;
  timestamp: number;
}

interface SessionIntent {
  score: number; // 0-100
  signals: string[];
  segment: 'high_intent' | 'medium_intent' | 'low_intent' | 'bounce';
  pageCount: number;
  sessionDurationMs: number;
  scrollDepthMax: number;
  ctaInteractions: number;
}

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  pageLoadTime: 0,
  scrollMilestones: new Set<number>(),
  rageClickBuffer: [] as { x: number; y: number; time: number; target: EventTarget | null }[],
  hoverTimers: new Map<Element, number>(),
  sectionVisibility: new Map<string, { startTime: number; totalVisible: number; scrollBacks: number }>(),
  ctaInteractions: 0,
  pageViews: 1,
  maxScrollDepth: 0,
  lastScrollY: 0,
  scrollDirection: 'down' as 'up' | 'down',
  scrollBackCount: 0,
  abandonmentTracked: false,
};

// ─── Clarity Integration ─────────────────────────────────────────────────────

function tagClarity(key: string, value: string) {
  if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
    window.clarity('set', key, value);
  }
}

function clarityEvent(name: string) {
  if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
    window.clarity('event', name);
  }
}

// ─── GA4 / GTM Event Dispatch ────────────────────────────────────────────────

function pushEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', name, params);
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: name, ...params });
  }
}

// ─── 1. Scroll Depth Tracking ────────────────────────────────────────────────

const SCROLL_MILESTONES = [25, 50, 75, 90, 100];

function getScrollDepth(): number {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / docHeight) * 100));
}

function handleScroll() {
  const depth = getScrollDepth();
  const currentY = window.scrollY;

  // Track direction changes (scroll-back = confusion signal)
  if (currentY < state.lastScrollY - 50) {
    if (state.scrollDirection === 'down') {
      state.scrollBackCount++;
      state.scrollDirection = 'up';

      if (state.scrollBackCount >= 3) {
        pushEvent('behavioral_confusion_signal', {
          signal_type: 'excessive_scroll_back',
          scroll_back_count: state.scrollBackCount,
          page_url: window.location.pathname,
        });
        tagClarity('confusion_signal', 'scroll_back');
        clarityEvent('confusion_scroll_back');
      }
    }
  } else if (currentY > state.lastScrollY + 50) {
    state.scrollDirection = 'down';
  }
  state.lastScrollY = currentY;

  // Track max depth
  if (depth > state.maxScrollDepth) {
    state.maxScrollDepth = depth;
  }

  // Fire milestone events
  for (const milestone of SCROLL_MILESTONES) {
    if (depth >= milestone && !state.scrollMilestones.has(milestone)) {
      state.scrollMilestones.add(milestone);
      const timeOnPage = Date.now() - state.pageLoadTime;

      pushEvent('scroll_depth', {
        depth_percent: milestone,
        time_on_page_ms: timeOnPage,
        page_url: window.location.pathname,
      });
      tagClarity('scroll_depth', `${milestone}%`);

      // Tag scroll drop-off zone
      if (milestone === 25) tagClarity('scroll_zone', 'above_fold');
      if (milestone === 50) tagClarity('scroll_zone', 'mid_page');
      if (milestone === 75) tagClarity('scroll_zone', 'deep_reader');
      if (milestone === 90) tagClarity('scroll_zone', 'full_reader');
    }
  }
}

// ─── 2. Rage Click Detection ─────────────────────────────────────────────────

const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 800;

function handleClick(e: MouseEvent) {
  const now = Date.now();
  const target = e.target as HTMLElement;

  // Track CTA clicks
  if (isCTAElement(target)) {
    state.ctaInteractions++;
    const ctaLabel = getCTALabel(target);
    pushEvent('cta_click', {
      cta_label: ctaLabel,
      cta_type: getCTAType(target),
      page_url: window.location.pathname,
      page_section: getClosestSection(target),
    });
    tagClarity('cta_clicked', ctaLabel);
    clarityEvent(`cta_${ctaLabel.toLowerCase().replace(/\s+/g, '_')}`);
  }

  // Rage click detection
  state.rageClickBuffer.push({ x: e.clientX, y: e.clientY, time: now, target: e.target });

  // Clean old clicks
  state.rageClickBuffer = state.rageClickBuffer.filter(
    (c) => now - c.time < RAGE_CLICK_WINDOW_MS
  );

  // Check for rage clicks in proximity
  if (state.rageClickBuffer.length >= RAGE_CLICK_THRESHOLD) {
    const recent = state.rageClickBuffer.slice(-RAGE_CLICK_THRESHOLD);
    const maxDist = Math.max(
      ...recent.map((c, i) =>
        i > 0 ? Math.hypot(c.x - recent[i - 1].x, c.y - recent[i - 1].y) : 0
      )
    );

    if (maxDist < 100) {
      const selector = getElementSelector(target);
      pushEvent('rage_click', {
        element: target.tagName,
        selector,
        click_count: state.rageClickBuffer.length,
        page_url: window.location.pathname,
        page_section: getClosestSection(target),
      });
      tagClarity('rage_click', selector);
      clarityEvent('rage_click');

      // Reset buffer to avoid duplicate events
      state.rageClickBuffer = [];
    }
  }
}

// ─── 3. Hesitation Detection ─────────────────────────────────────────────────

const HESITATION_THRESHOLD_MS = 2000;

function handleMouseEnter(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!isCTAElement(target)) return;

  state.hoverTimers.set(target, Date.now());
}

function handleMouseLeave(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const enterTime = state.hoverTimers.get(target);
  if (!enterTime) return;

  const duration = Date.now() - enterTime;
  state.hoverTimers.delete(target);

  if (duration >= HESITATION_THRESHOLD_MS) {
    const label = getCTALabel(target);
    pushEvent('hesitation_detected', {
      element: label,
      hover_duration_ms: duration,
      did_click: false,
      page_url: window.location.pathname,
      page_section: getClosestSection(target),
    });
    tagClarity('hesitation', label);
    clarityEvent('hesitation_on_cta');
  }
}

// ─── 4. Section Attention Tracking (IntersectionObserver) ────────────────────

let sectionObserver: IntersectionObserver | null = null;

function initSectionTracking() {
  const sections = document.querySelectorAll('section[id], [data-track-section]');
  if (sections.length === 0) return;

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id || (entry.target as HTMLElement).dataset.trackSection || 'unknown';

        if (entry.isIntersecting) {
          if (!state.sectionVisibility.has(id)) {
            state.sectionVisibility.set(id, { startTime: Date.now(), totalVisible: 0, scrollBacks: 0 });
          } else {
            const data = state.sectionVisibility.get(id)!;
            data.startTime = Date.now();
            data.scrollBacks++;
          }
        } else {
          const data = state.sectionVisibility.get(id);
          if (data && data.startTime > 0) {
            data.totalVisible += Date.now() - data.startTime;
            data.startTime = 0;
          }
        }
      });
    },
    { threshold: [0.3] }
  );

  sections.forEach((section) => sectionObserver!.observe(section));
}

// ─── 5. Booking Attempt Tracking ─────────────────────────────────────────────

function trackBookingAttempts() {
  // Mangomint widget opens
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          // Mangomint injects an iframe when booking opens
          if (
            node.tagName === 'IFRAME' &&
            (node as HTMLIFrameElement).src?.includes('mangomint')
          ) {
            pushEvent('booking_widget_opened', {
              source: 'mangomint',
              page_url: window.location.pathname,
            });
            tagClarity('booking_attempt', 'mangomint_opened');
            clarityEvent('booking_opened');
          }
          // Typeform embed detection
          if (
            node.tagName === 'IFRAME' &&
            (node as HTMLIFrameElement).src?.includes('typeform')
          ) {
            pushEvent('consultation_form_opened', {
              source: 'typeform',
              page_url: window.location.pathname,
            });
            tagClarity('booking_attempt', 'typeform_opened');
            clarityEvent('consultation_form_opened');
          }
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return observer;
}

// ─── 6. Abandonment Tracking ─────────────────────────────────────────────────

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden' && !state.abandonmentTracked) {
    state.abandonmentTracked = true;
    const sessionDuration = Date.now() - state.pageLoadTime;

    // Flush section visibility data
    const sectionData: Record<string, { visibleMs: number; scrollBacks: number }> = {};
    state.sectionVisibility.forEach((data, id) => {
      const totalVisible = data.startTime > 0
        ? data.totalVisible + (Date.now() - data.startTime)
        : data.totalVisible;
      sectionData[id] = { visibleMs: totalVisible, scrollBacks: data.scrollBacks };
    });

    // Calculate intent score
    const intent = calculateIntentScore();

    pushEvent('page_abandonment', {
      session_duration_ms: sessionDuration,
      max_scroll_depth: state.maxScrollDepth,
      scroll_back_count: state.scrollBackCount,
      cta_interactions: state.ctaInteractions,
      intent_score: intent.score,
      intent_segment: intent.segment,
      page_url: window.location.pathname,
    });

    tagClarity('intent_segment', intent.segment);
    tagClarity('intent_score', String(intent.score));
    tagClarity('max_scroll', `${state.maxScrollDepth}%`);
  }
}

// ─── 7. Intent Scoring ───────────────────────────────────────────────────────

function calculateIntentScore(): SessionIntent {
  const sessionDuration = Date.now() - state.pageLoadTime;
  const signals: string[] = [];
  let score = 0;

  // Duration scoring (max 25 points)
  if (sessionDuration > 180000) { score += 25; signals.push('long_session_3min+'); }
  else if (sessionDuration > 60000) { score += 15; signals.push('medium_session_1min+'); }
  else if (sessionDuration > 15000) { score += 5; signals.push('short_session'); }

  // Scroll depth (max 25 points)
  if (state.maxScrollDepth >= 75) { score += 25; signals.push('deep_scroll_75%+'); }
  else if (state.maxScrollDepth >= 50) { score += 15; signals.push('mid_scroll_50%+'); }
  else if (state.maxScrollDepth >= 25) { score += 5; signals.push('shallow_scroll'); }

  // CTA interactions (max 30 points)
  if (state.ctaInteractions >= 3) { score += 30; signals.push('multiple_cta_clicks'); }
  else if (state.ctaInteractions >= 1) { score += 20; signals.push('cta_clicked'); }

  // Page engagement signals (max 20 points)
  if (state.scrollBackCount >= 2 && state.scrollBackCount < 5) {
    score += 10; signals.push('re-reading_content');
  }
  const storedPages = sessionStorage.getItem('rani_page_count');
  const pageCount = storedPages ? parseInt(storedPages, 10) : 1;
  if (pageCount >= 3) { score += 20; signals.push('multi_page_visit'); }
  else if (pageCount >= 2) { score += 10; signals.push('second_page_visit'); }

  // Determine segment
  let segment: SessionIntent['segment'];
  if (sessionDuration < 10000 && state.maxScrollDepth < 25) segment = 'bounce';
  else if (score >= 60) segment = 'high_intent';
  else if (score >= 30) segment = 'medium_intent';
  else segment = 'low_intent';

  return {
    score: Math.min(100, score),
    signals,
    segment,
    pageCount,
    sessionDurationMs: sessionDuration,
    scrollDepthMax: state.maxScrollDepth,
    ctaInteractions: state.ctaInteractions,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCTAElement(el: HTMLElement): boolean {
  if (!el) return false;

  // Check the element itself and ancestors up to 3 levels
  let current: HTMLElement | null = el;
  for (let i = 0; i < 3 && current; i++) {
    if (
      current.tagName === 'A' ||
      current.tagName === 'BUTTON' ||
      current.getAttribute('role') === 'button' ||
      current.dataset.trackCta !== undefined ||
      current.classList.contains('mangomint-booking') ||
      (current.tagName === 'A' && current.getAttribute('href')?.includes('mangomint')) ||
      (current.tagName === 'A' && current.getAttribute('href')?.includes('typeform')) ||
      (current.tagName === 'A' && current.getAttribute('href')?.startsWith('tel:'))
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function getCTALabel(el: HTMLElement): string {
  // Walk up to find the CTA element
  let current: HTMLElement | null = el;
  for (let i = 0; i < 3 && current; i++) {
    if (current.tagName === 'A' || current.tagName === 'BUTTON') {
      return (
        current.getAttribute('aria-label') ||
        current.textContent?.trim().substring(0, 50) ||
        current.tagName
      );
    }
    current = current.parentElement;
  }
  return el.textContent?.trim().substring(0, 50) || el.tagName;
}

function getCTAType(el: HTMLElement): string {
  let current: HTMLElement | null = el;
  for (let i = 0; i < 3 && current; i++) {
    const href = current.getAttribute('href') || '';
    if (href.includes('mangomint') || current.classList.contains('mangomint-booking')) return 'booking';
    if (href.includes('typeform')) return 'consultation';
    if (href.startsWith('tel:')) return 'phone_call';
    if (href.includes('/contact')) return 'contact';
    if (href.includes('/quiz')) return 'quiz';
    if (href.includes('/get-started')) return 'get_started';
    if (href.includes('/services') || href.includes('/wellness')) return 'service_browse';
    if (href.includes('/pricing') || href.includes('/membership')) return 'pricing';
    current = current.parentElement;
  }
  return 'general';
}

function getClosestSection(el: HTMLElement): string {
  let current: HTMLElement | null = el;
  while (current) {
    if (current.tagName === 'SECTION' && current.id) return current.id;
    if (current.dataset.trackSection) return current.dataset.trackSection;
    current = current.parentElement;
  }
  return 'unknown';
}

function getElementSelector(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;
  for (let i = 0; i < 3 && current; i++) {
    let selector = current.tagName.toLowerCase();
    if (current.id) selector += `#${current.id}`;
    else if (current.className && typeof current.className === 'string') {
      const firstClass = current.className.split(' ')[0];
      if (firstClass && !firstClass.startsWith('__')) selector += `.${firstClass}`;
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

// ─── Device & Visitor Tagging ────────────────────────────────────────────────

function tagDeviceAndVisitor() {
  // Device type
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  tagClarity('device_type', deviceType);

  // Returning visitor
  const visitCount = parseInt(localStorage.getItem('rani_visit_count') || '0', 10) + 1;
  localStorage.setItem('rani_visit_count', String(visitCount));
  const isReturning = visitCount > 1;
  tagClarity('visitor_type', isReturning ? 'returning' : 'new');
  tagClarity('visit_count', String(visitCount));

  // Page count in session
  const sessionPages = parseInt(sessionStorage.getItem('rani_page_count') || '0', 10) + 1;
  sessionStorage.setItem('rani_page_count', String(sessionPages));
  tagClarity('session_pages', String(sessionPages));

  // Traffic source
  const referrer = document.referrer;
  let source = 'direct';
  if (referrer.includes('google')) source = 'google';
  else if (referrer.includes('facebook') || referrer.includes('instagram')) source = 'social';
  else if (referrer.includes('yelp')) source = 'yelp';
  else if (referrer) source = 'referral';
  tagClarity('traffic_source', source);

  // Landing page
  if (sessionPages === 1) {
    tagClarity('landing_page', window.location.pathname);
  }

  // UTM parameters
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  if (utmSource) tagClarity('utm_source', utmSource);
  if (utmMedium) tagClarity('utm_medium', utmMedium);
  if (utmCampaign) tagClarity('utm_campaign', utmCampaign);

  pushEvent('session_start_enriched', {
    device_type: deviceType,
    visitor_type: isReturning ? 'returning' : 'new',
    visit_count: visitCount,
    traffic_source: source,
    landing_page: window.location.pathname,
  });
}

// ─── Initialize ──────────────────────────────────────────────────────────────

let cleanupFns: (() => void)[] = [];

export function initBehavioralTracking() {
  if (typeof window === 'undefined') return () => {};

  state.pageLoadTime = Date.now();
  state.scrollMilestones.clear();
  state.rageClickBuffer = [];
  state.maxScrollDepth = 0;
  state.lastScrollY = window.scrollY;
  state.scrollBackCount = 0;
  state.ctaInteractions = 0;
  state.abandonmentTracked = false;
  state.sectionVisibility.clear();

  // Tag device and visitor info
  tagDeviceAndVisitor();

  // Scroll tracking (throttled)
  let scrollTimer: ReturnType<typeof setTimeout>;
  const throttledScroll = () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(handleScroll, 150);
  };
  window.addEventListener('scroll', throttledScroll, { passive: true });

  // Click tracking
  document.addEventListener('click', handleClick, true);

  // Hesitation tracking on CTAs
  document.addEventListener('mouseenter', handleMouseEnter as EventListener, true);
  document.addEventListener('mouseleave', handleMouseLeave as EventListener, true);

  // Visibility change (abandonment)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Section tracking
  requestAnimationFrame(() => initSectionTracking());

  // Booking attempt tracking
  const bookingObserver = trackBookingAttempts();

  // Tag the current page
  tagClarity('page_path', window.location.pathname);

  cleanupFns = [
    () => window.removeEventListener('scroll', throttledScroll),
    () => document.removeEventListener('click', handleClick, true),
    () => document.removeEventListener('mouseenter', handleMouseEnter as EventListener, true),
    () => document.removeEventListener('mouseleave', handleMouseLeave as EventListener, true),
    () => document.removeEventListener('visibilitychange', handleVisibilityChange),
    () => sectionObserver?.disconnect(),
    () => bookingObserver.disconnect(),
  ];

  return () => {
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  };
}

export { calculateIntentScore, type SessionIntent };
