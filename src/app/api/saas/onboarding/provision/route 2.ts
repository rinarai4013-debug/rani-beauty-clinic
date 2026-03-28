/**
 * Auto-Provisioning API
 *
 * POST - Stripe checkout webhook triggers tenant provisioning
 * GET  - Check provisioning status
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TenantProvisionSchema,
  createTenantRecord,
  createProvisioningPipeline,
  advanceProvisioningStep,
  getNextProvisioningStep,
  buildWelcomeEmailContent,
} from '@/lib/saas/auto-onboarding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TenantProvisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 1. Create tenant record
    const tenant = createTenantRecord(input);

    // 2. Start provisioning pipeline
    let pipeline = createProvisioningPipeline(tenant.id);

    // 3. Execute provisioning steps
    // In production, each step would be async with retries

    // Step: Create tenant
    pipeline = advanceProvisioningStep(pipeline, 'create_tenant', true);

    // Step: Create Airtable base (simulated)
    pipeline = advanceProvisioningStep(pipeline, 'create_airtable_base', true);

    // Step: Configure subdomain
    pipeline = advanceProvisioningStep(pipeline, 'configure_subdomain', true);

    // Step: Create admin account
    pipeline = advanceProvisioningStep(pipeline, 'create_admin_account', true);

    // Step: Load sample data
    pipeline = advanceProvisioningStep(pipeline, 'load_sample_data', true);

    // Step: Send welcome email
    const welcomeEmail = buildWelcomeEmailContent(tenant);
    // In production: send via Resend
    pipeline = advanceProvisioningStep(pipeline, 'send_welcome_email', true);

    // Step: Activate tenant
    pipeline = advanceProvisioningStep(pipeline, 'activate_tenant', true);

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        subdomain: tenant.subdomain,
        status: 'active',
        dashboardUrl: `https://${tenant.subdomain}.ranios.com`,
      },
      pipeline,
      welcomeEmail: {
        subject: welcomeEmail.subject,
        sentTo: tenant.ownerEmail,
      },
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    return NextResponse.json(
      { error: 'Provisioning failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'tenantId is required' },
      { status: 400 }
    );
  }

  // In production: fetch from database
  return NextResponse.json({
    tenantId,
    status: 'completed',
    steps: [
      { step: 'create_tenant', status: 'completed' },
      { step: 'create_airtable_base', status: 'completed' },
      { step: 'configure_subdomain', status: 'completed' },
      { step: 'create_admin_account', status: 'completed' },
      { step: 'load_sample_data', status: 'completed' },
      { step: 'send_welcome_email', status: 'completed' },
      { step: 'activate_tenant', status: 'completed' },
    ],
  });
}
