/**
 * RaniOS Onboarding API
 *
 * Manages onboarding progress for new tenants.
 *
 * GET  /api/tenant/onboarding - Get current onboarding progress
 * POST /api/tenant/onboarding - Submit step data or perform actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  getOnboardingProgress,
  updateOnboardingStep,
  processBusinessInfo,
  processAirtableConnection,
  processServicesImport,
  processTeamSetup,
  processSubscription,
  processGoLive,
  createNewTenant,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
} from '@/lib/tenant/onboarding';

const ONBOARDING_COOKIE = 'ranios-onboarding-tenant';

// ─── GET: Onboarding Progress ───────────────────────────────────────────────

export async function GET() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get(ONBOARDING_COOKIE)?.value;

  if (!tenantId) {
    return NextResponse.json({
      tenantId: null,
      currentStep: 1,
      completedSteps: [],
      stepData: {},
    });
  }

  const progress = getOnboardingProgress(tenantId);
  if (!progress) {
    return NextResponse.json({
      tenantId,
      currentStep: 1,
      completedSteps: [],
      stepData: {},
    });
  }

  return NextResponse.json(progress);
}

// ─── POST: Submit Step or Action ────────────────────────────────────────────

// @ts-ignore - schema validation done manually
const onboardingPostSchema = z.union([
  // Step submission
  z.object({
    action: z.undefined().optional(),
    step: z.number().min(1).max(7),
    data: z.record(z.unknown()),
  }),
  // Airtable connection test
  z.object({
    action: z.literal('test-airtable'),
    data: z.object({
      pat: z.string(),
      baseId: z.string(),
    }),
  }),
  // Initialize new tenant
  z.object({
    action: z.literal('init'),
    ownerEmail: z.string().email(),
    ownerName: z.string().min(1),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle action-based requests
    if (body.action === 'test-airtable') {
      const result = await processAirtableConnection(body.data);
      return NextResponse.json(result);
    }

    if (body.action === 'init') {
      const tenant = await createNewTenant({
        ownerEmail: body.ownerEmail,
        ownerName: body.ownerName,
      });

      // Set onboarding cookie
      const response = NextResponse.json({
        tenantId: tenant.id,
        currentStep: 1,
      });

      response.cookies.set(ONBOARDING_COOKIE, tenant.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 86400, // 7 days
        path: '/',
      });

      return response;
    }

    // Handle step submission
    const { step, data } = body;
    if (!step || !data) {
      return NextResponse.json(
        { error: 'Missing step or data' },
        { status: 400 }
      );
    }

    // Get or create tenant
    const cookieStore = await cookies();
    let tenantId = cookieStore.get(ONBOARDING_COOKIE)?.value;

    if (!tenantId) {
      // Auto-create tenant if no cookie (first step)
      const tenant = await createNewTenant({
        ownerEmail: (data as Record<string, string>).email || 'onboarding@ranios.com',
        ownerName: (data as Record<string, string>).name || 'New Clinic',
      });
      tenantId = tenant.id;
    }

    // Process step-specific validation
    let result: { valid: boolean; errors?: string[]; [key: string]: unknown } = { valid: true };

    switch (step) {
      case 1: {
        const parsed = step1Schema.safeParse(data);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.issues },
            { status: 400 }
          );
        }
        result = await processBusinessInfo(parsed.data);
        break;
      }

      case 2: {
        const parsed = step2Schema.safeParse(data);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.issues },
            { status: 400 }
          );
        }
        result = await processAirtableConnection(parsed.data);
        break;
      }

      case 3: {
        const parsed = step3Schema.safeParse(data);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.issues },
            { status: 400 }
          );
        }
        result = { valid: true };
        break;
      }

      case 4: {
        if (!(data as Record<string, boolean>).skipped) {
          const parsed = step4Schema.safeParse(data);
          if (!parsed.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: parsed.error.issues },
              { status: 400 }
            );
          }
          result = await processServicesImport(parsed.data);
        }
        break;
      }

      case 5: {
        if (!(data as Record<string, boolean>).skipped) {
          const parsed = step5Schema.safeParse(data);
          if (!parsed.success) {
            return NextResponse.json(
              { error: 'Validation failed', details: parsed.error.issues },
              { status: 400 }
            );
          }
          result = processTeamSetup(parsed.data);
        }
        break;
      }

      case 6: {
        const parsed = step6Schema.safeParse(data);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Validation failed', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const progress = getOnboardingProgress(tenantId);
        const businessInfo = progress?.stepData[1] as { email?: string; name?: string } | undefined;

        result = await processSubscription(
          tenantId,
          businessInfo?.email || 'owner@clinic.com',
          businessInfo?.name || 'New Clinic',
          parsed.data
        );
        break;
      }

      case 7: {
        const progress = getOnboardingProgress(tenantId);
        const goLiveResult = await processGoLive(tenantId, progress?.stepData || {});

        if (!goLiveResult.success) {
          return NextResponse.json(
            { error: 'Go-live failed', details: goLiveResult.errors },
            { status: 400 }
          );
        }

        // Clear onboarding cookie
        const response = NextResponse.json({
          success: true,
          dashboardUrl: goLiveResult.dashboardUrl,
        });

        response.cookies.delete(ONBOARDING_COOKIE);
        return response;
      }
    }

    if (!result.valid && result.errors) {
      return NextResponse.json(
        { error: result.errors.join('; '), details: result.errors },
        { status: 400 }
      );
    }

    // Save progress
    const progress = updateOnboardingStep(tenantId, step, data as Record<string, unknown>);

    // Set cookie if not already set
    const response = NextResponse.json({
      success: true,
      step,
      nextStep: step < 7 ? step + 1 : null,
      progress: {
        currentStep: progress.currentStep,
        completedSteps: progress.completedSteps,
      },
      ...result,
    });

    if (!cookieStore.get(ONBOARDING_COOKIE)) {
      response.cookies.set(ONBOARDING_COOKIE, tenantId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 86400,
        path: '/',
      });
    }

    return response;
  } catch (err) {
    console.error('[API:Onboarding] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
