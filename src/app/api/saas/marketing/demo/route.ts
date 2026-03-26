import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      clinicName,
      location,
      providers,
      monthlyRevenue,
      currentSoftware,
      interests,
      message,
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !clinicName) {
      return NextResponse.json(
        { error: 'First name, last name, email, and clinic name are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Generate demo credentials
    const demoId = `demo_${Date.now().toString(36)}`;
    const demoSlug = clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const demoPassword = `Demo${Math.random().toString(36).slice(2, 8)}!`;

    // In production:
    // 1. Save to Airtable "Demo Requests" table
    // 2. Create sandbox Airtable base with sample data
    // 3. Send welcome email with demo credentials via Resend
    // 4. Notify sales team via Slack webhook
    // 5. Create Calendly scheduling link
    // 6. Add to CRM pipeline

    const demoRequest = {
      id: demoId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      clinicName,
      location: location || null,
      providers: providers || null,
      monthlyRevenue: monthlyRevenue || null,
      currentSoftware: currentSoftware || null,
      interests: interests || [],
      message: message || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      demo: {
        url: `https://demo.ranios.com/${demoSlug}`,
        email: email,
        password: demoPassword,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      },
    };

    // Determine recommended plan based on inputs
    let recommendedPlan = 'starter';
    if (monthlyRevenue) {
      if (monthlyRevenue.includes('150K') || monthlyRevenue.includes('300K') || monthlyRevenue.includes('+')) {
        recommendedPlan = 'enterprise';
      } else if (monthlyRevenue.includes('75K') || monthlyRevenue.includes('50K')) {
        recommendedPlan = 'growth';
      }
    }

    // Score lead quality
    let leadScore = 0;
    if (email) leadScore += 10;
    if (phone) leadScore += 15;
    if (clinicName) leadScore += 10;
    if (providers) leadScore += 10;
    if (monthlyRevenue) leadScore += 20;
    if (currentSoftware && currentSoftware !== 'None') leadScore += 10;
    if (interests && interests.length > 0) leadScore += interests.length * 5;
    if (message) leadScore += 10;

    return NextResponse.json({
      success: true,
      message: 'Demo request received. Check your email for credentials.',
      demoRequest: {
        id: demoId,
        status: 'pending',
        demoUrl: demoRequest.demo.url,
        expiresAt: demoRequest.demo.expiresAt,
        recommendedPlan,
        leadScore: Math.min(leadScore, 100),
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process demo request. Please try again.' },
      { status: 500 }
    );
  }
}
