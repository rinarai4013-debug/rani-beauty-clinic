/**
 * Rina's Voice Engine
 * Rani Beauty Clinic
 *
 * Configures Rina's patient-facing voice for SMS and email.
 * Warm, personal, clinically confident. Like texting a friend
 * who happens to be your healthcare provider.
 */

import type {
  VoiceConfig,
  FormattedMessage,
  MessageStage,
  MessageChannel,
} from './types';

// ============================================================
// VOICE CONFIGURATION
// ============================================================

/** Rina's voice configuration */
export const RINA_VOICE: VoiceConfig = {
  senderName: 'Rina',
  clinicName: 'Rani Beauty Clinic',
  clinicPhone: '(425) 539-4440',
  toneKeywords: [
    'warm',
    'encouraging',
    'personal',
    'direct',
    'friendly',
    'confident',
    'supportive',
  ],
  bannedWords: [
    // Em dashes and corporate jargon
    'leverage',
    'utilize',
    'robust',
    'seamless',
    'cutting-edge',
    'game-changer',
    'revolutionary',
    'delve into',
    'synergy',
    'paradigm',
    'holistic approach',
    'best-in-class',
    'world-class',
    'state-of-the-art',
    'at the end of the day',
    'circle back',
    'touch base',
    'move the needle',
    'low-hanging fruit',
    'deep dive',
    'drill down',
    'take it to the next level',
    'think outside the box',
    'pivot',
    'disrupt',
    'ecosystem',
    'scalable',
    'actionable insights',
    'value proposition',

    // AI-sounding language
    'I understand your concern',
    'I\'d be happy to',
    'As an AI',
    'I don\'t have personal',
    'It\'s important to note',
    'It\'s worth noting',
    'In conclusion',
    'Furthermore',
    'Moreover',
    'Subsequently',
    'Consequently',
    'Notwithstanding',
    'Henceforth',
    'Heretofore',

    // Medical no-nos (Rani-specific)
    'infusion', // ALWAYS say injection
    'generic Ozempic',
    'generic Wegovy',
    'generic Mounjaro',
    'guaranteed weight loss',
    'cure obesity',
  ],
  maxSmsLength: 300,
  emojiUsage: 'sparingly',
};

/** Banned character: em dash */
const EM_DASH = '\u2014';
const EN_DASH = '\u2013';

// ============================================================
// TEXT SANITIZATION
// ============================================================

/**
 * Removes banned words and replaces them with approved alternatives.
 */
export function sanitizeText(text: string): { cleaned: string; replacements: string[] } {
  let cleaned = text;
  const replacements: string[] = [];

  // Replace em dashes with regular dashes
  if (cleaned.includes(EM_DASH)) {
    cleaned = cleaned.replace(new RegExp(EM_DASH, 'g'), '-');
    replacements.push('Replaced em dash with hyphen');
  }
  if (cleaned.includes(EN_DASH)) {
    cleaned = cleaned.replace(new RegExp(EN_DASH, 'g'), '-');
    replacements.push('Replaced en dash with hyphen');
  }

  // Replace banned words
  const wordReplacements: Record<string, string> = {
    'leverage': 'use',
    'utilize': 'use',
    'robust': 'strong',
    'seamless': 'smooth',
    'cutting-edge': 'advanced',
    'game-changer': 'big deal',
    'revolutionary': 'new',
    'delve into': 'look at',
    'infusion': 'injection',
    'generic Ozempic': 'compounded semaglutide',
    'generic Wegovy': 'compounded semaglutide',
    'generic Mounjaro': 'compounded tirzepatide',
    'guaranteed weight loss': 'medically supervised weight loss',
    'Furthermore': 'Also',
    'Moreover': 'Also',
    'Subsequently': 'Then',
    'Consequently': 'So',
    'It\'s important to note': '',
    'It\'s worth noting': '',
    'I\'d be happy to': 'I\'ll',
  };

  for (const [banned, replacement] of Object.entries(wordReplacements)) {
    const regex = new RegExp(banned, 'gi');
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, replacement);
      replacements.push(`"${banned}" -> "${replacement}"`);
    }
  }

  // Clean up double spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return { cleaned, replacements };
}

/**
 * Validates text against the voice config rules.
 */
export function validateVoice(text: string): {
  isCompliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for em dashes
  if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
    issues.push('Contains em dash or en dash. Use hyphen instead.');
  }

  // Check for banned words
  const lowerText = text.toLowerCase();
  for (const word of RINA_VOICE.bannedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      issues.push(`Contains banned word/phrase: "${word}"`);
    }
  }

  // Check for phone number in text
  if (!text.includes('(425) 539-4440') && !text.includes('425-539-4440')) {
    // Only flag for longer messages (not super short ones)
    if (text.length > 100) {
      issues.push('Missing clinic phone number (425) 539-4440');
    }
  }

  return {
    isCompliant: issues.length === 0,
    issues,
  };
}

// ============================================================
// SMS FORMATTER
// ============================================================

/**
 * Formats a message for SMS (under 300 characters).
 */
export function formatSMS(
  recipientName: string,
  body: string,
  stage: MessageStage
): FormattedMessage {
  let text = body;

  // Sanitize
  const { cleaned, replacements } = sanitizeText(text);
  text = cleaned;

  // Truncate if needed
  if (text.length > RINA_VOICE.maxSmsLength) {
    text = text.substring(0, RINA_VOICE.maxSmsLength - 3) + '...';
  }

  const validation = validateVoice(text);

  return {
    channel: 'sms',
    body: text,
    recipientName,
    stage,
    characterCount: text.length,
    isCompliant: validation.isCompliant,
    complianceIssues: validation.issues,
  };
}

/**
 * Formats a message for email.
 */
export function formatEmail(
  recipientName: string,
  subject: string,
  body: string,
  stage: MessageStage
): FormattedMessage {
  const { cleaned } = sanitizeText(body);
  const { cleaned: cleanedSubject } = sanitizeText(subject);
  const validation = validateVoice(cleaned);

  return {
    channel: 'email',
    subject: cleanedSubject,
    body: cleaned,
    recipientName,
    stage,
    characterCount: cleaned.length,
    isCompliant: validation.isCompliant,
    complianceIssues: validation.issues,
  };
}

// ============================================================
// TEMPLATE LIBRARY
// ============================================================

/** Template function type */
type TemplateFunction = (firstName: string, context?: Record<string, string>) => string;

/** SMS templates by stage */
export const SMS_TEMPLATES: Record<MessageStage, TemplateFunction> = {
  welcome: (firstName) =>
    `Hey ${firstName}! Welcome to Rani Beauty Clinic. I'm Rina and I'll be guiding you through your weight loss journey. First step: labs! I'll send details shortly. (425) 539-4440`,

  lab_reminder: (firstName) =>
    `${firstName}, just checking in on your labs! We need those results to get your treatment started. Need help finding a lab location? Reply and I'll help! - Rina (425) 539-4440`,

  gfe_reminder: (firstName) =>
    `${firstName}, quick reminder about your virtual exam. It takes about 10 min and it's the last step before we can start your treatment. Ready? Reply YES! - Rina (425) 539-4440`,

  approval_celebration: (firstName) =>
    `${firstName}! Great news - you're approved! Your compounded medication is being prepared and will ship soon. So excited for you to start this journey! - Rina (425) 539-4440`,

  shipping: (firstName, ctx) =>
    `${firstName}, your medication just shipped! ${ctx?.trackingInfo ? `Tracking: ${ctx.trackingInfo}` : 'You should receive it in 3-5 business days.'} I'll send first dose instructions when it arrives! - Rina (425) 539-4440`,

  first_dose_instructions: (firstName, ctx) => {
    const med = ctx?.medication ?? 'medication';
    return `${firstName}, time for your first dose! Take your ${med} injection in your abdomen or thigh. Eat light today, stay hydrated. Mild nausea is normal. Text me how it goes! - Rina (425) 539-4440`;
  },

  week1_checkin: (firstName) =>
    `Hey ${firstName}! It's been a week since your first dose. How are you feeling? Any side effects? Reply and let me know - I'm here to help with anything! - Rina (425) 539-4440`,

  month1_review: (firstName, ctx) => {
    const weightLost = ctx?.weightLost ?? 'progress';
    return `${firstName}, one month in! ${typeof weightLost === 'string' && weightLost !== 'progress' ? `You've lost ${weightLost} lbs - ` : ''}How are you feeling? Any questions about your next month? Let's keep this momentum going! - Rina (425) 539-4440`;
  },

  refill_reminder: (firstName, ctx) => {
    const med = ctx?.medication ?? 'medication';
    const price = ctx?.price ?? '';
    return `Hey ${firstName}! Your ${med} refill is coming up${price ? ` (${price})` : ''}. Reply YES to confirm and we'll get it processed! - Rina (425) 539-4440`;
  },

  at_risk_reengagement: (firstName) =>
    `${firstName}, we haven't heard from you in a while and we miss you! Everything okay? If you have questions or concerns about your treatment, I'm here. No pressure. - Rina (425) 539-4440`,

  win_back: (firstName) =>
    `Hey ${firstName}, it's Rina from Rani. I wanted to check in - we'd love to have you back whenever you're ready. Your health journey is always here for you. Call me anytime: (425) 539-4440`,
};

/** Email templates by stage */
export const EMAIL_TEMPLATES: Record<MessageStage, (firstName: string, context?: Record<string, string>) => { subject: string; body: string }> = {
  welcome: (firstName, ctx) => ({
    subject: `Welcome to Rani, ${firstName}!`,
    body: `Hi ${firstName},\n\nWelcome to Rani Beauty Clinic! I'm so glad you're here.\n\nI'm Rina, and I'll be your point of contact throughout your ${ctx?.serviceName ?? 'weight loss'} journey. Think of me as your personal guide.\n\nHere's what happens next:\n\n1. Labs - We need a few blood tests to make sure your treatment is safe and personalized for you.\n2. Virtual Exam - A quick 10-minute exam through Qualiphy (our telehealth partner).\n3. Prescription & Shipping - Once approved, your compounded medication ships right to your door.\n\nThe whole process typically takes 10-14 days from start to first dose.\n\nQuestions? Just reply to this email or call/text me at (425) 539-4440. I'm always here.\n\nExcited for you,\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  lab_reminder: (firstName, ctx) => ({
    subject: `${firstName}, your labs are needed`,
    body: `Hi ${firstName},\n\nJust a friendly check-in about your lab work. We need your results before we can move forward with your treatment plan.\n\n${ctx?.labList ? `Required labs:\n${ctx.labList}\n\n` : ''}You can get these done at any Quest Diagnostics or Labcorp near you. Most locations accept walk-ins and results come back within 2-3 business days.\n\nNeed help finding a location? Just reply and I'll send you options near your area.\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  gfe_reminder: (firstName) => ({
    subject: `Almost there, ${firstName}! One step left`,
    body: `Hi ${firstName},\n\nYour lab results are in and looking good! There's just one more step before we can get your prescription started.\n\nYou need to complete a quick virtual exam through Qualiphy. It takes about 10 minutes and you can do it right from your phone.\n\nWe'll send you the link separately. If you already received it, just click through and follow the prompts.\n\nSo close to getting started!\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  approval_celebration: (firstName) => ({
    subject: `You're approved, ${firstName}!`,
    body: `Hi ${firstName},\n\nI have exciting news - you've been approved for treatment!\n\nYour compounded medication is being prepared at our licensed pharmacy and will ship to you soon. You should receive it within 3-5 business days.\n\nOnce it arrives, I'll send you detailed instructions for your first dose. It's simple and I'll walk you through everything.\n\nThis is a big step and I'm really proud of you for taking it.\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  shipping: (firstName, ctx) => ({
    subject: `Your medication is on its way, ${firstName}!`,
    body: `Hi ${firstName},\n\nYour medication just shipped!${ctx?.trackingInfo ? `\n\nTracking: ${ctx.trackingInfo}` : ''}\n\nExpected delivery: 3-5 business days.\n\nImportant: When your package arrives, store it in the refrigerator. I'll send you complete first-dose instructions once you confirm delivery.\n\nReply to this email or text me at (425) 539-4440 when it arrives!\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  first_dose_instructions: (firstName, ctx) => ({
    subject: `First dose day, ${firstName}! Here's your guide`,
    body: `Hi ${firstName},\n\nToday's the day! Here's everything you need to know for your first dose:\n\nInjection site: Abdomen (2+ inches from belly button) or upper thigh\nTime: Pick a consistent day each week - many patients choose Monday or Friday\nMeal prep: Eat light today. Small, balanced meals. Stay hydrated.\n\nWhat to expect:\n- Mild nausea is common and usually passes within a few days\n- Decreased appetite (that's the medication working!)\n- Some patients feel a bit tired the first day\n\nWhat to watch for:\n- If you experience severe abdominal pain, stop medication and contact us immediately\n- Mild GI symptoms are normal, severe ones are not\n\nYour first check-in is in one week. I'll text you then to see how everything is going.\n\nYou've got this!\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  week1_checkin: (firstName) => ({
    subject: `Week 1 check-in, ${firstName}!`,
    body: `Hi ${firstName},\n\nIt's been a week since your first dose! I wanted to check in and see how you're doing.\n\nA few questions:\n- How are you feeling overall?\n- Any side effects? (Mild nausea and decreased appetite are normal)\n- Have you noticed any changes in appetite or energy?\n\nRemember, the first few weeks are about your body adjusting. The real magic happens over the next 2-3 months.\n\nReply and let me know how it's going. I'm here for whatever you need.\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  month1_review: (firstName, ctx) => ({
    subject: `One month milestone, ${firstName}!`,
    body: `Hi ${firstName},\n\nHappy one-month mark! Let's talk about how things are going.\n\n${ctx?.weightLost ? `You've lost ${ctx.weightLost} lbs so far - that's great progress!\n\n` : ''}At this point, most patients are feeling more comfortable with their routine. Your body is adjusting and the appetite changes should feel more natural now.\n\nA few things to think about:\n- Are you staying hydrated? (64+ oz of water daily)\n- Getting some movement in? (Even walks count)\n- Eating protein-rich meals?\n\nWe may discuss a dose adjustment at your next check-in depending on your progress and how you're tolerating the medication.\n\nKeep it up!\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  refill_reminder: (firstName, ctx) => ({
    subject: `Refill time, ${firstName}!`,
    body: `Hi ${firstName},\n\nYour ${ctx?.medication ?? 'medication'} refill is coming up${ctx?.price ? ` (${ctx.price})` : ''}.\n\nTo keep your treatment on track with no gaps, please confirm your refill by replying to this email or texting YES to (425) 539-4440.\n\nIf you need to update your payment method or have any questions about your treatment, just let me know.\n\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  at_risk_reengagement: (firstName) => ({
    subject: `Checking in, ${firstName}`,
    body: `Hi ${firstName},\n\nI noticed we haven't connected in a while and I wanted to reach out.\n\nIf you're experiencing side effects, have questions, or just need to talk through anything about your treatment, I'm here. No judgment, no pressure.\n\nSometimes patients need a break, and that's okay too. I just want to make sure you have the support you need.\n\nFeel free to reply to this email or call/text me directly at (425) 539-4440.\n\nThinking of you,\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),

  win_back: (firstName) => ({
    subject: `We'd love to see you again, ${firstName}`,
    body: `Hi ${firstName},\n\nIt's been a while and I wanted you to know that Rani is always here for you.\n\nWhether you're ready to restart your treatment, try something new, or just have questions, my door is open.\n\nYour health journey doesn't have an expiration date. Whenever you're ready, we're ready.\n\nWishing you well,\nRina\nRani Beauty Clinic\n(425) 539-4440`,
  }),
};

// ============================================================
// MESSAGE GENERATION
// ============================================================

/**
 * Generates a formatted SMS message for a given stage.
 */
export function generateSMS(
  firstName: string,
  stage: MessageStage,
  context?: Record<string, string>
): FormattedMessage {
  const template = SMS_TEMPLATES[stage];
  const body = template(firstName, context);
  return formatSMS(firstName, body, stage);
}

/**
 * Generates a formatted email message for a given stage.
 */
export function generateEmail(
  firstName: string,
  stage: MessageStage,
  context?: Record<string, string>
): FormattedMessage {
  const template = EMAIL_TEMPLATES[stage];
  const { subject, body } = template(firstName, context);
  return formatEmail(firstName, subject, body, stage);
}

/**
 * Generates both SMS and email for a given stage.
 */
export function generateMessages(
  firstName: string,
  stage: MessageStage,
  context?: Record<string, string>
): { sms: FormattedMessage; email: FormattedMessage } {
  return {
    sms: generateSMS(firstName, stage, context),
    email: generateEmail(firstName, stage, context),
  };
}

// ============================================================
// VOICE STYLE GUIDE
// ============================================================

/** Rina's voice style guide for reference */
export const VOICE_STYLE_GUIDE = {
  tone: 'Warm, like texting a friend who happens to be your healthcare provider.',
  pronouns: 'Use "I" and "we". First names always.',
  emoji: 'Gold heart sparingly. No other emoji overuse.',
  formatting: 'Short paragraphs. Phone-readable. No walls of text.',
  cta: 'Direct CTAs: "Reply YES" not "Please indicate your preference".',
  encouragement: 'Always encouraging. Celebrate wins, normalize challenges.',
  phone: 'Include (425) 539-4440 in every message.',
  smsLimit: 'SMS under 300 characters.',
  emailStyle: 'Conversational, structured, clear next steps.',
  never: [
    'Em dashes',
    'Corporate jargon',
    'AI-sounding language',
    'Passive voice (when possible)',
    'Long paragraphs',
    'Medical jargon without explanation',
    '"Infusion" (always say "injection")',
  ],
} as const;

/**
 * Returns the voice style guide as a formatted string.
 */
export function getVoiceGuide(): string {
  return [
    "Rina's Voice Guide",
    '='.repeat(40),
    '',
    `Tone: ${VOICE_STYLE_GUIDE.tone}`,
    `Pronouns: ${VOICE_STYLE_GUIDE.pronouns}`,
    `Emoji: ${VOICE_STYLE_GUIDE.emoji}`,
    `Formatting: ${VOICE_STYLE_GUIDE.formatting}`,
    `CTAs: ${VOICE_STYLE_GUIDE.cta}`,
    `Encouragement: ${VOICE_STYLE_GUIDE.encouragement}`,
    `Phone: ${VOICE_STYLE_GUIDE.phone}`,
    `SMS Limit: ${VOICE_STYLE_GUIDE.smsLimit}`,
    `Email Style: ${VOICE_STYLE_GUIDE.emailStyle}`,
    '',
    'NEVER use:',
    ...VOICE_STYLE_GUIDE.never.map((n) => `  - ${n}`),
  ].join('\n');
}
