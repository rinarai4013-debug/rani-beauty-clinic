import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webhooks - RaniOS Docs',
  description: 'Set up real-time event notifications with RaniOS webhooks.',
};

export default function WebhooksDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Webhooks
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">Receive real-time notifications when events occur in your clinic.</p>
      <p className="text-sm text-[#0F1D2C]/50 mb-8">
        Required scope: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">webhooks:manage</code>
      </p>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">How Webhooks Work</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3 leading-relaxed">
          RaniOS sends HTTP POST requests to your configured endpoints when events happen.
          Each webhook delivery includes a signature header for verification.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[#0F1D2C]/70">
          <li>Register a webhook URL and select event types</li>
          <li>RaniOS sends POST requests with event payloads</li>
          <li>Verify the signature and process the event</li>
          <li>Return a 2xx status to acknowledge receipt</li>
        </ol>
      </section>

      {/* Events */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Available Events</h2>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-xs">
            <thead className="bg-[#0F1D2C]/5"><tr><th className="px-4 py-3 text-left font-semibold">Event</th><th className="px-4 py-3 text-left font-semibold">Description</th></tr></thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">appointment.created</td><td className="px-4 py-2.5">New appointment booked</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">appointment.updated</td><td className="px-4 py-2.5">Appointment rescheduled or modified</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">appointment.completed</td><td className="px-4 py-2.5">Appointment marked as completed</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">appointment.cancelled</td><td className="px-4 py-2.5">Appointment cancelled</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">appointment.no_show</td><td className="px-4 py-2.5">Client marked as no-show</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">client.created</td><td className="px-4 py-2.5">New client record created</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">client.updated</td><td className="px-4 py-2.5">Client record updated</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">client.churn_risk</td><td className="px-4 py-2.5">Client churn risk crossed a threshold</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">transaction.created</td><td className="px-4 py-2.5">New payment processed</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">membership.created</td><td className="px-4 py-2.5">New membership activated</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">membership.cancelled</td><td className="px-4 py-2.5">Membership cancelled</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">review.received</td><td className="px-4 py-2.5">New review posted</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">alert.triggered</td><td className="px-4 py-2.5">System alert triggered</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">revenue.anomaly</td><td className="px-4 py-2.5">Revenue anomaly detected</td></tr>
              <tr><td className="px-4 py-2.5 font-mono text-[#C9A96E]">inventory.low_stock</td><td className="px-4 py-2.5">Inventory below reorder point</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Registering */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Register a Webhook</h2>
        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`// Register via the dashboard API
const response = await fetch('/api/sdk/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer rani_live_...',
    'X-Tenant-Id': 'my-clinic',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://your-server.com/webhooks/ranios',
    events: [
      'appointment.created',
      'appointment.completed',
      'client.churn_risk',
      'revenue.anomaly',
    ],
    secret: 'whsec_your_webhook_secret',
  }),
});`}
          </pre>
        </div>
      </section>

      {/* Payload format */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Webhook Payload</h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "id": "evt_abc123",
  "type": "appointment.completed",
  "tenantId": "my-clinic",
  "timestamp": "2026-03-25T15:30:00.000Z",
  "data": {
    "id": "apt_xyz789",
    "clientId": "rec_abc123",
    "clientName": "Jane Doe",
    "service": "Sofwave",
    "provider": "Dr. Mom",
    "revenue": 2750,
    "date": "2026-03-25",
    "time": "2:00 PM"
  }
}`}
        </pre>
      </section>

      {/* Verification */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Signature Verification</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          Every webhook includes a <code className="rounded bg-gray-100 px-1 text-xs font-mono">X-RaniOS-Signature</code> header.
          Verify it using HMAC-SHA256 with your webhook secret.
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const timestamp = signature.split(',')[0]?.split('=')[1];
  const sig = signature.split(',')[1]?.split('=')[1];

  const signedPayload = \`\${timestamp}.\${payload}\`;
  const expected = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return sig === expected;
}

// In your webhook handler (Express example):
app.post('/webhooks/ranios', (req, res) => {
  const signature = req.headers['x-ranios-signature'] as string;
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RANIOS_WEBHOOK_SECRET!,
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process the event
  const { type, data } = req.body;
  switch (type) {
    case 'appointment.completed':
      // Trigger post-treatment follow-up
      break;
    case 'client.churn_risk':
      // Alert team about at-risk client
      break;
  }

  res.status(200).json({ received: true });
});`}
        </pre>
      </section>

      {/* Retry policy */}
      <section className="rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-3">Retry Policy</h2>
        <ul className="space-y-2 text-sm text-[#0F1D2C]/70">
          <li>Webhooks that fail (non-2xx response or timeout) are retried up to <strong>5 times</strong></li>
          <li>Retry intervals: 1 min, 5 min, 30 min, 2 hours, 24 hours</li>
          <li>After 5 failures, the webhook is disabled and you are notified via email</li>
          <li>Webhook requests timeout after <strong>30 seconds</strong></li>
          <li>Your endpoint must respond within the timeout to avoid retries</li>
        </ul>
      </section>
    </div>
  );
}
