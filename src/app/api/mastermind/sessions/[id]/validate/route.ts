/**
 * POST /api/mastermind/sessions/[id]/validate
 *
 * Validates the current plan in a session against the constraint pipeline.
 * Returns warnings without blocking — same pipeline used in plan generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getSessionByIdAsyncRetry } from '@/lib/mastermind/session';
import { validatePlan } from '@/lib/plan-builder/constraints';
import { PHASE_LABELS, type PlanPhase, type SelectedService } from '@/lib/plan-builder/types';
import type { ServiceCategory } from '@/data/services/unified-catalog';
import { forbidden, unauthorized } from '@/lib/auth/middleware';

import { withSentry } from '@/lib/sentry-utils';
import { logEvent } from '@/lib/logging/structured-logger';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withSentry('mastermind/sessions/[id]/validate', async () => {
    try {
      const authSession = await getSessionFromRequest(_request).catch(() => null);
      if (!authSession) {
        return unauthorized();
      }
      if (authSession.role !== 'ceo' && authSession.role !== 'provider') {
        return forbidden();
      }

      const { id } = await params;
      const session = await getSessionByIdAsyncRetry(id);

      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
      }

      if (!session.mastermindPlan) {
        return NextResponse.json({
          success: true,
          data: { warnings: [], message: 'No plan to validate' },
        });
      }

      // Reconstruct PlanPhases from MastermindPlan for the validator
      const plan = session.mastermindPlan;
      const allTreatments = [
        ...(plan.recommendations?.primary || []),
        ...(plan.recommendations?.complementary || []),
        ...(plan.recommendations?.maintenance || []),
      ];

      const phases: [PlanPhase, PlanPhase, PlanPhase] = [
        { id: 1, ...PHASE_LABELS[1], services: [] },
        { id: 2, ...PHASE_LABELS[2], services: [] },
        { id: 3, ...PHASE_LABELS[3], services: [] },
      ];

      allTreatments.forEach((tx) => {
        // Map urgency to phase
        const phase = tx.urgency === 'immediate' ? 1 : tx.urgency === 'within-3-months' ? 2 : 3;
        const serviceCategory =
          typeof tx.category === 'string' ? (tx.category as ServiceCategory) : 'consultation';
        const selected: SelectedService = {
          id: String(tx.id),
          serviceId: String(tx.id),
          service: {
            id: String(tx.id),
            name: tx.treatmentName,
            category: serviceCategory,
            description: tx.aiReasoning,
            price: Number(tx.perSession) || 0,
            sessions: Number(tx.sessionsRequired) || 1,
            downtime: tx.downtime,
            results: tx.timeToResults,
            parentSlug: undefined,
            financingEligible: true,
            concerns: [],
            bodyAreas: [],
            duration: 0,
          },
          quantity: Number(tx.sessionsRequired) || 1,
          notes: tx.clinicalRationale,
          phase: phase as 1 | 2 | 3,
        };
        phases[phase - 1].services.push(selected);
      });

      const warnings = validatePlan(phases);

      // Single pass to count by severity instead of 3 separate filter calls
      let errorCount = 0;
      let warningCount = 0;
      let infoCount = 0;
      for (const w of warnings) {
        if (w.severity === 'error') errorCount++;
        else if (w.severity === 'warning') warningCount++;
        else if (w.severity === 'info') infoCount++;
      }

      return NextResponse.json({
        success: true,
        data: {
          warnings,
          isValid: errorCount === 0,
          errorCount,
          warningCount,
          infoCount,
        },
      });
    } catch (error) {
      logEvent('api', 'error', '[Mastermind Validate] Error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Validation failed' }, { status: 500 });
    }
  });
}
