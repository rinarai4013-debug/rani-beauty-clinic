// Jotform API client for live consent form data
const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY;
const BASE_URL = 'https://api.jotform.com';

// Rani Beauty Clinic Jotform IDs
export const JOTFORM_FORMS = {
  LHR_CONSENT: '222995765731166',
  INJECTABLES_CONSENT: '230359117132145',
  MICRONEEDLING_CONSENT: '230285665734159',
  FACIAL_CONSENT: '230236173920146',
  LYMPHATIC_CONSENT: '240907756849169',
} as const;

export interface JotformSubmission {
  id: string;
  form_id: string;
  created_at: string;
  status: string;
  answers: Record<
    string,
    {
      name: string;
      answer: string | Record<string, string>;
      type: string;
    }
  >;
}

export interface ParsedClient {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  formName: string;
  submittedAt: string;
  submissionId: string;
}

async function jotformFetch<T>(endpoint: string): Promise<T> {
  if (!JOTFORM_API_KEY) {
    throw new Error('JOTFORM_API_KEY not configured');
  }

  const url = `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}apiKey=${JOTFORM_API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // Cache 5 min

  if (!res.ok) {
    throw new Error(`Jotform API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.responseCode !== 200) {
    throw new Error(`Jotform API error: ${data.message}`);
  }

  return data.content as T;
}

export async function getFormSubmissions(
  formId: string,
  options?: {
    limit?: number;
    offset?: number;
    filter?: Record<string, string>;
    orderBy?: string;
  }
): Promise<JotformSubmission[]> {
  let endpoint = `/form/${formId}/submissions?limit=${options?.limit || 100}&offset=${options?.offset || 0}`;

  if (options?.filter) {
    endpoint += `&filter=${encodeURIComponent(JSON.stringify(options.filter))}`;
  }
  if (options?.orderBy) {
    endpoint += `&orderby=${encodeURIComponent(options.orderBy)}`;
  }

  return jotformFetch<JotformSubmission[]>(endpoint);
}

export async function get2026Submissions(formId: string): Promise<JotformSubmission[]> {
  return getFormSubmissions(formId, {
    limit: 1000,
    filter: { 'created_at:gt': '2026-01-01' },
    orderBy: 'created_at',
  });
}

export async function getAllForms(): Promise<
  Array<{ id: string; title: string; count: string; status: string; last_submission: string }>
> {
  return jotformFetch('/user/forms?limit=20');
}

export function parseSubmission(sub: JotformSubmission, formName: string): ParsedClient {
  const answers = sub.answers || {};
  let firstName = '';
  let lastName = '';
  let email = '';
  let phone = '';

  for (const [, val] of Object.entries(answers)) {
    const fieldName = (val.name || '').toLowerCase();

    // Extract name
    if (fieldName.includes('name') && !fieldName.includes('phone')) {
      if (typeof val.answer === 'object' && val.answer !== null) {
        firstName = (val.answer as Record<string, string>).first || '';
        lastName = (val.answer as Record<string, string>).last || '';
      } else if (typeof val.answer === 'string') {
        const parts = val.answer.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }
    }

    // Extract email
    if (fieldName.includes('email') && typeof val.answer === 'string') {
      email = val.answer;
    }

    // Extract phone
    if (fieldName.includes('phone')) {
      if (typeof val.answer === 'object' && val.answer !== null) {
        const area = (val.answer as Record<string, string>).area || '';
        const ph = (val.answer as Record<string, string>).phone || '';
        phone = area ? `(${area}) ${ph}` : JSON.stringify(val.answer);
      } else if (typeof val.answer === 'string') {
        phone = val.answer;
      }
    }
  }

  return {
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    email,
    phone,
    formName,
    submittedAt: sub.created_at,
    submissionId: sub.id,
  };
}

export function isConfigured(): boolean {
  return !!JOTFORM_API_KEY;
}
