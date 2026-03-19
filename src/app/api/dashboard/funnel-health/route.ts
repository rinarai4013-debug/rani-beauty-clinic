import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { Tables, fetchFirst, fetchAll } from '@/lib/airtable/client';

const N8N_WEBHOOK_URLS = [
  'https://ranibeautyclinic.app.n8n.cloud/webhook/booking-sync',
  'https://ranibeautyclinic.app.n8n.cloud/webhook/post-treatment-trigger',
  'https://ranibeautyclinic.app.n8n.cloud/webhook/financing-trigger',
];

interface FunnelStep {
  step: number;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  count?: number;
  value?: number;
}

interface FunnelHealthResponse {
  steps: FunnelStep[];
  overallHealth: number;
  brokenSteps: string[];
  summary: string;
  n8nWebhooks: { url: string; reachable: boolean }[];
}

function sevenDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

export async function GET() {
  // Auth: CEO only
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'ceo') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const steps: FunnelStep[] = [];
  const since = sevenDaysAgo();

  // Step 1: Airtable Connection
  try {
    const records = await fetchFirst(Tables.clients(), 1, {}, true);
    steps.push({
      step: 1,
      name: 'Airtable Connection',
      status: records.length > 0 ? 'pass' : 'warn',
      message: records.length > 0 ? 'Connected — fetched 1 record from Clients' : 'Connected but Clients table is empty',
    });
  } catch (err) {
    steps.push({
      step: 1,
      name: 'Airtable Connection',
      status: 'fail',
      message: `Cannot connect to Airtable: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 2: Intake Processing
  try {
    const records = await fetchAll(Tables.intakes(), {
      filterByFormula: `AND({Processing Status} = "Processed", IS_AFTER({CREATED_TIME()}, '${since}'))`,
    }, true);
    const count = records.length;
    steps.push({
      step: 2,
      name: 'Intake Processing',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0 ? `${count} intakes processed in last 7 days` : 'No intakes processed in last 7 days',
      count,
    });
  } catch (err) {
    steps.push({
      step: 2,
      name: 'Intake Processing',
      status: 'fail',
      message: `Failed to query Client Intakes: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 3: AI Analysis
  try {
    const records = await fetchAll(Tables.intakeIntelligence(), {
      filterByFormula: `IS_AFTER({CREATED_TIME()}, '${since}')`,
    });
    const count = records.length;
    steps.push({
      step: 3,
      name: 'AI Analysis',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0 ? `${count} AI analyses generated in last 7 days` : 'No AI analyses in last 7 days',
      count,
    });
  } catch (err) {
    steps.push({
      step: 3,
      name: 'AI Analysis',
      status: 'fail',
      message: `Failed to query Intake Intelligence: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 4: Treatment Plans
  try {
    const recentIntakes = await fetchFirst(Tables.intakes(), 1, {
      filterByFormula: `{Intake Summary (AI)} != ""`,
      sort: [{ field: 'CREATED_TIME', direction: 'desc' }],
    }, true);
    if (recentIntakes.length > 0) {
      const fields = recentIntakes[0].fields as Record<string, unknown>;
      const hasSummary = !!fields['Intake Summary (AI)'];
      steps.push({
        step: 4,
        name: 'Treatment Plans',
        status: hasSummary ? 'pass' : 'warn',
        message: hasSummary
          ? 'Treatment plan route operational — recent intake has AI summary'
          : 'Recent intake missing AI summary',
      });
    } else {
      steps.push({
        step: 4,
        name: 'Treatment Plans',
        status: 'warn',
        message: 'No intakes with AI summaries found',
      });
    }
  } catch (err) {
    steps.push({
      step: 4,
      name: 'Treatment Plans',
      status: 'fail',
      message: `Failed to verify treatment plans: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 5: Notifications
  try {
    const records = await fetchAll(Tables.messagesLog(), {
      filterByFormula: `IS_AFTER({Date}, '${since}')`,
    });
    const sent = records.filter(r => {
      const fields = r.fields as Record<string, unknown>;
      return fields['Status'] === 'Sent' || fields['Status'] === 'Delivered';
    }).length;
    const failed = records.filter(r => {
      const fields = r.fields as Record<string, unknown>;
      return fields['Status'] === 'Failed';
    }).length;
    const total = sent + failed;
    steps.push({
      step: 5,
      name: 'Notifications',
      status: failed === 0 && sent > 0 ? 'pass' : failed > 0 ? 'warn' : 'warn',
      message: total > 0
        ? `${sent} sent, ${failed} failed in last 7 days`
        : 'No notifications in last 7 days',
      count: total,
    });
  } catch (err) {
    steps.push({
      step: 5,
      name: 'Notifications',
      status: 'fail',
      message: `Failed to query Messages Log: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 6: Booking Pipeline
  try {
    const records = await fetchAll(Tables.appointments(), {
      filterByFormula: `AND({Is Consult} = TRUE(), IS_AFTER({Date}, '${since}'))`,
    });
    const count = records.length;
    steps.push({
      step: 6,
      name: 'Booking Pipeline',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0 ? `${count} consults created in last 7 days` : 'No consults in last 7 days',
      count,
    });
  } catch (err) {
    steps.push({
      step: 6,
      name: 'Booking Pipeline',
      status: 'fail',
      message: `Failed to query Appointments: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 7: Revenue Attribution
  try {
    const records = await fetchAll(Tables.transactions(), {
      filterByFormula: `AND({Status} = "Completed", IS_AFTER({Date}, '${since}'))`,
    });
    const total = records.reduce((sum, r) => {
      const fields = r.fields as Record<string, unknown>;
      return sum + (typeof fields['Amount'] === 'number' ? fields['Amount'] : 0);
    }, 0);
    const count = records.length;
    steps.push({
      step: 7,
      name: 'Revenue Attribution',
      status: count > 0 ? 'pass' : 'warn',
      message: count > 0
        ? `$${total.toLocaleString()} from ${count} transactions in last 7 days`
        : 'No completed transactions in last 7 days',
      count,
      value: total,
    });
  } catch (err) {
    steps.push({
      step: 7,
      name: 'Revenue Attribution',
      status: 'fail',
      message: `Failed to query Transactions: ${err instanceof Error ? err.message : 'Unknown error'}`,
    });
  }

  // Step 8: n8n Workflows — check primary webhook
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const res = await fetch(n8nUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      steps.push({
        step: 8,
        name: 'n8n Workflows',
        status: res.ok || res.status === 405 ? 'pass' : 'warn',
        message: `n8n webhook responded with status ${res.status}`,
      });
    } catch (err) {
      steps.push({
        step: 8,
        name: 'n8n Workflows',
        status: 'fail',
        message: `n8n webhook unreachable: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  } else {
    steps.push({
      step: 8,
      name: 'n8n Workflows',
      status: 'fail',
      message: 'N8N_WEBHOOK_URL environment variable not set',
    });
  }

  // Non-blocking: check additional n8n webhook URLs
  const webhookResults = await Promise.allSettled(
    N8N_WEBHOOK_URLS.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        const reachable = res.ok || res.status === 405 || res.status === 200;
        console.log(`[Funnel Health] n8n webhook ${url} — status ${res.status} (${reachable ? 'reachable' : 'error'})`);
        return { url, reachable };
      } catch (err) {
        console.log(`[Funnel Health] n8n webhook ${url} — unreachable: ${err instanceof Error ? err.message : 'Unknown'}`);
        return { url, reachable: false };
      }
    })
  );

  const n8nWebhooks = webhookResults.map((r) =>
    r.status === 'fulfilled' ? r.value : { url: 'unknown', reachable: false }
  );

  // Calculate overall health
  const passCount = steps.filter(s => s.status === 'pass').length;
  const warnCount = steps.filter(s => s.status === 'warn').length;
  const totalSteps = steps.length;
  const overallHealth = Math.round(((passCount * 1 + warnCount * 0.5) / totalSteps) * 100);

  const brokenSteps = steps.filter(s => s.status === 'fail').map(s => s.name);

  // Generate summary
  let summary: string;
  if (overallHealth >= 90) {
    summary = 'All funnel steps are healthy. Conversion pipeline is fully operational.';
  } else if (overallHealth >= 60) {
    summary = `Funnel is mostly healthy. ${warnCount} step(s) need attention: ${steps.filter(s => s.status === 'warn').map(s => s.name).join(', ')}.`;
  } else {
    summary = `Funnel has issues. ${brokenSteps.length} broken step(s): ${brokenSteps.join(', ')}. Immediate attention required.`;
  }

  const result: FunnelHealthResponse = {
    steps,
    overallHealth,
    brokenSteps,
    summary,
    n8nWebhooks,
  };

  return NextResponse.json(result);
}
