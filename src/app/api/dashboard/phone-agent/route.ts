import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { cache, TTL } from '@/lib/cache';
import {
  configurePhoneAgent,
  getVapiCallLogs,
  computeAnalyticsFromCallLogs,
  calculatePerformanceMetrics,
  generateRecommendations,
} from '@/lib/phone/vapi-agent';
import type { CallAnalytics } from '@/lib/phone/vapi-agent';

const CACHE_KEY = 'phone-agent';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_executive')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cached = cache.get<ReturnType<typeof buildResponse>>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const setup = configurePhoneAgent();
    const vapiApiKey = process.env.VAPI_API_KEY;

    if (vapiApiKey) {
      // Real Vapi integration — fetch actual call logs
      const logsResult = await getVapiCallLogs(vapiApiKey);

      if (logsResult.success && logsResult.calls.length > 0) {
        const realAnalytics = computeAnalyticsFromCallLogs(logsResult.calls);
        const realMetrics = calculatePerformanceMetrics(realAnalytics);
        const realRecs = generateRecommendations(realAnalytics, realMetrics);
        const response = buildResponse({
          ...setup,
          analytics: realAnalytics,
          performanceMetrics: realMetrics,
          recommendations: realRecs,
        }, true);
        cache.set(CACHE_KEY, response, TTL.RELAXED);
        return NextResponse.json(response);
      }

      // API key set but no calls yet
      const response = buildResponse({
        ...setup,
        analytics: null,
        performanceMetrics: null,
        recommendations: [],
      }, true);
      cache.set(CACHE_KEY, response, TTL.RELAXED);
      return NextResponse.json(response);
    }

    // No VAPI_API_KEY — return config only, no analytics
    const response = buildResponse({
      ...setup,
      analytics: null,
      performanceMetrics: null,
      recommendations: [],
    }, false);
    cache.set(CACHE_KEY, response, TTL.RELAXED);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Phone agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure phone agent' },
      { status: 500 }
    );
  }
}

function buildResponse(
  data: {
    assistantConfig: ReturnType<typeof configurePhoneAgent>['assistantConfig'];
    systemPrompt: string;
    callFlows: ReturnType<typeof configurePhoneAgent>['callFlows'];
    analytics: CallAnalytics | null;
    performanceMetrics: ReturnType<typeof configurePhoneAgent>['performanceMetrics'] | null;
    recommendations: ReturnType<typeof configurePhoneAgent>['recommendations'];
  },
  analyticsAvailable: boolean
) {
  return {
    success: true,
    data: {
      assistantConfig: data.assistantConfig,
      systemPrompt: data.systemPrompt,
      callFlows: data.callFlows,
      analytics: data.analytics,
      performanceMetrics: data.performanceMetrics,
      recommendations: data.recommendations,
      analyticsAvailable,
      ...(analyticsAvailable
        ? {}
        : { message: 'Connect Vapi API key to see real call analytics' }),
    },
    generatedAt: new Date().toISOString(),
  };
}
