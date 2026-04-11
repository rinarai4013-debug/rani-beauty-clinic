import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import { getMangomintHealth } from '@/lib/dashboard/mangomint-intelligence';
import { getMangomintMappingSummary } from '@/lib/mangomint/mapping';

function round(value: number): number {
  return Math.round(value);
}

function buildReadinessSummary(
  health: Awaited<ReturnType<typeof getMangomintHealth>>,
  mapping: Awaited<ReturnType<typeof getMangomintMappingSummary>>,
) {
  const serviceCoverage = mapping.services.coverage;
  const providerCoverage = mapping.providers.coverage;
  const mappingCoverage = round((serviceCoverage + providerCoverage) / 2);

  const blockers: string[] = [];
  const strengths: string[] = [];
  const nextMoves: string[] = [];

  if (health.lastSyncStatus !== 'healthy') {
    blockers.push('Mangomint sync health is not fully healthy yet.');
    nextMoves.push('Stabilize API/webhook health before trusting schedule intelligence for ad-scale demand.');
  } else {
    strengths.push('Mangomint sync health is currently healthy.');
  }

  if (serviceCoverage < 100) {
    blockers.push(`${mapping.services.unresolved} service mapping(s) are still unresolved.`);
    nextMoves.push('Resolve the remaining service mappings before turning on direct appointment write-back.');
  } else {
    strengths.push('All tracked internal services are mapped to Mangomint services.');
  }

  if (providerCoverage < 100) {
    blockers.push(`${mapping.providers.unresolved} provider mapping(s) still need confirmed staff linkage.`);
    nextMoves.push('Confirm unresolved provider-to-staff mappings from live Mangomint payloads.');
  } else {
    strengths.push('Provider coverage is fully linked or confidently inferred.');
  }

  if (!health.webhookConfigured) {
    blockers.push('Mangomint webhook secret/config is not fully wired.');
    nextMoves.push('Reconfirm Mangomint webhook registration and signature configuration.');
  } else {
    strengths.push('Webhook authentication is configured.');
  }

  nextMoves.push('Re-test one real booking and confirm the appointment links back with MangoMint Appointment ID.');
  nextMoves.push('Keep hosted Mangomint booking as source of truth until outbound create/cancel/reschedule is proven live.');

  const mode =
    health.lastSyncStatus === 'healthy' && serviceCoverage === 100 && providerCoverage === 100
      ? 'operator-ready'
      : health.lastSyncStatus === 'offline'
        ? 'degraded'
        : 'stabilizing';

  return {
    mode,
    mappingCoverage,
    strengths,
    blockers,
    nextMoves,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(session.role, 'view_settings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [health, mapping] = await Promise.all([
    getMangomintHealth(),
    getMangomintMappingSummary(),
  ]);

  const readiness = buildReadinessSummary(health, mapping);

  return NextResponse.json({
    integration: 'mangomint',
    ...health,
    mapping,
    readiness,
    recommendation:
      health.lastSyncStatus === 'healthy'
        ? 'Mangomint is healthy. Focus next on no-show prevention, rebooking, provider fill pressure, and closing the last write-back gaps.'
        : 'Fix API/webhook health before relying on dashboard schedule intelligence.',
  });
}
