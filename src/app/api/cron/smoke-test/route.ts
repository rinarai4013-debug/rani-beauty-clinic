import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { createRequire } from 'node:module';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const requireFromRoot = createRequire(process.cwd() + '/');

type SmokeRunResult = {
  ok: boolean;
  status: 'Pass' | 'Fail' | 'Partial';
  triggeredBy: string;
  timestamp: string;
  checks: Array<{
    name: string;
    ok: boolean;
    status?: 'Pass' | 'Fail' | 'Partial';
    durationMs: number;
    detail?: string;
    spec?: string;
  }>;
  durationMs: number;
};

async function runSmokeTest() {
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'live-smoke-test.js');
  const { runSmokeChecks } = requireFromRoot(scriptPath) as { runSmokeChecks: (opts?: { writeToAirtable?: boolean; triggeredBy?: string }) => Promise<SmokeRunResult> };

  const result = await runSmokeChecks({ writeToAirtable: true, triggeredBy: 'cron' });
  return result;
}

async function postSlackFailure(result: SmokeRunResult) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;

  const failedChecks = result.checks
    .filter((check) => !check.ok)
    .map((check) => `• ${check.name}: ${check.detail ?? 'failed'}`)
    .join('\n');

  const payload = {
    text: `🚨 Smoke test failed (${result.timestamp})\n` +
      `Route: /api/cron/smoke-test\n` +
      `Status: ${result.status}\n` +
      `Checks: ${failedChecks || 'unknown'}`,
  };

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[smoke-cron] Slack webhook failed:', response.status, body);
    }
  } catch (error) {
    console.error('[smoke-cron] Slack webhook request failed:', error instanceof Error ? error.message : String(error));
  }
}

export async function GET(req: NextRequest) {
  const isCronInvocation = req.headers.get('x-vercel-cron') === '1';

  if (!isCronInvocation) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSmokeTest();

    if (!result.ok) {
      await postSlackFailure(result);
    }

    return NextResponse.json(
      {
        ok: result.ok,
        status: result.status,
        checks: result.checks,
        durationMs: result.durationMs,
        triggeredBy: result.triggeredBy,
        timestamp: result.timestamp,
      },
      { status: result.ok ? 200 : 500 }
    );
  } catch (error) {
    console.error('[cron/smoke-test] run failed:', error);
    return NextResponse.json(
      {
        ok: false,
        status: 'Fail',
        checks: [
          {
            name: 'Smoke harness execution',
            ok: false,
            status: 'Fail',
            durationMs: 0,
            detail: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}
