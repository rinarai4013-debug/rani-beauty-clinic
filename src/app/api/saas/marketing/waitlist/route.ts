import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, clinicName, source } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // In production:
    // 1. Check for duplicates in Airtable "Waitlist" table
    // 2. Add to Airtable with metadata (source, timestamp, IP)
    // 3. Send confirmation email via Resend
    // 4. Add to email marketing list (SendGrid)
    // 5. Trigger n8n workflow for lead nurturing sequence
    // 6. Track conversion source for attribution

    const waitlistEntry = {
      id: `wl_${Date.now().toString(36)}`,
      email,
      clinicName: clinicName || null,
      source: source || 'marketing_site',
      status: 'active',
      position: Math.floor(Math.random() * 50) + 48, // Mock position
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'You have been added to the waitlist!',
      entry: {
        id: waitlistEntry.id,
        position: waitlistEntry.position,
        estimatedAccess: 'Within 48 hours',
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    // Return waitlist stats (admin view)
    return NextResponse.json({
      stats: {
        totalSignups: 94,
        thisWeek: 12,
        conversionRate: 34, // % of waitlist that started trial
        topSources: [
          { source: 'organic', count: 38 },
          { source: 'referral', count: 24 },
          { source: 'social', count: 18 },
          { source: 'paid', count: 14 },
        ],
      },
    });
  }

  // Check waitlist status for specific email
  // In production: query Airtable
  return NextResponse.json({
    email,
    status: 'active',
    position: 52,
    joinedAt: '2026-03-20T14:30:00Z',
  });
}
