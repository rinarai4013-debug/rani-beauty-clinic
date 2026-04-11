/**
 * GLP-1 Program Announcement - Email Blast to Existing Patient Database
 *
 * Task 5: Warm announcement to existing Rani patients about the new
 * weight management program. Personal tone - these are people who already trust Rina.
 */

const CLINIC_PHONE = '(425) 207-8883';

export const GLP1_ANNOUNCEMENT = {
  subject: 'New at Rani: Medical Weight Management with Zepbound',
  preheader: 'Get prescribed brand-name Zepbound through our new concierge weight management program.',
  body: `
<div style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Header -->
  <div style="background-color: #0F1D2C; padding: 40px 32px; text-align: center;">
    <p style="color: #C9A96E; font-size: 12px; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 12px; font-family: 'Montserrat', sans-serif;">New Program</p>
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-family: 'Playfair Display', Georgia, serif; line-height: 1.3;">
      Medical Weight Management<br/>
      <span style="color: #C9A96E;">Is Here</span>
    </h1>
  </div>

  <!-- Body -->
  <div style="padding: 32px; background-color: #ffffff;">
    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px; font-family: 'Montserrat', sans-serif;">
      hi love!
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px; font-family: 'Montserrat', sans-serif;">
      i am so excited to share something new with you. many of you have been asking about GLP-1 weight loss medications like Zepbound and Wegovy - and i've been working hard to create the right program for our Rani family.
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px; font-family: 'Montserrat', sans-serif;">
      this is not some random online prescription service. this is a <strong>concierge weight management program</strong> with real support, real check-ins, and real results - right here at Rani in Renton.
    </p>

    <!-- How It Works -->
    <div style="background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h2 style="color: #0F1D2C; font-size: 18px; margin: 0 0 16px; font-family: 'Playfair Display', Georgia, serif;">How It Works</h2>
      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 10px; font-family: 'Montserrat', sans-serif;">
        <strong style="color: #C9A96E;">1.</strong> You enroll in one of our program tiers (starting at $299/mo)
      </p>
      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 10px; font-family: 'Montserrat', sans-serif;">
        <strong style="color: #C9A96E;">2.</strong> We facilitate your medical evaluation with a licensed provider
      </p>
      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0 0 10px; font-family: 'Montserrat', sans-serif;">
        <strong style="color: #C9A96E;">3.</strong> If approved, you get prescribed brand-name Zepbound or Wegovy
      </p>
      <p style="color: #333; font-size: 14px; line-height: 1.6; margin: 0; font-family: 'Montserrat', sans-serif;">
        <strong style="color: #C9A96E;">4.</strong> You self-inject at home + get ongoing support from us (check-ins, nutrition, body comp tracking)
      </p>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px; font-family: 'Montserrat', sans-serif;">
      the best part? <strong>brand-name medications only</strong> - no compounded alternatives. the real deal, shipped straight to your door through LillyDirect.
    </p>

    <!-- Existing Patient Perk -->
    <div style="border: 2px solid #C9A96E; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="color: #C9A96E; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px; font-family: 'Montserrat', sans-serif;">Rani Family Exclusive</p>
      <h3 style="color: #0F1D2C; font-size: 20px; margin: 0 0 8px; font-family: 'Playfair Display', Georgia, serif;">Priority Booking + First Month at Starter Pricing</h3>
      <p style="color: #666; font-size: 14px; margin: 0; font-family: 'Montserrat', sans-serif;">
        Existing patients get priority scheduling for medical evaluations<br/>
        and your first month at the $299 Starter rate regardless of tier chosen.
      </p>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 20px; font-family: 'Montserrat', sans-serif;">
      if you have been thinking about GLP-1 medications, or if you've tried other programs that didn't give you the support you needed, i would love to talk to you about this. just reply to this email or give us a call.
    </p>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://www.ranibeautyclinic.com/glp1" style="display: inline-block; background-color: #C9A96E; color: #0F1D2C; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; font-family: 'Montserrat', sans-serif;">
        Learn More About the Program
      </a>
    </div>

    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0 0 4px; font-family: 'Montserrat', sans-serif;">
      with so much love,
    </p>
    <p style="color: #333; font-size: 16px; line-height: 1.7; margin: 0; font-family: 'Montserrat', sans-serif;">
      <strong>Rina</strong> + the Rani Team
    </p>
    <p style="color: #666; font-size: 14px; margin: 8px 0 0; font-family: 'Montserrat', sans-serif;">
      ${CLINIC_PHONE} &middot; reply to this email anytime
    </p>
  </div>

  <!-- Footer -->
  <div style="background-color: #FAF8F5; padding: 20px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 12px; font-family: 'Montserrat', sans-serif;">
      Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056
    </p>
    <p style="margin: 4px 0 0; color: #aaa; font-size: 11px; font-family: 'Montserrat', sans-serif;">
      Medical evaluation required. Not everyone qualifies for GLP-1 medication.
      Program fee and medication cost are separate.
    </p>
  </div>
</div>`,
};
