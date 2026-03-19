import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { logEvent } from '@/lib/logging/structured-logger';

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = getClientIP(request);
  const { allowed, resetIn } = rateLimit('checkout', ip, RATE_LIMITS.FORM);
  if (!allowed) return rateLimitResponse(resetIn);

  try {
    const { tier, planId, clientEmail, clientName } = await request.json();

    if (!tier || !planId) {
      return NextResponse.json({ error: 'tier and planId are required' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Fallback to Mangomint booking if Stripe not configured
      return NextResponse.json({
        url: 'https://booking.mangomint.com/876418',
        fallback: true,
      });
    }

    // Dynamic import to avoid build issues if stripe isn't installed
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    // Deposit amount — $250 consultation deposit (applied to treatment)
    const depositAmount = 25000; // cents

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: clientEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Rani Beauty Clinic — ${tier} Consultation Deposit`,
              description: `Fully refundable $250 deposit for your ${tier} treatment plan. Applied to your first treatment.`,
              images: ['https://www.ranibeautyclinic.com/og-image.jpg'],
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        planId,
        tier,
        clientName: clientName || '',
        source: 'treatment_plan_page',
      },
      success_url: `https://www.ranibeautyclinic.com/thank-you?plan=${planId}&tier=${tier}`,
      cancel_url: `https://www.ranibeautyclinic.com/plan/${planId}`,
    });

    logEvent('api', 'info', 'Stripe checkout session created', {
      planId,
      tier,
      sessionId: session.id,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    logEvent('api', 'error', 'Stripe checkout error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
