/**
 * Ads War Machine - Creative Library
 *
 * Pre-built creative assets for Meta and Google ad campaigns.
 * Organized by service, season, holiday, and audience segment.
 *
 * Brand voice: Luxury, confident, clinically-assured.
 * CRITICAL: Always "injection" - never "infusion."
 */

// ── TYPES ──

export interface Headline {
  text: string;
  service: string;
  platform: 'meta' | 'google' | 'both';
  characterCount: number;
  style: 'emotional' | 'benefit' | 'stat' | 'question' | 'urgency' | 'social_proof';
}

export interface Description {
  text: string;
  service: string;
  platform: 'meta' | 'google' | 'both';
  characterCount: number;
  angle: string;
}

export interface CTAAsset {
  text: string;
  style: 'direct' | 'soft' | 'urgency' | 'curiosity' | 'value';
  bestFor: string[];
}

export interface SocialProofSnippet {
  text: string;
  type: 'stat' | 'review' | 'credential' | 'count';
  service?: string;
}

export interface UrgencyElement {
  text: string;
  type: 'scarcity' | 'time' | 'seasonal' | 'social' | 'event';
  applicableMonths?: number[];
}

export interface TrustSignal {
  text: string;
  type: 'credential' | 'safety' | 'guarantee' | 'experience' | 'compliance';
}

export interface SeasonalCopy {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  service: string;
  headline: string;
  body: string;
  cta: string;
}

export interface HolidayCopy {
  holiday: string;
  month: number;
  headline: string;
  body: string;
  cta: string;
  services: string[];
}

// ── HEADLINES (50) ──

export const HEADLINES: Headline[] = [
  // GLP-1 / Weight Loss
  { text: 'Medical Weight Loss That Delivers', service: 'glp1', platform: 'both', characterCount: 34, style: 'benefit' },
  { text: 'Physician-Guided GLP-1 Program', service: 'glp1', platform: 'google', characterCount: 30, style: 'benefit' },
  { text: 'Drop the Weight, Not the Energy', service: 'glp1', platform: 'meta', characterCount: 32, style: 'emotional' },
  { text: 'Finally, a Weight Loss Plan That Respects Your Body', service: 'glp1', platform: 'meta', characterCount: 49, style: 'emotional' },
  { text: 'GLP-1 Weight Loss from $399/mo', service: 'glp1', platform: 'google', characterCount: 30, style: 'benefit' },
  { text: 'Your Scale Doesn\'t Define You, But We Can Help', service: 'glp1', platform: 'meta', characterCount: 46, style: 'emotional' },
  { text: '89% of Clients See Results in 8 Weeks', service: 'glp1', platform: 'both', characterCount: 37, style: 'stat' },
  // Botox
  { text: 'Botox That Looks Like You', service: 'botox', platform: 'both', characterCount: 25, style: 'benefit' },
  { text: '15 Minutes to Smoother Skin', service: 'botox', platform: 'both', characterCount: 27, style: 'benefit' },
  { text: 'Preventative Botox in Your 20s?', service: 'botox', platform: 'meta', characterCount: 31, style: 'question' },
  { text: 'Natural Results, Expert Hands', service: 'botox', platform: 'google', characterCount: 29, style: 'benefit' },
  { text: 'When Did You Last Look Rested?', service: 'botox', platform: 'meta', characterCount: 30, style: 'question' },
  // Fillers
  { text: 'Restore Volume Without Looking "Done"', service: 'fillers', platform: 'both', characterCount: 37, style: 'benefit' },
  { text: 'Lip Filler by Board-Certified Experts', service: 'fillers', platform: 'google', characterCount: 37, style: 'benefit' },
  { text: 'The Subtle Difference Everyone Notices', service: 'fillers', platform: 'meta', characterCount: 38, style: 'social_proof' },
  // HydraFacial
  { text: 'The Lunch-Break Glow-Up', service: 'hydrafacial', platform: 'both', characterCount: 23, style: 'benefit' },
  { text: 'Red Carpet Skin in 60 Minutes', service: 'hydrafacial', platform: 'both', characterCount: 29, style: 'benefit' },
  { text: 'What Is Your Skin Telling You?', service: 'hydrafacial', platform: 'meta', characterCount: 30, style: 'question' },
  { text: 'Signature HydraFacial from $249', service: 'hydrafacial', platform: 'google', characterCount: 31, style: 'benefit' },
  // Laser Hair Removal
  { text: 'Never Shave Again. Seriously.', service: 'laser_hair', platform: 'both', characterCount: 29, style: 'benefit' },
  { text: 'Smooth Skin All Year Round', service: 'laser_hair', platform: 'both', characterCount: 26, style: 'benefit' },
  { text: 'Laser Hair Removal Packages from $800', service: 'laser_hair', platform: 'google', characterCount: 37, style: 'benefit' },
  // Sofwave
  { text: 'A Facelift Without the Scalpel', service: 'sofwave', platform: 'both', characterCount: 30, style: 'benefit' },
  { text: 'Tighter Skin, Zero Downtime', service: 'sofwave', platform: 'both', characterCount: 27, style: 'benefit' },
  { text: 'FDA-Cleared Skin Tightening', service: 'sofwave', platform: 'google', characterCount: 27, style: 'benefit' },
  // RF Microneedling
  { text: 'Erase Scars. Rebuild Collagen.', service: 'rf_microneedling', platform: 'both', characterCount: 30, style: 'benefit' },
  { text: 'Turn Back the Clock on Your Skin', service: 'rf_microneedling', platform: 'meta', characterCount: 32, style: 'emotional' },
  // Wellness Injections
  { text: 'One Injection. One Week of Energy.', service: 'wellness', platform: 'both', characterCount: 33, style: 'benefit' },
  { text: 'Your Immune System Deserves Backup', service: 'wellness', platform: 'meta', characterCount: 34, style: 'emotional' },
  { text: 'B12 + Glutathione + Tri-Immune', service: 'wellness', platform: 'google', characterCount: 30, style: 'benefit' },
  // NAD+
  { text: 'Your Cells Are Asking for Help', service: 'nad', platform: 'meta', characterCount: 30, style: 'emotional' },
  { text: 'NAD+ Therapy from $150', service: 'nad', platform: 'google', characterCount: 22, style: 'benefit' },
  { text: 'Cellular Energy. Restored.', service: 'nad', platform: 'both', characterCount: 26, style: 'benefit' },
  // Peptides
  { text: 'Peptide Therapy for Peak Performance', service: 'peptides', platform: 'both', characterCount: 36, style: 'benefit' },
  { text: 'Recovery at the Cellular Level', service: 'peptides', platform: 'meta', characterCount: 30, style: 'benefit' },
  // VI Peel
  { text: 'Clear Skin in 7 Days', service: 'vi_peel', platform: 'both', characterCount: 20, style: 'benefit' },
  { text: 'The Peel That Erases Sun Damage', service: 'vi_peel', platform: 'meta', characterCount: 31, style: 'benefit' },
  // PicoWay
  { text: 'Say Goodbye to Dark Spots', service: 'picoway', platform: 'both', characterCount: 25, style: 'benefit' },
  { text: 'Laser Pigment Removal from $350', service: 'picoway', platform: 'google', characterCount: 32, style: 'benefit' },
  // PRX-T33
  { text: 'Biorevitalization Without Needles', service: 'prx', platform: 'both', characterCount: 33, style: 'benefit' },
  { text: 'Instant Skin Renewal, No Peeling', service: 'prx', platform: 'meta', characterCount: 32, style: 'benefit' },
  // Brand / General
  { text: 'Rani Beauty Clinic - Renton, WA', service: 'brand', platform: 'google', characterCount: 30, style: 'benefit' },
  { text: 'Where Science Meets Luxury', service: 'brand', platform: 'both', characterCount: 26, style: 'emotional' },
  { text: 'Physician-Supervised Medspa', service: 'brand', platform: 'google', characterCount: 27, style: 'benefit' },
  { text: '5-Star Rated Medspa in Renton', service: 'brand', platform: 'both', characterCount: 29, style: 'social_proof' },
  { text: 'Book Your Free Consultation', service: 'brand', platform: 'google', characterCount: 27, style: 'benefit' },
  { text: 'The Medspa Renton Trusts', service: 'brand', platform: 'both', characterCount: 25, style: 'social_proof' },
  { text: 'Your Transformation Starts Here', service: 'brand', platform: 'meta', characterCount: 31, style: 'emotional' },
  { text: 'Confidence Is Not a Luxury', service: 'brand', platform: 'meta', characterCount: 26, style: 'emotional' },
  { text: 'Experience the Rani Difference', service: 'brand', platform: 'both', characterCount: 30, style: 'benefit' },
];

// ── DESCRIPTIONS (30) ──

export const DESCRIPTIONS: Description[] = [
  // GLP-1
  { text: 'Physician-supervised GLP-1 weight loss program starting at $399/mo. Weekly check-ins, personalized dosing, and real results. Book your consultation today.', service: 'glp1', platform: 'both', characterCount: 155, angle: 'program_overview' },
  { text: 'Stop fighting your body. Our medical weight loss program works with your biology to deliver sustainable results. Physician-supervised, compassionate care in Renton.', service: 'glp1', platform: 'meta', characterCount: 161, angle: 'empathy' },
  { text: 'GLP-1 injections with monthly monitoring, body composition tracking, and nutritional guidance. Trusted by hundreds of patients in the Renton area.', service: 'glp1', platform: 'google', characterCount: 148, angle: 'clinical' },
  // Botox
  { text: 'Expert Botox injections that look natural, not frozen. 15-minute appointment, zero downtime. Physician-supervised care at Rani Beauty Clinic, Renton WA.', service: 'botox', platform: 'both', characterCount: 152, angle: 'natural_results' },
  { text: 'Whether you are preventing or correcting, our Botox specialists create results that look like the best version of you. Walk-ins welcome.', service: 'botox', platform: 'meta', characterCount: 139, angle: 'personalization' },
  // HydraFacial
  { text: 'Deep cleanse, exfoliate, and hydrate in one 60-minute session. The HydraFacial at Rani Beauty Clinic gives you that glow everyone asks about. Starting at $249.', service: 'hydrafacial', platform: 'both', characterCount: 162, angle: 'process' },
  { text: 'Your skin deserves more than a regular facial. HydraFacial removes impurities and delivers antioxidants for skin you can feel confident in.', service: 'hydrafacial', platform: 'meta', characterCount: 143, angle: 'upgrade' },
  // Laser Hair Removal
  { text: 'Advanced laser hair removal for all skin types. Full body packages starting at $800. Pain-free technology, lasting results. Renton, WA.', service: 'laser_hair', platform: 'google', characterCount: 139, angle: 'comprehensive' },
  { text: 'Imagine never worrying about shaving again. Our advanced laser technology works on all skin tones with minimal discomfort. Book your free consultation.', service: 'laser_hair', platform: 'meta', characterCount: 153, angle: 'lifestyle' },
  // Sofwave
  { text: 'FDA-cleared SUPERB ultrasound technology lifts and tightens skin without surgery. One session, visible results. Non-invasive facelift at Rani Beauty Clinic.', service: 'sofwave', platform: 'both', characterCount: 157, angle: 'technology' },
  { text: 'Skip the surgery. Sofwave tightens sagging skin on face, neck, and brow with zero downtime. See why Renton clients are choosing this over facelifts.', service: 'sofwave', platform: 'meta', characterCount: 153, angle: 'alternative' },
  // RF Microneedling
  { text: 'RF Microneedling stimulates your body\'s own collagen production to smooth scars, tighten pores, and renew skin texture. Starting at $495.', service: 'rf_microneedling', platform: 'both', characterCount: 141, angle: 'science' },
  // Wellness
  { text: 'Vitamin D3, B12, Glutathione, Tri-Immune, and NAD+ injections. Quick IM injections that support energy, immunity, and recovery. Walk-ins welcome.', service: 'wellness', platform: 'both', characterCount: 150, angle: 'menu' },
  { text: 'Running on empty? Our wellness injections deliver vitamins and nutrients directly to your body for maximum absorption. Feel the difference same day.', service: 'wellness', platform: 'meta', characterCount: 152, angle: 'energy' },
  // NAD+
  { text: 'NAD+ injection therapy supports cellular repair, mental clarity, and sustained energy. Physician-supervised sessions from $150 at Rani Beauty Clinic.', service: 'nad', platform: 'both', characterCount: 152, angle: 'clinical_benefit' },
  // Peptides
  { text: 'BPC-157, Sermorelin, and advanced peptide therapy for recovery, anti-aging, and performance. Physician-supervised protocols tailored to your goals.', service: 'peptides', platform: 'both', characterCount: 150, angle: 'protocols' },
  // VI Peel
  { text: 'VI Peel targets hyperpigmentation, acne scarring, and sun damage with visible improvement in 7 days. Safe for all skin types. Starting at $395.', service: 'vi_peel', platform: 'both', characterCount: 147, angle: 'results' },
  // PicoWay
  { text: 'PicoWay laser technology targets dark spots, melasma, and uneven tone without damaging surrounding skin. Precise results from $350 per session.', service: 'picoway', platform: 'both', characterCount: 148, angle: 'precision' },
  // PRX-T33
  { text: 'PRX-T33 biorevitalization delivers deep skin renewal without peeling or downtime. Stimulates collagen production for smoother, firmer skin. $495 per session.', service: 'prx', platform: 'both', characterCount: 159, angle: 'no_downtime' },
  // Brand
  { text: 'Rani Beauty Clinic in Renton, WA offers physician-supervised aesthetic treatments, medical weight loss, and wellness injections. Book your consultation today.', service: 'brand', platform: 'google', characterCount: 157, angle: 'overview' },
  { text: 'Where science meets luxury. Our physician-supervised medspa delivers results you can see and confidence you can feel. Serving Renton and the greater PNW.', service: 'brand', platform: 'both', characterCount: 155, angle: 'brand_voice' },
  { text: '5-star rated medspa in Renton, WA. Botox, fillers, HydraFacial, laser treatments, GLP-1 weight loss, and wellness injections. Now accepting new clients.', service: 'brand', platform: 'google', characterCount: 155, angle: 'services_list' },
  { text: 'From weight loss to skin renewal, Rani Beauty Clinic has a treatment plan designed around your goals. Physician-supervised. Walk-ins welcome for select services.', service: 'brand', platform: 'meta', characterCount: 160, angle: 'comprehensive_care' },
  // Audience-specific
  { text: 'Tired of treatments that promise results and under-deliver? At Rani Beauty Clinic, every protocol is physician-supervised and backed by clinical evidence.', service: 'brand', platform: 'meta', characterCount: 156, angle: 'trust' },
  { text: 'Your confidence is our priority. Whether it is your first visit or your tenth, our team creates a personalized plan that respects your time and your goals.', service: 'brand', platform: 'meta', characterCount: 157, angle: 'personalization' },
  { text: 'Men deserve results-driven care too. GLP-1 weight loss, peptide therapy, and performance-focused wellness injections at Rani Beauty Clinic.', service: 'brand', platform: 'meta', characterCount: 143, angle: 'male_targeting' },
  { text: 'PNW weather got you feeling drained? Our wellness injection menu is designed to boost immunity, energy, and recovery during the rainy months.', service: 'wellness', platform: 'meta', characterCount: 146, angle: 'pnw_seasonal' },
  { text: 'Summer is coming to the PNW. Prep your skin with HydraFacial, laser hair removal, and body confidence treatments. Book now to secure your spot.', service: 'brand', platform: 'meta', characterCount: 150, angle: 'summer_prep' },
  { text: 'New to injectables? Start with a free consultation. Our providers walk you through every option with zero pressure and complete transparency.', service: 'brand', platform: 'meta', characterCount: 147, angle: 'first_timer' },
  { text: 'Cherry financing available on treatments over $400. Get the results you want today with flexible monthly payments. No credit impact to check eligibility.', service: 'brand', platform: 'both', characterCount: 155, angle: 'financing' },
];

// ── CTAs (20) ──

export const CTAS: CTAAsset[] = [
  { text: 'Book Now', style: 'direct', bestFor: ['botox', 'fillers', 'hydrafacial', 'wellness'] },
  { text: 'Book Your Consultation', style: 'direct', bestFor: ['glp1', 'sofwave', 'rf_microneedling', 'peptides'] },
  { text: 'Schedule Today', style: 'direct', bestFor: ['laser_hair', 'vi_peel', 'picoway'] },
  { text: 'Claim Your Spot', style: 'urgency', bestFor: ['glp1', 'sofwave', 'brand'] },
  { text: 'Start Your Transformation', style: 'soft', bestFor: ['glp1', 'rf_microneedling', 'sofwave'] },
  { text: 'Get Started', style: 'soft', bestFor: ['glp1', 'peptides', 'brand'] },
  { text: 'See Available Times', style: 'curiosity', bestFor: ['botox', 'hydrafacial', 'wellness'] },
  { text: 'Learn More', style: 'curiosity', bestFor: ['sofwave', 'peptides', 'nad', 'prx'] },
  { text: 'Request a Consultation', style: 'soft', bestFor: ['sofwave', 'glp1', 'fillers'] },
  { text: 'See What is Possible', style: 'curiosity', bestFor: ['glp1', 'botox', 'rf_microneedling'] },
  { text: 'Reserve Your Appointment', style: 'direct', bestFor: ['botox', 'fillers', 'hydrafacial'] },
  { text: 'Talk to a Specialist', style: 'soft', bestFor: ['glp1', 'peptides', 'hormone'] },
  { text: 'Get Your Free Consultation', style: 'value', bestFor: ['glp1', 'sofwave', 'laser_hair'] },
  { text: 'View Treatment Options', style: 'curiosity', bestFor: ['brand', 'wellness', 'aesthetic'] },
  { text: 'Take the First Step', style: 'soft', bestFor: ['glp1', 'brand'] },
  { text: 'Limited Spots Available', style: 'urgency', bestFor: ['glp1', 'sofwave', 'brand'] },
  { text: 'Book Before Spots Fill', style: 'urgency', bestFor: ['hydrafacial', 'botox', 'glp1'] },
  { text: 'Check Eligibility', style: 'curiosity', bestFor: ['glp1', 'peptides'] },
  { text: 'Call (425) 555-7264', style: 'direct', bestFor: ['brand', 'glp1'] },
  { text: 'Visit Us in Renton', style: 'direct', bestFor: ['brand', 'wellness'] },
];

// ── SOCIAL PROOF SNIPPETS (10) ──

export const SOCIAL_PROOF: SocialProofSnippet[] = [
  { text: '5-star rated on Google with 200+ reviews', type: 'stat' },
  { text: 'Trusted by 2,000+ clients in the Renton area', type: 'count' },
  { text: 'Physician-supervised by board-certified providers', type: 'credential' },
  { text: '"The best medspa experience I have ever had" - Sarah K.', type: 'review' },
  { text: '98% client satisfaction rate', type: 'stat' },
  { text: '"I finally found a weight loss program that works for me" - Lisa M.', type: 'review', service: 'glp1' },
  { text: '"My skin has never looked this good" - Jennifer R.', type: 'review', service: 'hydrafacial' },
  { text: 'Over 500 successful GLP-1 weight loss journeys', type: 'count', service: 'glp1' },
  { text: 'FDA-cleared treatments with clinical-grade protocols', type: 'credential' },
  { text: '"I look 10 years younger and it is completely natural" - Diana P.', type: 'review', service: 'sofwave' },
];

// ── URGENCY ELEMENTS (15) ──

export const URGENCY_ELEMENTS: UrgencyElement[] = [
  { text: 'Limited appointment slots this week', type: 'scarcity' },
  { text: 'Only 3 consultation spots left this month', type: 'scarcity' },
  { text: 'Book this week and save on your first treatment', type: 'time' },
  { text: 'New Year, new you - start your transformation today', type: 'seasonal', applicableMonths: [1, 2] },
  { text: 'Summer-ready skin starts now', type: 'seasonal', applicableMonths: [3, 4, 5] },
  { text: 'Get your pre-summer body confidence treatment', type: 'seasonal', applicableMonths: [4, 5] },
  { text: 'Fall skin reset season is here', type: 'seasonal', applicableMonths: [9, 10] },
  { text: 'Holiday glow-up appointments filling fast', type: 'seasonal', applicableMonths: [11, 12] },
  { text: 'Everyone is asking about this treatment', type: 'social' },
  { text: 'The most-requested service this month', type: 'social' },
  { text: 'Your friends already booked - have you?', type: 'social' },
  { text: 'PNW Wellness Month special', type: 'event' },
  { text: 'National Healthy Skin Month', type: 'event', applicableMonths: [11] },
  { text: 'Breast Cancer Awareness Month - prioritize your health', type: 'event', applicableMonths: [10] },
  { text: 'Back to school? Time for a self-care appointment', type: 'seasonal', applicableMonths: [8, 9] },
];

// ── TRUST SIGNALS (10) ──

export const TRUST_SIGNALS: TrustSignal[] = [
  { text: 'Physician-supervised treatments', type: 'credential' },
  { text: 'Board-certified providers', type: 'credential' },
  { text: 'FDA-cleared technology', type: 'compliance' },
  { text: 'Complimentary consultations for new clients', type: 'guarantee' },
  { text: '5-star rated medspa', type: 'experience' },
  { text: 'Clinical-grade protocols', type: 'safety' },
  { text: 'Serving the Renton community since day one', type: 'experience' },
  { text: 'Cherry financing available', type: 'guarantee' },
  { text: 'HIPAA-compliant and fully licensed', type: 'compliance' },
  { text: 'Personalized treatment plans for every client', type: 'safety' },
];

// ── SEASONAL COPY VARIANTS (4 seasons x 5 services = 20) ──

export const SEASONAL_COPY: SeasonalCopy[] = [
  // Spring
  { season: 'spring', service: 'glp1', headline: 'Spring Into Your Weight Loss Journey', body: 'The days are getting longer and the motivation is here. Start your physician-supervised GLP-1 program this spring and see real results by summer. Personalized dosing, weekly check-ins, and a plan that fits your life.', cta: 'Start Your Spring Transformation' },
  { season: 'spring', service: 'hydrafacial', headline: 'Spring Skin Refresh', body: 'Winter is done drying out your skin. Reset with our signature HydraFacial - deep cleanse, exfoliate, and hydrate in one 60-minute session. Your spring glow is one appointment away.', cta: 'Book Your Spring Facial' },
  { season: 'spring', service: 'laser_hair', headline: 'Get Smooth for Spring', body: 'Spring is the perfect time to start laser hair removal. Our advanced technology works on all skin types. Begin your sessions now and be ready for sandal season.', cta: 'Start Your Package' },
  { season: 'spring', service: 'botox', headline: 'Spring Clean Your Fine Lines', body: 'Fresh season, fresh face. Our expert Botox injections smooth fine lines and wrinkles in just 15 minutes. Natural results, zero downtime. Walk-ins welcome.', cta: 'Book Your Spring Botox' },
  { season: 'spring', service: 'wellness', headline: 'Spring Energy Boost', body: 'Shake off the winter slowdown with our wellness injection menu. B12 for energy, Tri-Immune for allergy season support, and Glutathione for that spring glow from within.', cta: 'Get Your Spring Boost' },
  // Summer
  { season: 'summer', service: 'glp1', headline: 'Summer Confidence Starts with GLP-1', body: 'This is your summer. Our medical weight loss program delivers visible results with physician-supervised GLP-1 therapy. Join hundreds of clients who chose this season to transform.', cta: 'Claim Your Summer Spot' },
  { season: 'summer', service: 'hydrafacial', headline: 'Summer Glow HydraFacial', body: 'Sun, heat, and sweat can take a toll on your skin. Our HydraFacial deep-cleans pores and restores hydration so you glow all summer long. Perfect before any event.', cta: 'Book Your Summer Glow' },
  { season: 'summer', service: 'laser_hair', headline: 'Beach-Ready Smooth Skin', body: 'No more last-minute shaving. Our laser hair removal technology delivers permanent reduction so you are always beach-ready. Full body packages available.', cta: 'Get Beach Ready' },
  { season: 'summer', service: 'botox', headline: 'Summer Wedding? Botox Now.', body: 'Wedding season is here. Whether you are the bride, bridesmaid, or guest, Botox 2-3 weeks before your event gives you that camera-ready look. 15 minutes, zero downtime.', cta: 'Book Pre-Event Botox' },
  { season: 'summer', service: 'picoway', headline: 'Erase Sun Spots This Summer', body: 'PicoWay laser targets sun damage, dark spots, and uneven pigmentation with precision. Protect your skin this summer and treat what the sun has already done.', cta: 'Treat Your Sun Damage' },
  // Fall
  { season: 'fall', service: 'glp1', headline: 'Fall Into Better Health', body: 'Before the holidays hit, start your weight loss journey now. Our GLP-1 program gives you a 2-3 month head start so you enter the new year feeling strong and confident.', cta: 'Start Before the Holidays' },
  { season: 'fall', service: 'vi_peel', headline: 'Fall Skin Reset with VI Peel', body: 'Summer sun did a number on your skin. The VI Peel reverses hyperpigmentation, sun damage, and dullness in just 7 days. Fall is the ideal time for a skin reset.', cta: 'Book Your Fall Peel' },
  { season: 'fall', service: 'rf_microneedling', headline: 'Fall Collagen Renewal', body: 'Cooler weather means your skin can heal faster post-treatment. RF Microneedling this fall for smoother, tighter, more radiant skin by the holidays.', cta: 'Schedule Your Fall Treatment' },
  { season: 'fall', service: 'wellness', headline: 'Immune Boost for Fall', body: 'PNW fall means rain, cold, and flu season. Arm your immune system with Tri-Immune and Vitamin D3 injections. Quick visits, real protection.', cta: 'Boost Your Immunity' },
  { season: 'fall', service: 'sofwave', headline: 'Tighter Skin by the Holidays', body: 'One Sofwave session this fall delivers visible skin tightening by December. No surgery, no downtime. Walk out the same day looking refreshed and lifted.', cta: 'Book Your Sofwave Session' },
  // Winter
  { season: 'winter', service: 'glp1', headline: 'New Year Weight Loss Resolution', body: 'Make this the year it actually works. Our physician-supervised GLP-1 program pairs medical science with personal support. Start January strong.', cta: 'Start Your New Year Right' },
  { season: 'winter', service: 'hydrafacial', headline: 'Winter Hydration Rescue', body: 'PNW winter air and indoor heating strip your skin of moisture. Our HydraFacial restores deep hydration and leaves you glowing even on the grayest days.', cta: 'Rescue Your Winter Skin' },
  { season: 'winter', service: 'wellness', headline: 'Winter Wellness Shield', body: 'Cold and flu season is at its peak. Our Tri-Immune and Vitamin D3 injections give your immune system the support it needs to get through PNW winter strong.', cta: 'Protect Your Health' },
  { season: 'winter', service: 'nad', headline: 'Beat the Winter Energy Slump', body: 'Short days and gray skies draining your energy? NAD+ injection therapy restores cellular energy and mental clarity. Feel the difference after one session.', cta: 'Restore Your Energy' },
  { season: 'winter', service: 'prx', headline: 'Winter Skin Renewal', body: 'PRX-T33 biorevitalization delivers deep collagen stimulation without peeling or downtime. The perfect winter treatment for skin that looks renewed, not raw.', cta: 'Book Your Winter Renewal' },
];

// ── HOLIDAY COPY VARIANTS ──

export const HOLIDAY_COPY: HolidayCopy[] = [
  { holiday: 'New Year', month: 1, headline: 'New Year, New You Is Not a Cliche', body: 'This year, back it up with real action. Physician-supervised GLP-1 weight loss, skin renewal treatments, and wellness injections to start the year right.', cta: 'Book Your 2026 Transformation', services: ['glp1', 'hydrafacial', 'wellness'] },
  { holiday: 'Valentine\'s Day', month: 2, headline: 'The Best Gift? Confidence.', body: 'Treat yourself (or someone you love) to a Rani Beauty Clinic experience this Valentine\'s Day. From glow-ups to self-care, we have something for everyone.', cta: 'Gift a Treatment', services: ['botox', 'hydrafacial', 'fillers'] },
  { holiday: 'Mother\'s Day', month: 5, headline: 'She Deserves the Best', body: 'Give Mom the gift of luxury self-care. HydraFacial, Botox, or a wellness injection session - because she deserves more than brunch.', cta: 'Gift Mom a Treatment', services: ['hydrafacial', 'botox', 'wellness'] },
  { holiday: 'Fourth of July', month: 7, headline: 'Summer Confidence, Unlocked', body: 'Get BBQ-ready with smooth skin, a fresh face, and the energy to enjoy every minute of summer. Quick treatments, big results.', cta: 'Book Your Summer Glow', services: ['laser_hair', 'hydrafacial', 'wellness'] },
  { holiday: 'Halloween', month: 10, headline: 'The Only Scary Thing? Not Booking.', body: 'No masks needed when your skin looks this good. Fall skin treatments, immune boosters, and glow-up specials all October long.', cta: 'Book Your October Treatment', services: ['vi_peel', 'hydrafacial', 'wellness'] },
  { holiday: 'Black Friday', month: 11, headline: 'Skip the Mall. Invest in You.', body: 'The best investment is in yourself. Special treatment packages available this holiday season. Physician-supervised care, luxury results.', cta: 'View Holiday Packages', services: ['botox', 'hydrafacial', 'glp1', 'sofwave'] },
  { holiday: 'Holiday Season', month: 12, headline: 'Holiday Glow, Guaranteed', body: 'Party season is here. From Botox to HydraFacial to wellness injections, look and feel your best at every holiday gathering this December.', cta: 'Book Your Holiday Glow', services: ['botox', 'hydrafacial', 'fillers', 'wellness'] },
  { holiday: 'Galentine\'s Day', month: 2, headline: 'Bring Your Girls. We Will Bring the Glow.', body: 'Group bookings for Galentine\'s Day. HydraFacials, Botox touch-ups, and wellness injections - the ultimate girl\'s day out.', cta: 'Book a Group Treatment', services: ['hydrafacial', 'botox', 'wellness'] },
];

// ── UTILITY FUNCTIONS ──

export function getHeadlinesForService(service: string): Headline[] {
  return HEADLINES.filter(h => h.service === service || h.service === 'brand');
}

export function getDescriptionsForService(service: string): Description[] {
  return DESCRIPTIONS.filter(d => d.service === service || d.service === 'brand');
}

export function getCTAsForService(service: string): CTAAsset[] {
  return CTAS.filter(c => c.bestFor.includes(service));
}

export function getSeasonalCopyForMonth(month: number): SeasonalCopy[] {
  const seasonMap: Record<number, SeasonalCopy['season']> = {
    1: 'winter', 2: 'winter', 3: 'spring', 4: 'spring', 5: 'spring',
    6: 'summer', 7: 'summer', 8: 'summer', 9: 'fall', 10: 'fall', 11: 'fall', 12: 'winter',
  };
  return SEASONAL_COPY.filter(s => s.season === seasonMap[month]);
}

export function getHolidayCopyForMonth(month: number): HolidayCopy[] {
  return HOLIDAY_COPY.filter(h => h.month === month);
}

export function getUrgencyForMonth(month: number): UrgencyElement[] {
  return URGENCY_ELEMENTS.filter(u => !u.applicableMonths || u.applicableMonths.includes(month));
}

export function getGoogleHeadlines(service: string): Headline[] {
  return HEADLINES.filter(h => (h.service === service || h.service === 'brand') && (h.platform === 'google' || h.platform === 'both') && h.characterCount <= 30);
}

export function getGoogleDescriptions(service: string): Description[] {
  return DESCRIPTIONS.filter(d => (d.service === service || d.service === 'brand') && (d.platform === 'google' || d.platform === 'both') && d.characterCount <= 90);
}

export function getMetaCreatives(service: string): { headlines: Headline[]; descriptions: Description[]; ctas: CTAAsset[] } {
  return {
    headlines: HEADLINES.filter(h => (h.service === service || h.service === 'brand') && (h.platform === 'meta' || h.platform === 'both')),
    descriptions: DESCRIPTIONS.filter(d => (d.service === service || d.service === 'brand') && (d.platform === 'meta' || d.platform === 'both')),
    ctas: getCTAsForService(service),
  };
}

export const CREATIVE_LIBRARY_STATS = {
  totalHeadlines: HEADLINES.length,
  totalDescriptions: DESCRIPTIONS.length,
  totalCTAs: CTAS.length,
  totalSocialProof: SOCIAL_PROOF.length,
  totalUrgency: URGENCY_ELEMENTS.length,
  totalTrustSignals: TRUST_SIGNALS.length,
  totalSeasonalVariants: SEASONAL_COPY.length,
  totalHolidayVariants: HOLIDAY_COPY.length,
} as const;
