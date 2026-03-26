import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview';

  // In production: aggregate from Stripe API
  const billing = {
    overview: {
      mrr: 42800,
      arr: 513600,
      mrrGrowthRate: 23.7,
      failedPaymentsTotal: 1197,
      failedPaymentsCount: 3,
      upcomingRenewalsCount: 38,
      upcomingRenewalsMRR: 36200,
      trialConversionsExpected: 5,
      trialConversionsMRR: 1795,
    },

    mrrByPlan: [
      { plan: 'starter', mrr: 3800, tenants: 15, avgMRR: 253 },
      { plan: 'growth', mrr: 17600, tenants: 22, avgMRR: 800 },
      { plan: 'enterprise', mrr: 10000, tenants: 10, avgMRR: 1000 },
    ],

    mrrHistory: [
      { month: '2025-09', starter: 1800, growth: 3200, enterprise: 4000, total: 9000 },
      { month: '2025-10', starter: 2400, growth: 5500, enterprise: 4000, total: 11900 },
      { month: '2025-11', starter: 2800, growth: 7200, enterprise: 5000, total: 15000 },
      { month: '2025-12', starter: 3000, growth: 8800, enterprise: 6000, total: 17800 },
      { month: '2026-01', starter: 3200, growth: 11200, enterprise: 8000, total: 22400 },
      { month: '2026-02', starter: 3600, growth: 14400, enterprise: 9000, total: 27000 },
      { month: '2026-03', starter: 3800, growth: 17600, enterprise: 10000, total: 31400 },
    ],

    failedPayments: [
      {
        id: 'fp_001',
        tenantId: 't_005',
        tenantName: 'Bella Vita Med Spa',
        amount: 499,
        plan: 'growth',
        failedAt: '2026-03-22T08:00:00Z',
        attempts: 3,
        nextRetry: '2026-03-25T08:00:00Z',
        reason: 'Card declined',
        stripePaymentIntentId: 'pi_mock_001',
      },
      {
        id: 'fp_002',
        tenantId: 't_003',
        tenantName: 'Luxe Skin Studio',
        amount: 199,
        plan: 'starter',
        failedAt: '2026-03-20T08:00:00Z',
        attempts: 2,
        nextRetry: '2026-03-24T08:00:00Z',
        reason: 'Insufficient funds',
        stripePaymentIntentId: 'pi_mock_002',
      },
      {
        id: 'fp_003',
        tenantId: 't_015',
        tenantName: 'Nova Aesthetics',
        amount: 499,
        plan: 'growth',
        failedAt: '2026-03-18T08:00:00Z',
        attempts: 1,
        nextRetry: '2026-03-21T08:00:00Z',
        reason: 'Card expired',
        stripePaymentIntentId: 'pi_mock_003',
      },
    ],

    upcomingRenewals: [
      { tenantId: 't_001', tenantName: 'Glow Medical Spa', plan: 'growth', mrr: 499, renewsAt: '2026-04-01', churnRisk: 'low' },
      { tenantId: 't_004', tenantName: 'Derma Elite Clinic', plan: 'growth', mrr: 499, renewsAt: '2026-04-01', churnRisk: 'low' },
      { tenantId: 't_007', tenantName: 'Zen Medspa & Wellness', plan: 'enterprise', mrr: 999, renewsAt: '2026-04-01', churnRisk: 'low' },
      { tenantId: 't_008', tenantName: 'Aura Skin Clinic', plan: 'starter', mrr: 199, renewsAt: '2026-04-05', churnRisk: 'medium' },
      { tenantId: 't_012', tenantName: 'Bloom Med Spa', plan: 'growth', mrr: 499, renewsAt: '2026-04-10', churnRisk: 'low' },
      { tenantId: 't_009', tenantName: 'Ethereal Med Aesthetics', plan: 'growth', mrr: 499, renewsAt: '2026-04-15', churnRisk: 'high' },
    ],

    forecast: {
      next6Months: [
        { month: '2026-04', projected: 48500, low: 44000, high: 53000 },
        { month: '2026-05', projected: 55200, low: 49000, high: 61000 },
        { month: '2026-06', projected: 62800, low: 55000, high: 70000 },
        { month: '2026-07', projected: 71400, low: 62000, high: 80000 },
        { month: '2026-08', projected: 81000, low: 70000, high: 92000 },
        { month: '2026-09', projected: 92000, low: 78000, high: 105000 },
      ],
      assumptions: {
        monthlyGrowthRate: 15,
        churnRate: 3.2,
        avgNewTenantMRR: 450,
        expansionRate: 5,
      },
    },
  };

  if (view === 'failed') {
    return NextResponse.json({ failedPayments: billing.failedPayments });
  }
  if (view === 'renewals') {
    return NextResponse.json({ upcomingRenewals: billing.upcomingRenewals });
  }
  if (view === 'forecast') {
    return NextResponse.json({ forecast: billing.forecast });
  }

  return NextResponse.json(billing);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, paymentId, tenantId } = body;

    if (action === 'retry_payment') {
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
      }
      // In production: call Stripe to retry the payment intent
      return NextResponse.json({
        message: `Payment ${paymentId} retry initiated`,
        status: 'processing',
      });
    }

    if (action === 'cancel_subscription') {
      if (!tenantId) {
        return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
      }
      // In production: cancel Stripe subscription, update tenant status
      return NextResponse.json({
        message: `Subscription for tenant ${tenantId} will be cancelled at period end`,
        status: 'pending_cancellation',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
