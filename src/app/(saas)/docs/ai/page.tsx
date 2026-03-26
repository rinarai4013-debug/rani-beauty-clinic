import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Endpoints - RaniOS Docs',
  description: 'Claude-powered chat, treatment recommendations, and intake analysis API reference.',
};

export default function AIDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        AI Endpoints
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">
        Claude-powered concierge chat, 3-tier treatment recommendations, and intake intelligence analysis.
      </p>
      <p className="text-sm text-[#0F1D2C]/50 mb-8">
        Required scope: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">ai:write</code> for mutations, <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">ai:read</code> for read-only
      </p>

      {/* Chat */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">POST</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/ai/chat</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Send a message to the AI concierge. Handles booking inquiries, service questions,
          concern assessment, and lead capture with SMS opt-in.
        </p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Request Body</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Required</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">message</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">User message</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">conversationId</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Continue an existing conversation</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">context.clientId</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Known client ID for personalization</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">context.currentPage</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Page URL for context-aware responses</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">context.metadata</td><td className="px-3 py-1.5">object</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Additional key-value context</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.ai.chat({
  message: 'What treatments do you recommend for fine lines?',
  context: {
    currentPage: '/services/anti-aging',
  },
});

console.log(data.message); // AI response
console.log(data.intent);  // "inquiry"
data.suggestedActions.forEach(action => {
  console.log(\`\${action.type}: \${action.label}\`);
});`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl -X POST "https://api.ranios.com/v1/ai/chat" \\
  -H "Authorization: Bearer rani_live_..." \\
  -H "X-Tenant-Id: my-clinic" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What treatments do you recommend for fine lines?",
    "context": { "currentPage": "/services/anti-aging" }
  }'`}
          </pre>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mt-4 mb-2">Response Schema</h4>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "message": "For fine lines, I'd recommend starting with...",
    "conversationId": "conv_abc123",
    "intent": "inquiry",
    "suggestedActions": [
      { "type": "book_consult", "label": "Book a Free Consultation", "url": "/get-started" },
      { "type": "view_service", "label": "Learn About Sofwave", "url": "/services/sofwave" }
    ],
    "leadCaptured": false,
    "metadata": {
      "model": "claude-3-haiku",
      "tokensUsed": 450,
      "responseTimeMs": 1200
    }
  }
}`}
        </pre>
      </section>

      {/* Recommend */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">POST</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/ai/recommend</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Generate 3-tier (Good/Better/Best) treatment plans based on client concerns, goals, and budget.
        </p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Request Body</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Required</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">concerns</td><td className="px-3 py-1.5">string[]</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Skin concerns (fine lines, acne, etc.)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">goals</td><td className="px-3 py-1.5">string[]</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Treatment goals</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">clientId</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Existing client for history-aware recs</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">budget</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">value, moderate, premium</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">age</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Client age for age-appropriate recs</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">skinType</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Fitzpatrick skin type</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">previousTreatments</td><td className="px-3 py-1.5">string[]</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Previous treatment history</td></tr>
            </tbody>
          </table>
        </div>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.ai.recommend({
  concerns: ['fine lines', 'uneven skin tone'],
  goals: ['anti-aging', 'skin brightening'],
  budget: 'moderate',
  age: 42,
});

data.plans.forEach(plan => {
  console.log(\`\${plan.tier}: \${plan.name} - $\${plan.totalPrice}\`);
  plan.services.forEach(s => console.log(\`  \${s.service} x\${s.sessions}\`));
});`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "plans": [
      {
        "tier": "good",
        "name": "Essential Renewal",
        "services": [
          { "service": "HydraFacial", "sessions": 3, "pricePerSession": 275, "totalPrice": 825, "frequency": "Monthly", "description": "Deep cleansing + hydration" },
          { "service": "VI Peel", "sessions": 2, "pricePerSession": 395, "totalPrice": 790, "frequency": "Every 6 weeks", "description": "Chemical exfoliation for tone" }
        ],
        "totalPrice": 1615,
        "timeline": "3 months",
        "benefits": ["Improved texture", "Brighter complexion"],
        "idealFor": "Starting your skincare journey"
      },
      {
        "tier": "better",
        "name": "Advanced Rejuvenation",
        "totalPrice": 3740,
        "timeline": "4 months"
      },
      {
        "tier": "best",
        "name": "Complete Transformation",
        "totalPrice": 6495,
        "timeline": "6 months"
      }
    ],
    "rationale": "Based on your concerns with fine lines and uneven tone at age 42..."
  }
}`}
        </pre>
      </section>

      {/* Intake Analysis */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">POST</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/ai/intake</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Analyze a client intake form. Returns risk flags, suggested treatment plan,
          consult talking points, and cost breakdown.
        </p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Request Body</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Required</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">clientId</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Client record ID</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.firstName</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">First name</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.lastName</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Last name</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.email</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Email address</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.phone</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Phone number</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.concerns</td><td className="px-3 py-1.5">string[]</td><td className="px-3 py-1.5">Yes</td><td className="px-3 py-1.5">Health/skin concerns</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.medicalHistory</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Medical history notes</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.goals</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Treatment goals</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">formData.budget</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">No</td><td className="px-3 py-1.5">Budget range</td></tr>
            </tbody>
          </table>
        </div>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.ai.analyzeIntake({
  clientId: 'rec_abc123',
  formData: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '+12065551234',
    concerns: ['acne scars', 'hyperpigmentation'],
    goals: 'Clear, even-toned skin',
    budget: '$1,000-2,000',
  },
});

console.log(data.summary);
data.riskFlags.forEach(f => console.warn(\`\${f.severity}: \${f.flag}\`));
console.log(\`Estimated value: $\${data.suggestedPlan.estimatedValue}\`);`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "clientId": "rec_abc123",
    "summary": "New client with acne scarring and hyperpigmentation concerns...",
    "riskFlags": [
      {
        "flag": "No medical history provided",
        "severity": "medium",
        "detail": "Medical history field was left empty",
        "recommendation": "Ask about medications during consult"
      }
    ],
    "suggestedPlan": {
      "services": ["PicoWay", "VI Peel", "HydraFacial"],
      "timeline": "4 months",
      "estimatedValue": 1840,
      "nextStep": "Book complimentary consultation"
    },
    "consultScript": {
      "opening": "Welcome Jane! I see you're interested in...",
      "keyQuestions": ["Current skincare routine?", "Sun exposure habits?"],
      "talkingPoints": ["PicoWay for scar texture", "VI Peel for pigment"],
      "closingStrategy": "Offer Good/Better/Best package options"
    },
    "costBreakdown": "PicoWay x2: $700-$1,200 | VI Peel x2: $790 | HydraFacial x1: $275"
  }
}`}
        </pre>
      </section>
    </div>
  );
}
