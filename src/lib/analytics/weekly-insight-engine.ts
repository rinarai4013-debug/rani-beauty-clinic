/**
 * Weekly Behavioral Insight Engine
 *
 * Structured framework for extracting actionable insights from
 * Clarity recordings, heatmaps, and behavioral data.
 *
 * This module defines the analysis process, scoring criteria,
 * and conversion improvement actions.
 */

// ─── Analysis Framework ─────────────────────────────────────────────────────

export interface WeeklyReviewChecklist {
  category: string;
  tasks: ReviewTask[];
}

export interface ReviewTask {
  task: string;
  where: string; // Where to look in Clarity
  what: string;  // What pattern to look for
  action: string; // What to do when found
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export const WEEKLY_REVIEW_CHECKLIST: WeeklyReviewChecklist[] = [
  {
    category: 'Rage Click Analysis',
    tasks: [
      {
        task: 'Review top rage-click elements',
        where: 'Clarity → Dashboard → Rage Clicks filter',
        what: 'Elements receiving 3+ rapid clicks - indicates broken UI, unclear buttons, or unresponsive elements',
        action: 'Fix: make element clickable, enlarge tap target, add loading state, or clarify that the element is not interactive',
        priority: 'critical',
      },
      {
        task: 'Check rage clicks on mobile vs desktop',
        where: 'Clarity → Recordings → Filter by device + rage click',
        what: 'Mobile-specific rage clicks often mean tap targets too small or overlapping elements',
        action: 'Increase button padding to min 44x44px, add spacing between clickable elements',
        priority: 'high',
      },
    ],
  },
  {
    category: 'Scroll Drop-off Analysis',
    tasks: [
      {
        task: 'Identify scroll drop-off zones on homepage',
        where: 'Clarity → Heatmaps → Scroll map → Homepage',
        what: 'Where does the majority (>50%) of users stop scrolling? Content below that line is invisible to most visitors',
        action: 'Move highest-converting content (CTAs, social proof, booking) above the drop-off line. Test removing low-value sections',
        priority: 'critical',
      },
      {
        task: 'Check scroll depth on service pages',
        where: 'Clarity → Heatmaps → Filter by /services, /wellness, individual service pages',
        what: 'If pricing section is below drop-off, users never see it',
        action: 'Move pricing higher, add sticky "Book Now" button, or add inline pricing near hero',
        priority: 'high',
      },
      {
        task: 'Measure scroll depth on mobile',
        where: 'Clarity → Heatmaps → Filter: mobile only',
        what: 'Mobile users typically scroll less - check if CTAs are visible without scrolling',
        action: 'Ensure primary CTA is above fold on mobile. Use sticky mobile CTA bar',
        priority: 'high',
      },
    ],
  },
  {
    category: 'Hesitation & Confusion Signals',
    tasks: [
      {
        task: 'Review recordings with hesitation on CTAs',
        where: 'Clarity → Recordings → Filter by custom tag: hesitation',
        what: 'Users hovering 2+ seconds over a CTA without clicking = unclear value prop or anxiety about commitment',
        action: 'Add microcopy under CTA (e.g., "Free consultation, no obligation"), reduce perceived commitment, add trust indicators',
        priority: 'high',
      },
      {
        task: 'Find scroll-back patterns',
        where: 'Clarity → Recordings → Filter by custom tag: confusion_signal',
        what: 'Users scrolling up repeatedly = looking for info they missed, or confused by page structure',
        action: 'Add anchor links / sticky nav, improve section hierarchy, add breadcrumbs on service pages',
        priority: 'medium',
      },
      {
        task: 'Check dead click zones',
        where: 'Clarity → Heatmaps → Click map',
        what: 'Areas receiving clicks that are not interactive = users expect a link/button there',
        action: 'Either make the element clickable or clearly style it as non-interactive',
        priority: 'medium',
      },
    ],
  },
  {
    category: 'Booking Funnel Analysis',
    tasks: [
      {
        task: 'Track booking widget abandonment',
        where: 'Clarity → Recordings → Filter by custom tag: booking_attempt',
        what: 'Users who open Mangomint widget but don\'t complete - note where they drop off in the booking flow',
        action: 'Report friction points to streamline booking. Consider fewer form fields, clearer service selection',
        priority: 'critical',
      },
      {
        task: 'Compare CTA performance by page',
        where: 'GA4 → Events → cta_click → breakdown by page_url and cta_type',
        what: 'Which pages drive the most booking clicks? Which CTAs convert best?',
        action: 'Double down on high-converting page layouts. Replicate successful CTA patterns across site',
        priority: 'high',
      },
      {
        task: 'Analyze phone call CTA usage',
        where: 'GA4 → Events → cta_click → Filter cta_type = phone_call',
        what: 'High phone call clicks may indicate users who want info but can\'t find it on the page',
        action: 'Add FAQ or info that answers the likely question. Consider live chat escalation',
        priority: 'medium',
      },
    ],
  },
  {
    category: 'Intent Segmentation Review',
    tasks: [
      {
        task: 'Review high-intent user behavior',
        where: 'Clarity → Recordings → Filter by custom tag: intent_segment = high_intent',
        what: 'What pages do high-intent users visit? What\'s their journey? Do they convert?',
        action: 'Optimize the path high-intent users take. Remove friction, add urgency signals',
        priority: 'high',
      },
      {
        task: 'Analyze bounce users',
        where: 'Clarity → Recordings → Filter by custom tag: intent_segment = bounce',
        what: 'Why are they bouncing? Wrong landing page? Slow load? Unclear value prop?',
        action: 'Improve hero messaging, speed, above-fold CTA. Match landing page to ad/search intent',
        priority: 'critical',
      },
      {
        task: 'Compare new vs returning visitors',
        where: 'Clarity → Recordings → Filter by custom tag: visitor_type',
        what: 'Do returning visitors convert at higher rate? What brings them back?',
        action: 'Add personalization for returning visitors. Show "Welcome back" or recent-viewed services',
        priority: 'medium',
      },
    ],
  },
  {
    category: 'Attention Zone Mapping',
    tasks: [
      {
        task: 'Identify highest-attention sections',
        where: 'Clarity → Heatmaps → Scroll + Click combined analysis',
        what: 'Sections with highest dwell time + click density = content users care about most',
        action: 'Keep these sections prominent. Ensure they have clear CTAs. Test adding social proof nearby',
        priority: 'medium',
      },
      {
        task: 'Find ignored sections',
        where: 'Clarity → Heatmaps → Zero/minimal click zones',
        what: 'Sections with high scroll-through speed and no clicks = content users skip',
        action: 'Test removing, condensing, or repositioning. Don\'t let ignored content push CTAs down',
        priority: 'medium',
      },
    ],
  },
];

// ─── Recording Analysis Protocol ─────────────────────────────────────────────

export interface RecordingAnalysisProtocol {
  step: number;
  instruction: string;
  lookFor: string[];
  notation: string; // How to log the finding
}

export const RECORDING_ANALYSIS_PROTOCOL: RecordingAnalysisProtocol[] = [
  {
    step: 1,
    instruction: 'Watch 10 random recordings from the past week (mix of mobile + desktop)',
    lookFor: [
      'Where do users pause for 3+ seconds? (attention or confusion)',
      'Where do they scroll back up? (missed info or re-reading)',
      'Where do they click that nothing happens? (dead clicks)',
      'Where do they leave the page? (abandonment point)',
    ],
    notation: 'Log: page URL, timestamp, behavior type, device',
  },
  {
    step: 2,
    instruction: 'Watch 5 recordings filtered by "rage click" tag',
    lookFor: [
      'What element are they rage-clicking?',
      'Is the element supposed to be clickable?',
      'Is there a loading delay they\'re frustrated with?',
      'Is the click target too small on mobile?',
    ],
    notation: 'Log: element, page, device, suggested fix',
  },
  {
    step: 3,
    instruction: 'Watch 5 recordings filtered by "booking_attempt" tag',
    lookFor: [
      'Do they complete the booking or abandon?',
      'If they abandon, at which step?',
      'Do they hesitate on service selection?',
      'Do they look for pricing before booking?',
    ],
    notation: 'Log: completed (yes/no), abandon step, hesitation points',
  },
  {
    step: 4,
    instruction: 'Watch 5 recordings from high-intent users (intent_segment = high_intent)',
    lookFor: [
      'What\'s their page journey? (which pages, in what order)',
      'Which CTA do they click?',
      'Do they check pricing/membership?',
      'How long before they take action?',
    ],
    notation: 'Log: journey path, conversion action, time to action',
  },
  {
    step: 5,
    instruction: 'Watch 5 recordings from bounced users (intent_segment = bounce)',
    lookFor: [
      'What landing page did they arrive on?',
      'How far did they scroll?',
      'Did they interact with anything?',
      'What might have made them stay?',
    ],
    notation: 'Log: landing page, scroll depth, interaction count, hypothesis',
  },
];

// ─── Heatmap Analysis Extraction ─────────────────────────────────────────────

export interface HeatmapAnalysisGuide {
  page: string;
  analysisPoints: {
    check: string;
    metric: string;
    threshold: string;
    action: string;
  }[];
}

export const HEATMAP_ANALYSIS_GUIDES: HeatmapAnalysisGuide[] = [
  {
    page: 'Homepage (/)',
    analysisPoints: [
      {
        check: 'Hero CTA click density',
        metric: 'Click concentration on "Book Consultation" vs "Call" buttons',
        threshold: 'If phone CTA gets >40% of clicks, users want to talk before booking',
        action: 'Add live chat or pre-consultation quiz to reduce phone dependency',
      },
      {
        check: 'Service panels engagement',
        metric: 'Click-through rate on service category panels',
        threshold: 'If any panel gets <5% of clicks, it may be poorly positioned or labeled',
        action: 'Reorder panels by click popularity, improve low-performing panel design',
      },
      {
        check: 'Below-fold visibility',
        metric: 'Scroll map - what % reach FAQ, testimonials, CTA banner',
        threshold: 'If <30% reach the CTA banner, move it higher',
        action: 'Add mid-page CTA or sticky booking button',
      },
    ],
  },
  {
    page: 'Services (/services)',
    analysisPoints: [
      {
        check: 'Most-clicked services',
        metric: 'Click heatmap on service cards',
        threshold: 'Top 3 clicked services should be positioned first',
        action: 'Reorder services by demand. Consider featuring top services in hero',
      },
      {
        check: 'Price visibility',
        metric: 'Do users scroll to/click on pricing elements?',
        threshold: 'If pricing elements are below 50% scroll line, most users miss them',
        action: 'Add price ranges directly on service cards',
      },
    ],
  },
  {
    page: 'Pricing (/pricing)',
    analysisPoints: [
      {
        check: 'Pricing tier comparison behavior',
        metric: 'Click + hover patterns across pricing tiers',
        threshold: 'If middle tier gets most attention, anchoring is working',
        action: 'If highest tier is ignored, make the value clearer or reduce the price gap',
      },
      {
        check: 'Financing/membership clicks',
        metric: 'Click rate on financing options vs direct booking',
        threshold: 'If >25% click financing, price is a barrier',
        action: 'Make financing more prominent, add monthly payment callouts on service pages',
      },
    ],
  },
  {
    page: 'Quiz (/quiz)',
    analysisPoints: [
      {
        check: 'Quiz completion funnel',
        metric: 'Drop-off between quiz steps',
        threshold: 'If >40% drop off at any single step, that question is problematic',
        action: 'Simplify the question, reduce options, or add progress indicator',
      },
      {
        check: 'Results page engagement',
        metric: 'Scroll depth + CTA clicks on quiz results',
        threshold: 'If <50% click the recommended service CTA, results aren\'t compelling enough',
        action: 'Add before/after photos, pricing, and social proof to results',
      },
    ],
  },
];

// ─── Conversion Improvement Actions ──────────────────────────────────────────

export interface ConversionAction {
  finding: string;
  category: 'ux' | 'copy' | 'layout' | 'trust' | 'speed' | 'mobile';
  impact: 'high' | 'medium' | 'low';
  effort: 'quick_win' | 'medium' | 'major';
  action: string;
  expectedLift: string;
}

export const CONVERSION_PLAYBOOK: ConversionAction[] = [
  // High impact, quick wins
  {
    finding: 'Users hesitate on booking CTA',
    category: 'copy',
    impact: 'high',
    effort: 'quick_win',
    action: 'Add microcopy: "Free consultation • No commitment • Takes 2 minutes"',
    expectedLift: '10-20% increase in CTA clicks',
  },
  {
    finding: 'High bounce rate on mobile',
    category: 'mobile',
    impact: 'high',
    effort: 'quick_win',
    action: 'Ensure hero CTA is visible without scrolling. Add sticky mobile CTA bar (already exists - verify it\'s prominent)',
    expectedLift: '15-25% mobile bounce reduction',
  },
  {
    finding: 'Users scroll past important sections',
    category: 'layout',
    impact: 'high',
    effort: 'quick_win',
    action: 'Reorder sections by engagement data. Put highest-attention sections first',
    expectedLift: '10-15% more CTA visibility',
  },
  {
    finding: 'Rage clicks on non-interactive elements',
    category: 'ux',
    impact: 'high',
    effort: 'quick_win',
    action: 'Make the element clickable (link to relevant service page) or visually distinguish as non-interactive',
    expectedLift: '5-10% frustration reduction, improved session quality',
  },
  // High impact, medium effort
  {
    finding: 'Users check pricing before booking',
    category: 'layout',
    impact: 'high',
    effort: 'medium',
    action: 'Add price ranges on service cards and hero. Don\'t hide pricing - transparency builds trust',
    expectedLift: '20-30% reduction in pricing-related bounces',
  },
  {
    finding: 'Low quiz completion rate',
    category: 'ux',
    impact: 'high',
    effort: 'medium',
    action: 'Reduce quiz to 3-5 questions. Add progress bar. Show partial results early',
    expectedLift: '25-40% increase in quiz completions',
  },
  {
    finding: 'Booking widget abandonment',
    category: 'ux',
    impact: 'high',
    effort: 'medium',
    action: 'Pre-select most popular service. Reduce form fields. Add estimated visit duration',
    expectedLift: '15-25% increase in booking completion',
  },
  // Trust signals
  {
    finding: 'New visitors don\'t convert',
    category: 'trust',
    impact: 'high',
    effort: 'medium',
    action: 'Add Google review rating + count near every CTA. Show before/after photos inline. Add "physician-supervised" badge',
    expectedLift: '10-20% conversion lift for new visitors',
  },
  {
    finding: 'Users read reviews section extensively',
    category: 'trust',
    impact: 'medium',
    effort: 'quick_win',
    action: 'Move reviews higher on page. Add review count to hero. Consider video testimonials',
    expectedLift: '5-10% conversion lift',
  },
  // Speed
  {
    finding: 'Slow page load on service pages',
    category: 'speed',
    impact: 'medium',
    effort: 'medium',
    action: 'Lazy-load below-fold images. Optimize hero image size. Defer non-critical scripts',
    expectedLift: '10-15% bounce reduction on slow connections',
  },
];

// ─── Weekly Report Template ──────────────────────────────────────────────────

export interface WeeklyInsightReport {
  weekOf: string;
  topFindings: {
    finding: string;
    evidence: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendedAction: string;
  }[];
  metrics: {
    totalSessions: number;
    bounceRate: number;
    avgScrollDepth: number;
    rageClickCount: number;
    hesitationCount: number;
    bookingAttempts: number;
    bookingCompletions: number;
    topPages: { page: string; sessions: number; avgScrollDepth: number }[];
    intentBreakdown: {
      high_intent: number;
      medium_intent: number;
      low_intent: number;
      bounce: number;
    };
  };
  actionsToTake: ConversionAction[];
  nextWeekFocus: string;
}

export function generateReportTemplate(weekOf: string): WeeklyInsightReport {
  return {
    weekOf,
    topFindings: [],
    metrics: {
      totalSessions: 0,
      bounceRate: 0,
      avgScrollDepth: 0,
      rageClickCount: 0,
      hesitationCount: 0,
      bookingAttempts: 0,
      bookingCompletions: 0,
      topPages: [],
      intentBreakdown: {
        high_intent: 0,
        medium_intent: 0,
        low_intent: 0,
        bounce: 0,
      },
    },
    actionsToTake: [],
    nextWeekFocus: '',
  };
}
