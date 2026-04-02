// Staff Training Modules - Rani Beauty Clinic
// 20 modules across 4 role categories: Front Desk, Provider, All Staff, Management

export type TrainingRole = 'front-desk' | 'provider' | 'all-staff' | 'management';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrainingSection {
  title: string;
  content: string;
  quiz: QuizQuestion[];
}

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  role: TrainingRole;
  duration: number; // minutes
  sections: TrainingSection[];
  prerequisites: string[];
}

// ═══════════════════════════════════════════════════════════════
// FRONT DESK MODULES (6)
// ═══════════════════════════════════════════════════════════════

const bookingWorkflow: TrainingModule = {
  id: 'fd-001',
  slug: 'booking-workflow',
  title: 'Booking Workflow Mastery',
  description: 'End-to-end booking process from initial inquiry through appointment confirmation, including Mangomint system navigation, service matching, and provider scheduling.',
  role: 'front-desk',
  duration: 45,
  prerequisites: [],
  sections: [
    {
      title: 'Introduction to the Rani Booking Experience',
      content: `The booking workflow at Rani Beauty Clinic is the first point of contact a client has with our luxury medical aesthetics brand. Every interaction - whether by phone, online, or walk-in - must convey clinical confidence, warmth, and a sense of exclusivity. Our goal is never to "fill appointments" but to curate personalized treatment journeys for every guest.

At Rani, we use Mangomint as our primary scheduling platform. Every front desk team member must be proficient with the Mangomint interface, including client profiles, provider calendars, service catalog navigation, and automated confirmations. Mangomint is connected to our Airtable CRM, which tracks client history, lead status, lifetime value, and communication preferences.

When a new client reaches out, the booking process begins with discovery - understanding their aesthetic goals, any medical history considerations, and their comfort level with various treatment modalities. We do not simply book the service they mention. We guide them toward the right consultation or treatment based on their specific concerns. For example, a client calling about "wrinkle treatment" may benefit from a Sofwave consultation rather than jumping directly to injectables.

The key stages of our booking workflow are: (1) Initial Contact & Discovery, (2) Service Matching & Recommendation, (3) Provider Assignment, (4) Scheduling & Confirmation, (5) Pre-Appointment Communication. Each stage has specific protocols designed to maximize conversion while maintaining our luxury service standard.

Our booking conversion target is 85% for new inquiry-to-appointment. Every missed booking is a missed revenue opportunity and a client left unserved. Track your conversion rate in the dashboard leaderboard. The front desk team is the revenue gateway of the clinic - every call, message, and walk-in matters.

Remember: We never use the word "infusion" at Rani. All IM treatments are referred to as "injections." This is a clinical and branding standard that must be followed in all verbal and written communications without exception.`,
      quiz: [
        {
          question: 'What is the primary scheduling platform used at Rani Beauty Clinic?',
          options: ['Square', 'Mangomint', 'Calendly', 'Acuity'],
          correctIndex: 1,
          explanation: 'Rani uses Mangomint as the primary scheduling platform, connected to Airtable CRM for full client tracking.',
        },
        {
          question: 'What is the booking conversion target for new inquiries?',
          options: ['70%', '75%', '80%', '85%'],
          correctIndex: 3,
          explanation: 'The target booking conversion rate for new inquiry-to-appointment is 85%.',
        },
        {
          question: 'When a client asks about "wrinkle treatment," what should you do first?',
          options: [
            'Book them for Botox immediately',
            'Guide them toward the right consultation based on their specific concerns',
            'Tell them to check the website',
            'Transfer them to a provider',
          ],
          correctIndex: 1,
          explanation: 'We never simply book the service mentioned. We guide clients toward the right consultation or treatment based on their specific concerns - they may benefit from Sofwave, RF Microneedling, or injectables depending on their goals.',
        },
      ],
    },
    {
      title: 'Mangomint System Navigation & Service Matching',
      content: `Mangomint is your command center for all scheduling operations. Understanding its interface thoroughly is non-negotiable for front desk staff. Here is a comprehensive guide to the core functions you will use daily.

Client Profile Search: When a client contacts us, always begin by searching their name in Mangomint. Existing clients will have full profiles including visit history, preferred provider, membership status, and notes from previous interactions. For new clients, you will create a profile during the booking process - collect first name, last name, phone number, and email at minimum.

Service Catalog Navigation: Rani offers over 25 distinct services across aesthetic treatments, wellness injections, and body contouring. Services are organized by category in Mangomint: Injectables (Botox, Fillers, Kybella), Skin Rejuvenation (Sofwave, RF Microneedling, PRX-T33, VI Peel), Laser (PicoWay, Laser Hair Removal), Facials (HydraFacial), Wellness Injections (Vitamin D3, Tri-Immune, Glutathione, B12, NAD+), Body Programs (GLP-1 Weight Loss), and Rx Skincare (Tretinoin).

Service matching is the art of connecting a client's stated concern to the right service. Common concern-to-service mappings include: "I want to look younger" → Sofwave consultation + HydraFacial, "My skin looks dull" → HydraFacial + VI Peel, "I want to lose weight" → GLP-1 program consultation, "I have dark spots" → PicoWay consultation, "I want more energy" → Wellness Injection consultation (NAD+, B12, Tri-Immune), "I want to tighten my skin" → Sofwave or RF Microneedling consultation.

Provider Assignment Rules: Not all providers perform all services. Check the provider's service permissions in Mangomint before booking. Our providers have different specialties and certifications. Always match the service to a qualified provider. When in doubt, book a general consultation and let the provider recommend the specific treatment plan.

Double-booking Prevention: Always check the provider's calendar before confirming. Mangomint will flag conflicts, but visual verification is important. Some treatments require specific room setups - laser treatments need the laser suite, Sofwave needs the Sofwave room, and wellness injections can be done in any treatment room. Room availability is as important as provider availability.

After matching the service, confirm the appointment details verbally: date, time, provider name, service name, estimated duration, and any pre-appointment instructions. Send the confirmation through Mangomint's automated system, which triggers an email and SMS confirmation.`,
      quiz: [
        {
          question: 'A client says "I want to get rid of my dark spots." Which service should you suggest for consultation?',
          options: ['HydraFacial', 'Botox', 'PicoWay', 'GLP-1'],
          correctIndex: 2,
          explanation: 'PicoWay is Rani\'s laser pigment removal treatment, ideal for dark spots and hyperpigmentation concerns.',
        },
        {
          question: 'What information must you collect at minimum when creating a new client profile?',
          options: [
            'First name and email only',
            'First name, last name, phone number, and email',
            'Full name and insurance information',
            'Name, DOB, and social security number',
          ],
          correctIndex: 1,
          explanation: 'At minimum, collect first name, last name, phone number, and email to create a Mangomint client profile.',
        },
        {
          question: 'Before confirming a booking, what two availability factors must you verify?',
          options: [
            'Provider schedule and room availability',
            'Client insurance and payment method',
            'Provider vacation and lunch breaks',
            'Equipment calibration and supply levels',
          ],
          correctIndex: 0,
          explanation: 'Both provider calendar availability and room availability must be verified. Some treatments require specific rooms (laser suite, Sofwave room).',
        },
      ],
    },
    {
      title: 'Pre-Appointment Communication & Deposit Protocol',
      content: `Once a booking is confirmed, the pre-appointment communication sequence begins automatically through our n8n automation system. However, front desk staff must understand what is sent, when it is sent, and how to handle client responses.

Automated Communication Sequence: (1) Immediately after booking - Confirmation email + SMS with date, time, provider, and service details. (2) 24 hours before appointment - Reminder email with pre-treatment instructions specific to the booked service. For example, laser clients receive instructions to avoid sun exposure and discontinue retinoids. Injectable clients receive instructions to avoid blood thinners and alcohol. (3) 2 hours before - Final SMS reminder with clinic address and parking instructions.

Deposit Protocol: For new clients booking high-value services (Sofwave at $2,750+, injectable consultations, GLP-1 program), a deposit is required at booking. The standard deposit is $100 for consultations and $250 for treatment bookings. Deposits are collected via the Square payment link sent through Mangomint. Deposits are applied to the final treatment cost and are refundable with 48-hour cancellation notice. No-show deposits are forfeited after the first occurrence - this is clearly communicated at booking.

Pre-Treatment Instructions by Category: Each service category has specific preparation requirements that must be communicated during booking. Laser treatments (PicoWay, Laser Hair Removal): Avoid sun exposure for 2 weeks, discontinue retinoids and AHAs 5 days prior, arrive with clean skin, no makeup on treatment area. Injectable treatments (Botox, Fillers): Avoid aspirin, ibuprofen, fish oil, and alcohol for 48 hours. Do not schedule within 2 weeks of a major event (swelling and bruising are possible). Facial treatments (HydraFacial, VI Peel, PRX-T33): Discontinue active skincare (retinoids, AHAs, BHAs) 3 days prior. Arrive with no makeup. Wellness injections (all IM injections): No special preparation required beyond hydration. GLP-1 program: First appointment includes lab work - arrive fasted for 8 hours.

Handling Client Questions: When clients respond to pre-appointment communications with questions, front desk staff should answer standard questions about logistics (parking, timing, payment methods). Medical questions about treatment specifics, contraindications, or expected results should be escalated to the provider with a message: "Great question! Let me have [Provider Name] reach out to you directly with that clinical information." Never provide medical advice.

New Client Intake Forms: All new clients are sent a Typeform intake form (ID: Ecgz85JA) after booking confirmation. This form collects medical history, aesthetic goals, allergies, medications, and consent. The intake must be completed before the appointment. Monitor completion status in Airtable - if incomplete 24 hours before the appointment, send a manual reminder. Incomplete intakes delay the consultation and reduce conversion rates.`,
      quiz: [
        {
          question: 'What is the standard deposit for a new client Sofwave booking?',
          options: ['$50', '$100', '$250', '$500'],
          correctIndex: 2,
          explanation: 'Treatment bookings (like Sofwave) require a $250 deposit. Consultations require $100.',
        },
        {
          question: 'A client asks about possible side effects of Botox via text. How should you respond?',
          options: [
            'List common side effects from the treatment guide',
            'Escalate to the provider for clinical information',
            'Tell them to Google it',
            'Ignore the question and confirm the appointment',
          ],
          correctIndex: 1,
          explanation: 'Medical questions about treatment specifics, contraindications, or expected results must be escalated to the provider. Front desk never provides medical advice.',
        },
        {
          question: 'How long before a GLP-1 first appointment must the client fast?',
          options: ['4 hours', '6 hours', '8 hours', '12 hours'],
          correctIndex: 2,
          explanation: 'GLP-1 first appointments include lab work, requiring 8 hours of fasting.',
        },
      ],
    },
  ],
};

const checkInProcess: TrainingModule = {
  id: 'fd-002',
  slug: 'check-in-process',
  title: 'Client Check-In Protocol',
  description: 'Greeting standards, identity verification, consent review, payment collection, and creating a luxury first impression at every visit.',
  role: 'front-desk',
  duration: 30,
  prerequisites: ['booking-workflow'],
  sections: [
    {
      title: 'The Rani Arrival Experience',
      content: `The check-in process is where Rani's luxury brand promise becomes tangible. From the moment a client walks through our door, every sensory detail matters - the ambient lighting, the subtle fragrance, the temperature of the reception area, and most importantly, the warmth and professionalism of the front desk greeting.

The Greeting Protocol: Stand and make eye contact within 3 seconds of a client entering. Smile genuinely and greet by name if you recognize them or if you can see their appointment on the schedule. The standard greeting is: "Welcome to Rani Beauty Clinic! [Name], we're so glad you're here today." For new clients: "Welcome to Rani! You must be [Name] - we've been looking forward to meeting you." Never say "Can I help you?" - this is transactional language. We are not a retail store. We are a luxury medical aesthetics destination.

Identity Verification: For every visit, verify the client's identity by confirming their full name and date of birth. This is a HIPAA requirement and a safety protocol. For new clients, verify a government-issued photo ID on the first visit and note it in Mangomint.

Intake Form Status: Before the client sits down, confirm their intake form is complete. Check Airtable for the intake status. If the form is incomplete, hand them a tablet with the Typeform link and allow 10-15 minutes for completion before the consultation. Never send a client back to the treatment room without a completed intake - this is a compliance and safety requirement.

Consent Review: Each treatment category requires specific consent forms. Injectable treatments require informed consent covering risks, benefits, alternatives, and expected outcomes. Laser treatments require laser consent with Fitzpatrick skin type documentation. GLP-1 programs require medical program consent and lab work authorization. Verify all required consents are signed and current (consents expire annually).

Waiting Area Management: Offer the client water (still or sparkling), tea, or coffee. Direct them to the waiting area and provide an estimated wait time if the provider is running behind. If the wait exceeds 10 minutes beyond the scheduled time, proactively update the client and offer to reschedule if preferred. Luxury clients value their time - never leave them uninformed.

Payment Verification: Confirm the client's payment method is on file. If they have a membership, verify its active status. If they have a package, verify remaining sessions. If they are paying per service, confirm the expected cost at check-in to avoid surprise billing at checkout. Transparency builds trust.`,
      quiz: [
        {
          question: 'Within how many seconds of a client entering should you make eye contact?',
          options: ['1 second', '3 seconds', '5 seconds', '10 seconds'],
          correctIndex: 1,
          explanation: 'Stand and make eye contact within 3 seconds of a client entering. This sets the tone for a luxury experience.',
        },
        {
          question: 'What should you NEVER say to a client upon arrival?',
          options: [
            '"Welcome to Rani!"',
            '"We\'ve been looking forward to meeting you"',
            '"Can I help you?"',
            '"You must be [Name]"',
          ],
          correctIndex: 2,
          explanation: '"Can I help you?" is transactional retail language. Rani is a luxury medical aesthetics destination - use warm, personalized greetings.',
        },
        {
          question: 'How often do treatment consent forms expire?',
          options: ['Every visit', 'Every 6 months', 'Annually', 'Never'],
          correctIndex: 2,
          explanation: 'Treatment consents expire annually and must be re-signed to maintain compliance.',
        },
      ],
    },
    {
      title: 'New Client Onboarding & Record Creation',
      content: `New clients represent our biggest revenue opportunity and our most critical first impression moment. The new client onboarding process is meticulous and must be executed flawlessly every time.

Document Collection Checklist: (1) Government-issued photo ID - scan or photograph for file. (2) Completed Typeform intake (medical history, allergies, medications, aesthetic goals). (3) Signed general consent form. (4) Signed treatment-specific consent (after provider consultation). (5) HIPAA Notice of Privacy Practices acknowledgment. (6) Financial policy acknowledgment (cancellation, deposit, payment terms). (7) Photography consent (before/after documentation).

Mangomint Profile Setup: Create the full client profile in Mangomint with all collected information. Add notes from the intake form that are relevant to scheduling - allergies, medication interactions, skin type, treatment history at other clinics. Tag the client with appropriate labels: "New Client," service interest tags, and referral source.

Airtable CRM Entry: The Typeform submission automatically creates a record in Airtable via our n8n automation. Verify the record exists and the AI intake analysis has been processed (check for "Intake Summary (AI)" field population). If the automation has not triggered, manually flag the record for processing.

Welcome Communication: After the first visit, a welcome sequence is triggered automatically: same-day thank you email with provider introduction, next-day follow-up with post-treatment care instructions (if applicable), and a 7-day check-in message. These are automated through n8n but front desk should be aware of what clients receive.

First Visit Experience Extras: For new clients, add 10 minutes of buffer time to the appointment for paperwork and orientation. Offer a brief tour of the clinic if the schedule permits - showing the treatment rooms, technology, and ambiance reinforces the luxury positioning. Introduce the client to their provider by name and include a brief personal detail: "This is [Provider] - she specializes in [relevant specialty] and has been with Rani for [duration]."

Referral Tracking: Always ask new clients how they heard about us. Options: Google search, Instagram, referral from a friend/family, Facebook ad, walk-in, another provider. Log the source in Mangomint and Airtable. Referral tracking drives our marketing budget allocation. If they were referred by an existing client, note the referrer's name for our referral rewards program.`,
      quiz: [
        {
          question: 'How many documents are on the new client collection checklist?',
          options: ['5', '6', '7', '8'],
          correctIndex: 2,
          explanation: 'The new client document collection checklist includes 7 items: photo ID, Typeform intake, general consent, treatment consent, HIPAA acknowledgment, financial policy, and photography consent.',
        },
        {
          question: 'What field should you check in Airtable to verify the AI intake analysis has processed?',
          options: [
            'AI Summary',
            'Intake Summary (AI)',
            'Processing Notes',
            'Client Analysis',
          ],
          correctIndex: 1,
          explanation: 'The correct field name is "Intake Summary (AI)" - this is the exact Airtable field name for the AI-processed intake analysis.',
        },
        {
          question: 'How much buffer time should you add for new client appointments?',
          options: ['5 minutes', '10 minutes', '15 minutes', '30 minutes'],
          correctIndex: 1,
          explanation: 'Add 10 minutes of buffer time for new client appointments to accommodate paperwork and clinic orientation.',
        },
      ],
    },
  ],
};

const checkoutUpsell: TrainingModule = {
  id: 'fd-003',
  slug: 'checkout-upsell',
  title: 'Checkout & Strategic Upselling',
  description: 'Payment processing, membership presentation, package recommendations, rebooking protocols, and revenue-maximizing checkout conversations.',
  role: 'front-desk',
  duration: 40,
  prerequisites: ['check-in-process'],
  sections: [
    {
      title: 'The Revenue-Maximizing Checkout',
      content: `Checkout is not simply a financial transaction - it is the final brand touchpoint and the highest-conversion moment for rebooking, membership enrollment, and package upgrades. Studies show that clients are most receptive to recommendations immediately after a positive treatment experience, when satisfaction and trust are at their peak.

Payment Processing via Square: All payments are processed through our Square POS terminal. Accept all major credit/debit cards, Apple Pay, Google Pay, and CareCredit/Cherry financing. Never accept cash for amounts over $500 without manager approval. Always provide an itemized receipt - email preferred over print (environmentally conscious messaging aligns with our brand values).

The Checkout Conversation Framework follows the CARE model: Confirm satisfaction ("How are you feeling about today's treatment?"), Advise on next steps (relay provider's recommendations), Recommend enhancements (packages, memberships, complementary services), Establish the next appointment (rebook before they leave).

Rebooking Protocol: The single most important action at checkout is securing the next appointment. Our rebooking target is 75% - meaning three out of every four clients should leave with their next appointment scheduled. Use the provider's recommendation as your anchor: "Dr. [Name] recommended your next [treatment] in [timeframe]. I have availability on [date] at [time] - shall I reserve that for you?" Never ask "Would you like to rebook?" - this invites a "no." Instead, present specific options.

Membership Presentation: Rani's membership program is our primary recurring revenue vehicle. Present membership benefits at every checkout where the client is not already a member. The pitch: "Did you know that our members save an average of 20% on their treatments? Your [treatment today] would have been [$ amount less] with membership. Would you like me to show you how the program works?" Membership tiers and benefits are detailed in the product-knowledge module.

Package Recommendations: When a provider recommends a treatment series (RF Microneedling series of 3, PicoWay series of 4-6, etc.), present the package pricing at checkout. Package savings are typically 10-15% versus individual sessions. Frame the savings in dollar amounts, not percentages: "The package of 3 sessions saves you $285 compared to booking individually."

Financing Options: For treatments over $1,000, proactively mention financing. "We also offer flexible financing through CareCredit and Cherry - many clients prefer monthly payments. Would you like me to walk you through the options?" Never make assumptions about a client's ability to pay. Offer financing as a convenience, not a necessity.`,
      quiz: [
        {
          question: 'What is the rebooking target percentage at Rani?',
          options: ['50%', '65%', '75%', '90%'],
          correctIndex: 2,
          explanation: 'The rebooking target is 75% - three out of every four clients should leave with their next appointment scheduled.',
        },
        {
          question: 'How should you frame package savings to a client?',
          options: [
            'As a percentage discount',
            'As a dollar amount saved',
            'As a comparison to competitor pricing',
            'As a limited-time offer',
          ],
          correctIndex: 1,
          explanation: 'Frame savings in dollar amounts ("saves you $285") rather than percentages. Dollar amounts feel more tangible and motivating.',
        },
        {
          question: 'What is the CARE checkout model sequence?',
          options: [
            'Confirm, Advise, Recommend, Establish',
            'Check, Assess, Review, Exit',
            'Collect, Analyze, Redirect, Engage',
            'Close, Ask, Refer, End',
          ],
          correctIndex: 0,
          explanation: 'CARE stands for: Confirm satisfaction, Advise on next steps, Recommend enhancements, Establish the next appointment.',
        },
      ],
    },
    {
      title: 'Product Sales & Cross-Selling at Checkout',
      content: `Retail product sales at checkout represent significant incremental revenue with high margins. When a provider recommends a homecare regimen, the front desk must execute the product sale seamlessly.

Provider Recommendation Relay: Providers will communicate product recommendations through Mangomint notes or direct verbal handoff. Common post-treatment product recommendations include: Post-injectable - Arnica cream, gentle cleanser. Post-laser - SPF 50+, hydrating serum, gentle cleanser. Post-facial - Hydrating serum, SPF, treatment-specific products. Post-peel - Gentle cleanser, hydrating moisturizer, SPF 50+ (no active ingredients for 5-7 days). GLP-1 program - Protein supplements, recommended vitamins.

Rx Skincare Subscription: Rani offers prescription tretinoin at $99/month through our Rx skincare program. This is a recurring revenue product that complements nearly all aesthetic treatments. When a provider notes tretinoin as a recommendation, present it at checkout: "Dr. [Name] also recommended our prescription skincare program to enhance your results. It's $99 per month and includes tretinoin customized to your skin - many clients see dramatic improvement in texture and tone within 8-12 weeks."

Cross-Selling Complementary Services: Use the treatment just completed as a bridge to complementary services. Common cross-sell pairings: Botox → HydraFacial (for skin glow between injectable appointments), Sofwave → PRX-T33 (biorevitalization to complement skin tightening), PicoWay → VI Peel (accelerate pigment clearance), HydraFacial → Wellness Injection (boost from the inside out), RF Microneedling → LED therapy add-on.

The cross-sell approach should be educational, not salesy: "A lot of our clients who love [treatment just done] also pair it with [complementary service] because [specific benefit]. Would you like to hear more about that?" Always tie the recommendation to the client's stated goals from their intake.

Loyalty Points & Rewards: If the client is a loyalty program member, inform them of points earned and any available rewards at checkout. "You earned 275 points today! You now have 1,200 points total - that's enough for a complimentary HydraFacial upgrade. Would you like to redeem on your next visit?"

End-of-Checkout Confirmation: Before the client departs, confirm: (1) Next appointment date and time, (2) Pre-treatment instructions for next visit, (3) Post-treatment care reminders, (4) Products purchased and usage instructions, (5) Any follow-up calls or messages they should expect. Walk the client to the door - never let them find their own way out. This final gesture reinforces the luxury experience.`,
      quiz: [
        {
          question: 'What is the monthly price for the Rx Skincare (tretinoin) subscription?',
          options: ['$49/month', '$79/month', '$99/month', '$129/month'],
          correctIndex: 2,
          explanation: 'The Rx skincare subscription is $99/month for prescription tretinoin customized to the client\'s skin.',
        },
        {
          question: 'Which treatment pairs best as a cross-sell with Sofwave?',
          options: ['Botox', 'PRX-T33', 'GLP-1', 'Laser Hair Removal'],
          correctIndex: 1,
          explanation: 'PRX-T33 (biorevitalization) complements Sofwave skin tightening for comprehensive skin renewal.',
        },
        {
          question: 'What should be the very last action before a client departs?',
          options: [
            'Process the payment',
            'Hand them a business card',
            'Walk the client to the door',
            'Ask for a Google review',
          ],
          correctIndex: 2,
          explanation: 'Walk the client to the door - never let them find their own way out. This final gesture reinforces the luxury experience.',
        },
      ],
    },
  ],
};

const phoneHandling: TrainingModule = {
  id: 'fd-004',
  slug: 'phone-handling',
  title: 'Phone & Communication Mastery',
  description: 'Answering protocols, call scripts, handling pricing questions, objection management, voicemail standards, and coordination with the AI phone agent.',
  role: 'front-desk',
  duration: 35,
  prerequisites: ['booking-workflow'],
  sections: [
    {
      title: 'Phone Answering Standards & Call Scripts',
      content: `The phone is our highest-converting lead source. A single missed or poorly handled call can cost the clinic $2,000-$10,000 in lifetime client value. Rani uses a Vapi AI phone agent for after-hours and overflow calls, but during business hours, the human front desk team is the primary point of contact.

Answer Within 3 Rings: Every call must be answered within 3 rings during business hours (9 AM - 6 PM, Monday-Saturday). If you are on another call, let the second call go to the AI agent rather than putting a client on hold for more than 60 seconds. The AI agent will collect the caller's information and schedule a callback.

Standard Phone Greeting: "Thank you for calling Rani Beauty Clinic, this is [Your Name]. How can I assist you with your beauty journey today?" This greeting establishes professionalism, identifies the clinic, personalizes with your name, and invites an open-ended conversation. Never answer with just "Hello" or "Rani Clinic."

Active Listening Framework: When a caller describes their concern, use the LISTEN method: Let them finish speaking without interruption, Identify their primary concern, Summarize what you heard ("So you're looking for help with [concern]"), Transition to a solution ("We have several excellent options for that"), Educate briefly on the recommended service, Navigate to booking ("Let me get you scheduled for a consultation").

Handling Pricing Questions: Price inquiries are the most common and most sensitive call type. Never quote a price without context. Instead of "Botox is $X per unit," say: "Great question about Botox! Pricing depends on your specific treatment areas and goals. Our experienced injectors will customize your treatment plan during a consultation. Most clients invest between [range] for their desired results. I'd love to get you in for a complimentary assessment - do you have availability this week?"

For specific service pricing: Sofwave ranges from $2,750-$4,500 depending on treatment areas. HydraFacial is $275 for the signature treatment. Wellness injections range from $35 (B12) to $500 (NAD+ full dose). GLP-1 programs start at $399/month. Always frame pricing as an "investment" not a "cost."

Voicemail Standards: If a call reaches voicemail during business hours (rare - only if all lines are busy), the recorded message should be: "Thank you for calling Rani Beauty Clinic. We're currently assisting other guests. Please leave your name, number, and the best time to reach you, and we'll return your call within 30 minutes. For immediate assistance, you can also book online at ranibeautyclinic.com." Return all voicemails within 30 minutes - no exceptions.`,
      quiz: [
        {
          question: 'Within how many rings must you answer the phone during business hours?',
          options: ['1 ring', '2 rings', '3 rings', '5 rings'],
          correctIndex: 2,
          explanation: 'Every call must be answered within 3 rings during business hours.',
        },
        {
          question: 'How should you handle a pricing question about Botox?',
          options: [
            'Quote the exact per-unit price immediately',
            'Provide a range with context and transition to booking a consultation',
            'Tell them to check the website',
            'Transfer to the provider',
          ],
          correctIndex: 1,
          explanation: 'Never quote a price without context. Provide a range, explain that pricing depends on treatment areas and goals, and transition to booking a consultation.',
        },
        {
          question: 'What is the maximum voicemail callback time?',
          options: ['15 minutes', '30 minutes', '1 hour', '2 hours'],
          correctIndex: 1,
          explanation: 'Return all voicemails within 30 minutes - no exceptions.',
        },
      ],
    },
    {
      title: 'Objection Handling & Lead Conversion',
      content: `Every objection is a request for more information. The most common phone objections at a medical aesthetics clinic are: price concerns, fear of pain, uncertainty about results, wanting to think about it, and comparing with other clinics. Mastering objection handling directly impacts your booking conversion rate and the clinic's revenue.

Price Objection - "That's more than I expected": Acknowledge their concern without apologizing for pricing. "I completely understand - investing in your appearance is a significant decision. Many of our clients felt the same way initially. What I can share is that Rani uses only the highest-quality products and our providers have extensive training in medical aesthetics. We also offer flexible financing through CareCredit and Cherry, where many clients pay as little as $X per month. Would you like me to schedule a consultation so you can meet the provider and discuss a plan that works for your budget?"

Fear Objection - "Does it hurt?": "That's a great question, and I appreciate you asking. Comfort is extremely important to us. Our providers use [topical numbing/cooling devices/specific comfort measures] to ensure you're comfortable throughout the treatment. Many clients describe it as [appropriate descriptor]. During your consultation, your provider will walk you through exactly what to expect."

Hesitation - "I need to think about it": "Absolutely, take your time! This is an important decision. Would it be helpful if I sent you some information about [treatment] to review? I can also reserve a consultation spot for you - there's no obligation, and it's a great way to get all your questions answered in person. We do tend to book up [X days/weeks] in advance, so having a spot saved gives you flexibility."

Competitor Comparison - "I'm shopping around": "That's smart - it's important to find the right fit. What I'd encourage you to consider is the provider's credentials, the quality of products used, and the overall experience. Rani is physician-supervised, and we use only FDA-approved devices and premium products. Many of our clients came to us after trying other clinics and found the difference in results was significant. A consultation with us is complimentary and no-pressure."

Never be aggressive, condescending, or dismissive of competitor clinics. We win on quality, expertise, and experience - not on disparaging others. Log all call outcomes (booked, callback requested, lost) in Mangomint and Airtable for conversion tracking. Every interaction, even unsuccessful ones, provides data that improves our marketing and sales approach.

AI Phone Agent Coordination: Our Vapi AI phone agent handles after-hours calls and overflow during peak times. The AI agent can answer FAQs, provide general service information, and collect callback requests. When you arrive in the morning, check the AI agent's overnight call log in the dashboard for any callback requests. Prioritize returning these calls within the first 30 minutes of the business day.`,
      quiz: [
        {
          question: 'When a client says "I need to think about it," what should you do?',
          options: [
            'Pressure them to book immediately',
            'Offer to send information and reserve a no-obligation consultation spot',
            'Offer a discount',
            'Tell them to call back when ready',
          ],
          correctIndex: 1,
          explanation: 'Offer to send information and reserve a no-obligation consultation spot. Create gentle urgency by mentioning booking lead times without being pushy.',
        },
        {
          question: 'How should you respond to a client comparing Rani with competitor clinics?',
          options: [
            'Disparage the competitor',
            'Match their competitor\'s price',
            'Highlight Rani\'s credentials, quality, and experience without disparaging competitors',
            'Tell them the competitor is unsafe',
          ],
          correctIndex: 2,
          explanation: 'Never disparage competitors. Win on quality, expertise, and experience - highlight physician-supervised care, FDA-approved devices, and premium products.',
        },
        {
          question: 'When should overnight AI phone agent callback requests be returned?',
          options: [
            'Within 2 hours of opening',
            'Within the first 30 minutes of the business day',
            'Before lunch',
            'By end of day',
          ],
          correctIndex: 1,
          explanation: 'Return AI agent overnight callback requests within the first 30 minutes of the business day.',
        },
      ],
    },
  ],
};

const emergencyProtocols: TrainingModule = {
  id: 'fd-005',
  slug: 'emergency-protocols',
  title: 'Emergency & Safety Protocols',
  description: 'Medical emergencies, adverse reactions, equipment failures, fire safety, active threat response, and regulatory reporting requirements.',
  role: 'front-desk',
  duration: 50,
  prerequisites: [],
  sections: [
    {
      title: 'Medical Emergency Response',
      content: `As a front desk team member at a medical aesthetics clinic, you are the first line of response coordination during any emergency. While clinical treatment of emergencies is the provider's responsibility, front desk staff must know exactly what to do to support, coordinate, and communicate during critical situations.

Anaphylactic Reaction Protocol: Although rare, anaphylaxis can occur with injectable treatments (fillers, Botox, wellness injections). Signs include: difficulty breathing, swelling of throat/tongue, hives, rapid pulse, dizziness, loss of consciousness. Immediate steps: (1) Alert the provider immediately - do NOT leave the client unattended. (2) The provider will administer epinephrine from the emergency kit. (3) Call 911 - provide the clinic address: 401 Olympia Ave NE, Suite 101, Renton, WA 98056. (4) Clear the path from the treatment room to the front entrance for paramedics. (5) Meet paramedics at the door and direct them to the treatment room. (6) Ask other clients in the waiting area to step outside briefly.

Vasovagal Syncope (Fainting): More common than anaphylaxis, especially with injectable treatments. Signs: pale skin, sweating, nausea, lightheadedness, tunnel vision. Front desk role: (1) Do NOT attempt to move the client yourself. (2) Alert the provider if not already present. (3) Bring water and cold compresses when requested. (4) Ensure the waiting area remains calm. (5) If the client does not recover within 2-3 minutes, call 911.

Cardiac Emergency: If a client or staff member shows signs of cardiac distress (chest pain, shortness of breath, arm pain, jaw pain): (1) Call 911 immediately. (2) Alert the provider. (3) Know the location of the AED (automated external defibrillator) - mounted on the wall between treatment rooms 1 and 2. (4) Clear the area for paramedics.

Emergency Kit Contents & Location: The emergency kit is located in the supply room, clearly marked with a red cross. It contains: epinephrine auto-injectors (2), diphenhydramine (Benadryl), nitroglycerin tablets, albuterol inhaler, blood pressure cuff, pulse oximeter, glucose tablets, basic first aid supplies, emergency contact list, and incident report forms. Check the kit monthly - verify nothing is expired and all items are stocked. Document the check on the supply room log.

Post-Emergency Documentation: After any medical emergency, front desk must: (1) Complete an incident report within 1 hour. (2) Collect witness statements if applicable. (3) Note exact timeline of events, interventions, and outcomes. (4) Notify the clinic owner (Rina) immediately. (5) Do NOT discuss the incident with other clients. (6) Preserve all relevant records - do not alter appointment notes or client charts. Documentation protects the clinic legally and supports quality improvement.`,
      quiz: [
        {
          question: 'Where is the AED located in the clinic?',
          options: [
            'Front desk drawer',
            'Between treatment rooms 1 and 2',
            'Supply room',
            'Break room',
          ],
          correctIndex: 1,
          explanation: 'The AED is mounted on the wall between treatment rooms 1 and 2.',
        },
        {
          question: 'Within what timeframe must an incident report be completed after a medical emergency?',
          options: ['15 minutes', '30 minutes', '1 hour', '24 hours'],
          correctIndex: 2,
          explanation: 'Incident reports must be completed within 1 hour of a medical emergency.',
        },
        {
          question: 'What is the clinic address you must provide when calling 911?',
          options: [
            '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
            '401 Olympic Ave NE, Renton, WA 98056',
            '401 Olympia Ave SE #101, Renton, WA 98056',
            '410 Olympia Ave NE #101, Renton, WA 98056',
          ],
          correctIndex: 0,
          explanation: 'The exact clinic address is 401 Olympia Ave NE, Suite 101, Renton, WA 98056. Memorize this.',
        },
      ],
    },
    {
      title: 'Adverse Reaction Reporting & Fire Safety',
      content: `Beyond acute emergencies, front desk staff must understand adverse reaction reporting and facility safety protocols.

Adverse Reaction Identification & Escalation: Adverse reactions differ from emergencies in that they may develop hours or days after treatment. Common post-treatment adverse reactions reported by phone or at follow-up include: Injectables - excessive swelling beyond 48 hours, asymmetry, skin discoloration at injection sites, nodules or lumps, vision changes (filler-specific emergency - IMMEDIATE provider escalation). Laser treatments - blistering, burns, paradoxical hyperpigmentation, scarring. Chemical peels - excessive peeling beyond expected, infection signs, persistent redness beyond 7 days. GLP-1 injections - severe nausea, vomiting, signs of pancreatitis (severe abdominal pain radiating to back).

Front desk adverse reaction protocol: (1) Listen to the client's concerns without minimizing or diagnosing. (2) Ask clarifying questions: when did it start, is it getting worse, have they taken any medications? (3) Escalate to the treating provider within 15 minutes. (4) If the provider is unavailable, escalate to the clinic owner. (5) If symptoms suggest an emergency (vision changes with filler, signs of vascular occlusion, difficulty breathing), advise the client to call 911 or go to the nearest emergency room immediately. (6) Document the report in the client's chart and create an alert in Airtable.

Regulatory Reporting: Certain adverse events require regulatory reporting. The clinic owner will handle FDA MedWatch reports and state medical board notifications, but front desk must ensure all incidents are documented thoroughly to support these filings.

Fire Safety Protocol: (1) Know the location of all fire extinguishers (reception area, hallway, break room). (2) Know the primary and secondary exit routes. Primary: front entrance. Secondary: back door through the break room. (3) If a fire alarm sounds: alert all clients and staff, assist any mobility-impaired clients, do NOT use the elevator, gather at the designated meeting point (parking lot southeast corner), account for all clients and staff using the day's appointment list. (4) For small fires (trash can, minor electrical): use the nearest fire extinguisher with the PASS technique (Pull pin, Aim low, Squeeze handle, Sweep side to side). Only attempt extinguishing if the fire is small and you have a clear exit path.

Active Threat Response: Follow the Run-Hide-Fight protocol. Run: if there is a safe escape path, take it. Leave belongings behind. Help others if possible. Hide: if you cannot escape, find a secure room, lock and barricade the door, silence your phone, stay quiet. Fight: as a last resort only. The front desk has a panic button under the counter connected to local law enforcement. Know its location and how to activate it without drawing attention.`,
      quiz: [
        {
          question: 'If a filler client reports sudden vision changes, what should front desk do?',
          options: [
            'Schedule a follow-up appointment',
            'Tell them to apply ice',
            'Advise them to call 911 or go to the ER immediately - this is a vascular occlusion emergency',
            'Wait for the provider to call them back',
          ],
          correctIndex: 2,
          explanation: 'Vision changes after filler injection suggest vascular occlusion, which is a medical emergency requiring immediate ER attention.',
        },
        {
          question: 'What is the fire extinguisher technique?',
          options: ['STOP', 'PASS', 'RACE', 'FAST'],
          correctIndex: 1,
          explanation: 'PASS: Pull pin, Aim low, Squeeze handle, Sweep side to side.',
        },
        {
          question: 'Within what timeframe must an adverse reaction report be escalated to the treating provider?',
          options: ['5 minutes', '15 minutes', '30 minutes', '1 hour'],
          correctIndex: 1,
          explanation: 'Adverse reactions must be escalated to the treating provider within 15 minutes of the client report.',
        },
      ],
    },
  ],
};

const schedulingOptimization: TrainingModule = {
  id: 'fd-006',
  slug: 'scheduling-optimization',
  title: 'Scheduling Optimization',
  description: 'Revenue-per-hour maximization, buffer time management, provider utilization targets, waitlist management, and schedule gap filling strategies.',
  role: 'front-desk',
  duration: 35,
  prerequisites: ['booking-workflow'],
  sections: [
    {
      title: 'Revenue-Optimized Scheduling Principles',
      content: `Scheduling is not just about filling time slots - it is about maximizing revenue per provider hour while maintaining clinical safety and client satisfaction. A well-optimized schedule can increase clinic revenue by 15-25% without adding any new clients.

Provider Utilization Targets: Each provider should maintain 75-85% utilization during working hours. Below 75% indicates unfilled capacity (revenue loss). Above 85% risks burnout, delays, and client dissatisfaction. Monitor utilization daily through the dashboard Schedule Optimizer page. The optimizer flags underutilized time blocks and suggests services that fit the available gaps.

Revenue-Per-Hour Thinking: Every scheduling decision should consider the revenue generated per hour of provider time. High-revenue services like Sofwave ($2,750-$4,500 for 60-90 min = $1,833-$3,000/hour) should be prioritized during peak demand hours. Lower-revenue services like wellness injections ($35-$150 for 15-30 min = $70-$600/hour) should fill gaps between major treatments.

Service Duration Awareness: Accurate duration booking prevents cascading delays. Key durations: Botox - 30 min (including consult and photos), Filler - 45-60 min, Sofwave - 60-90 min depending on areas, HydraFacial - 60 min, RF Microneedling - 60-75 min, PicoWay - 30-45 min per area, VI Peel - 45 min, PRX-T33 - 30 min, Wellness injections - 15-30 min, GLP-1 consult - 45 min (first visit), GLP-1 injection - 15 min (follow-up), Laser Hair Removal - 15-60 min by area.

Buffer Time Rules: Always add appropriate buffer between appointments. 15-minute buffer between same-provider appointments (room cleanup, charting, preparation). 30-minute buffer after complex procedures (Sofwave, extensive filler, RF Microneedling series). No buffer needed for back-to-back wellness injections (same setup). The Mangomint system has buffer defaults, but manual adjustment may be needed for complex treatment plans.

Peak vs. Off-Peak Strategy: Peak hours (10 AM - 2 PM, Tuesday-Thursday) should be reserved for high-revenue services. Off-peak hours (early morning, late afternoon, Monday, Saturday) are ideal for follow-up visits, wellness injections, and new client consultations. Train yourself to recognize when a client is flexible with timing and guide them to off-peak slots for lower-revenue services, freeing peak slots for premium treatments.`,
      quiz: [
        {
          question: 'What is the target provider utilization range?',
          options: ['60-70%', '70-80%', '75-85%', '85-95%'],
          correctIndex: 2,
          explanation: 'Target utilization is 75-85%. Below 75% means lost revenue; above 85% risks burnout and delays.',
        },
        {
          question: 'How long is the standard buffer between same-provider appointments?',
          options: ['5 minutes', '10 minutes', '15 minutes', '30 minutes'],
          correctIndex: 2,
          explanation: '15-minute buffer is standard between same-provider appointments for cleanup, charting, and preparation.',
        },
        {
          question: 'Which services should be prioritized during peak hours (10 AM - 2 PM)?',
          options: [
            'Wellness injections',
            'High-revenue services like Sofwave',
            'New client consultations',
            'Follow-up visits',
          ],
          correctIndex: 1,
          explanation: 'Peak hours should be reserved for high-revenue services. Lower-revenue services, follow-ups, and consultations should be guided to off-peak times.',
        },
      ],
    },
    {
      title: 'Waitlist Management & Gap Filling',
      content: `The waitlist is a powerful revenue recovery tool. When a cancellation occurs, a well-managed waitlist can fill the slot within hours, preventing revenue loss. Conversely, an unmanaged waitlist is a missed opportunity.

Waitlist Protocol: Maintain an active waitlist in Mangomint for clients who want earlier appointments or specific time slots. When adding to the waitlist, record: client name, desired service, preferred provider (or "any"), preferred dates/times, contact preference (call or text), and how soon they can come in (same day, next day, within a week). Review the waitlist immediately upon any cancellation.

Cancellation Recovery Process: (1) A cancellation occurs - check the waitlist for clients matching the now-open slot (same service category, provider preference, timing). (2) Contact the top 3 matches by text first (faster response), then phone if no text response within 30 minutes. (3) Text template: "Hi [Name]! Great news - an opening just became available at Rani on [date] at [time] for your [treatment]. Would you like to grab this spot? Reply YES to confirm or let me know if another time works better." (4) If no waitlist matches, check for opportunities to move an existing appointment forward (clients who booked far out may want to come sooner).

Schedule Gap Analysis: Review the next 3 days of schedule each morning. Identify gaps of 30+ minutes between appointments. For each gap, determine what services could fit (use the service duration list from Section 1). Proactive gap-filling strategies: (a) Call clients with upcoming appointments who are also due for complementary services - "Since you're already coming in for [booked service], would you like to add a [complementary service]? I can fit it right before/after your appointment." (b) Contact local walk-in inquiries who didn't book - "I have a perfect opening this [day] if you'd like to try the [service] we discussed." (c) Promote last-minute openings on Instagram stories (coordinate with marketing).

No-Show Impact & Prevention: No-shows cost the clinic an average of $350-$1,500 per occurrence depending on the service. Prevention tactics managed by front desk: confirmation calls 24 hours prior for high-value appointments, deposit enforcement for new clients and premium services, no-show policy enforcement (first occurrence = warning, second = deposit required for all future bookings, third = advance payment required). The dashboard No-Show Risk panel uses AI to predict which upcoming appointments are at high risk - check this daily and send proactive reminders to flagged clients.

End-of-Day Optimization Review: Before leaving each day, review tomorrow's schedule for: gaps that could be filled, appointments that need room reassignment, any double-bookings or conflicts, provider-specific preparation needs (Sofwave calibration, laser settings, supply staging). Communicate any notes to the opening team if you are not working the next day.`,
      quiz: [
        {
          question: 'When a cancellation occurs, how should you first contact waitlist clients?',
          options: [
            'Email',
            'Phone call',
            'Text message',
            'In-app notification',
          ],
          correctIndex: 2,
          explanation: 'Contact waitlist clients by text first for faster response. Follow up with phone call if no text response within 30 minutes.',
        },
        {
          question: 'After how many no-shows is advance payment required for all future bookings?',
          options: ['First no-show', 'Second no-show', 'Third no-show', 'Fourth no-show'],
          correctIndex: 2,
          explanation: 'No-show policy: 1st = warning, 2nd = deposit required for all future bookings, 3rd = advance payment required.',
        },
        {
          question: 'How far ahead should you review the schedule each morning for gap analysis?',
          options: ['Today only', 'Next 2 days', 'Next 3 days', 'Next 7 days'],
          correctIndex: 2,
          explanation: 'Review the next 3 days of schedule each morning to identify and fill gaps proactively.',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// PROVIDER MODULES (7)
// ═══════════════════════════════════════════════════════════════

const treatmentProtocols: TrainingModule = {
  id: 'pv-001',
  slug: 'treatment-protocols',
  title: 'Treatment Protocols & Standards',
  description: 'Standardized treatment protocols for all Rani services including pre-treatment assessment, contraindication screening, treatment parameters, and post-treatment care.',
  role: 'provider',
  duration: 60,
  prerequisites: [],
  sections: [
    {
      title: 'Injectable Treatment Protocols',
      content: `Rani Beauty Clinic maintains rigorous standardized protocols for all injectable treatments. These protocols ensure consistent, safe, high-quality outcomes across all providers while supporting our luxury brand standard. Deviation from established protocols requires documented clinical justification and supervisor approval.

Neurotoxin (Botox/Dysport) Protocol: Pre-treatment assessment includes reviewing contraindications (pregnancy, breastfeeding, neuromuscular disorders, allergy to botulinum toxin components, active infection at injection sites). Photograph the treatment area in standard positions (rest, animation) with consistent lighting. Mark injection points using anatomical landmarks - the goal is reproducible, predictable results.

Standard dosing guidelines by area: Glabella (frown lines) - 20-25 units Botox / 50-60 units Dysport. Frontalis (forehead) - 10-20 units Botox, always treat after glabella to prevent brow ptosis. Lateral canthal lines (crow's feet) - 8-12 units per side. Masseter (jawline slimming/TMJ) - 25-30 units per side. Platysmal bands - 2-5 units per band.

Adjust dosing based on: muscle mass (stronger muscles = higher dose), gender (men typically require 1.5x female doses), treatment history (first-timers may start conservative), desired outcome (subtle vs. dramatic). Document exact units, lot number, reconstitution date, and injection sites in the patient chart. Botox reconstitution: 2.5mL preservative-free saline per 100-unit vial. Use within 24 hours of reconstitution. Store reconstituted vial at 2-8°C.

Dermal Filler Protocol: Pre-treatment assessment includes reviewing contraindications (pregnancy, breastfeeding, autoimmune disorders, active herpes simplex, allergy to hyaluronic acid or lidocaine, previous adverse reaction to fillers). Assess facial anatomy comprehensively - never treat a single area in isolation. Use the MD Codes framework for full-face assessment.

Critical safety: Aspirate before injecting in high-risk vascular zones (nose, nasolabial folds, glabella, temple). Keep hyaluronidase immediately accessible during all filler treatments. Know the signs of vascular occlusion: immediate blanching, severe pain disproportionate to expected discomfort, dusky discoloration, vision changes. If vascular occlusion is suspected: STOP injecting immediately, apply warm compresses, massage the area, inject hyaluronidase, and seek emergent ophthalmology consultation if vision is affected.

Documentation requirements for all injectables: Before/after photographs, consent form signed and dated, product lot numbers, exact units/mLs used, injection technique (needle vs. cannula), injection sites mapped on a facial diagram, any immediate adverse events, post-treatment instructions given.`,
      quiz: [
        {
          question: 'What is the standard Botox reconstitution for a 100-unit vial?',
          options: [
            '1.0mL preservative-free saline',
            '2.0mL preservative-free saline',
            '2.5mL preservative-free saline',
            '5.0mL preservative-free saline',
          ],
          correctIndex: 2,
          explanation: 'Standard reconstitution is 2.5mL preservative-free saline per 100-unit vial of Botox.',
        },
        {
          question: 'What should you do if you suspect vascular occlusion during filler injection?',
          options: [
            'Continue injecting slowly',
            'Apply ice and send the client home',
            'Stop injecting, warm compresses, massage, inject hyaluronidase',
            'Schedule a follow-up in 2 weeks',
          ],
          correctIndex: 2,
          explanation: 'Vascular occlusion protocol: STOP injecting immediately, warm compresses, massage the area, inject hyaluronidase, and seek emergent ophthalmology consultation if vision is affected.',
        },
        {
          question: 'Why should frontalis (forehead) always be treated AFTER the glabella?',
          options: [
            'It hurts less in that order',
            'To prevent brow ptosis',
            'The product works better in that order',
            'Insurance requires it',
          ],
          correctIndex: 1,
          explanation: 'Frontalis should always be treated after glabella to prevent brow ptosis (drooping).',
        },
      ],
    },
    {
      title: 'Device-Based Treatment Protocols',
      content: `Rani's device-based treatments (Sofwave, PicoWay, RF Microneedling, Laser Hair Removal) require precise parameter documentation and standardized protocols to ensure safety and reproducibility.

Sofwave SUPERB Protocol: Sofwave uses synchronous ultrasound parallel beam technology (SUPERB) to stimulate collagen at 1.5mm depth in the mid-dermis. Pre-treatment: clean skin, apply topical numbing (LMX 5% or BLT compound) 30-45 minutes before treatment. Treatment parameters: energy level starts at 0.7-1.0 J/cm2 for first treatment, increase in subsequent sessions based on tolerance. Cover the full treatment area in systematic passes - do not over-treat any single zone. Post-treatment: apply cooling gel, expect mild redness and swelling for 24-48 hours. Results develop over 3-6 months as collagen remodels. Recommend follow-up treatment at 12 months for maintenance.

Contraindications for Sofwave: open wounds, active infections, severe cystic acne in treatment area, implanted devices in treatment area (pacemakers with certain configurations), isotretinoin use within 6 months.

RF Microneedling Protocol: Uses radiofrequency energy delivered through insulated microneedles to stimulate collagen and elastin production at controlled depths. Pre-treatment: topical numbing 45-60 minutes prior. Needle depth varies by treatment area: forehead 0.5-1.0mm, cheeks 1.5-2.5mm, jawline 2.0-3.0mm, neck 0.5-1.5mm, body 2.0-3.5mm. Energy settings: start conservative (Level 1-2) for first treatment, titrate up in subsequent sessions. Treatment pass pattern: systematic grid, single pass per treatment for first session, may increase to 2 passes in subsequent treatments based on response and tolerance.

Post-treatment for RF Microneedling: apply hyaluronic acid serum immediately, followed by healing moisturizer. No makeup, active ingredients, or sun exposure for 48 hours. Expect redness like moderate sunburn for 2-3 days, mild swelling for 3-5 days. Bruising is possible but uncommon. Series recommendation: 3 sessions spaced 4-6 weeks apart for optimal results.

PicoWay Laser Protocol: PicoWay uses ultra-short picosecond pulses to shatter pigment particles. For pigmented lesions: 532nm for brown/red pigment, 1064nm for darker pigment. Spot size and fluence depend on lesion depth, color, and skin type. Fitzpatrick skin type assessment is MANDATORY before any laser treatment - document in the chart. Higher Fitzpatrick types (IV-VI) require conservative parameters to avoid post-inflammatory hyperpigmentation. Test spot protocol: treat a small area first, evaluate at 4-6 weeks before proceeding with full treatment.

Laser Hair Removal Protocol: Wavelength selection based on skin type: Alexandrite (755nm) for Fitzpatrick I-III, Nd:YAG (1064nm) for Fitzpatrick IV-VI. Confirm the client has avoided sun exposure, tanning, and self-tanners for 4 weeks. Shave the treatment area 24 hours before (not waxed or plucked - the root must be present). Spot size, fluence, and pulse duration settings are documented in treatment protocols by body area and skin type.`,
      quiz: [
        {
          question: 'What depth does Sofwave target in the skin?',
          options: ['0.5mm epidermis', '1.5mm mid-dermis', '3.0mm deep dermis', '4.5mm subcutaneous'],
          correctIndex: 1,
          explanation: 'Sofwave uses SUPERB technology to stimulate collagen at 1.5mm depth in the mid-dermis.',
        },
        {
          question: 'What Fitzpatrick skin types can safely receive Alexandrite laser hair removal?',
          options: ['I-III', 'I-IV', 'III-VI', 'All types'],
          correctIndex: 0,
          explanation: 'Alexandrite (755nm) is suitable for Fitzpatrick types I-III. Types IV-VI require Nd:YAG (1064nm).',
        },
        {
          question: 'How many RF Microneedling sessions are recommended in a standard series?',
          options: ['1 session', '2 sessions', '3 sessions', '6 sessions'],
          correctIndex: 2,
          explanation: 'The standard RF Microneedling series is 3 sessions spaced 4-6 weeks apart for optimal results.',
        },
      ],
    },
  ],
};

const consultationFramework: TrainingModule = {
  id: 'pv-002',
  slug: 'consultation-framework',
  title: 'Consultation Excellence Framework',
  description: 'Structured consultation methodology including client assessment, goal setting, treatment planning, pricing presentation, and conversion techniques.',
  role: 'provider',
  duration: 45,
  prerequisites: ['treatment-protocols'],
  sections: [
    {
      title: 'The Rani Consultation Method',
      content: `A great consultation is the highest-leverage activity in a medical aesthetics practice. It transforms a curious prospect into a committed client with a multi-thousand-dollar treatment plan. At Rani, consultations follow a structured framework that balances clinical expertise with luxury hospitality.

The 5-Phase Consultation Framework: (1) Connection & Discovery (10 min), (2) Clinical Assessment (10 min), (3) Treatment Planning & Education (10 min), (4) Financial Presentation (5 min), (5) Commitment & Next Steps (5 min). Total consultation time: 40 minutes maximum.

Phase 1 - Connection & Discovery: Begin by reviewing the AI-generated intake summary in Airtable before the client enters the room. The "Intake Summary (AI)" field contains a concise analysis of their concerns, medical history, and aesthetic goals. This preparation allows you to personalize the conversation from the first moment.

Greet the client warmly and introduce yourself with credentials. Open with an empathetic, open-ended question: "Tell me about what brings you in today and what you'd most like to change." Listen without interrupting. Take notes. Repeat their concerns back to confirm understanding: "So the main things you'd like to address are [concern 1] and [concern 2], and you're hoping to achieve [stated goal]. Is that right?"

Phase 2 - Clinical Assessment: Conduct a thorough visual and tactile assessment relevant to their concerns. Use a magnifying lamp and good lighting. Assess skin quality, laxity, volume loss, pigmentation, texture, and symmetry. For wellness concerns (energy, weight loss), review relevant lab work or recommend labs. Explain what you observe in educational, non-judgmental language: "I can see some mild volume loss in the mid-face area, which is what's creating that shadow under your eyes. This is completely normal - it happens to everyone as collagen production slows in our 30s and 40s."

Phase 3 - Treatment Planning: Present a customized treatment plan using the Good/Better/Best framework. Good = addresses primary concern with a single treatment. Better = comprehensive approach addressing primary and secondary concerns. Best = full transformation plan with optimal results. Always present Best first, as it anchors the conversation at the highest value. Use the Consult Co-pilot in the dashboard for AI-generated treatment plans, talking points, and cross-sell opportunities.

Phase 4 - Financial Presentation: Present pricing confidently and without apology. Frame costs as investments in their transformation. Provide itemized pricing for each recommendation. Highlight package savings and membership benefits. Present financing options proactively for plans over $1,000. Use the phrase "Your investment for [treatment plan]" rather than "The cost" or "The price."

Phase 5 - Commitment: Ask for the booking directly: "Which plan resonates most with you?" or "Would you like to start with [specific treatment] - I have availability [date]." Never end a consultation without a clear next step: booked appointment, scheduled follow-up call, or deposit for future treatment.`,
      quiz: [
        {
          question: 'In the Good/Better/Best framework, which plan should you present first?',
          options: ['Good', 'Better', 'Best', 'Let the client choose'],
          correctIndex: 2,
          explanation: 'Always present Best first, as it anchors the conversation at the highest value and frames the other options as more accessible.',
        },
        {
          question: 'What field should you review in Airtable before a consultation?',
          options: [
            'Client Notes',
            'Intake Summary (AI)',
            'Appointment History',
            'Payment Records',
          ],
          correctIndex: 1,
          explanation: 'Review the "Intake Summary (AI)" field in Airtable for the AI-generated analysis of the client\'s concerns, medical history, and goals.',
        },
        {
          question: 'What is the maximum recommended consultation duration?',
          options: ['20 minutes', '30 minutes', '40 minutes', '60 minutes'],
          correctIndex: 2,
          explanation: 'Total consultation time should be 40 minutes maximum across all 5 phases.',
        },
      ],
    },
  ],
};

const chartingCompliance: TrainingModule = {
  id: 'pv-003',
  slug: 'charting-compliance',
  title: 'Charting & Documentation Compliance',
  description: 'Medical record documentation standards, SOAP note format, injection mapping, photo documentation, and regulatory compliance requirements.',
  role: 'provider',
  duration: 40,
  prerequisites: [],
  sections: [
    {
      title: 'Documentation Standards & SOAP Notes',
      content: `Proper charting is not just a legal requirement - it is the foundation of consistent care, defensible medical records, and effective multi-provider coordination. At Rani, all providers must complete treatment documentation before their next appointment begins. No exceptions.

SOAP Note Format: Every treatment visit requires a SOAP note. S (Subjective): Document the client's stated concerns, goals, and any changes since the last visit. Include relevant quotes: "Client reports she was happy with Botox results but feels the right side wore off faster than the left." O (Objective): Document your clinical findings - visual assessment, measurements, skin type, areas of concern. Include pre-treatment photographs. A (Assessment): Your clinical assessment and diagnosis. What treatment is indicated and why. Document contraindication screening results. P (Plan): Detailed treatment plan including products used (with lot numbers), technique, parameters, areas treated, post-treatment instructions given, and follow-up plan.

Injectable Documentation Specifics: For neurotoxins - record product name, lot number, reconstitution date, units per injection site (use a facial diagram), total units, technique (e.g., intramuscular for masseter, intradermal for forehead). For fillers - record product name, lot number, volume per area, injection depth, technique (needle vs. cannula, linear threading vs. bolus vs. fanning), aspiration results in high-risk zones. Our charting system includes injection mapping templates - use these for every injectable treatment.

Photo Documentation Protocol: Before/after photos are required for EVERY treatment visit. Standards: consistent lighting (ring light, positioned at 12 o'clock), consistent positioning (frontal, left 45-degree, right 45-degree, left 90-degree, right 90-degree), neutral background, no makeup, hair pulled back. Label photos with client name, date, and treatment. Photos must be taken BEFORE any topical numbing (numbing cream alters skin appearance). Store in the secure clinic photo system - never on personal devices.

Device Treatment Documentation: Record all device parameters: energy level, pulse duration, spot size, number of passes, treatment area, skin cooling method and settings. For laser treatments, document Fitzpatrick skin type assessment and test spot results if applicable. For RF Microneedling, document needle depth per zone and energy level. These parameters are critical for reproducibility in follow-up treatments and for troubleshooting adverse outcomes.

Timeliness & Completeness: Notes must be completed within 2 hours of the treatment. Late charting risks inaccurate recall and compliance violations. Each note must be signed with the provider's name and credentials. If a note needs to be amended, use the addendum process - never delete or overwrite existing documentation. Amended notes must include the date and reason for amendment.

Compliance Audits: Charts are audited quarterly for completeness. Audit criteria: SOAP note present, photos documented, consent current, product lot numbers recorded, technique details sufficient for reproducibility, post-treatment instructions documented. Target compliance: 100%. Deficiencies trigger immediate correction and additional training.`,
      quiz: [
        {
          question: 'Within what timeframe must treatment notes be completed?',
          options: ['30 minutes', '1 hour', '2 hours', 'End of day'],
          correctIndex: 2,
          explanation: 'Notes must be completed within 2 hours of the treatment to ensure accurate documentation.',
        },
        {
          question: 'What must be documented for every injectable treatment?',
          options: [
            'Just the total units used',
            'Product lot numbers, units per site, technique, and injection map',
            'Provider name and date only',
            'Client satisfaction score',
          ],
          correctIndex: 1,
          explanation: 'Injectable documentation requires product name, lot number, units per injection site with facial diagram, technique, and total volume/units.',
        },
        {
          question: 'When should before photos be taken relative to numbing cream application?',
          options: [
            'After numbing cream',
            'Before numbing cream',
            'It doesn\'t matter',
            'During treatment',
          ],
          correctIndex: 1,
          explanation: 'Photos must be taken BEFORE any topical numbing because numbing cream alters skin appearance.',
        },
      ],
    },
  ],
};

const safetyStandards: TrainingModule = {
  id: 'pv-004',
  slug: 'safety-standards',
  title: 'Clinical Safety Standards',
  description: 'Infection control, sterile technique, equipment sterilization, product storage, sharps disposal, and OSHA compliance for medical aesthetics.',
  role: 'provider',
  duration: 45,
  prerequisites: [],
  sections: [
    {
      title: 'Infection Control & Sterile Technique',
      content: `Medical aesthetics procedures, while minimally invasive, carry real infection risks. Maintaining rigorous infection control protocols protects both clients and staff. At Rani, we follow OSHA Bloodborne Pathogen Standards and CDC guidelines for infection control in outpatient settings.

Hand Hygiene: Wash hands with antimicrobial soap for a minimum of 20 seconds or use alcohol-based hand sanitizer (minimum 60% alcohol) before and after every client interaction - even if gloves are worn. Hand hygiene is the single most effective infection prevention measure. Change gloves between clients, between treatment areas on the same client, and if gloves are torn or contaminated.

Personal Protective Equipment (PPE): For injectable procedures - non-sterile nitrile gloves at minimum. For laser procedures - appropriate laser-specific eye protection for both provider and client (wavelength-matched goggles). For procedures with splash risk - face shield or safety glasses in addition to gloves. For chemical peels - nitrile gloves and eye protection.

Sterile Field Preparation: For any procedure involving skin penetration (microneedling, injections, laser with open skin): prepare the sterile field on a clean, disinfected surface. Open sterile supplies using aseptic technique. Do not reach over the sterile field. Reconstitute injectables using aseptic technique with alcohol-swabbed vial tops.

Skin Preparation: Clean the treatment area with alcohol swabs or chlorhexidine before any injection or device treatment that penetrates the skin. Allow the antiseptic to dry completely before proceeding. For laser treatments on intact skin, ensure the area is clean and free of makeup, sunscreen, and topical products.

Sharps Disposal: All needles, cannulas, and sharp devices go immediately into FDA-approved sharps containers. Never recap needles. Never overfill sharps containers beyond the fill line. Sharps containers are located in every treatment room. When a container reaches the fill line, seal it and replace it. Used containers are picked up by our medical waste service on a scheduled basis.

Equipment Sterilization: Non-disposable instruments (rare at Rani, but includes some specialty tools) must be processed through the ultrasonic cleaner, then autoclaved. Autoclave spore testing is performed weekly to verify sterilization effectiveness. Device handpieces (RF Microneedling, Sofwave) are disinfected with hospital-grade surface wipes between clients. Disposable tips (microneedling cartridges) are single-use - NEVER reuse on another client.

Product Storage: Injectable products must be stored per manufacturer specifications. Botulinum toxin: unreconstituted stored at 2-8°C, reconstituted used within 24 hours. Hyaluronic acid fillers: stored at room temperature (below 25°C), do not freeze. Check expiration dates before every use. Document product temperature log daily for refrigerated items.

Post-Exposure Protocol: If a needlestick or sharps injury occurs: (1) wash the wound immediately with soap and water, (2) report the incident to the clinic supervisor, (3) complete an incident report, (4) seek post-exposure evaluation (healthcare provider assessment, baseline labs, potential prophylaxis). Do not delay reporting - early intervention is critical.`,
      quiz: [
        {
          question: 'How long should you wash hands with antimicrobial soap?',
          options: ['10 seconds', '15 seconds', '20 seconds', '30 seconds'],
          correctIndex: 2,
          explanation: 'Wash hands for a minimum of 20 seconds with antimicrobial soap.',
        },
        {
          question: 'What should you NEVER do with used needles?',
          options: ['Dispose in sharps container', 'Recap them', 'Document their use', 'Report dull needles'],
          correctIndex: 1,
          explanation: 'Never recap needles - this is a leading cause of needlestick injuries. Dispose immediately in a sharps container.',
        },
        {
          question: 'How often is autoclave spore testing performed?',
          options: ['Daily', 'Weekly', 'Monthly', 'Quarterly'],
          correctIndex: 1,
          explanation: 'Autoclave spore testing is performed weekly to verify sterilization effectiveness.',
        },
      ],
    },
  ],
};

const injectionTechniques: TrainingModule = {
  id: 'pv-005',
  slug: 'injection-techniques',
  title: 'Advanced Injection Techniques',
  description: 'Anatomy review, injection point mapping, cannula vs. needle decision-making, complication management, and technique refinement for neurotoxins and fillers.',
  role: 'provider',
  duration: 60,
  prerequisites: ['treatment-protocols', 'safety-standards'],
  sections: [
    {
      title: 'Facial Anatomy & Danger Zones',
      content: `Mastery of facial anatomy is the foundation of safe and effective injection technique. Every provider at Rani must have thorough knowledge of the vascular anatomy, nerve distribution, and tissue planes relevant to injectable treatments.

Vascular Danger Zones - these areas require extra caution due to proximity to critical blood vessels: (1) Glabella/Nose region - the supratrochlear and dorsal nasal arteries supply this area. Inadvertent intravascular injection can cause skin necrosis or, in worst cases, retinal artery occlusion leading to blindness. Always aspirate, use small volumes, inject slowly with low pressure. (2) Nasolabial folds - the facial artery courses along the nasolabial fold. Deep injections near the piriform aperture carry vascular risk. Use cannula technique when possible. (3) Temple - the superficial temporal artery runs through this area. Inject superficially (subdermally) and use cannula when filling temple hollows. (4) Periorbital region - complex vascular network. Use only experienced-approved products (low G-prime HA) and conservative volumes. (5) Lip - labial arteries run approximately 4mm deep to the vermilion border. Know the anatomy, aspirate, use blunt cannula for volume augmentation.

Nerve Anatomy: Key nerves to avoid: supraorbital nerve (runs through the supraorbital notch - palpate before injecting forehead), infraorbital nerve (exits below the orbit at the mid-pupillary line - avoid deep injection here), mental nerve (exits at the chin at the mid-pupillary line, below the second premolar). Temporary nerve damage can cause numbness, weakness, or asymmetry lasting weeks to months.

Tissue Planes: Understanding tissue planes is critical for placing product at the correct depth. From superficial to deep: epidermis → dermis → subcutaneous fat (superficial and deep compartments) → SMAS/muscle → periosteum/bone. Neurotoxins target the muscle layer. Fillers are placed in different planes depending on the goal: deep fat compartment/periosteal level for volumization, subcutaneous level for contouring, dermal level for superficial lines and skin quality.

Injection Point Mapping: Before every injection session, map your injection points using anatomical landmarks. Standard approaches by area - Glabella: 5-point injection pattern (2 corrugator insertions, 2 corrugator bodies, 1 procerus). Forehead: horizontal rows following frontalis muscle fibers, spacing 1.5-2cm apart. Crow's feet: 3 injection points per side in a fan pattern, lateral to the orbital rim. Masseter: 3-6 injection points per side in the masseter body, confirmed by palpation during clenching.

Use the clinic's facial diagram templates to mark and document injection points for every treatment. This enables reproducibility, comparison between treatments, and clear documentation for any follow-up adjustments.`,
      quiz: [
        {
          question: 'Which area carries the highest risk for retinal artery occlusion during filler injection?',
          options: ['Lips', 'Cheeks', 'Glabella/Nose region', 'Jawline'],
          correctIndex: 2,
          explanation: 'The glabella/nose region carries the highest risk for retinal artery occlusion due to the supratrochlear and dorsal nasal artery connections to the ophthalmic artery.',
        },
        {
          question: 'At what depth do the labial arteries run relative to the lip vermilion border?',
          options: ['1mm', '2mm', '4mm', '8mm'],
          correctIndex: 2,
          explanation: 'The labial arteries run approximately 4mm deep to the vermilion border.',
        },
        {
          question: 'How many injection points make up the standard glabella Botox pattern?',
          options: ['3 points', '4 points', '5 points', '7 points'],
          correctIndex: 2,
          explanation: 'Standard glabella pattern is 5 points: 2 corrugator insertions, 2 corrugator bodies, and 1 procerus.',
        },
      ],
    },
  ],
};

const patientCommunication: TrainingModule = {
  id: 'pv-006',
  slug: 'patient-communication',
  title: 'Patient Communication & Education',
  description: 'Setting realistic expectations, managing anxiety, explaining procedures, aftercare communication, and building long-term provider-client relationships.',
  role: 'provider',
  duration: 35,
  prerequisites: ['consultation-framework'],
  sections: [
    {
      title: 'Expectation Management & Clinical Communication',
      content: `Effective patient communication in medical aesthetics requires a balance of clinical authority, empathetic listening, and honest expectation management. Client satisfaction is more closely tied to expectation alignment than to objective treatment outcomes - a client with realistic expectations and good results will be more satisfied than a client with unrealistic expectations and excellent results.

Setting Realistic Expectations: Begin every treatment discussion with an honest timeline and outcome range. Use language like "most clients see improvement of..." rather than promising specific results. Examples: Botox - "You'll start noticing softening of the lines within 3-7 days, with full effect at 14 days. Results typically last 3-4 months." Fillers - "You'll see immediate volume, but there will be some swelling for 2-5 days. Final results are best judged at 2 weeks." Sofwave - "Collagen remodeling takes time. You'll see gradual improvement over 3-6 months with peak results around the 6-month mark." RF Microneedling - "Expect significant improvement after 3 sessions. Individual sessions provide noticeable benefit, but the series delivers optimal results."

Always under-promise and over-deliver. If you think a client will need 2 sessions, tell them 2-3 sessions. If they end up needing only 2, they are delighted. If they need 3, they were prepared.

Managing Treatment Anxiety: Many clients, especially first-timers, experience anxiety before aesthetic treatments. Recognize the signs: nervous fidgeting, excessive questions, repeatedly asking about pain, asking "how many people have you done this on?" Address anxiety directly: "It's completely normal to feel nervous - many of my clients felt the same way before their first treatment. I'm going to walk you through everything before we start, and we can stop at any time if you need a break."

Comfort Measures Communication: Explain your comfort protocol before starting: "First, I'll apply numbing cream that takes about 30 minutes to work. During the treatment, I'll check in with you regularly. If anything feels uncomfortable, just tell me and we can pause." Use distraction techniques: conversational engagement, music preferences, hand mirrors so they can watch (some clients find this reduces anxiety), or offering to cover mirrors for those who don't want to watch.

Post-Treatment Communication: Provide verbal AND written post-treatment instructions. Clients retain only 20-40% of verbal information after a procedure. Key points to communicate: (1) What is NORMAL - expected swelling, redness, bruising timeline. (2) What is NOT normal - signs that warrant calling the clinic. (3) Activity restrictions and duration. (4) Product usage (what to apply, what to avoid). (5) Follow-up timeline. End every treatment with: "We'll check in with you [tomorrow/in a few days] to make sure everything is going well. Don't hesitate to call if you have any questions before then."

Building Long-Term Relationships: Remember personal details and reference them in follow-up visits. Ask about their results at the next appointment before jumping into the new treatment. Celebrate their progress - "Your skin has really transformed since we started. Compare these photos from your first visit - the texture improvement is remarkable." Personalization creates loyalty. Clients don't leave providers who remember them and celebrate their journey.`,
      quiz: [
        {
          question: 'How long after Botox injection do full effects typically appear?',
          options: ['Immediately', '3-7 days', '14 days', '30 days'],
          correctIndex: 2,
          explanation: 'Botox starts softening at 3-7 days but full effect is seen at 14 days.',
        },
        {
          question: 'What percentage of verbal post-treatment instructions do clients typically retain?',
          options: ['10-20%', '20-40%', '50-60%', '70-80%'],
          correctIndex: 1,
          explanation: 'Clients retain only 20-40% of verbal information after a procedure, which is why written instructions are essential.',
        },
        {
          question: 'If you think a client will need 2 treatment sessions, what should you tell them?',
          options: ['1-2 sessions', '2-3 sessions', 'Exactly 2 sessions', '3-4 sessions'],
          correctIndex: 1,
          explanation: 'Under-promise and over-deliver. If you think 2 sessions, say 2-3 so clients are prepared for the maximum and delighted if they need fewer.',
        },
      ],
    },
  ],
};

const crossSellClinical: TrainingModule = {
  id: 'pv-007',
  slug: 'cross-sell-clinical',
  title: 'Clinical Cross-Selling Mastery',
  description: 'Ethical treatment bundling, pathway-based recommendations, membership value propositions from a clinical perspective, and maximizing client outcomes through comprehensive care.',
  role: 'provider',
  duration: 30,
  prerequisites: ['consultation-framework', 'treatment-protocols'],
  sections: [
    {
      title: 'Ethical Cross-Selling Through Clinical Excellence',
      content: `Cross-selling in medical aesthetics is not about increasing revenue for its own sake - it is about providing comprehensive care that maximizes client outcomes. When done ethically, cross-selling leads to better results, higher satisfaction, and stronger client loyalty. Every recommendation must be clinically justified.

The Treatment Pathway Approach: Think of each client's aesthetic journey as a pathway with logical progressions. A client who starts with Botox for forehead lines will likely benefit from: filler for mid-face volume loss (addresses the underlying cause of deeper lines), HydraFacial for skin quality improvement (surface-level glow), skincare regimen for maintenance between treatments, and Sofwave for long-term collagen stimulation (preventive aging strategy).

Clinical Cross-Sell Pairings at Rani - these combinations are evidence-based and deliver synergistic results: Botox + Filler - "The neurotoxin relaxes the muscles creating the lines, while the filler restores the volume loss underneath. Together, they give you a more comprehensive rejuvenation than either alone." Sofwave + PRX-T33 - "Sofwave stimulates deep collagen, and PRX-T33 enhances skin quality at the dermal level. Clients who combine these see accelerated improvement in both tightening and texture." HydraFacial + VI Peel - "The HydraFacial deeply cleanses and hydrates, while the VI Peel addresses pigmentation and fine lines. Alternating these monthly gives your skin the best of both worlds." RF Microneedling + PRP - "Adding PRP (platelet-rich plasma) to your microneedling session amplifies the healing response and can improve results by 30-40%." GLP-1 + Body Contouring - "As you lose weight with GLP-1, skin laxity can develop. We can proactively address that with Sofwave or RF Microneedling on the body to tighten skin as the weight comes off."

Wellness Injection Cross-Sells: After any aesthetic treatment, wellness injections are a low-barrier add-on that enhances results: NAD+ injection ($150-500) - promotes cellular repair and energy, excellent post-treatment recovery support. Glutathione injection ($100) - powerful antioxidant that brightens skin from within, complements any skin treatment. Tri-Immune injection ($75) - immune system support, beneficial for clients undergoing series treatments. B12 injection ($35) - energy boost, easiest cross-sell for any client.

The "Since You're Already Here" Framework: After completing a treatment, present add-on recommendations naturally: "Since you're already here and your skin is freshly treated, this is actually the perfect time for a [wellness injection/add-on service]. Many of my clients add [specific injection] because [specific benefit]. It only takes 5 minutes and it really enhances your results." This approach works because the client is already in the treatment mindset, already committed time and money, and the add-on feels like an enhancement rather than a separate purchase.

Membership Integration: When recommending treatment series or pathways, always calculate the membership savings and present them: "Based on your treatment plan, membership would save you approximately $[X] over the next 12 months. Plus you get [specific member perks] included." The provider's endorsement of membership carries more clinical credibility than the front desk presentation.`,
      quiz: [
        {
          question: 'What is the primary ethical standard for clinical cross-selling?',
          options: [
            'Revenue maximization',
            'Every recommendation must be clinically justified',
            'Selling the most expensive option',
            'Meeting monthly targets',
          ],
          correctIndex: 1,
          explanation: 'Every cross-sell recommendation must be clinically justified. Cross-selling should lead to better outcomes for the client.',
        },
        {
          question: 'Which wellness injection is the easiest cross-sell for any client?',
          options: ['NAD+ ($150-500)', 'Glutathione ($100)', 'Tri-Immune ($75)', 'B12 ($35)'],
          correctIndex: 3,
          explanation: 'B12 at $35 is the lowest barrier and universally beneficial, making it the easiest cross-sell for any client.',
        },
        {
          question: 'Why is provider endorsement of membership more effective than front desk presentation?',
          options: [
            'Providers are more persuasive',
            'It carries more clinical credibility',
            'Front desk is too busy',
            'It is required by policy',
          ],
          correctIndex: 1,
          explanation: 'The provider\'s endorsement carries clinical credibility because clients trust their medical recommendations.',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// ALL STAFF MODULES (4)
// ═══════════════════════════════════════════════════════════════

const brandVoice: TrainingModule = {
  id: 'as-001',
  slug: 'brand-voice',
  title: 'Rani Brand Voice & Standards',
  description: 'Luxury brand positioning, communication tone, visual standards, social media voice, and maintaining brand consistency across all client touchpoints.',
  role: 'all-staff',
  duration: 30,
  prerequisites: [],
  sections: [
    {
      title: 'The Rani Brand Identity',
      content: `Rani Beauty Clinic is positioned as a luxury medical aesthetics destination - not a discount medspa, not a clinical hospital, and not a casual beauty bar. Every team member is a brand ambassador, and every interaction shapes the client's perception of our brand. Understanding and embodying the Rani brand voice is essential for every role.

Brand Positioning Statement: "Rani Beauty Clinic is where clinical precision meets luxury experience. We are a physician-supervised medical aesthetics practice delivering transformative results through advanced technology, expert providers, and personalized care." This statement should guide every decision from how we answer the phone to how we decorate the treatment rooms.

The Four Pillars of Rani's Brand Voice: (1) Luxury - We speak and act like a 5-star hospitality brand. Language is elevated but not pretentious. "Shall I offer you water or tea?" not "Want something to drink?" We use "guests" and "clients," never "customers." (2) Clinical Confidence - We are medically supervised and evidence-based. We speak with authority about our treatments without being condescending. We educate rather than sell. (3) Warmth - Despite our luxury positioning, we are not cold or intimidating. Clients should feel welcomed, valued, and comfortable. We use first names, remember personal details, and celebrate their aesthetic journey. (4) Aspirational - We help clients envision their best selves. We talk about "transformation journeys," not "treatment lists." We frame conversations around goals and outcomes, not procedures and prices.

Words We Use vs. Words We Avoid: USE: "investment" (not "cost" or "price"), "treatment journey" (not "appointment schedule"), "enhance" or "optimize" (not "fix"), "aesthetic goals" (not "problems" or "issues"), "injection" (NEVER "infusion" - this is a critical brand standard), "customized plan" (not "package deal"), "results" (not "outcomes"), "complementary" (not "free" when offering consultations). AVOID: discount language ("sale," "deal," "cheap," "affordable"), negative language ("wrinkles," "aging," "damage" - instead use "fine lines," "maturing," "sun-related changes"), competitor comparisons, medical jargon without explanation, pressure tactics ("limited time," "running out").

Visual Brand Standards: Colors - Navy (#0F1D2C), Gold (#C9A96E), Cream (#F8F6F1). Fonts - Playfair Display for headings (elegant serif), Montserrat for body text (clean, modern). Photography style - warm tones, natural lighting, diverse representation, candid luxury moments. Social media - educational + aspirational tone, never discount-first messaging.

Environmental Standards: The clinic environment is an extension of the brand. Temperature maintained at 70-72°F, ambient music (lo-fi, classical, spa-appropriate - never pop or radio), subtle signature scent, treatment rooms immaculately clean and staged before each client, fresh flowers in reception weekly. These details seem small but they compound into a luxury experience that justifies our premium pricing and builds fierce loyalty.`,
      quiz: [
        {
          question: 'What word must NEVER be used at Rani when referring to IM treatments?',
          options: ['Injection', 'Shot', 'Infusion', 'Treatment'],
          correctIndex: 2,
          explanation: 'NEVER use the word "infusion" at Rani. All IM treatments are always referred to as "injections." This is a critical brand standard.',
        },
        {
          question: 'What are the four pillars of the Rani brand voice?',
          options: [
            'Fast, Cheap, Good, Reliable',
            'Luxury, Clinical Confidence, Warmth, Aspirational',
            'Professional, Medical, Friendly, Affordable',
            'Exclusive, Clinical, Formal, Premium',
          ],
          correctIndex: 1,
          explanation: 'The four pillars are Luxury, Clinical Confidence, Warmth, and Aspirational.',
        },
        {
          question: 'Instead of saying "cost" or "price," what word should you use?',
          options: ['Fee', 'Charge', 'Investment', 'Rate'],
          correctIndex: 2,
          explanation: 'Use "investment" instead of "cost" or "price" - it frames treatment as a valuable investment in the client\'s appearance and confidence.',
        },
      ],
    },
  ],
};

const hipaaBasics: TrainingModule = {
  id: 'as-002',
  slug: 'hipaa-basics',
  title: 'HIPAA & Privacy Fundamentals',
  description: 'Protected health information handling, client privacy rights, breach prevention, documentation standards, and state-specific medical aesthetics regulations.',
  role: 'all-staff',
  duration: 40,
  prerequisites: [],
  sections: [
    {
      title: 'HIPAA Essentials for Medical Aesthetics Staff',
      content: `HIPAA (Health Insurance Portability and Accountability Act) applies to ALL staff at Rani Beauty Clinic, regardless of role. As a medical aesthetics practice with physician supervision, we are a covered entity under HIPAA. Violations can result in fines from $100 to $1.5 million per violation category per year, plus potential criminal penalties. Every team member must understand and follow these requirements.

What is Protected Health Information (PHI)? PHI includes any individually identifiable health information. At Rani, this includes: client names linked to treatment information, before/after photographs, treatment records and charts, appointment schedules, payment records tied to medical services, email/text communications about treatments, intake forms and medical histories, lab results (GLP-1 program), allergy and medication lists.

The Minimum Necessary Rule: Only access PHI that is necessary for your job function. Front desk needs appointment details but not detailed treatment notes. Providers need clinical information but not payment details. Marketing needs anonymized data for analytics but not individual client records. Never browse client records out of curiosity - system access is logged and audited.

Physical Safeguards: (1) Computer screens must lock after 2 minutes of inactivity. (2) Never leave client charts or intake forms visible in common areas. (3) Treatment room doors must be closed during consultations and treatments. (4) Shred all paper documents containing PHI - never put them in regular trash. (5) Before/after photos must be stored in the secure clinic system, never on personal phones. (6) Printer output containing PHI must be collected immediately.

Digital Safeguards: (1) Use strong, unique passwords for all systems (Mangomint, Airtable, email). (2) Enable two-factor authentication where available. (3) Never send PHI via personal email or text - use the clinic's approved communication channels. (4) Do not discuss client information in text messages with coworkers - use the clinic's secure communication system. (5) Never access clinic systems from public Wi-Fi without VPN. (6) Report any suspected phishing emails to management immediately.

Social Media Compliance: This is where medical aesthetic clinics most commonly violate HIPAA. (1) NEVER post client photos without a signed photography consent AND specific social media consent. (2) NEVER tag clients in treatment photos. (3) NEVER respond to online reviews with any treatment details - even if the client mentioned their treatment. A compliant review response is: "Thank you for your feedback! We're glad you had a positive experience." An NON-compliant response is: "We're so glad your Botox turned out great!" (4) Never mention a client's name on social media. (5) Even with consent, remove any identifying features (distinctive tattoos, jewelry) unless the client specifically approves.

Breach Protocol: If you suspect a HIPAA breach (unauthorized access, lost records, misdirected communication): (1) Report to the clinic owner/privacy officer immediately. (2) Do not attempt to fix the breach yourself. (3) Document what happened, when, and what PHI was involved. (4) The privacy officer will assess the breach and determine notification requirements. Small breaches must be logged annually and reported to HHS. Breaches affecting 500+ individuals require media notification. Take every potential breach seriously - early reporting allows faster remediation.`,
      quiz: [
        {
          question: 'What is the maximum annual HIPAA fine per violation category?',
          options: ['$10,000', '$100,000', '$500,000', '$1.5 million'],
          correctIndex: 3,
          explanation: 'HIPAA fines can reach up to $1.5 million per violation category per year.',
        },
        {
          question: 'A client leaves a 5-star Google review mentioning their Botox treatment. How should you respond?',
          options: [
            '"Thanks for the great review of your Botox!"',
            '"We\'re so glad your treatment went well - see you for your next Botox session!"',
            '"Thank you for your feedback! We\'re glad you had a positive experience."',
            'Do not respond at all',
          ],
          correctIndex: 2,
          explanation: 'Even if the client mentions their treatment, your response must never confirm or reference any specific treatment. Use a generic positive acknowledgment.',
        },
        {
          question: 'After how many minutes of inactivity must computer screens lock?',
          options: ['1 minute', '2 minutes', '5 minutes', '10 minutes'],
          correctIndex: 1,
          explanation: 'Computer screens must lock after 2 minutes of inactivity to prevent unauthorized access to PHI.',
        },
      ],
    },
  ],
};

const productKnowledge: TrainingModule = {
  id: 'as-003',
  slug: 'product-knowledge',
  title: 'Product & Service Knowledge',
  description: 'Complete knowledge of all Rani services, pricing tiers, treatment benefits, ideal candidates, expected results, and competitive differentiators.',
  role: 'all-staff',
  duration: 50,
  prerequisites: ['brand-voice'],
  sections: [
    {
      title: 'Aesthetic Treatment Portfolio',
      content: `Every team member must be able to speak knowledgeably about all Rani services. Whether you are answering the phone, greeting a client, or discussing treatment options, product knowledge builds credibility and confidence in our brand.

Sofwave SUPERB ($2,750-$4,500): Non-invasive skin tightening using synchronous ultrasound. Ideal for: clients 35-65+ wanting to tighten skin without surgery, address fine lines, improve jawline definition. Results: gradual improvement over 3-6 months as collagen remodels. Competitive advantage: FDA-cleared, no downtime, single-session protocol. Treatment areas: full face, neck, submentum (double chin), brow lift. Pair with: PRX-T33 for enhanced skin quality, HydraFacial for immediate glow post-treatment.

HydraFacial ($275): Multi-step facial using vortex technology to cleanse, exfoliate, extract, and hydrate. Ideal for: everyone - no contraindications for most skin types, great introductory treatment. Results: immediate glow and hydration, cumulative improvement with monthly sessions. Competitive advantage: gentle, customizable, no downtime, suitable for all skin types. Pair with: LED add-on, dermaplaning, wellness injection.

PRX-T33 ($495): Bio-revitalization treatment using TCA (trichloroacetic acid) without the traditional peeling process. Ideal for: clients wanting improved skin texture, reduced fine lines, enhanced radiance without downtime. Results: immediate brightness, cumulative improvement over 3-5 sessions. Competitive advantage: no peeling, no downtime, can be done year-round regardless of skin type.

VI Peel ($395): Professional-grade chemical peel for pigmentation, acne, and anti-aging. Ideal for: clients with hyperpigmentation, melasma, acne scarring, sun damage. Results: visible peeling at days 3-5, new skin revealed at day 7, optimal results after a series of 3 peels. Competitive advantage: suitable for all skin types including darker skin tones.

PicoWay ($350-$600 per session): Picosecond laser for pigmented lesions and skin revitalization. Ideal for: dark spots, sun spots, freckles, melasma, tattoo removal. Results: lesions fade over 2-4 weeks, may need 3-6 sessions for complete clearance. Competitive advantage: ultra-short pulses minimize heat damage, safer for diverse skin types than traditional lasers.

RF Microneedling ($495-$850 per session): Radiofrequency energy delivered through microneedles for collagen stimulation. Ideal for: acne scars, large pores, fine lines, skin laxity, stretch marks. Results: improvement seen after first session, optimal after 3-session series. Competitive advantage: treats both superficial and deep skin concerns, customizable depth.

Wellness Injections: IM injection portfolio - Vitamin D3 ($50), Tri-Immune ($75), Glutathione ($100), B12 ($35), NAD+ ($150-500). Ideal for: clients seeking energy, immune support, skin brightening, anti-aging from within. Results: varies by injection, generally felt within 24-48 hours. Competitive advantage: quick (15-30 min), affordable entry point, introduces clients to the clinic.

GLP-1 Weight Loss Program ($399-599/month): Physician-supervised weight management using GLP-1 receptor agonist injections. Includes: monthly injection, lab monitoring, nutritional guidance, provider check-ins. Ideal for: adults with BMI 27+ or weight-related health concerns. Results: average 15-20% body weight loss over 12-16 months.`,
      quiz: [
        {
          question: 'What is the price of a signature HydraFacial at Rani?',
          options: ['$175', '$225', '$275', '$350'],
          correctIndex: 2,
          explanation: 'The signature HydraFacial at Rani is $275.',
        },
        {
          question: 'Which treatment has the broadest ideal candidate profile ("suitable for everyone")?',
          options: ['Sofwave', 'HydraFacial', 'PicoWay', 'RF Microneedling'],
          correctIndex: 1,
          explanation: 'HydraFacial has virtually no contraindications and is suitable for all skin types, making it ideal for everyone.',
        },
        {
          question: 'What is the GLP-1 program monthly price range?',
          options: ['$199-399/month', '$299-499/month', '$399-599/month', '$499-699/month'],
          correctIndex: 2,
          explanation: 'The GLP-1 Weight Loss Program is $399-599 per month.',
        },
      ],
    },
  ],
};

const technologyOverview: TrainingModule = {
  id: 'as-004',
  slug: 'technology-overview',
  title: 'Technology & Systems Overview',
  description: 'Mangomint, Airtable, Square, n8n automation, dashboard navigation, and the technology ecosystem powering Rani operations.',
  role: 'all-staff',
  duration: 35,
  prerequisites: [],
  sections: [
    {
      title: 'The Rani Technology Ecosystem',
      content: `Rani Beauty Clinic runs on an integrated technology stack that automates operations, tracks performance, and enhances the client experience. Every team member must understand the core systems and how they interact.

Mangomint (Scheduling & Client Management): This is our primary booking and client management platform. Key functions: appointment scheduling, client profiles, service catalog, automated confirmations/reminders, online booking widget, membership management. All team members have Mangomint access with role-appropriate permissions. Mangomint is connected to our other systems through webhooks - when an appointment is created, completed, or cancelled, automated workflows trigger in n8n.

Airtable (CRM & Data Hub): Airtable is our central database for client intelligence, KPIs, financial tracking, and operational data. We use 12 tables: Clients, Client Intakes, Intake Intelligence, Appointments, Packages, Memberships, Transactions, Messages Log, Reviews, KPI Snapshots, Alerts, and Competitor Intelligence. Staff access is through the dashboard, not directly through Airtable. The dashboard visualizes Airtable data in an actionable format - KPI cards, lead funnels, schedule views, client profiles, and more.

Square (Payment Processing): All in-person payments are processed through Square. Square handles credit/debit cards, contactless payments (Apple Pay, Google Pay), and generates itemized receipts. Square transaction data syncs to Airtable for revenue tracking and financial reporting. We also use CareCredit and Cherry for patient financing, which processes through Square.

n8n (Workflow Automation): n8n is our automation engine running 19 active workflows that handle: intake processing (AI-powered analysis of new client forms), lead response automation (instant follow-up to new inquiries), appointment notifications (confirmation, reminders, follow-up sequences), KPI aggregation (daily metric snapshots), review monitoring (Google review tracking and response drafting), and more. These automations run without manual intervention but staff should understand what they do - if a client asks "how did you know to follow up?" the answer is our intelligent automation system.

Dashboard (Operations Intelligence): The Rani dashboard at ranibeautyclinic.com/dashboard is our command center. It includes: KPI overview (revenue, bookings, conversion rates, clinic score), schedule management (today's appointments, no-show risk scoring), lead funnel (new leads, follow-up status, conversion tracking), client profiles (360-degree view with LTV, visit history, churn risk), gamification (clinic score, achievements, provider leaderboard), and intelligence pages (pricing AI, P&L, schedule optimizer, inventory, social AI, Meta Ads, consult co-pilot, knowledge base, phone agent).

Authentication: Dashboard access uses JWT-based authentication with 5 roles: CEO (full access), Front Desk (scheduling, entry, basic KPIs), Provider (clinical, consult tools, schedule), Marketing (ads, social, content), Operations (finance, inventory, settings). Each role sees only the features relevant to their responsibilities.

AI Integration: Claude AI powers multiple features - intake analysis, treatment recommendations, consult co-pilot, review response drafting, social content generation, and the knowledge base RAG system. Our AI phone agent (Vapi) handles calls using trained brand voice. All AI outputs are reviewed by staff before client-facing use.`,
      quiz: [
        {
          question: 'How many active n8n automation workflows does Rani operate?',
          options: ['10', '15', '19', '25'],
          correctIndex: 2,
          explanation: 'Rani operates 19 active n8n automation workflows handling intake processing, lead response, notifications, KPIs, and more.',
        },
        {
          question: 'How many database tables does Rani use in Airtable?',
          options: ['6', '8', '10', '12'],
          correctIndex: 3,
          explanation: 'Rani uses 12 Airtable tables: Clients, Client Intakes, Intake Intelligence, Appointments, Packages, Memberships, Transactions, Messages Log, Reviews, KPI Snapshots, Alerts, and Competitor Intelligence.',
        },
        {
          question: 'How many dashboard user roles exist?',
          options: ['3', '4', '5', '6'],
          correctIndex: 2,
          explanation: 'There are 5 dashboard roles: CEO, Front Desk, Provider, Marketing, and Operations.',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// MANAGEMENT MODULES (3)
// ═══════════════════════════════════════════════════════════════

const kpiUnderstanding: TrainingModule = {
  id: 'mg-001',
  slug: 'kpi-understanding',
  title: 'KPI Mastery & Data-Driven Decisions',
  description: 'Understanding clinic KPIs, revenue metrics, operational benchmarks, provider performance analysis, and using the dashboard for strategic decisions.',
  role: 'management',
  duration: 50,
  prerequisites: ['technology-overview'],
  sections: [
    {
      title: 'Core Clinic KPIs & Benchmarks',
      content: `Managing a medical aesthetics clinic by instinct alone is a recipe for stagnation. Data-driven decision making separates thriving practices from struggling ones. At Rani, we track a comprehensive set of KPIs through our dashboard, and every manager must understand what these numbers mean, what they indicate, and what actions to take when they deviate from targets.

Revenue KPIs: (1) Revenue MTD (Month-to-Date) - Total revenue collected in the current month. Target: tracked against monthly revenue goals set by the CEO. Dashboard shows this as the hero KPI card with sparkline trend. (2) Revenue per Provider Hour - Total revenue divided by total provider hours worked. Benchmark: $350-500/hour for a healthy medspa. Below $350 indicates underpriced services or low-value service mix. Above $500 indicates strong service mix and efficient scheduling. (3) Average Transaction Value (ATV) - Average dollar amount per client visit. Benchmark: $350-600 for a luxury medspa. Improving ATV through upselling, cross-selling, and package sales is the fastest path to revenue growth without new client acquisition. (4) Revenue Mix - Percentage of revenue from each service category. A healthy mix avoids over-reliance on any single service. Target: no single service should exceed 40% of total revenue.

Operational KPIs: (1) Booking Conversion Rate - Percentage of inquiries that convert to booked appointments. Target: 85%. Below 80% indicates front desk training needs or lead quality issues. (2) Show Rate - Percentage of booked appointments that are attended. Target: 90%+. Below 85% indicates deposit protocol is not being enforced or confirmation outreach is insufficient. (3) Rebooking Rate - Percentage of clients who book their next appointment before leaving. Target: 75%. This is the strongest predictor of recurring revenue. (4) Provider Utilization - Percentage of available provider hours filled with appointments. Target: 75-85%.

Client KPIs: (1) New Clients per Month - Total new client appointments. Target varies by growth phase. (2) Client Retention Rate (90-day) - Percentage of clients who return within 90 days of their last visit. Target: 65%+. (3) Client Lifetime Value (LTV) - Average total revenue per client over their relationship with the clinic. Benchmark: $2,500-5,000 for a luxury medspa. (4) Churn Rate - Percentage of clients who have not visited in 90+ days. The dashboard's churn prediction AI flags at-risk clients before they lapse.

Gamification Score: The dashboard's clinic score (0-100) is a composite metric incorporating revenue performance, operational efficiency, and client engagement. It is designed to gamify daily operations - higher scores unlock boss levels (Bronze $30K → Diamond $150K+). Monitor the score daily and use the breakdown to identify which component is dragging the total down.

Reading the Dashboard: Every morning, managers should review: (1) KPI cards for revenue, bookings, and conversion trends, (2) Alert panel for any flagged items (no-shows, at-risk clients, inventory), (3) Schedule view for today's appointments and utilization, (4) Lead funnel for new inquiry status. Weekly: review revenue trends, provider performance, P&L intelligence, and churn predictions.`,
      quiz: [
        {
          question: 'What is the benchmark revenue per provider hour for a healthy medspa?',
          options: ['$150-250/hour', '$250-350/hour', '$350-500/hour', '$500-750/hour'],
          correctIndex: 2,
          explanation: 'Benchmark revenue per provider hour is $350-500 for a healthy medspa.',
        },
        {
          question: 'What is the target client retention rate (90-day)?',
          options: ['50%+', '55%+', '60%+', '65%+'],
          correctIndex: 3,
          explanation: 'Target 90-day client retention rate is 65% or higher.',
        },
        {
          question: 'What should no single service category exceed as a percentage of total revenue?',
          options: ['20%', '30%', '40%', '50%'],
          correctIndex: 2,
          explanation: 'No single service should exceed 40% of total revenue to maintain a healthy, diversified revenue mix.',
        },
      ],
    },
  ],
};

const teamManagement: TrainingModule = {
  id: 'mg-002',
  slug: 'team-management',
  title: 'Team Management & Development',
  description: 'Staff scheduling, performance reviews, training program management, conflict resolution, and building a high-performance medical aesthetics team.',
  role: 'management',
  duration: 45,
  prerequisites: ['kpi-understanding'],
  sections: [
    {
      title: 'Building & Managing a High-Performance Team',
      content: `Managing a medical aesthetics team requires balancing clinical expertise, hospitality standards, sales performance, and team morale. The best clinics are built by teams that feel invested in the mission and accountable for results.

Performance Review Framework: Conduct structured reviews quarterly using a balanced scorecard approach. Evaluate four dimensions: (1) Clinical Quality (providers) / Operational Excellence (front desk) - Are they following protocols, completing documentation correctly, maintaining safety standards? (2) Revenue Contribution - Individual booking conversion rates, rebooking rates, average transaction value, cross-sell/upsell metrics. (3) Client Satisfaction - Review mentions, client feedback, complaint frequency, retention rate for their clients. (4) Team Contribution - Reliability (attendance, punctuality), collaboration, initiative, willingness to cover shifts, mentoring junior staff.

The dashboard tracks most of these metrics automatically. Use the Provider Performance page for individual provider analytics and the KPI page for front desk conversion metrics. Document reviews in writing and store securely.

Training Program Management: As a manager, you are responsible for ensuring all staff complete required training modules. Use the Training Progress dashboard to monitor: which modules each team member has completed, quiz scores (minimum passing score: 80%), overdue modules, and certification renewals. New hires must complete all role-appropriate modules within their first 30 days. Annual re-certification is required for HIPAA, Emergency Protocols, and Safety Standards.

Staff Scheduling Principles: Build schedules that balance coverage, fairness, and efficiency. Ensure minimum staffing requirements: at least 1 front desk + 1 provider during all business hours, 2 front desk during peak hours (Tuesday-Thursday, 10 AM - 2 PM), provider scheduling based on demand patterns (more injectable slots Tuesday-Thursday, consultations Monday/Friday). Distribute less-desirable shifts (Saturday, early Monday) equitably. Post schedules 2 weeks in advance. Maintain an on-call list for sick day coverage.

Conflict Resolution: In a small medical aesthetics team, conflicts can derail morale quickly. Follow the CLEAR framework: Calm - address conflicts promptly before they escalate, never in front of clients. Listen - hear both sides separately and without judgment. Evaluate - identify the root cause (workload, personality clash, unclear expectations). Act - propose a specific resolution with clear expectations. Review - follow up within 1 week to ensure resolution is holding.

Recognition & Motivation: The gamification system (clinic score, achievements, leaderboard) provides daily motivation. As a manager, supplement this with: verbal recognition in team meetings for specific accomplishments, written thank-you notes for exceptional client feedback, team celebrations when boss level milestones are reached, professional development opportunities (conferences, advanced training) as performance rewards.

Compensation & Incentives: Discuss compensation strategies with the CEO. Common medical aesthetics incentive structures: providers earn commission (percentage of treatment revenue or tiered bonus), front desk earn bonus for hitting conversion targets, team-wide bonus when monthly revenue goal is met. Align incentives with clinic priorities - if retention is the focus, incentivize rebooking rates rather than new bookings.`,
      quiz: [
        {
          question: 'What is the minimum passing quiz score for training modules?',
          options: ['60%', '70%', '80%', '90%'],
          correctIndex: 2,
          explanation: 'Minimum passing score is 80% on all training module quizzes.',
        },
        {
          question: 'Within what timeframe must new hires complete all role-appropriate training?',
          options: ['1 week', '2 weeks', '30 days', '60 days'],
          correctIndex: 2,
          explanation: 'New hires must complete all role-appropriate training modules within their first 30 days.',
        },
        {
          question: 'What does the "C" in the CLEAR conflict resolution framework stand for?',
          options: ['Confront', 'Calm', 'Collect', 'Call'],
          correctIndex: 1,
          explanation: 'C stands for Calm - address conflicts promptly before they escalate, never in front of clients.',
        },
      ],
    },
  ],
};

const growthPlaybook: TrainingModule = {
  id: 'mg-003',
  slug: 'growth-playbook',
  title: 'Clinic Growth Playbook',
  description: 'Revenue growth strategies, marketing-operations alignment, new service launch framework, partnership development, and scaling from single-provider to multi-provider operations.',
  role: 'management',
  duration: 45,
  prerequisites: ['kpi-understanding', 'team-management'],
  sections: [
    {
      title: 'Revenue Growth Strategies for Medical Aesthetics',
      content: `Growth in a medical aesthetics practice comes from five levers: (1) New Client Acquisition, (2) Client Retention & Reactivation, (3) Average Transaction Value, (4) Visit Frequency, and (5) Service Expansion. Understanding and systematically working each lever is the management playbook for sustainable growth.

Lever 1 - New Client Acquisition: New clients are the lifeblood of growth, but they are also the most expensive revenue source. Cost per acquisition (CPA) in medical aesthetics ranges from $50-250 depending on channel. Rani's acquisition channels ranked by efficiency: (a) Google search (organic + paid) - highest intent, lowest cost-to-convert. Our SEO content engine drives organic traffic. Meta Ads supplement with targeted campaigns. (b) Referrals - lowest CPA, highest lifetime value. Every satisfied client should be asked for referrals. Our referral program offers [benefit] for both referrer and referred client. (c) Instagram - builds awareness and trust through before/after content, educational posts, and behind-the-scenes. (d) Walk-ins and local visibility - community events, local partnerships, Google Business Profile optimization.

Lever 2 - Client Retention & Reactivation: Retaining an existing client costs 5-7x less than acquiring a new one. Our retention strategies: membership program (recurring revenue + commitment), automated follow-up sequences (post-treatment, reactivation at 30/60/90 days), rebooking protocol at checkout, personalized treatment pathways that create ongoing need. The dashboard's churn prediction system flags at-risk clients before they lapse - use the At-Risk Clients panel weekly to assign outreach.

Lever 3 - Average Transaction Value (ATV): Increase ATV without increasing client volume through: package sales (bundling series treatments at 10-15% savings), cross-selling complementary services, product retail sales, membership enrollment, provider-initiated treatment plan upgrades. The Consult Co-pilot AI generates personalized cross-sell recommendations for every consultation.

Lever 4 - Visit Frequency: Increase how often clients visit through: maintenance treatment plans (monthly HydraFacials, quarterly Botox), wellness injection programs (regular vitamin injections), seasonal promotions tied to treatment calendars (spring laser season, fall peel season), membership perks that encourage regular visits.

Lever 5 - Service Expansion: Adding new services captures untapped demand from existing clients and attracts new client segments. Evaluate new services using the framework: (a) Market demand - is there unmet demand in our area? (b) Revenue potential - what is the expected revenue per hour? (c) Capital investment - equipment cost, training, marketing launch budget. (d) Competitive environment - do nearby clinics already offer this? (e) Fit with our brand - does it align with Rani's luxury medical aesthetics positioning?

Marketing-Operations Alignment: Growth requires marketing and operations to be in sync. Marketing drives demand; operations fulfills it. Misalignment leads to wasted ad spend (no one answers the phone), missed opportunities (demand exceeds capacity), or inconsistent client experience. Hold weekly marketing-operations sync meetings to review: lead volume vs. booking capacity, campaign performance vs. conversion rates, new client experience quality, and upcoming promotional calendar.

Scaling Considerations: Moving from a single-provider to multi-provider operation introduces complexity: standardized treatment protocols (so outcomes are consistent across providers), provider-specific scheduling (matching specialties to demand), revenue attribution (tracking which provider drives which revenue), quality control (chart audits, client satisfaction monitoring), and team culture (maintaining luxury standards as the team grows).`,
      quiz: [
        {
          question: 'How much more expensive is it to acquire a new client versus retaining an existing one?',
          options: ['2-3x', '3-5x', '5-7x', '10x'],
          correctIndex: 2,
          explanation: 'Retaining an existing client costs 5-7x less than acquiring a new one.',
        },
        {
          question: 'What are the five growth levers for a medical aesthetics practice?',
          options: [
            'Marketing, Sales, Service, Technology, Hiring',
            'New Client Acquisition, Retention, ATV, Visit Frequency, Service Expansion',
            'Advertising, Pricing, Staffing, Location, Equipment',
            'Social Media, SEO, Referrals, Partnerships, Events',
          ],
          correctIndex: 1,
          explanation: 'The five growth levers are: New Client Acquisition, Client Retention & Reactivation, Average Transaction Value, Visit Frequency, and Service Expansion.',
        },
        {
          question: 'Which client acquisition channel has the highest intent and lowest cost-to-convert?',
          options: ['Instagram', 'Meta Ads', 'Google search (organic + paid)', 'Walk-ins'],
          correctIndex: 2,
          explanation: 'Google search (organic + paid) has the highest intent because searchers are actively looking for treatments, leading to the lowest cost-to-convert.',
        },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL MODULES
// ═══════════════════════════════════════════════════════════════

export const TRAINING_MODULES: TrainingModule[] = [
  // Front Desk (6)
  bookingWorkflow,
  checkInProcess,
  checkoutUpsell,
  phoneHandling,
  emergencyProtocols,
  schedulingOptimization,
  // Provider (7)
  treatmentProtocols,
  consultationFramework,
  chartingCompliance,
  safetyStandards,
  injectionTechniques,
  patientCommunication,
  crossSellClinical,
  // All Staff (4)
  brandVoice,
  hipaaBasics,
  productKnowledge,
  technologyOverview,
  // Management (3)
  kpiUnderstanding,
  teamManagement,
  growthPlaybook,
];

export const ROLE_LABELS: Record<TrainingRole, string> = {
  'front-desk': 'Front Desk',
  'provider': 'Provider',
  'all-staff': 'All Staff',
  'management': 'Management',
};

export const ROLE_COLORS: Record<TrainingRole, string> = {
  'front-desk': '#3B82F6', // blue
  'provider': '#8B5CF6', // purple
  'all-staff': '#C9A96E', // gold
  'management': '#059669', // green
};

export function getModuleBySlug(slug: string): TrainingModule | undefined {
  return TRAINING_MODULES.find(m => m.slug === slug);
}

export function getModulesByRole(role: TrainingRole): TrainingModule[] {
  return TRAINING_MODULES.filter(m => m.role === role);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return TRAINING_MODULES.find(m => m.id === id);
}
