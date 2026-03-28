import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Error Handling - RaniOS Docs',
  description: 'Error codes, typed errors, and retry logic for the RaniOS SDK.',
};

const ERROR_CODES = [
  { code: 'authentication_error', status: 401, description: 'Invalid or expired API key', retryable: false, class: 'AuthenticationError' },
  { code: 'authorization_error', status: 403, description: 'Insufficient permissions for this operation', retryable: false, class: 'AuthorizationError' },
  { code: 'not_found', status: 404, description: 'Requested resource does not exist', retryable: false, class: 'NotFoundError' },
  { code: 'validation_error', status: 400, description: 'Invalid request parameters', retryable: false, class: 'ValidationError' },
  { code: 'rate_limit_exceeded', status: 429, description: 'Too many requests - slow down', retryable: true, class: 'RateLimitError' },
  { code: 'feature_not_available', status: 402, description: 'Feature requires a higher subscription tier', retryable: false, class: 'FeatureNotAvailableError' },
  { code: 'conflict', status: 409, description: 'Resource already exists or state conflict', retryable: false, class: 'RaniOSError' },
  { code: 'unprocessable_entity', status: 422, description: 'Request is valid but cannot be processed', retryable: false, class: 'RaniOSError' },
  { code: 'internal_error', status: 500, description: 'Server-side error', retryable: true, class: 'RaniOSError' },
  { code: 'timeout_error', status: 408, description: 'Request timed out', retryable: true, class: 'RaniOSError' },
  { code: 'network_error', status: 0, description: 'Network connectivity issue', retryable: true, class: 'RaniOSError' },
  { code: 'tenant_not_found', status: 404, description: 'Tenant ID not recognized', retryable: false, class: 'RaniOSError' },
];

export default function ErrorsDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Error Handling
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">Typed errors, error codes, and retry strategies.</p>

      {/* Error format */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Error Response Format</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          All API errors return a consistent JSON structure:
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "error": "Human-readable error message",
  "code": "authentication_error",
  "status": 401,
  "requestId": "req_abc123",
  "details": {}
}`}
        </pre>
      </section>

      {/* Error codes table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Error Codes</h2>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-xs">
            <thead className="bg-[#0F1D2C]/5">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Code</th>
                <th className="px-3 py-3 text-left font-semibold">Status</th>
                <th className="px-3 py-3 text-left font-semibold">Description</th>
                <th className="px-3 py-3 text-left font-semibold">Retryable</th>
                <th className="px-3 py-3 text-left font-semibold">SDK Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              {ERROR_CODES.map((err) => (
                <tr key={err.code}>
                  <td className="px-3 py-2 font-mono text-[#C9A96E]">{err.code}</td>
                  <td className="px-3 py-2">{err.status}</td>
                  <td className="px-3 py-2 text-[#0F1D2C]/70">{err.description}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${err.retryable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {err.retryable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{err.class}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TypeScript error handling */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Typed Error Handling</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          The SDK throws typed error classes that you can catch individually:
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import {
  RaniOSError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  FeatureNotAvailableError,
} from '@ranios/sdk';

try {
  const { data } = await ranios.clients.get('rec_abc123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 - Invalid or expired API key
    console.error('Check your API key');

  } else if (error instanceof AuthorizationError) {
    // 403 - Missing required scope
    console.error('Need clients:read scope');

  } else if (error instanceof NotFoundError) {
    // 404 - Client not found
    console.error(\`Not found: \${error.message}\`);

  } else if (error instanceof ValidationError) {
    // 400 - Invalid parameters
    console.error('Validation errors:', error.fields);
    // error.fields = { "clientId": ["must be a valid record ID"] }

  } else if (error instanceof RateLimitError) {
    // 429 - Too many requests
    console.error(\`Retry after \${error.retryAfter}s\`);
    await sleep(error.retryAfter * 1000);
    // SDK handles this automatically with retry logic

  } else if (error instanceof FeatureNotAvailableError) {
    // 402 - Tier upgrade needed
    console.error(\`Upgrade to \${error.requiredTier}\`);

  } else if (error instanceof RaniOSError) {
    // Generic SDK error
    console.error(\`[\${error.code}] \${error.message}\`);
    console.error(\`Request ID: \${error.requestId}\`);
    console.error(\`Retryable: \${error.retryable}\`);
  }
}`}
        </pre>
      </section>

      {/* Automatic retry */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Automatic Retry</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          The SDK automatically retries on transient errors (5xx, timeouts, network errors)
          with exponential backoff and jitter:
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-3">
{`const ranios = new RaniOSClient({
  apiKey: '...',
  tenantId: '...',
  maxRetries: 3,    // Default: 3 retries
  timeout: 30000,   // Default: 30s timeout
  debug: true,      // Log retry attempts
});`}
        </pre>
        <div className="overflow-x-auto rounded border border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Attempt</th><th className="px-3 py-2 text-left">Delay</th><th className="px-3 py-2 text-left">Max Wait</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5">1st retry</td><td className="px-3 py-1.5">1s + random jitter (0-500ms)</td><td className="px-3 py-1.5">1.5s</td></tr>
              <tr><td className="px-3 py-1.5">2nd retry</td><td className="px-3 py-1.5">2s + random jitter (0-500ms)</td><td className="px-3 py-1.5">2.5s</td></tr>
              <tr><td className="px-3 py-1.5">3rd retry</td><td className="px-3 py-1.5">4s + random jitter (0-500ms)</td><td className="px-3 py-1.5">4.5s</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Disable retry */}
      <section className="rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-3">Disabling Retry</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          For time-sensitive operations, disable retry per-request:
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`// Using the low-level request method
const response = await ranios.request('/clients', {
  noRetry: true,
});`}
        </pre>
      </section>
    </div>
  );
}
