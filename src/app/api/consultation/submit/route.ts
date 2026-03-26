import { NextRequest, NextResponse } from 'next/server';
import { Tables, createRecord } from '@/lib/airtable/client';

// Rate limiting
const submissions = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_SUBMISSIONS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const key = `${ip}`;
  const lastSubmit = submissions.get(key) || 0;

  // Clean old entries
  for (const [k, v] of submissions) {
    if (now - v > RATE_LIMIT_WINDOW) submissions.delete(k);
  }

  if (now - lastSubmit < RATE_LIMIT_WINDOW / MAX_SUBMISSIONS) return true;
  submissions.set(key, now);
  return false;
}

// Map internal IDs to exact Airtable select option names
function mapConcernsToAirtable(concerns: string[]): string[] {
  const map: Record<string, string> = {
    'acne': 'Acne',
    'aging-skin': 'Fine Lines',
    'hyperpigmentation': 'Hyperpigmentation',
    'skin-laxity': 'Laxity or loose skin',
    'unwanted-hair': 'Hair Removal',
    'dull-skin': 'Texture',
    'body-contouring': 'Laxity or loose skin',
    'sun-damage': 'Pigmentation',
    'large-pores': 'Texture',
  };
  return concerns.map(c => map[c]).filter(Boolean);
}

function mapTargetsToAirtable(areas: string[]): string[] {
  const map: Record<string, string> = {
    'forehead': 'Face', 'cheeks': 'Face', 'nose': 'Face', 'chin': 'Face',
    'jawline': 'Face', 'under-eyes': 'Face', 'lips': 'Face',
    'neck': 'Neck', 'chest': 'Body', 'arms': 'Body',
    'abdomen': 'Body', 'back': 'Back', 'legs': 'Body', 'bikini': 'Body',
    'face': 'Face',
  };
  return [...new Set(areas.map(a => map[a]).filter(Boolean))];
}

function mapInterestsToAirtable(interests: string[]): string[] {
  const map: Record<string, string> = {
    'facial': 'Hydrafacial',
    'laser-hair-removal': 'Laser Hair Removal',
    'rf-microneedling': 'Radiofrequency Microneedling',
    'skin-tightening': 'Sofwave',
    'chemical-peel': 'Peels',
    'laser': 'Laser Facials',
    'injectables': 'Injectables',
    'wellness': 'Skin Boosters',
    'weight-management': 'Hormones',
    'skincare': 'Skin Boosters',
    'hair': 'Laser Hair Removal',
  };
  return [...new Set(interests.map(i => map[i]).filter(Boolean))];
}

function mapSkinTypeToAirtable(skinType: string): string[] {
  const map: Record<string, string> = {
    'normal': 'Balanced',
    'dry': 'Dry',
    'oily': 'Oily',
    'combination': 'Combination',
    'sensitive': 'Sensitive',
  };
  return [map[skinType] || 'Combination'];
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many submissions. Please wait a moment.' }, { status: 429 });
    }

    // Parse FormData - wizard sends JSON in 'data' field + optional 'photos' files
    const formData = await req.formData();
    const rawData = formData.get('data');
    if (!rawData || typeof rawData !== 'string') {
      return NextResponse.json({ error: 'Missing form data' }, { status: 400 });
    }

    const body = JSON.parse(rawData);

    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      skinConcerns,
      targetAreas,
      treatmentInterests,
      skinType,
      treatmentHistory,
      currentRoutine,
      allergies,
      goals,
      timeline,
      eventDate,
      budget,
      smsConsent,
    } = body;

    // Photos are sent as FormData files (stored as base64 URLs for now)
    const photoFiles = formData.getAll('photos') as File[];
    const photoUrls: string[] = [];
    for (const photo of photoFiles) {
      if (photo && photo.size > 0) {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const base64 = buffer.toString('base64');
        const mimeType = photo.type || 'image/jpeg';
        photoUrls.push(`data:${mimeType};base64,${base64}`);
      }
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Sanitize inputs - prevent email header injection and XSS
    const sanitize = (val: string): string =>
      val.replace(/[\r\n]/g, '').trim();
    const escapeHtml = (val: string): string =>
      val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeEmail = sanitize(email);
    const safeFirstName = escapeHtml(sanitize(firstName));
    const safeLastName = escapeHtml(sanitize(lastName));
    const safeGoals = goals ? escapeHtml(sanitize(goals)) : '';

    // Create Airtable record in Client Intakes table
    // Field names from RaniOS/airtable/complete_schema.json
    // Only write fields confirmed in the schema to avoid UNKNOWN_FIELD_NAME errors
    // Build all intake data as JSON for the Raw Typeform Data field
    const allIntakeData = {
      firstName, lastName, email: safeEmail, phone, dob,
      skinConcerns, targetAreas, treatmentInterests,
      skinType, treatmentHistory, currentRoutine, allergies,
      goals, timeline, eventDate, budget, smsConsent,
      source: 'native-glow-intake',
      submittedAt: new Date().toISOString(),
    };

    // Write to Airtable - progressive field discovery
    // The live Airtable schema may differ from exported schema
    // Strategy: try fields progressively, dropping any that fail
    const allIntakeJson = JSON.stringify(allIntakeData, null, 2);

    // Field sets ordered by likelihood of existence
    const fieldSets = [
      // Attempt 1: Core fields + multi-selects (mapped to exact Airtable option names)
      {
        'Full Name': `${firstName} ${lastName}`.trim(),
        'Phone Number': phone,
        'Email': safeEmail,
        ...(dob && { 'Date of Birth': dob }),
        ...(skinConcerns?.length && { 'Top Skin Concerns': mapConcernsToAirtable(skinConcerns) }),
        ...(targetAreas?.length && { 'Target Areas': mapTargetsToAirtable(targetAreas) }),
        ...(treatmentInterests?.length && { 'Treatment Interests': mapInterestsToAirtable(treatmentInterests) }),
        ...(skinType && { 'Skin Type': mapSkinTypeToAirtable(skinType) }),
        ...(treatmentHistory && { 'Cosmetic Treatment History': treatmentHistory }),
        ...(allergies && { 'Known Skin Allergies': allergies }),
        ...(timeline === 'event' && { 'Preparing for Special Occasion?': true }),
        'Referral Source': 'Website Glow Intake',
      },
      // Attempt 2: Core fields only (multi-selects may have mismatched option names)
      {
        'Full Name': `${firstName} ${lastName}`.trim(),
        'Phone Number': phone,
      },
      // Attempt 3: Absolute minimum
      {
        'Full Name': `${firstName} ${lastName}`.trim(),
      },
    ];

    let recordId = '';
    for (const fields of fieldSets) {
      try {
        recordId = await createRecord(Tables.intakes(), fields);
        break; // Success
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isFieldError = errMsg.includes('UNKNOWN_FIELD_NAME') || errMsg.includes('INVALID_MULTIPLE_CHOICE') || errMsg.includes('Insufficient permissions');
        if (!isFieldError) throw err;
        const fieldMatch = (err as Error).message?.match(/Unknown field name: "(.+?)"/);
        console.warn(`[Consultation] Field "${fieldMatch?.[1]}" not found in Airtable, trying simpler field set`);
        continue;
      }
    }

    if (!recordId) {
      throw new Error('Failed to create Airtable record after all attempts');
    }

    // Send email notification to clinic (replaces Typeform email alerts)
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const concernsList = (skinConcerns || []).join(', ') || 'Not specified';
      const interestsList = (treatmentInterests || []).join(', ') || 'Not specified';

      resend.emails.send({
        from: process.env.FROM_EMAIL || 'Rani Beauty Clinic <noreply@ranibeautyclinic.com>',
        to: process.env.CONTACT_EMAIL || 'info@ranibeautyclinic.com',
        replyTo: safeEmail,
        subject: `New Glow Intake - ${safeFirstName} ${safeLastName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #0F1D2C; padding: 24px; text-align: center;">
              <h1 style="color: #C9A96E; margin: 0; font-size: 24px;">New Consultation Intake</h1>
              <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0; font-size: 14px;">via Glow Intake Form</p>
            </div>
            <div style="padding: 24px; background-color: #ffffff;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C; width: 140px;">Name</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${safeFirstName} ${safeLastName}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Email</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;"><a href="mailto:${escapeHtml(safeEmail)}">${escapeHtml(safeEmail)}</a></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Phone</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;"><a href="tel:${escapeHtml(sanitize(phone))}">${escapeHtml(sanitize(phone))}</a></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Concerns</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${concernsList}</td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Interests</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${interestsList}</td></tr>
                ${skinType ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Skin Type</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${skinType}</td></tr>` : ''}
                ${timeline ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Timeline</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${timeline}</td></tr>` : ''}
                ${budget ? `<tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #0F1D2C;">Budget</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #555;">${budget}</td></tr>` : ''}
              </table>
              ${safeGoals ? `<div style="margin-top: 16px; padding: 16px; background: #F8F6F1; border-radius: 8px;"><p style="margin: 0 0 4px; font-weight: bold; color: #0F1D2C; font-size: 13px;">Goals</p><p style="margin: 0; color: #555; font-size: 14px;">${safeGoals}</p></div>` : ''}
            </div>
            <div style="padding: 16px 24px; background-color: #F8F6F1; text-align: center;">
              <p style="margin: 0; color: #888; font-size: 12px;">Airtable Record: ${recordId} | Source: Native Glow Intake</p>
            </div>
          </div>
        `,
      }).catch(() => {
        // Fire-and-forget - don't block response
      });
    }

    // Trigger n8n webhook for intake intelligence processing
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(`${webhookUrl}/webhook/intake-submitted`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId,
          firstName,
          lastName,
          email,
          phone,
          skinConcerns,
          treatmentInterests,
          source: 'native-consultation-form',
        }),
      }).catch(() => {
        // Fire-and-forget - don't block response
      });
    }

    return NextResponse.json({
      success: true,
      recordId,
      message: 'Thank you! We\'ll be in touch within 24 hours.',
    });
  } catch (error) {
    console.error('[Consultation Submit Error]', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or call us at (425) 539-4440.' },
      { status: 500 }
    );
  }
}
