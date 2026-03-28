/**
 * RaniOS Onboarding Wizard - Main Page
 *
 * Redirects to the appropriate step based on the tenant's onboarding progress,
 * or starts from step 1 for new tenants.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get('ranios-onboarding-tenant')?.value;

  if (!tenantId) {
    // New tenant - start fresh at step 1
    redirect('/onboarding/1');
  }

  // Existing tenant - check progress via API
  // In production, this would fetch from the onboarding state store
  redirect('/onboarding/1');
}

export const metadata = {
  title: 'Get Started | RaniOS',
  description: 'Set up your medspa dashboard in minutes.',
};
