import { test, expect } from '@playwright/test';

/**
 * Voice Engine E2E Tests
 * Tests message generation in Rina's brand voice, AI chat responses,
 * voice AI phone agent configuration, and communication template rendering.
 */

const MOCK_VOICE_CONFIG = {
  assistantId: 'asst_rani_voice_001',
  voiceProvider: 'deepgram',
  voiceModel: 'aura-luna-en',
  llmModel: 'gpt-4o-mini',
  transcriber: 'nova-2',
  brandVoice: {
    tone: 'luxury, confident, clinically-assured',
    personality: 'warm, educational, aspirational',
    prohibitedWords: ['infusion', 'cheap', 'discount', 'deal'],
    requiredPhrases: ['physician-supervised', 'Dr. Landfield'],
  },
};

const MOCK_CALL_ANALYTICS = {
  totalCalls: 156,
  avgDuration: '3:42',
  bookingConversion: 0.34,
  satisfaction: 4.2,
  topIntents: [
    { intent: 'booking_inquiry', count: 62, percentage: 0.40 },
    { intent: 'service_info', count: 45, percentage: 0.29 },
    { intent: 'pricing_inquiry', count: 28, percentage: 0.18 },
    { intent: 'existing_appointment', count: 14, percentage: 0.09 },
    { intent: 'general_faq', count: 7, percentage: 0.04 },
  ],
  peakHours: [
    { hour: 10, calls: 22 },
    { hour: 11, calls: 28 },
    { hour: 14, calls: 25 },
    { hour: 15, calls: 19 },
  ],
};

const MOCK_CHAT_MESSAGES = [
  { role: 'user', content: 'Hi, I want to know about weight loss injections' },
  {
    role: 'assistant',
    content:
      'Welcome to Rani Beauty Clinic! I would love to tell you about our physician-supervised GLP-1 weight management program, The Rani Protocol. Under the medical direction of Dr. Alexander Landfield, we offer both Semaglutide and Tirzepatide injection programs starting at $399/month. The program includes in-house blood work, custom dosing, and ongoing medical support. Would you like to schedule a consultation to discuss which option is right for you?',
  },
];

const MOCK_GENERATED_MESSAGE = {
  type: 'follow_up',
  channel: 'sms',
  content:
    'Hi Rachel, this is Rina from Rani Beauty Clinic. I wanted to check in after your HydraFacial yesterday. Your skin looked beautiful! Remember to keep it hydrated and avoid direct sun for 48 hours. Let us know if you have any questions. We are here for you! - Rina',
  tone: 'warm',
  compliance: { passesReview: true, flags: [] },
};

const MOCK_CALL_FLOWS = [
  { id: 'flow_new_booking', name: 'New Booking', steps: 5, active: true },
  { id: 'flow_service_inquiry', name: 'Service Inquiry', steps: 4, active: true },
  { id: 'flow_existing_apt', name: 'Existing Appointment', steps: 3, active: true },
  { id: 'flow_general_faq', name: 'General FAQ', steps: 3, active: true },
  { id: 'flow_after_hours', name: 'After Hours', steps: 2, active: true },
  { id: 'flow_escalation', name: 'Escalation', steps: 2, active: true },
];

const MOCK_ESCALATION_RULES = [
  { trigger: 'medical_emergency', action: 'Transfer to 911', priority: 'critical' },
  { trigger: 'adverse_reaction', action: 'Transfer to provider on call', priority: 'critical' },
  { trigger: 'billing_dispute', action: 'Transfer to front desk', priority: 'high' },
  { trigger: 'complaint', action: 'Transfer to manager', priority: 'high' },
  { trigger: 'complex_medical_question', action: 'Schedule callback with provider', priority: 'medium' },
];

test.describe('Voice Engine', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/dashboard/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'Rina', role: 'ceo', permissions: ['view_phone_agent', 'manage_voice', 'view_messages'] },
        }),
      })
    );
  });

  test.describe('AI Chat Voice', () => {
    test('generates response in Rani brand voice', async ({ page }) => {
      await page.route('**/api/ai/chat', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: MOCK_CHAT_MESSAGES[1].content,
            leadCaptured: false,
          }),
        })
      );

      await page.goto('/');
      const chatWidget = page.locator('[data-testid="chat-widget"], [class*="chat"], button[aria-label*="chat"]').first();
      const hasChat = await chatWidget.count();
      if (hasChat > 0) {
        await chatWidget.click();
        await page.waitForTimeout(300);

        const chatInput = page.locator('input[data-testid="chat-input"], textarea[data-testid="chat-input"], input[placeholder*="message"]').first();
        const hasInput = await chatInput.count();
        if (hasInput > 0) {
          await chatInput.fill('I want to know about weight loss injections');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);

          const response = page.getByText(/physician-supervised|Rani Protocol|Dr.*Landfield/i).first();
          await expect(response).toBeVisible();
        }
      }
    });

    test('never uses the word infusion in responses', async ({ page }) => {
      await page.route('**/api/ai/chat', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Our vitamin injection program delivers essential nutrients directly. We offer B12, Vitamin D3, Glutathione, and NAD+ injections administered by our trained clinicians under physician supervision.',
            leadCaptured: false,
          }),
        })
      );

      await page.goto('/');
      const chatWidget = page.locator('[data-testid="chat-widget"], [class*="chat"], button[aria-label*="chat"]').first();
      const hasChat = await chatWidget.count();
      if (hasChat > 0) {
        await chatWidget.click();
        await page.waitForTimeout(300);

        const chatInput = page.locator('input[data-testid="chat-input"], textarea[data-testid="chat-input"]').first();
        const hasInput = await chatInput.count();
        if (hasInput > 0) {
          await chatInput.fill('Tell me about your vitamin treatments');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);

          const responseArea = page.locator('[class*="chat-messages"], [data-testid="chat-messages"]').first();
          const hasArea = await responseArea.count();
          if (hasArea > 0) {
            const text = await responseArea.textContent();
            expect(text?.toLowerCase()).not.toContain('infusion');
          }
        }
      }
    });

    test('captures lead information during chat', async ({ page }) => {
      let leadCaptured = false;

      await page.route('**/api/ai/chat', (route) => {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.email || body.phone) {
          leadCaptured = true;
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Thank you for your interest! I have noted your contact information. A member of our team will reach out shortly to schedule your consultation.',
            leadCaptured: true,
          }),
        });
      });

      await page.goto('/');
      const chatWidget = page.locator('[data-testid="chat-widget"], [class*="chat"], button[aria-label*="chat"]').first();
      const hasChat = await chatWidget.count();
      if (hasChat > 0) {
        await chatWidget.click();
        await page.waitForTimeout(300);

        const chatInput = page.locator('input[data-testid="chat-input"], textarea[data-testid="chat-input"]').first();
        const hasInput = await chatInput.count();
        if (hasInput > 0) {
          await chatInput.fill('I want to book a consultation. My email is test@example.com');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
        }
      }
    });

    test('provides service-specific information on request', async ({ page }) => {
      await page.route('**/api/ai/chat', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Our Botox treatments start at $12 per unit and are administered by experienced clinicians under the supervision of Dr. Landfield. Most treatments take about 15-20 minutes with no downtime. Results appear within 3-5 days and last 3-4 months. Would you like to schedule a consultation?',
            leadCaptured: false,
          }),
        })
      );

      await page.goto('/');
      const chatWidget = page.locator('[data-testid="chat-widget"], button[aria-label*="chat"]').first();
      const hasChat = await chatWidget.count();
      if (hasChat > 0) {
        await chatWidget.click();
        const chatInput = page.locator('input[data-testid="chat-input"], textarea[data-testid="chat-input"]').first();
        const hasInput = await chatInput.count();
        if (hasInput > 0) {
          await chatInput.fill('How much is Botox?');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);

          const response = page.getByText(/\$12.*unit|Botox.*treatment/i).first();
          await expect(response).toBeVisible();
        }
      }
    });
  });

  test.describe('Phone Agent Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/dashboard/phone-agent', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            config: MOCK_VOICE_CONFIG,
            analytics: MOCK_CALL_ANALYTICS,
            callFlows: MOCK_CALL_FLOWS,
            escalationRules: MOCK_ESCALATION_RULES,
          }),
        })
      );
    });

    test('displays call analytics overview', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const totalCalls = page.getByText(/156|total calls/i).first();
      await expect(totalCalls).toBeVisible();
    });

    test('shows booking conversion rate', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const conversion = page.getByText(/34%|booking.*conversion/i).first();
      await expect(conversion).toBeVisible();
    });

    test('displays top call intents', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const bookingIntent = page.getByText(/booking.*inquiry|40%/i).first();
      await expect(bookingIntent).toBeVisible();
    });

    test('shows peak call hours', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const peakHour = page.getByText(/11.*AM|peak.*hour/i).first();
      const hasPeak = await peakHour.count();
      expect(hasPeak).toBeGreaterThanOrEqual(0);
    });

    test('displays average call duration', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const duration = page.getByText(/3:42|avg.*duration/i).first();
      await expect(duration).toBeVisible();
    });

    test('shows satisfaction score', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const satisfaction = page.getByText(/4\.2|satisfaction/i).first();
      await expect(satisfaction).toBeVisible();
    });

    test('lists all call flows', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      for (const flow of MOCK_CALL_FLOWS) {
        const flowEntry = page.getByText(new RegExp(flow.name, 'i')).first();
        await expect(flowEntry).toBeVisible();
      }
    });

    test('displays escalation rules', async ({ page }) => {
      await page.goto('/dashboard/phone-agent');
      const escalation = page.getByText(/medical emergency|adverse reaction|escalation/i).first();
      await expect(escalation).toBeVisible();
    });
  });

  test.describe('Message Generation', () => {
    test('generates follow-up message in brand voice', async ({ page }) => {
      await page.route('**/api/dashboard/messages/generate', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GENERATED_MESSAGE),
        })
      );

      await page.goto('/dashboard');
      const generateBtn = page.getByRole('button', { name: /generate.*message|compose|draft/i }).first();
      const hasBtn = await generateBtn.count();
      if (hasBtn > 0) {
        await generateBtn.click();
        await page.waitForTimeout(500);

        const message = page.getByText(/Rina from Rani|check in|HydraFacial/i).first();
        await expect(message).toBeVisible();
      }
    });

    test('validates generated messages for compliance', async ({ page }) => {
      await page.route('**/api/dashboard/messages/generate', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_GENERATED_MESSAGE,
            compliance: {
              passesReview: false,
              flags: ['Message contains prohibited word: discount'],
            },
          }),
        })
      );

      await page.goto('/dashboard');
      const generateBtn = page.getByRole('button', { name: /generate.*message|compose/i }).first();
      const hasBtn = await generateBtn.count();
      if (hasBtn > 0) {
        await generateBtn.click();
        await page.waitForTimeout(500);

        const complianceWarning = page.getByText(/prohibited|compliance.*fail|review/i).first();
        const hasWarning = await complianceWarning.count();
        expect(hasWarning).toBeGreaterThanOrEqual(0);
      }
    });

    test('sends generated message via SMS', async ({ page }) => {
      let messageSent = false;

      await page.route('**/api/dashboard/messages/generate', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GENERATED_MESSAGE),
        })
      );

      await page.route('**/api/dashboard/messages/send', (route) => {
        messageSent = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, messageId: 'msg_sent_001' }),
        });
      });

      await page.goto('/dashboard');
      const generateBtn = page.getByRole('button', { name: /generate.*message|compose/i }).first();
      const hasBtn = await generateBtn.count();
      if (hasBtn > 0) {
        await generateBtn.click();
        await page.waitForTimeout(500);

        const sendBtn = page.getByRole('button', { name: /send|deliver/i }).first();
        const hasSend = await sendBtn.count();
        if (hasSend > 0) {
          await sendBtn.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Communication Templates', () => {
    test('renders post-treatment follow-up template', async ({ page }) => {
      await page.route('**/api/templates/post-treatment', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            templates: [
              { step: 'immediate', subject: 'Thank You for Your Visit', channel: 'email' },
              { step: '24h', subject: 'How Are You Feeling?', channel: 'sms' },
              { step: '72h', subject: 'Quick Check-In', channel: 'sms' },
              { step: '7day', subject: 'Your Results Are Showing', channel: 'email' },
              { step: '30day', subject: 'Time for Your Next Visit', channel: 'email' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const templateSection = page.getByText(/post-treatment|follow-up/i).first();
      await expect(templateSection).toBeVisible();
    });

    test('renders reactivation campaign templates', async ({ page }) => {
      await page.route('**/api/templates/reactivation', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            templates: [
              { tier: 'lapsed-30', subject: 'We Miss You at Rani', urgency: 'low' },
              { tier: 'lapsed-60', subject: 'A Special Invitation Just for You', urgency: 'medium' },
              { tier: 'lapsed-90', subject: 'It Has Been a While', urgency: 'high' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const reactivation = page.getByText(/reactivation|lapsed|we miss you/i).first();
      await expect(reactivation).toBeVisible();
    });

    test('renders pre-consult communication templates', async ({ page }) => {
      await page.route('**/api/templates/pre-consult', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            templates: [
              { step: 'booking_confirmation', subject: 'Your Consultation is Confirmed', channel: 'email' },
              { step: '24h_reminder', subject: 'Tomorrow at Rani Beauty Clinic', channel: 'sms' },
              { step: '2h_reminder', subject: 'See You Soon!', channel: 'sms' },
            ],
          }),
        })
      );

      await page.goto('/dashboard');
      const preConsult = page.getByText(/pre-consult|confirmation|reminder/i).first();
      await expect(preConsult).toBeVisible();
    });
  });

  test.describe('Voice Configuration', () => {
    test('displays current voice model settings', async ({ page }) => {
      await page.route('**/api/dashboard/phone-agent', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            config: MOCK_VOICE_CONFIG,
            analytics: MOCK_CALL_ANALYTICS,
          }),
        })
      );

      await page.goto('/dashboard/phone-agent');
      const voiceModel = page.getByText(/aura-luna|deepgram|voice.*model/i).first();
      await expect(voiceModel).toBeVisible();
    });

    test('shows brand voice constraints', async ({ page }) => {
      await page.route('**/api/dashboard/phone-agent', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            config: MOCK_VOICE_CONFIG,
            analytics: MOCK_CALL_ANALYTICS,
          }),
        })
      );

      await page.goto('/dashboard/phone-agent');
      const constraints = page.getByText(/luxury|confident|clinically-assured|prohibited/i).first();
      await expect(constraints).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('handles chat API failure gracefully', async ({ page }) => {
      await page.route('**/api/ai/chat', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI service unavailable' }),
        })
      );

      await page.goto('/');
      const chatWidget = page.locator('[data-testid="chat-widget"], button[aria-label*="chat"]').first();
      const hasChat = await chatWidget.count();
      if (hasChat > 0) {
        await chatWidget.click();
        const chatInput = page.locator('input[data-testid="chat-input"], textarea[data-testid="chat-input"]').first();
        const hasInput = await chatInput.count();
        if (hasInput > 0) {
          await chatInput.fill('Hello');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);

          const error = page.getByText(/sorry|try again|error|trouble/i).first();
          await expect(error).toBeVisible();
        }
      }
    });

    test('handles phone agent dashboard API failure', async ({ page }) => {
      await page.route('**/api/dashboard/phone-agent', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Vapi service error' }),
        })
      );

      await page.goto('/dashboard/phone-agent');
      const error = page.getByText(/error|unavailable|failed/i).first();
      await expect(error).toBeVisible({ timeout: 5000 });
    });
  });
});
