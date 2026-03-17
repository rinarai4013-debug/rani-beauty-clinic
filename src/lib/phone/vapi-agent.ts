/**
 * Vapi AI Phone Agent Engine
 *
 * Configures and manages the AI receptionist for Rani Beauty Clinic.
 * Handles inbound calls: greeting, service inquiries, appointment booking,
 * FAQ answering, and escalation to staff.
 *
 * Uses Vapi.ai for voice AI infrastructure.
 *
 * Capabilities:
 * 1. Custom assistant configuration with Rani brand voice
 * 2. Call flow management (greeting → routing → booking/FAQ → close)
 * 3. Service information lookup from knowledge base
 * 4. Appointment booking via Mangomint webhook
 * 5. Call analytics and performance tracking
 * 6. Escalation rules and call transfer
 * 7. After-hours handling with voicemail
 */

// ── TYPES ──

export interface PhoneAgentConfig {
  assistantId: string;
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicHours: ClinicHours;
  providers: ProviderInfo[];
  services: ServiceQuickRef[];
  escalationRules: EscalationRule[];
  greetingMode: 'standard' | 'after_hours' | 'holiday';
}

export interface ClinicHours {
  monday: { open: string; close: string } | null;
  tuesday: { open: string; close: string } | null;
  wednesday: { open: string; close: string } | null;
  thursday: { open: string; close: string } | null;
  friday: { open: string; close: string } | null;
  saturday: { open: string; close: string } | null;
  sunday: { open: string; close: string } | null;
}

export interface ProviderInfo {
  name: string;
  role: string;
  specialties: string[];
  availability: string;
}

export interface ServiceQuickRef {
  name: string;
  priceRange: string;
  duration: string;
  description: string;
  consultRequired: boolean;
  category: string;
}

export interface EscalationRule {
  trigger: string;
  action: 'transfer_staff' | 'take_message' | 'schedule_callback' | 'provide_info';
  priority: 'immediate' | 'normal' | 'low';
  department?: string;
}

// ── OUTPUT TYPES ──

export interface PhoneAgentSetup {
  assistantConfig: VapiAssistantConfig;
  systemPrompt: string;
  callFlows: CallFlow[];
  analytics: CallAnalytics;
  performanceMetrics: PerformanceMetrics;
  recommendations: AgentRecommendation[];
}

export interface VapiAssistantConfig {
  name: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    systemPrompt: string;
  };
  voice: {
    provider: string;
    voiceId: string;
    speed: number;
    stability: number;
  };
  firstMessage: string;
  transcriber: {
    provider: string;
    model: string;
    language: string;
  };
  endCallPhrases: string[];
  silenceTimeoutSeconds: number;
  maxDurationSeconds: number;
  backgroundSound: string;
  complianceMessages: string[];
}

export interface CallFlow {
  name: string;
  trigger: string;
  steps: CallFlowStep[];
  estimatedDuration: string;
}

export interface CallFlowStep {
  order: number;
  action: string;
  script: string;
  waitForResponse: boolean;
  nextStepCondition?: string;
}

export interface CallAnalytics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: number; // seconds
  bookingConversion: number; // percentage
  topIntents: IntentStat[];
  peakCallTimes: { hour: number; count: number }[];
  satisfaction: number; // 0-100
  callsByDay: { day: string; count: number }[];
}

export interface IntentStat {
  intent: string;
  count: number;
  percentage: number;
  avgDuration: number;
  conversionRate: number;
}

export interface PerformanceMetrics {
  firstResponseTime: number; // ms
  resolutionRate: number; // percentage
  transferRate: number; // percentage
  avgHandleTime: number; // seconds
  costPerCall: number;
  callQualityScore: number; // 0-100
  sentimentScore: number; // 0-100
}

export interface AgentRecommendation {
  category: 'voice' | 'flow' | 'knowledge' | 'performance' | 'hours';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
}

// ── CONSTANTS ──

const RANI_HOURS: ClinicHours = {
  monday: { open: '09:00', close: '18:00' },
  tuesday: { open: '09:00', close: '18:00' },
  wednesday: { open: '09:00', close: '18:00' },
  thursday: { open: '09:00', close: '18:00' },
  friday: { open: '09:00', close: '18:00' },
  saturday: { open: '10:00', close: '16:00' },
  sunday: null,
};

const RANI_PROVIDERS: ProviderInfo[] = [
  {
    name: 'Dr. Rani',
    role: 'Medical Director & Provider',
    specialties: ['Botox', 'Fillers', 'GLP-1', 'Sofwave', 'Medical Oversight'],
    availability: 'Monday-Friday 9AM-6PM',
  },
];

const RANI_SERVICES: ServiceQuickRef[] = [
  { name: 'Botox', priceRange: '$300-500', duration: '15-30 min', description: 'Wrinkle-relaxing injectable for forehead, crows feet, and more', consultRequired: false, category: 'injectable' },
  { name: 'Dermal Fillers', priceRange: '$600-1200', duration: '30-45 min', description: 'Volume restoration for lips, cheeks, jawline, and under-eyes', consultRequired: true, category: 'injectable' },
  { name: 'HydraFacial', priceRange: '$275-350', duration: '30-60 min', description: 'Deep-cleansing facial with hydration and glow', consultRequired: false, category: 'facial' },
  { name: 'Sofwave', priceRange: '$2,750-4,500', duration: '30-45 min', description: 'Non-invasive skin tightening and lifting using ultrasound', consultRequired: true, category: 'device' },
  { name: 'RF Microneedling', priceRange: '$495-850', duration: '45-60 min', description: 'Collagen stimulation for acne scars, texture, and tightening', consultRequired: true, category: 'device' },
  { name: 'VI Peel', priceRange: '$395', duration: '30 min', description: 'Medical-grade chemical peel for tone, texture, and clarity', consultRequired: false, category: 'peel' },
  { name: 'Laser Hair Removal', priceRange: 'From $800 pkg', duration: '15-60 min', description: 'Permanent hair reduction for all skin tones', consultRequired: true, category: 'laser' },
  { name: 'GLP-1 Weight Loss', priceRange: '$399-599/mo', duration: 'Monthly visits', description: 'Physician-supervised medical weight loss program', consultRequired: true, category: 'wellness' },
  { name: 'PicoWay', priceRange: '$350-600', duration: '15-30 min', description: 'Laser treatment for pigmentation, tattoo removal, and skin renewal', consultRequired: true, category: 'laser' },
  { name: 'Wellness Injections', priceRange: '$35-500', duration: '5-15 min', description: 'B12, NAD+, Glutathione, Vitamin D3, Tri-Immune IM injections', consultRequired: false, category: 'wellness' },
];

const ESCALATION_RULES: EscalationRule[] = [
  { trigger: 'medical_emergency', action: 'transfer_staff', priority: 'immediate', department: 'provider' },
  { trigger: 'adverse_reaction', action: 'transfer_staff', priority: 'immediate', department: 'provider' },
  { trigger: 'billing_dispute', action: 'schedule_callback', priority: 'normal', department: 'frontdesk' },
  { trigger: 'complaint', action: 'take_message', priority: 'normal', department: 'manager' },
  { trigger: 'prescription_refill', action: 'take_message', priority: 'normal', department: 'provider' },
  { trigger: 'complex_medical_question', action: 'schedule_callback', priority: 'normal', department: 'provider' },
  { trigger: 'cancel_multiple', action: 'transfer_staff', priority: 'normal', department: 'frontdesk' },
  { trigger: 'pricing_negotiation', action: 'schedule_callback', priority: 'low', department: 'manager' },
];

// ── MAIN ENGINE ──

export function configurePhoneAgent(
  overrides?: Partial<PhoneAgentConfig>
): PhoneAgentSetup {
  const config: PhoneAgentConfig = {
    assistantId: process.env.VAPI_ASSISTANT_ID || '',
    clinicName: 'Rani Beauty Clinic',
    clinicPhone: '(425) 207-8870',
    clinicAddress: '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
    clinicHours: RANI_HOURS,
    providers: RANI_PROVIDERS,
    services: RANI_SERVICES,
    escalationRules: ESCALATION_RULES,
    greetingMode: determineGreetingMode(),
    ...overrides,
  };

  const systemPrompt = buildSystemPrompt(config);
  const assistantConfig = buildAssistantConfig(config, systemPrompt);
  const callFlows = buildCallFlows(config);
  const analytics = generateSampleAnalytics();
  const performanceMetrics = calculatePerformanceMetrics(analytics);
  const recommendations = generateRecommendations(analytics, performanceMetrics);

  return {
    assistantConfig,
    systemPrompt,
    callFlows,
    analytics,
    performanceMetrics,
    recommendations,
  };
}

// ── SYSTEM PROMPT ──

function buildSystemPrompt(config: PhoneAgentConfig): string {
  const serviceList = config.services
    .map(s => `- ${s.name}: ${s.priceRange} (${s.duration}) — ${s.description}${s.consultRequired ? ' [Consultation required]' : ''}`)
    .join('\n');

  const hoursText = Object.entries(config.clinicHours)
    .map(([day, hours]) => {
      if (!hours) return `${day.charAt(0).toUpperCase() + day.slice(1)}: Closed`;
      return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours.open} - ${hours.close}`;
    })
    .join('\n');

  return `# Rani Beauty Clinic — AI Phone Receptionist

## Identity & Voice
You are Rani, the AI receptionist for Rani Beauty Clinic, a luxury medical aesthetics clinic in Renton, Washington. You are warm, professional, and knowledgeable. You speak with confidence about our services while being approachable and caring.

## Brand Voice Guidelines
- Luxury, confident, clinically-assured tone
- Educational and aspirational — never discount-first
- Say "transformation journey" not "treatment list"
- NEVER use the word "infusion" — always say "injection" for wellness services
- Address callers warmly by name once provided
- Use "we" and "our clinic" to build connection

## Clinic Information
- Name: ${config.clinicName}
- Phone: ${config.clinicPhone}
- Address: ${config.clinicAddress}
- Website: ranibeautyclinic.com

## Hours of Operation
${hoursText}

## Services & Pricing
${serviceList}

## Key Policies
- Free consultations for all services
- 24-hour cancellation policy ($50 late cancel fee)
- Cherry financing available (0% APR plans)
- HSA/FSA cards accepted for eligible treatments
- Membership program with 10-15% off services

## Call Handling Rules

### Greetings
- Standard: "Thank you for calling Rani Beauty Clinic, this is Rani speaking. How may I help you today?"
- After hours: "Thank you for calling Rani Beauty Clinic. We're currently closed, but I'd love to help you. I can answer questions about our services, or help you book an appointment for when we're open."
- Returning caller: "Welcome back to Rani Beauty Clinic! How can I assist you today?"

### Appointment Booking
1. Ask what service they're interested in
2. If consult required, explain complimentary consultation
3. Ask preferred date/time and provider preference
4. Confirm name, phone number, and email
5. Mention intake form will be sent via text
6. Confirm appointment details and say goodbye warmly

### Service Questions
- Provide accurate pricing and duration
- Explain benefits in accessible language
- Mention consultation for complex services
- Offer to book a consult if interested
- Reference specific results and client satisfaction

### Escalation Triggers — IMMEDIATELY transfer or take message:
- Medical emergency or adverse reaction
- Billing disputes or complaints
- Prescription refill requests
- Complex medical questions beyond service info
- Caller requests to speak with a person

### Things You Should NEVER Do
- Never diagnose or provide medical advice
- Never guarantee specific results
- Never discuss other clients or their treatments
- Never share provider personal information
- Never pressure callers into booking
- Never discuss competitor clinics negatively
- Never accept payment information over the phone

## Compliance
- If asked, confirm you are an AI assistant
- All calls may be recorded for quality purposes
- Refer medical questions to the provider
- Protect caller privacy at all times`;
}

// ── ASSISTANT CONFIG ──

function buildAssistantConfig(
  config: PhoneAgentConfig,
  systemPrompt: string
): VapiAssistantConfig {
  const greetings: Record<string, string> = {
    standard: `Thank you for calling ${config.clinicName}, this is Rani speaking. How may I help you today?`,
    after_hours: `Thank you for calling ${config.clinicName}. We're currently closed, but I'd love to help! I can answer questions about our services or help you schedule an appointment. How can I assist you?`,
    holiday: `Happy holidays from ${config.clinicName}! We're currently enjoying some time off, but I'm here to help with any questions or to schedule your next visit. What can I do for you?`,
  };

  return {
    name: 'Rani AI Receptionist',
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      systemPrompt,
    },
    voice: {
      provider: 'deepgram',
      voiceId: 'aura-luna-en', // warm, professional female voice
      speed: 1.0,
      stability: 0.75,
    },
    firstMessage: greetings[config.greetingMode] || greetings.standard,
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2',
      language: 'en',
    },
    endCallPhrases: [
      'goodbye',
      'bye bye',
      'have a great day',
      'thanks thats all',
      'nothing else',
      'end call',
    ],
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600, // 10 min max call
    backgroundSound: 'off',
    complianceMessages: [
      'This call may be recorded for quality and training purposes.',
      'I am an AI assistant for Rani Beauty Clinic.',
    ],
  };
}

// ── CALL FLOWS ──

function buildCallFlows(config: PhoneAgentConfig): CallFlow[] {
  return [
    {
      name: 'New Appointment Booking',
      trigger: 'Caller wants to book an appointment',
      estimatedDuration: '3-5 minutes',
      steps: [
        { order: 1, action: 'identify_service', script: 'What service are you interested in? We offer treatments ranging from facials and injectables to advanced skin tightening and medical weight loss.', waitForResponse: true },
        { order: 2, action: 'provide_info', script: 'Great choice! [Service details and pricing]. Would you like to schedule an appointment?', waitForResponse: true, nextStepCondition: 'if_interested' },
        { order: 3, action: 'check_availability', script: 'When works best for you? We have availability Monday through Friday 9-6 and Saturdays 10-4.', waitForResponse: true },
        { order: 4, action: 'collect_info', script: 'Perfect. Can I get your full name, phone number, and email address for the booking?', waitForResponse: true },
        { order: 5, action: 'confirm_booking', script: 'I have you booked for [service] on [date] at [time]. We will send a confirmation text with your intake form. Is there anything else I can help with?', waitForResponse: true },
        { order: 6, action: 'close_call', script: 'Wonderful! We look forward to seeing you. Have a beautiful day!', waitForResponse: false },
      ],
    },
    {
      name: 'Service Inquiry',
      trigger: 'Caller asking about services or pricing',
      estimatedDuration: '2-4 minutes',
      steps: [
        { order: 1, action: 'identify_interest', script: 'I would be happy to help! Are you looking for information about a specific treatment, or would you like an overview of what we offer?', waitForResponse: true },
        { order: 2, action: 'provide_details', script: '[Service-specific information, pricing, duration, and benefits]', waitForResponse: true },
        { order: 3, action: 'offer_consult', script: 'Would you like to schedule a complimentary consultation to learn more and create a personalized plan?', waitForResponse: true, nextStepCondition: 'if_interested' },
        { order: 4, action: 'book_or_close', script: 'Let me get you set up with a consultation. When works best for you?', waitForResponse: true },
      ],
    },
    {
      name: 'Existing Appointment',
      trigger: 'Caller wants to confirm, reschedule, or cancel',
      estimatedDuration: '1-3 minutes',
      steps: [
        { order: 1, action: 'identify_action', script: 'Of course! Are you looking to confirm, reschedule, or cancel your appointment?', waitForResponse: true },
        { order: 2, action: 'get_details', script: 'Can I get your name and the date of your appointment?', waitForResponse: true },
        { order: 3, action: 'process_request', script: '[Confirm/reschedule/cancel the appointment]. Please remember our 24-hour cancellation policy.', waitForResponse: true },
        { order: 4, action: 'close_call', script: 'All set! Is there anything else I can help with?', waitForResponse: true },
      ],
    },
    {
      name: 'General Questions / FAQ',
      trigger: 'Caller has general questions',
      estimatedDuration: '1-3 minutes',
      steps: [
        { order: 1, action: 'listen', script: 'I would be happy to help! What would you like to know?', waitForResponse: true },
        { order: 2, action: 'answer', script: '[Provide accurate answer from knowledge base]', waitForResponse: true },
        { order: 3, action: 'offer_more', script: 'Is there anything else you would like to know?', waitForResponse: true },
        { order: 4, action: 'close_or_book', script: 'Would you like to schedule a visit, or is there anything else I can help with?', waitForResponse: true },
      ],
    },
    {
      name: 'After-Hours Call',
      trigger: 'Call received outside business hours',
      estimatedDuration: '2-4 minutes',
      steps: [
        { order: 1, action: 'after_hours_greeting', script: 'Thank you for calling Rani Beauty Clinic. We are currently closed, but I am here to help!', waitForResponse: true },
        { order: 2, action: 'determine_need', script: 'I can answer questions about our services, help you book an appointment for when we are open, or take a message for our team.', waitForResponse: true },
        { order: 3, action: 'handle_request', script: '[Answer questions / book appointment / take message]', waitForResponse: true },
        { order: 4, action: 'close', script: 'Our office opens at [next open time]. We look forward to hearing from you! Have a wonderful evening.', waitForResponse: false },
      ],
    },
    {
      name: 'Escalation',
      trigger: 'Medical question, complaint, or caller requests human',
      estimatedDuration: '1-2 minutes',
      steps: [
        { order: 1, action: 'acknowledge', script: 'I completely understand. Let me connect you with the right person for this.', waitForResponse: false },
        { order: 2, action: 'collect_info', script: 'Can I get your name and a brief description of what you need help with so I can make sure the right team member follows up?', waitForResponse: true },
        { order: 3, action: 'transfer_or_message', script: 'I have noted this down. A member of our team will [call you back / be right with you]. Is there anything else?', waitForResponse: true },
      ],
    },
  ];
}

// ── ANALYTICS (Sample) ──

function generateSampleAnalytics(): CallAnalytics {
  return {
    totalCalls: 247,
    answeredCalls: 235,
    missedCalls: 12,
    avgDuration: 185, // seconds
    bookingConversion: 38.5,
    topIntents: [
      { intent: 'Book Appointment', count: 89, percentage: 37.9, avgDuration: 240, conversionRate: 72.0 },
      { intent: 'Service Inquiry', count: 68, percentage: 28.9, avgDuration: 180, conversionRate: 35.0 },
      { intent: 'Confirm/Reschedule', count: 42, percentage: 17.9, avgDuration: 90, conversionRate: 95.0 },
      { intent: 'Pricing Question', count: 25, percentage: 10.6, avgDuration: 150, conversionRate: 28.0 },
      { intent: 'General FAQ', count: 11, percentage: 4.7, avgDuration: 120, conversionRate: 18.0 },
    ],
    peakCallTimes: [
      { hour: 9, count: 28 },
      { hour: 10, count: 42 },
      { hour: 11, count: 35 },
      { hour: 12, count: 18 },
      { hour: 13, count: 15 },
      { hour: 14, count: 32 },
      { hour: 15, count: 38 },
      { hour: 16, count: 25 },
      { hour: 17, count: 14 },
    ],
    satisfaction: 92,
    callsByDay: [
      { day: 'Monday', count: 45 },
      { day: 'Tuesday', count: 42 },
      { day: 'Wednesday', count: 38 },
      { day: 'Thursday', count: 40 },
      { day: 'Friday', count: 35 },
      { day: 'Saturday', count: 35 },
      { day: 'Sunday', count: 12 },
    ],
  };
}

// ── PERFORMANCE ──

function calculatePerformanceMetrics(analytics: CallAnalytics): PerformanceMetrics {
  const answerRate = analytics.totalCalls > 0
    ? (analytics.answeredCalls / analytics.totalCalls) * 100
    : 0;

  const transferRate = 8.5; // estimated
  const costPerMinute = 0.14; // Vapi PAYG rate

  return {
    firstResponseTime: 1200, // 1.2 seconds
    resolutionRate: answerRate * 0.92,
    transferRate,
    avgHandleTime: analytics.avgDuration,
    costPerCall: (analytics.avgDuration / 60) * costPerMinute,
    callQualityScore: Math.min(95, Math.round(analytics.satisfaction * 1.03)),
    sentimentScore: 88,
  };
}

// ── RECOMMENDATIONS ──

function generateRecommendations(
  analytics: CallAnalytics,
  metrics: PerformanceMetrics
): AgentRecommendation[] {
  const recs: AgentRecommendation[] = [];

  // Missed calls
  if (analytics.missedCalls > 10) {
    recs.push({
      category: 'performance',
      priority: 'high',
      title: `${analytics.missedCalls} missed calls this period`,
      description: 'Missed calls represent lost booking opportunities. Each missed call could be $300+ in lost revenue.',
      expectedImpact: `Potential +$${(analytics.missedCalls * 300 * 0.38).toLocaleString()} in recovered bookings`,
    });
  }

  // Low conversion intents
  const lowConversion = analytics.topIntents.filter(i => i.conversionRate < 30 && i.count > 10);
  if (lowConversion.length > 0) {
    recs.push({
      category: 'flow',
      priority: 'high',
      title: `Low conversion on "${lowConversion[0].intent}" calls`,
      description: `Only ${lowConversion[0].conversionRate}% of ${lowConversion[0].intent} calls convert to bookings. Consider adding more compelling value propositions and clear CTAs.`,
      expectedImpact: 'Could increase booking rate by 10-15% with optimized scripts',
    });
  }

  // Peak hour coverage
  const peakHours = analytics.peakCallTimes.filter(t => t.count > 35);
  if (peakHours.length > 2) {
    recs.push({
      category: 'hours',
      priority: 'medium',
      title: 'High call volume at peak hours',
      description: `${peakHours.length} hours exceed 35+ calls. AI agent handles overflow well, but consider adding staff support during 10AM-11AM and 2PM-4PM.`,
      expectedImpact: 'Improved caller experience during peak times',
    });
  }

  // Knowledge base enhancement
  recs.push({
    category: 'knowledge',
    priority: 'medium',
    title: 'Expand FAQ knowledge for common questions',
    description: 'Add more detailed responses for seasonal promotions, package pricing, and financing options to reduce call duration and improve conversion.',
    expectedImpact: 'Reduce avg call duration by 15-20 seconds, improve satisfaction',
  });

  // Voice optimization
  if (metrics.sentimentScore < 90) {
    recs.push({
      category: 'voice',
      priority: 'low',
      title: 'Consider voice personality adjustment',
      description: 'Sentiment score is good but could be improved. Test a slightly warmer voice setting or adjust speech speed for complex service explanations.',
      expectedImpact: '+3-5% improvement in caller satisfaction',
    });
  }

  return recs.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ── VAPI API INTEGRATION ──

/**
 * Create or update the Vapi assistant with Rani's configuration.
 * Call this to sync the assistant config with Vapi's API.
 */
export async function syncAssistantToVapi(
  apiKey: string,
  assistantId: string | null,
  config: VapiAssistantConfig
): Promise<{ success: boolean; assistantId: string; message: string }> {
  try {
    const body = {
      name: config.name,
      model: {
        provider: config.model.provider,
        model: config.model.model,
        temperature: config.model.temperature,
        messages: [
          { role: 'system', content: config.model.systemPrompt },
        ],
      },
      voice: {
        provider: config.voice.provider,
        voiceId: config.voice.voiceId,
      },
      firstMessage: config.firstMessage,
      transcriber: {
        provider: config.transcriber.provider,
        model: config.transcriber.model,
        language: config.transcriber.language,
      },
      endCallPhrases: config.endCallPhrases,
      silenceTimeoutSeconds: config.silenceTimeoutSeconds,
      maxDurationSeconds: config.maxDurationSeconds,
    };

    const url = assistantId
      ? `https://api.vapi.ai/assistant/${assistantId}`
      : 'https://api.vapi.ai/assistant';

    const method = assistantId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, assistantId: assistantId || '', message: `Vapi API error: ${error}` };
    }

    const result = await response.json();
    return {
      success: true,
      assistantId: result.id || assistantId || '',
      message: assistantId ? 'Assistant updated successfully' : 'New assistant created',
    };
  } catch (error) {
    return {
      success: false,
      assistantId: assistantId || '',
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get call logs from Vapi.
 */
export async function getVapiCallLogs(
  apiKey: string,
  limit: number = 100
): Promise<{ success: boolean; calls: unknown[]; message: string }> {
  try {
    const response = await fetch(`https://api.vapi.ai/call?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, calls: [], message: 'Failed to fetch call logs' };
    }

    const calls = await response.json();
    return { success: true, calls, message: `Retrieved ${Array.isArray(calls) ? calls.length : 0} call logs` };
  } catch (error) {
    return { success: false, calls: [], message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// ── HELPERS ──

function determineGreetingMode(): 'standard' | 'after_hours' | 'holiday' {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
  const hour = now.getHours();

  // Sunday
  if (dayOfWeek === 0) return 'after_hours';

  // Saturday
  if (dayOfWeek === 6) {
    return (hour >= 10 && hour < 16) ? 'standard' : 'after_hours';
  }

  // Weekday
  return (hour >= 9 && hour < 18) ? 'standard' : 'after_hours';
}
