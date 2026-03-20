import { NextResponse } from 'next/server';
import {
  WEEKLY_REVIEW_CHECKLIST,
  RECORDING_ANALYSIS_PROTOCOL,
  HEATMAP_ANALYSIS_GUIDES,
  CONVERSION_PLAYBOOK,
  generateReportTemplate,
} from '@/lib/analytics/weekly-insight-engine';

/**
 * GET /api/dashboard/behavioral-insights
 *
 * Returns the full behavioral insight engine framework:
 * - Weekly review checklist (what to look at in Clarity)
 * - Recording analysis protocol (how to watch recordings)
 * - Heatmap analysis guides (per-page analysis points)
 * - Conversion playbook (actions to take from findings)
 * - Report template (structure for weekly reports)
 *
 * Query params:
 *   ?week=2026-03-17  — generates a report template for that week
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const week = searchParams.get('week') || new Date().toISOString().split('T')[0];

  return NextResponse.json({
    weeklyChecklist: WEEKLY_REVIEW_CHECKLIST,
    recordingProtocol: RECORDING_ANALYSIS_PROTOCOL,
    heatmapGuides: HEATMAP_ANALYSIS_GUIDES,
    conversionPlaybook: CONVERSION_PLAYBOOK,
    reportTemplate: generateReportTemplate(week),
    clarityDashboardUrl: 'https://clarity.microsoft.com/projects/view/vnjnfo8pn5',
    customFilters: {
      description: 'Use these Clarity custom tag filters to segment recordings',
      filters: [
        { tag: 'intent_segment', values: ['high_intent', 'medium_intent', 'low_intent', 'bounce'] },
        { tag: 'visitor_type', values: ['new', 'returning'] },
        { tag: 'device_type', values: ['mobile', 'tablet', 'desktop'] },
        { tag: 'traffic_source', values: ['google', 'social', 'direct', 'yelp', 'referral'] },
        { tag: 'scroll_depth', values: ['25%', '50%', '75%', '90%', '100%'] },
        { tag: 'rage_click', values: ['(any element selector)'] },
        { tag: 'hesitation', values: ['(CTA label where user hesitated)'] },
        { tag: 'booking_attempt', values: ['mangomint_opened', 'typeform_opened'] },
        { tag: 'confusion_signal', values: ['scroll_back'] },
        { tag: 'landing_page', values: ['(page path)'] },
        { tag: 'utm_source', values: ['(campaign source)'] },
        { tag: 'utm_campaign', values: ['(campaign name)'] },
      ],
    },
    ga4Events: {
      description: 'These behavioral events are now tracked in GA4/GTM',
      events: [
        { name: 'scroll_depth', params: ['depth_percent', 'time_on_page_ms', 'page_url'] },
        { name: 'cta_click', params: ['cta_label', 'cta_type', 'page_url', 'page_section'] },
        { name: 'rage_click', params: ['element', 'selector', 'click_count', 'page_url', 'page_section'] },
        { name: 'hesitation_detected', params: ['element', 'hover_duration_ms', 'did_click', 'page_url'] },
        { name: 'booking_widget_opened', params: ['source', 'page_url'] },
        { name: 'consultation_form_opened', params: ['source', 'page_url'] },
        { name: 'page_abandonment', params: ['session_duration_ms', 'max_scroll_depth', 'cta_interactions', 'intent_score', 'intent_segment'] },
        { name: 'session_start_enriched', params: ['device_type', 'visitor_type', 'visit_count', 'traffic_source', 'landing_page'] },
        { name: 'behavioral_confusion_signal', params: ['signal_type', 'scroll_back_count', 'page_url'] },
      ],
    },
  });
}
