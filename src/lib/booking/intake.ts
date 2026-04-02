/**
 * Digital Intake System
 *
 * Complete patient intake flow:
 * - New patient intake form with 50+ fields
 * - Medical history questionnaire
 * - Consent form generation per service
 * - Photo consent
 * - HIPAA acknowledgment
 * - Insurance information (if applicable)
 * - Payment method on file
 * - Communication preferences
 * - Referral source tracking
 * - Form completion tracking and reminders
 * - Pre-populate from previous visits
 */

import { format, addDays } from 'date-fns';
import type {
  ConsentRecord,
  IntakeField,
  IntakeForm,
  IntakeSection,
} from './types';

// ── INTAKE FORM SECTIONS ──

/**
 * Build the complete intake form with all sections
 */
export function buildIntakeForm(
  clientId: string,
  appointmentId?: string,
  serviceId?: string,
  previousData?: Partial<Record<string, string | string[] | boolean | number>>,
): IntakeForm {
  const now = new Date();

  const sections: IntakeSection[] = [
    buildPersonalInfoSection(previousData),
    buildEmergencyContactSection(previousData),
    buildMedicalHistorySection(previousData),
    buildMedicationsSection(previousData),
    buildAllergiesSection(previousData),
    buildSkinHistorySection(previousData),
    buildLifestyleSection(previousData),
    buildTreatmentGoalsSection(previousData),
    buildCommunicationPreferencesSection(previousData),
    buildReferralSection(previousData),
    buildInsuranceSection(previousData),
    buildPaymentSection(previousData),
  ];

  // Add service-specific sections
  if (serviceId) {
    const serviceSection = buildServiceSpecificSection(serviceId, previousData);
    if (serviceSection) {
      sections.splice(8, 0, serviceSection); // Insert before communication prefs
    }
  }

  return {
    id: `intake-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    clientId,
    appointmentId,
    status: 'pending',
    sections,
    consentsSigned: [],
    createdAt: now.toISOString(),
    expiresAt: format(addDays(now, 7), 'yyyy-MM-dd'),
  };
}

// ── SECTION BUILDERS ──

function buildPersonalInfoSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Please provide your personal details so we can create your client profile.',
    isRequired: true,
    isComplete: false,
    order: 1,
    fields: [
      textField('first-name', 'First Name', true, prev?.['first-name'] as string),
      textField('last-name', 'Last Name', true, prev?.['last-name'] as string),
      dateField('date-of-birth', 'Date of Birth', true, prev?.['date-of-birth'] as string),
      selectField('gender', 'Gender', true, [
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
        { value: 'non-binary', label: 'Non-binary' },
        { value: 'prefer-not-to-say', label: 'Prefer not to say' },
      ], prev?.['gender'] as string),
      emailField('email', 'Email Address', true, prev?.['email'] as string),
      phoneField('phone', 'Phone Number', true, prev?.['phone'] as string),
      textField('address-street', 'Street Address', true, prev?.['address-street'] as string),
      textField('address-city', 'City', true, prev?.['address-city'] as string),
      selectField('address-state', 'State', true, US_STATES, prev?.['address-state'] as string),
      textField('address-zip', 'ZIP Code', true, prev?.['address-zip'] as string, undefined, { pattern: '^\\d{5}(-\\d{4})?$' }),
      selectField('preferred-pronouns', 'Preferred Pronouns', false, [
        { value: 'she-her', label: 'She/Her' },
        { value: 'he-him', label: 'He/Him' },
        { value: 'they-them', label: 'They/Them' },
        { value: 'other', label: 'Other' },
      ], prev?.['preferred-pronouns'] as string),
    ],
  };
}

function buildEmergencyContactSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    description: 'Please provide an emergency contact in case we need to reach someone on your behalf.',
    isRequired: true,
    isComplete: false,
    order: 2,
    fields: [
      textField('ec-name', 'Emergency Contact Name', true, prev?.['ec-name'] as string),
      textField('ec-relationship', 'Relationship', true, prev?.['ec-relationship'] as string),
      phoneField('ec-phone', 'Emergency Contact Phone', true, prev?.['ec-phone'] as string),
    ],
  };
}

function buildMedicalHistorySection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'medical-history',
    title: 'Medical History',
    description: 'Your medical history helps us ensure safe and effective treatments. All information is kept strictly confidential under HIPAA.',
    isRequired: true,
    isComplete: false,
    order: 3,
    fields: [
      checkboxField('med-pregnant', 'Are you currently pregnant or nursing?', true),
      checkboxField('med-planning-pregnancy', 'Are you planning to become pregnant in the next 6 months?', true),
      multiselectField('med-conditions', 'Do you have any of the following conditions?', false, [
        { value: 'diabetes', label: 'Diabetes' },
        { value: 'hypertension', label: 'High Blood Pressure' },
        { value: 'heart-disease', label: 'Heart Disease' },
        { value: 'autoimmune', label: 'Autoimmune Disorder' },
        { value: 'thyroid', label: 'Thyroid Disorder' },
        { value: 'bleeding-disorder', label: 'Bleeding Disorder' },
        { value: 'keloids', label: 'History of Keloid Scarring' },
        { value: 'herpes', label: 'Cold Sores / Herpes Simplex' },
        { value: 'seizures', label: 'Seizure Disorder' },
        { value: 'cancer', label: 'Cancer (current or history)' },
        { value: 'skin-cancer', label: 'Skin Cancer' },
        { value: 'hepatitis', label: 'Hepatitis' },
        { value: 'hiv', label: 'HIV/AIDS' },
        { value: 'mental-health', label: 'Mental Health Condition' },
        { value: 'none', label: 'None of the above' },
      ]),
      textareaField('med-conditions-detail', 'If you checked any conditions above, please provide details', false, undefined, 'Include diagnosis date and current management'),
      checkboxField('med-surgery-recent', 'Have you had any surgery in the past 6 months?', true),
      textareaField('med-surgery-detail', 'Surgery details', false, undefined, 'Type of surgery, date, and recovery status', { fieldId: 'med-surgery-recent', value: true }),
      checkboxField('med-pacemaker', 'Do you have a pacemaker or implanted medical device?', true),
      checkboxField('med-metal-implants', 'Do you have any metal implants in the treatment area?', true),
      textareaField('med-other', 'Any other medical conditions or concerns we should know about?', false),
    ],
  };
}

function buildMedicationsSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'medications',
    title: 'Current Medications',
    description: 'List all medications, supplements, and vitamins you are currently taking.',
    isRequired: true,
    isComplete: false,
    order: 4,
    fields: [
      checkboxField('meds-taking', 'Are you currently taking any medications?', true),
      textareaField('meds-prescription', 'Prescription Medications', false, undefined, 'List medication name, dosage, and frequency', { fieldId: 'meds-taking', value: true }),
      textareaField('meds-otc', 'Over-the-Counter Medications & Supplements', false, undefined, 'Include vitamins, supplements, herbal remedies', { fieldId: 'meds-taking', value: true }),
      checkboxField('meds-blood-thinners', 'Are you taking blood thinners (aspirin, warfarin, etc.)?', true),
      checkboxField('meds-accutane', 'Have you taken Accutane (isotretinoin) in the past 6 months?', true),
      checkboxField('meds-retinoids', 'Are you using topical retinoids (tretinoin, retinol)?', true),
    ],
  };
}

function buildAllergiesSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'allergies',
    title: 'Allergies',
    description: 'Please list any known allergies to help us ensure your safety.',
    isRequired: true,
    isComplete: false,
    order: 5,
    fields: [
      checkboxField('allergy-any', 'Do you have any allergies?', true),
      multiselectField('allergy-types', 'Type of allergies', false, [
        { value: 'lidocaine', label: 'Lidocaine / Local Anesthetics' },
        { value: 'latex', label: 'Latex' },
        { value: 'adhesive', label: 'Adhesive / Tape' },
        { value: 'antibiotics', label: 'Antibiotics' },
        { value: 'aspirin', label: 'Aspirin / NSAIDs' },
        { value: 'iodine', label: 'Iodine' },
        { value: 'nickel', label: 'Nickel / Metals' },
        { value: 'fragrance', label: 'Fragrances' },
        { value: 'food', label: 'Food Allergies' },
        { value: 'other', label: 'Other' },
      ], { fieldId: 'allergy-any', value: true }),
      textareaField('allergy-details', 'Please describe your allergies and reactions', false, undefined, undefined, { fieldId: 'allergy-any', value: true }),
    ],
  };
}

function buildSkinHistorySection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'skin-history',
    title: 'Skin History & Concerns',
    description: 'Help us understand your skin so we can recommend the best treatments.',
    isRequired: false,
    isComplete: false,
    order: 6,
    fields: [
      selectField('skin-type', 'Skin Type (Fitzpatrick Scale)', false, [
        { value: 'type-1', label: 'Type I — Very fair, always burns, never tans' },
        { value: 'type-2', label: 'Type II — Fair, burns easily, tans minimally' },
        { value: 'type-3', label: 'Type III — Medium, sometimes burns, tans gradually' },
        { value: 'type-4', label: 'Type IV — Olive, rarely burns, tans well' },
        { value: 'type-5', label: 'Type V — Brown, very rarely burns, tans darkly' },
        { value: 'type-6', label: 'Type VI — Dark brown/black, never burns' },
      ]),
      multiselectField('skin-concerns', 'Primary Skin Concerns', false, [
        { value: 'aging', label: 'Fine Lines & Wrinkles' },
        { value: 'acne', label: 'Acne & Breakouts' },
        { value: 'scarring', label: 'Acne Scarring' },
        { value: 'pigmentation', label: 'Hyperpigmentation / Dark Spots' },
        { value: 'redness', label: 'Redness / Rosacea' },
        { value: 'texture', label: 'Uneven Texture' },
        { value: 'pores', label: 'Large Pores' },
        { value: 'dryness', label: 'Dryness / Dehydration' },
        { value: 'sagging', label: 'Skin Laxity / Sagging' },
        { value: 'sun-damage', label: 'Sun Damage' },
        { value: 'hair-removal', label: 'Unwanted Hair' },
        { value: 'volume-loss', label: 'Volume Loss' },
      ]),
      multiselectField('prev-treatments', 'Previous Aesthetic Treatments', false, [
        { value: 'botox', label: 'Botox / Neurotoxin' },
        { value: 'filler', label: 'Dermal Fillers' },
        { value: 'laser', label: 'Laser Treatments' },
        { value: 'microneedling', label: 'Microneedling' },
        { value: 'chemical-peel', label: 'Chemical Peels' },
        { value: 'facial', label: 'Professional Facials' },
        { value: 'rf', label: 'RF Treatments' },
        { value: 'thread-lift', label: 'Thread Lift' },
        { value: 'surgery', label: 'Cosmetic Surgery' },
        { value: 'lhr', label: 'Laser Hair Removal' },
        { value: 'none', label: 'None — this is my first treatment' },
      ]),
      textareaField('prev-treatments-detail', 'Details about previous treatments', false, undefined, 'When, where, and your experience'),
      textareaField('current-skincare', 'Current Skincare Routine', false, undefined, 'Products you use daily (cleanser, serum, moisturizer, SPF, etc.)'),
      selectField('sun-exposure', 'Sun Exposure Level', false, [
        { value: 'minimal', label: 'Minimal — mostly indoors' },
        { value: 'moderate', label: 'Moderate — some outdoor activity' },
        { value: 'high', label: 'High — frequent outdoor exposure' },
      ]),
    ],
  };
}

function buildLifestyleSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'lifestyle',
    title: 'Lifestyle',
    description: 'A few lifestyle questions to help customize your treatment plan.',
    isRequired: false,
    isComplete: false,
    order: 7,
    fields: [
      selectField('smoking', 'Do you smoke or use tobacco?', false, [
        { value: 'never', label: 'Never' },
        { value: 'former', label: 'Former smoker' },
        { value: 'current', label: 'Current smoker' },
      ]),
      selectField('alcohol', 'Alcohol Consumption', false, [
        { value: 'none', label: 'None' },
        { value: 'occasional', label: 'Occasional (1-2 per week)' },
        { value: 'moderate', label: 'Moderate (3-5 per week)' },
        { value: 'frequent', label: 'Frequent (daily)' },
      ]),
      selectField('exercise', 'Exercise Frequency', false, [
        { value: 'none', label: 'None' },
        { value: 'light', label: '1-2 times per week' },
        { value: 'moderate', label: '3-4 times per week' },
        { value: 'daily', label: '5+ times per week' },
      ]),
      selectField('stress-level', 'Stress Level', false, [
        { value: 'low', label: 'Low' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'high', label: 'High' },
      ]),
      selectField('sleep', 'Average Sleep per Night', false, [
        { value: 'less-5', label: 'Less than 5 hours' },
        { value: '5-6', label: '5-6 hours' },
        { value: '7-8', label: '7-8 hours' },
        { value: 'more-8', label: 'More than 8 hours' },
      ]),
      selectField('water-intake', 'Daily Water Intake', false, [
        { value: 'low', label: 'Less than 4 glasses' },
        { value: 'moderate', label: '4-6 glasses' },
        { value: 'good', label: '7-8 glasses' },
        { value: 'excellent', label: 'More than 8 glasses' },
      ]),
    ],
  };
}

function buildTreatmentGoalsSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'treatment-goals',
    title: 'Treatment Goals',
    description: 'Tell us about the results you\'d like to achieve.',
    isRequired: true,
    isComplete: false,
    order: 8,
    fields: [
      textareaField('goals-primary', 'What is your primary goal for visiting Rani Beauty Clinic?', true, undefined, 'Describe the results you hope to achieve'),
      selectField('goals-timeline', 'Desired Timeline', false, [
        { value: 'asap', label: 'As soon as possible' },
        { value: 'event', label: 'Before a specific event or date' },
        { value: 'gradual', label: 'Gradual improvement over time' },
        { value: 'maintenance', label: 'Ongoing maintenance' },
      ]),
      textField('goals-event-date', 'Event Date (if applicable)', false, undefined, 'MM/DD/YYYY', undefined, { fieldId: 'goals-timeline', value: 'event' }),
      selectField('goals-budget', 'Approximate Budget Range', false, [
        { value: 'under-500', label: 'Under $500' },
        { value: '500-1000', label: '$500 — $1,000' },
        { value: '1000-2500', label: '$1,000 — $2,500' },
        { value: '2500-5000', label: '$2,500 — $5,000' },
        { value: 'over-5000', label: 'Over $5,000' },
        { value: 'flexible', label: 'Flexible — focus on best results' },
      ]),
      radioField('goals-commitment', 'Treatment Commitment', false, [
        { value: 'single', label: 'Single treatment to try it out' },
        { value: 'series', label: 'Willing to do a series for best results' },
        { value: 'ongoing', label: 'Interested in ongoing maintenance plan' },
      ]),
    ],
  };
}

function buildCommunicationPreferencesSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'communication-preferences',
    title: 'Communication Preferences',
    description: 'How would you like us to stay in touch?',
    isRequired: true,
    isComplete: false,
    order: 10,
    fields: [
      multiselectField('comm-channels', 'Preferred Communication', true, [
        { value: 'sms', label: 'Text Message (SMS)' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone Call' },
      ]),
      checkboxField('comm-marketing', 'I would like to receive promotional offers and treatment recommendations', false),
      checkboxField('comm-sms-consent', 'I consent to receive text messages from Rani Beauty Clinic for appointment reminders and updates', true),
      selectField('comm-best-time', 'Best Time to Reach You', false, [
        { value: 'morning', label: 'Morning (9am-12pm)' },
        { value: 'afternoon', label: 'Afternoon (12pm-5pm)' },
        { value: 'evening', label: 'Evening (5pm-8pm)' },
        { value: 'anytime', label: 'Anytime' },
      ]),
    ],
  };
}

function buildReferralSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'referral',
    title: 'How Did You Hear About Us?',
    description: 'Help us understand how you found Rani Beauty Clinic.',
    isRequired: false,
    isComplete: false,
    order: 11,
    fields: [
      selectField('referral-source', 'How did you find us?', false, [
        { value: 'google', label: 'Google Search' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'yelp', label: 'Yelp' },
        { value: 'google-maps', label: 'Google Maps' },
        { value: 'friend', label: 'Friend or Family Referral' },
        { value: 'doctor', label: 'Doctor Referral' },
        { value: 'event', label: 'Event or Partnership' },
        { value: 'drive-by', label: 'Drove/Walked By' },
        { value: 'ad', label: 'Online Ad' },
        { value: 'other', label: 'Other' },
      ]),
      textField('referral-name', 'Referral Name (if applicable)', false, undefined, 'Who referred you?', undefined, { fieldId: 'referral-source', value: 'friend' }),
      textField('referral-other', 'Please specify', false, undefined, undefined, undefined, { fieldId: 'referral-source', value: 'other' }),
    ],
  };
}

function buildInsuranceSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'insurance',
    title: 'Insurance Information',
    description: 'Most aesthetic treatments are not covered by insurance, but some wellness services may be. This section is optional.',
    isRequired: false,
    isComplete: false,
    order: 12,
    fields: [
      checkboxField('ins-has', 'I have health insurance I would like on file', false),
      textField('ins-provider', 'Insurance Provider', false, undefined, undefined, undefined, { fieldId: 'ins-has', value: true }),
      textField('ins-policy', 'Policy Number', false, undefined, undefined, undefined, { fieldId: 'ins-has', value: true }),
      textField('ins-group', 'Group Number', false, undefined, undefined, undefined, { fieldId: 'ins-has', value: true }),
      textField('ins-subscriber', 'Subscriber Name (if different)', false, undefined, undefined, undefined, { fieldId: 'ins-has', value: true }),
    ],
  };
}

function buildPaymentSection(prev?: Partial<Record<string, unknown>>): IntakeSection {
  return {
    id: 'payment',
    title: 'Payment Preferences',
    description: 'Set up your preferred payment method for a seamless experience.',
    isRequired: true,
    isComplete: false,
    order: 13,
    fields: [
      selectField('payment-method', 'Preferred Payment Method', true, [
        { value: 'credit-card', label: 'Credit/Debit Card' },
        { value: 'hsa-fsa', label: 'HSA/FSA Card' },
        { value: 'financing', label: 'Interested in Financing' },
        { value: 'cash', label: 'Cash' },
      ]),
      checkboxField('payment-card-on-file', 'I agree to keep a card on file for appointment deposits and cancellation fees', true),
      checkboxField('payment-financing-interest', 'I\'m interested in learning about 0% financing options for larger treatments', false),
    ],
  };
}

// ── SERVICE-SPECIFIC SECTIONS ──

function buildServiceSpecificSection(serviceId: string, prev?: Partial<Record<string, unknown>>): IntakeSection | null {
  if (serviceId.startsWith('botox') || serviceId.startsWith('dysport') || serviceId.startsWith('filler')) {
    return buildInjectableSection(serviceId);
  }
  if (serviceId.startsWith('lhr-')) {
    return buildLaserHairRemovalSection();
  }
  if (serviceId.includes('microneedling') || serviceId.includes('sofwave') || serviceId.includes('laser')) {
    return buildEnergyDeviceSection();
  }
  if (serviceId.startsWith('wellness-') || serviceId.startsWith('glp1')) {
    return buildWellnessSection();
  }
  return null;
}

function buildInjectableSection(serviceId: string): IntakeSection {
  return {
    id: 'injectable-history',
    title: 'Injectable History',
    description: 'To ensure the best results and your safety, please answer the following about your injectable history.',
    isRequired: true,
    isComplete: false,
    order: 9,
    fields: [
      checkboxField('inj-previous', 'Have you had injectable treatments before?', true),
      textareaField('inj-previous-detail', 'Previous injectable details', false, undefined, 'Product used, area treated, approximate date, and provider', { fieldId: 'inj-previous', value: true }),
      checkboxField('inj-adverse-reaction', 'Have you ever had an adverse reaction to an injectable?', true),
      textareaField('inj-adverse-detail', 'Reaction details', false, undefined, 'Describe the reaction', { fieldId: 'inj-adverse-reaction', value: true }),
      selectField('inj-last-treatment', 'When was your last injectable treatment?', false, [
        { value: 'never', label: 'Never' },
        { value: 'less-3mo', label: 'Less than 3 months ago' },
        { value: '3-6mo', label: '3-6 months ago' },
        { value: '6-12mo', label: '6-12 months ago' },
        { value: 'over-1yr', label: 'Over 1 year ago' },
      ]),
      ...(serviceId.startsWith('filler') ? [
        checkboxField('inj-filler-dissolve', 'Have you ever had filler dissolved (hyaluronidase)?', true),
        textareaField('inj-filler-dissolve-detail', 'Dissolving details', false, undefined, undefined, { fieldId: 'inj-filler-dissolve', value: true }),
      ] : []),
    ],
  };
}

function buildLaserHairRemovalSection(): IntakeSection {
  return {
    id: 'lhr-history',
    title: 'Laser Hair Removal History',
    description: 'Help us optimize your laser hair removal treatment plan.',
    isRequired: true,
    isComplete: false,
    order: 9,
    fields: [
      checkboxField('lhr-previous', 'Have you had laser hair removal before?', true),
      numberField('lhr-sessions', 'Approximately how many sessions?', false, undefined, { fieldId: 'lhr-previous', value: true }),
      textareaField('lhr-areas', 'Previous treatment areas', false, undefined, undefined, { fieldId: 'lhr-previous', value: true }),
      checkboxField('lhr-waxing', 'Have you waxed, threaded, or plucked in the past 4 weeks?', true),
      checkboxField('lhr-tanning', 'Have you used self-tanner or had sun exposure in the past 2 weeks?', true),
      checkboxField('lhr-tattoos', 'Do you have any tattoos in or near the treatment area?', true),
      selectField('lhr-hair-color', 'Hair Color in Treatment Area', false, [
        { value: 'black', label: 'Black' },
        { value: 'dark-brown', label: 'Dark Brown' },
        { value: 'brown', label: 'Brown' },
        { value: 'light-brown', label: 'Light Brown' },
        { value: 'blonde', label: 'Blonde' },
        { value: 'red', label: 'Red' },
        { value: 'gray-white', label: 'Gray/White' },
      ]),
    ],
  };
}

function buildEnergyDeviceSection(): IntakeSection {
  return {
    id: 'energy-device-history',
    title: 'Energy Device Treatment History',
    description: 'Important information for your energy-based treatment.',
    isRequired: true,
    isComplete: false,
    order: 9,
    fields: [
      checkboxField('energy-previous', 'Have you had energy-based treatments before (laser, RF, ultrasound)?', true),
      textareaField('energy-previous-detail', 'Previous treatment details', false, undefined, 'Type of treatment, date, and results', { fieldId: 'energy-previous', value: true }),
      checkboxField('energy-sun-recent', 'Have you had significant sun exposure in the past 2 weeks?', true),
      checkboxField('energy-retinoid', 'Are you currently using retinoids or exfoliating acids?', true),
      checkboxField('energy-active-infection', 'Do you have any active skin infections, rashes, or open wounds in the treatment area?', true),
      checkboxField('energy-cold-sore', 'Do you get cold sores? (important for facial treatments)', true),
    ],
  };
}

function buildWellnessSection(): IntakeSection {
  return {
    id: 'wellness-history',
    title: 'Wellness Assessment',
    description: 'Help us customize your wellness treatment plan.',
    isRequired: true,
    isComplete: false,
    order: 9,
    fields: [
      multiselectField('wellness-goals', 'Wellness Goals', true, [
        { value: 'energy', label: 'Increased Energy' },
        { value: 'immunity', label: 'Immune Support' },
        { value: 'weight', label: 'Weight Management' },
        { value: 'skin', label: 'Skin Health' },
        { value: 'hair', label: 'Hair Health' },
        { value: 'anti-aging', label: 'Anti-Aging' },
        { value: 'detox', label: 'Detox & Recovery' },
        { value: 'athletic', label: 'Athletic Performance' },
        { value: 'stress', label: 'Stress Management' },
        { value: 'general', label: 'General Wellness' },
      ]),
      checkboxField('wellness-iv-previous', 'Have you received wellness injections before?', true),
      textareaField('wellness-iv-detail', 'Previous injection details', false, undefined, 'Type, provider, and experience', { fieldId: 'wellness-iv-previous', value: true }),
      checkboxField('wellness-fasting', 'Are you currently fasting?', false),
      textareaField('wellness-dietary', 'Dietary Restrictions or Preferences', false),
      numberField('wellness-weight', 'Current Weight (lbs)', false, undefined, undefined, 'Used for dosage calculations'),
      numberField('wellness-height-ft', 'Height (feet)', false),
      numberField('wellness-height-in', 'Height (inches)', false),
    ],
  };
}

// ── CONSENT FORMS ──

export interface ConsentFormTemplate {
  type: ConsentRecord['type'];
  title: string;
  content: string;
  version: string;
  requiresSignature: boolean;
}

/**
 * Get required consent forms for a service
 */
export function getRequiredConsents(serviceId: string): ConsentFormTemplate[] {
  const consents: ConsentFormTemplate[] = [
    // HIPAA is always required
    {
      type: 'hipaa',
      title: 'HIPAA Privacy Practices Acknowledgment',
      content: HIPAA_ACKNOWLEDGMENT,
      version: '2024.1',
      requiresSignature: true,
    },
    // Photo consent is recommended for all
    {
      type: 'photo',
      title: 'Photography & Media Consent',
      content: PHOTO_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    },
    // Financial consent
    {
      type: 'financial',
      title: 'Financial Agreement & Cancellation Policy',
      content: FINANCIAL_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    },
  ];

  // Treatment-specific consent
  const treatmentConsent = getTreatmentConsent(serviceId);
  if (treatmentConsent) {
    consents.push(treatmentConsent);
  }

  return consents;
}

function getTreatmentConsent(serviceId: string): ConsentFormTemplate | null {
  if (serviceId.startsWith('botox') || serviceId.startsWith('dysport')) {
    return {
      type: 'treatment',
      title: 'Neurotoxin Injection Informed Consent',
      content: NEUROTOXIN_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    };
  }

  if (serviceId.startsWith('filler')) {
    return {
      type: 'treatment',
      title: 'Dermal Filler Informed Consent',
      content: FILLER_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    };
  }

  if (serviceId.startsWith('lhr-')) {
    return {
      type: 'treatment',
      title: 'Laser Hair Removal Informed Consent',
      content: LASER_HR_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    };
  }

  if (serviceId.includes('microneedling')) {
    return {
      type: 'treatment',
      title: 'RF Microneedling Informed Consent',
      content: RF_MICRONEEDLING_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    };
  }

  if (serviceId.startsWith('sofwave')) {
    return {
      type: 'treatment',
      title: 'Sofwave SUPERB Skin Tightening Informed Consent',
      content: SOFWAVE_CONSENT,
      version: '2024.1',
      requiresSignature: true,
    };
  }

  return null;
}

// ── FORM COMPLETION TRACKING ──

export interface FormProgress {
  formId: string;
  totalFields: number;
  completedFields: number;
  requiredFields: number;
  completedRequired: number;
  percentComplete: number;
  incompleteSections: string[];
  isReady: boolean; // all required fields complete + all consents signed
  missingConsents: string[];
}

/**
 * Calculate form completion progress
 */
export function calculateFormProgress(form: IntakeForm, requiredConsents: ConsentFormTemplate[]): FormProgress {
  let totalFields = 0;
  let completedFields = 0;
  let requiredFields = 0;
  let completedRequired = 0;
  const incompleteSections: string[] = [];

  for (const section of form.sections) {
    for (const field of section.fields) {
      totalFields++;
      if (field.required) requiredFields++;

      const hasValue = field.value !== undefined && field.value !== '' && field.value !== null;
      if (hasValue) {
        completedFields++;
        if (field.required) completedRequired++;
      }
    }

    if (section.isRequired && !section.isComplete) {
      incompleteSections.push(section.title);
    }
  }

  // Check consents
  const signedTypes = new Set(form.consentsSigned.map(c => c.type));
  const missingConsents = requiredConsents
    .filter(c => !signedTypes.has(c.type))
    .map(c => c.title);

  const percentComplete = totalFields > 0
    ? Math.round((completedFields / totalFields) * 100)
    : 0;

  return {
    formId: form.id,
    totalFields,
    completedFields,
    requiredFields,
    completedRequired,
    percentComplete,
    incompleteSections,
    isReady: completedRequired === requiredFields && missingConsents.length === 0,
    missingConsents,
  };
}

/**
 * Update a field value in the form
 */
export function updateFormField(
  form: IntakeForm,
  sectionId: string,
  fieldId: string,
  value: string | string[] | boolean | number,
): IntakeForm {
  const updatedSections = form.sections.map(section => {
    if (section.id !== sectionId) return section;

    const updatedFields = section.fields.map(field => {
      if (field.id !== fieldId) return field;
      return { ...field, value };
    });

    // Check if section is complete
    const isComplete = updatedFields
      .filter(f => f.required)
      .every(f => f.value !== undefined && f.value !== '' && f.value !== null);

    return { ...section, fields: updatedFields, isComplete };
  });

  return {
    ...form,
    sections: updatedSections,
    status: 'in-progress',
  };
}

/**
 * Sign a consent form
 */
export function signConsent(
  form: IntakeForm,
  consent: ConsentFormTemplate,
  signatureData?: string,
): IntakeForm {
  const record: ConsentRecord = {
    type: consent.type,
    title: consent.title,
    signedAt: new Date().toISOString(),
    signatureData,
    version: consent.version,
  };

  return {
    ...form,
    consentsSigned: [...form.consentsSigned, record],
  };
}

// ── FIELD FACTORY HELPERS ──

function textField(
  id: string, label: string, required: boolean,
  value?: string, placeholder?: string,
  validation?: IntakeField['validation'],
  conditionalOn?: IntakeField['conditionalOn'],
): IntakeField {
  return { id, label, type: 'text', required, value, placeholder, validation, conditionalOn };
}

function textareaField(
  id: string, label: string, required: boolean,
  value?: string, placeholder?: string,
  conditionalOn?: IntakeField['conditionalOn'],
): IntakeField {
  return { id, label, type: 'textarea', required, value, placeholder, conditionalOn };
}

function emailField(id: string, label: string, required: boolean, value?: string): IntakeField {
  return { id, label, type: 'email', required, value, validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } };
}

function phoneField(id: string, label: string, required: boolean, value?: string): IntakeField {
  return { id, label, type: 'phone', required, value, placeholder: '(xxx) xxx-xxxx' };
}

function dateField(id: string, label: string, required: boolean, value?: string): IntakeField {
  return { id, label, type: 'date', required, value };
}

function numberField(
  id: string, label: string, required: boolean, value?: number,
  conditionalOn?: IntakeField['conditionalOn'], helpText?: string,
): IntakeField {
  return { id, label, type: 'number', required, value, conditionalOn, helpText };
}

function selectField(
  id: string, label: string, required: boolean,
  options: { value: string; label: string }[],
  value?: string,
): IntakeField {
  return { id, label, type: 'select', required, options, value };
}

function multiselectField(
  id: string, label: string, required: boolean,
  options: { value: string; label: string }[],
  conditionalOn?: IntakeField['conditionalOn'],
): IntakeField {
  return { id, label, type: 'multiselect', required, options, conditionalOn };
}

function radioField(
  id: string, label: string, required: boolean,
  options: { value: string; label: string }[],
): IntakeField {
  return { id, label, type: 'radio', required, options };
}

function checkboxField(id: string, label: string, required: boolean): IntakeField {
  return { id, label, type: 'checkbox', required };
}

// ── CONSENT TEXT CONSTANTS ──

const HIPAA_ACKNOWLEDGMENT = `NOTICE OF PRIVACY PRACTICES ACKNOWLEDGMENT

I acknowledge that I have been provided access to Rani Beauty Clinic's Notice of Privacy Practices, which describes how my medical information may be used and disclosed, and how I can access this information.

I understand that:
- My protected health information (PHI) will be kept confidential
- PHI may be used for treatment, payment, and healthcare operations
- I have the right to request restrictions on certain uses and disclosures
- I have the right to access and receive copies of my PHI
- I have the right to request amendments to my PHI
- I have the right to an accounting of disclosures

Rani Beauty Clinic
401 Olympia Ave NE, Suite 101, Renton, WA 98056`;

const PHOTO_CONSENT = `PHOTOGRAPHY AND MEDIA CONSENT

I authorize Rani Beauty Clinic to take photographs, videos, and other recordings before, during, and after my treatments for the following purposes:

- Medical documentation and treatment planning (required)
- Before and after comparison for my personal treatment records

OPTIONAL: I additionally consent to the use of my images for:
- Educational and training purposes (de-identified)
- Marketing and social media (with additional approval before each use)

I understand that I may revoke this consent at any time by notifying Rani Beauty Clinic in writing.`;

const FINANCIAL_CONSENT = `FINANCIAL AGREEMENT AND CANCELLATION POLICY

I understand and agree to the following:

PAYMENT: Payment is due at the time of service unless prior financing arrangements have been made.

DEPOSITS: Certain services require a deposit to secure the appointment. Deposits are applied to the treatment cost.

CANCELLATION POLICY:
- Standard services: 24-hour cancellation notice required
- Premium services (Sofwave, RF Microneedling, Filler): 48-hour cancellation notice required
- Late cancellations or no-shows may be subject to a fee equal to the deposit amount

PACKAGES: Treatment packages are non-refundable and non-transferable. Packages expire 12 months from purchase date.

I authorize Rani Beauty Clinic to charge the card on file for any applicable cancellation or no-show fees per the above policy.`;

const NEUROTOXIN_CONSENT = `INFORMED CONSENT FOR NEUROTOXIN INJECTION (Botox/Dysport)

I consent to receive neurotoxin injection treatment performed by an authorized provider at Rani Beauty Clinic.

I understand that:
- Results typically appear in 3-14 days and last 3-4 months
- Common side effects include redness, swelling, and bruising at injection sites
- Rare side effects may include headache, drooping eyelid, or asymmetry
- Multiple treatments are needed to maintain results
- Results cannot be guaranteed and may vary

I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.`;

const FILLER_CONSENT = `INFORMED CONSENT FOR DERMAL FILLER INJECTION

I consent to receive dermal filler injection treatment performed by an authorized provider at Rani Beauty Clinic.

I understand that:
- Results are typically immediate and may last 6-18 months depending on the product and area
- Common side effects include swelling, redness, bruising, and tenderness
- Rare but serious risks include vascular occlusion, infection, and granuloma
- I should seek immediate medical attention if I experience unusual pain, skin color changes, or vision changes
- The filler can be dissolved if needed using hyaluronidase

I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.`;

const LASER_HR_CONSENT = `INFORMED CONSENT FOR LASER HAIR REMOVAL

I consent to receive laser hair removal treatment at Rani Beauty Clinic.

I understand that:
- Multiple sessions (typically 6-8) are required for optimal results
- Results vary based on hair color, skin type, and hormonal factors
- Common side effects include redness, mild swelling, and temporary sensitivity
- Rare risks include burns, blistering, scarring, or changes in skin pigmentation
- I must avoid sun exposure and self-tanners before and after treatment
- I must shave (not wax, pluck, or thread) the treatment area before each session

I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.`;

const RF_MICRONEEDLING_CONSENT = `INFORMED CONSENT FOR RF MICRONEEDLING

I consent to receive radiofrequency microneedling treatment at Rani Beauty Clinic.

I understand that:
- The treatment involves controlled micro-injuries combined with radiofrequency energy
- Results develop gradually over weeks as collagen remodels
- Multiple sessions may be recommended for optimal results
- Common side effects include redness, swelling, pinpoint bleeding, and skin sensitivity
- Rare risks include infection, scarring, or hyperpigmentation
- Post-treatment care is essential for optimal results and safety

I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.`;

const SOFWAVE_CONSENT = `INFORMED CONSENT FOR SOFWAVE SUPERB SKIN TIGHTENING

I consent to receive Sofwave ultrasound skin tightening treatment at Rani Beauty Clinic.

I understand that:
- Sofwave uses focused ultrasound energy to stimulate collagen production
- Results develop gradually over 3-6 months
- The treatment may cause temporary redness, mild swelling, or tenderness
- A single treatment may be sufficient, with results lasting 1+ years
- Individual results vary based on age, skin condition, and lifestyle factors

I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction.`;

// ── US STATES LIST ──

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];
