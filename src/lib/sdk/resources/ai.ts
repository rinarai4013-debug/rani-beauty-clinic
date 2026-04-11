/**
 * RaniOS SDK - AI Resource
 *
 * Access AI-powered chat, treatment recommendations, and intake analysis.
 * Powered by Anthropic Claude API.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    clientId?: string;
    currentPage?: string;
    metadata?: Record<string, string>;
  };
}

export interface ChatResponse {
  message: string;
  conversationId: string;
  intent: 'booking' | 'inquiry' | 'concern' | 'general' | 'lead_capture' | 'pricing';
  suggestedActions: {
    type: 'book_consult' | 'view_service' | 'call_clinic' | 'sms_optin' | 'none';
    label: string;
    url?: string;
  }[];
  leadCaptured: boolean;
  metadata: {
    model: string;
    tokensUsed: number;
    responseTimeMs: number;
  };
}

export interface TreatmentPlan {
  tier: 'good' | 'better' | 'best';
  name: string;
  services: {
    service: string;
    sessions: number;
    pricePerSession: number;
    totalPrice: number;
    frequency: string;
    description: string;
  }[];
  totalPrice: number;
  timeline: string;
  benefits: string[];
  idealFor: string;
}

export interface RecommendRequest {
  clientId?: string;
  concerns: string[];
  goals: string[];
  budget?: 'value' | 'moderate' | 'premium';
  previousTreatments?: string[];
  skinType?: string;
  age?: number;
}

export interface RecommendResponse {
  plans: TreatmentPlan[];
  rationale: string;
  clientProfile: {
    primaryConcerns: string[];
    skinAnalysis: string;
    treatmentHistory: string;
  };
  metadata: {
    model: string;
    tokensUsed: number;
    responseTimeMs: number;
  };
}

export interface IntakeAnalysis {
  clientId: string;
  summary: string;
  riskFlags: {
    flag: string;
    severity: 'low' | 'medium' | 'high';
    detail: string;
    recommendation: string;
  }[];
  suggestedPlan: {
    services: string[];
    timeline: string;
    estimatedValue: number;
    nextStep: string;
  };
  consultScript: {
    opening: string;
    keyQuestions: string[];
    talkingPoints: string[];
    closingStrategy: string;
  };
  costBreakdown: string;
  metadata: {
    model: string;
    tokensUsed: number;
    responseTimeMs: number;
    processingStatus: 'new' | 'processed' | 'responded';
  };
}

export interface IntakeRequest {
  clientId: string;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    concerns: string[];
    medicalHistory?: string;
    currentMedications?: string;
    allergies?: string;
    previousTreatments?: string;
    goals?: string;
    budget?: string;
    referralSource?: string;
  };
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class AIResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Send a message to the AI concierge chatbot.
   * The chatbot handles booking inquiries, service questions, concern assessment,
   * and lead capture with SMS opt-in.
   *
   * @example
   * ```ts
   * const { data } = await client.ai.chat({
   *   message: 'What treatments do you recommend for fine lines?',
   *   context: { currentPage: '/services/anti-aging' },
   * });
   * console.log(data.message);
   * console.log(`Intent: ${data.intent}`);
   * data.suggestedActions.forEach(a => console.log(`Action: ${a.label}`));
   * ```
   */
  async chat(request: ChatRequest): Promise<SDKResponse<ChatResponse>> {
    return this.client.request<ChatResponse>('/ai/chat', {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Get AI-powered treatment recommendations.
   * Returns 3-tier Good/Better/Best treatment plans based on client
   * concerns, goals, budget, and treatment history.
   *
   * @example
   * ```ts
   * const { data } = await client.ai.recommend({
   *   concerns: ['fine lines', 'uneven skin tone'],
   *   goals: ['anti-aging', 'skin brightening'],
   *   budget: 'moderate',
   *   age: 42,
   * });
   * data.plans.forEach(plan => {
   *   console.log(`${plan.tier}: ${plan.name} - $${plan.totalPrice}`);
   * });
   * ```
   */
  async recommend(request: RecommendRequest): Promise<SDKResponse<RecommendResponse>> {
    return this.client.request<RecommendResponse>('/ai/recommend', {
      method: 'POST',
      body: request,
    });
  }

  /**
   * Analyze a client intake form submission.
   * Returns risk flags, suggested treatment plan, consult script,
   * cost breakdown, and processing status.
   *
   * @example
   * ```ts
   * const { data } = await client.ai.analyzeIntake({
   *   clientId: 'rec_abc123',
   *   formData: {
   *     firstName: 'Jane',
   *     lastName: 'Doe',
   *     email: 'jane@example.com',
   *     phone: '+12065551234',
   *     concerns: ['acne scars', 'hyperpigmentation'],
   *     goals: 'Clear, even-toned skin',
   *     budget: '$1,000-2,000',
   *   },
   * });
   * console.log(data.summary);
   * data.riskFlags.forEach(f => console.warn(`${f.severity}: ${f.flag}`));
   * ```
   */
  async analyzeIntake(request: IntakeRequest): Promise<SDKResponse<IntakeAnalysis>> {
    return this.client.request<IntakeAnalysis>('/ai/intake', {
      method: 'POST',
      body: request,
    });
  }
}
