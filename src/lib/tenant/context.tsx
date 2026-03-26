/**
 * RaniOS Tenant React Context
 *
 * Provides tenant configuration (branding, features, config) to all
 * dashboard components via React Context.
 *
 * Usage:
 *   // In layout:
 *   <TenantProvider config={tenantConfig}>
 *     {children}
 *   </TenantProvider>
 *
 *   // In components:
 *   const { tenant, branding, features, isFeatureEnabled } = useTenant();
 */

'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { TenantConfig, TenantBranding, FeatureFlags, SubscriptionTier } from './config';
import { isFeatureEnabled as checkFeature, getTierForFeature, TIER_PRICING } from './config';

// ─── Context Value ──────────────────────────────────────────────────────────

export interface TenantContextValue {
  /** Full tenant config */
  tenant: TenantConfig;
  /** Shortcut to tenant.branding */
  branding: TenantBranding;
  /** Shortcut to tenant.features */
  features: FeatureFlags;
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Check if a specific feature is enabled for this tenant */
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  /** Get the minimum tier needed to access a feature (for upsell UI) */
  requiredTier: (feature: keyof FeatureFlags) => SubscriptionTier;
  /** Whether tenant is on the free trial */
  isTrial: boolean;
  /** Whether white-label is active (remove RaniOS branding) */
  isWhiteLabel: boolean;
  /** CSS custom properties derived from branding */
  cssVars: Record<string, string>;
  /** Whether onboarding is complete */
  onboardingComplete: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

interface TenantProviderProps {
  config: TenantConfig;
  children: ReactNode;
}

export function TenantProvider({ config, children }: TenantProviderProps) {
  const value = useMemo<TenantContextValue>(() => {
    const cssVars: Record<string, string> = {
      '--color-primary': config.branding.colors.primary,
      '--color-secondary': config.branding.colors.secondary,
      '--color-accent': config.branding.colors.accent,
      '--color-background': config.branding.colors.background,
      '--color-text': config.branding.colors.text,
      '--color-muted': config.branding.colors.muted,
      '--font-heading': config.branding.fonts.heading,
      '--font-body': config.branding.fonts.body,
    };

    return {
      tenant: config,
      branding: config.branding,
      features: config.features,
      tier: config.subscription.tier,
      isFeatureEnabled: (feature) => checkFeature(config, feature),
      requiredTier: (feature) => getTierForFeature(feature),
      isTrial: config.subscription.status === 'trialing',
      isWhiteLabel: config.features.whiteLabel,
      cssVars,
      onboardingComplete: config.onboardingComplete,
    };
  }, [config]);

  return (
    <TenantContext.Provider value={value}>
      <div style={value.cssVars as React.CSSProperties}>
        {children}
      </div>
    </TenantContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant() must be used inside <TenantProvider>');
  }
  return ctx;
}

/**
 * Hook to conditionally render based on feature access.
 * Returns { enabled, tier, upgradeUrl } for upsell UX.
 */
export function useFeatureGate(feature: keyof FeatureFlags): {
  enabled: boolean;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
  upgradeCta: string;
  upgradeUrl: string;
} {
  const { isFeatureEnabled, tier, requiredTier } = useTenant();
  const enabled = isFeatureEnabled(feature);
  const needed = requiredTier(feature);
  const pricing = TIER_PRICING[needed];

  return {
    enabled,
    currentTier: tier,
    requiredTier: needed,
    upgradeCta: enabled
      ? ''
      : `Upgrade to ${pricing.name} ($${pricing.monthly}/mo) to unlock this feature`,
    upgradeUrl: enabled ? '' : `/settings/billing?upgrade=${needed}`,
  };
}

// ─── Feature Gate Component ─────────────────────────────────────────────────

interface FeatureGateProps {
  feature: keyof FeatureFlags;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children if the feature is enabled.
 * Shows a fallback (or nothing) if the feature is gated.
 */
export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { enabled } = useFeatureGate(feature);
  if (enabled) return <>{children}</>;
  return fallback ? <>{fallback}</> : null;
}

// ─── Upgrade Prompt Component ───────────────────────────────────────────────

interface UpgradePromptProps {
  feature: keyof FeatureFlags;
  title?: string;
  className?: string;
}

export function UpgradePrompt({ feature, title, className }: UpgradePromptProps) {
  const { enabled, requiredTier, upgradeCta, upgradeUrl } = useFeatureGate(feature);
  const { branding } = useTenant();

  if (enabled) return null;

  const pricing = TIER_PRICING[requiredTier];

  return (
    <div
      className={`rounded-xl border p-8 text-center ${className || ''}`}
      style={{
        borderColor: branding.colors.secondary,
        backgroundColor: `${branding.colors.background}`,
      }}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold" style={{ color: branding.colors.text }}>
        {title || `${pricing.name} Feature`}
      </h3>
      <p className="mt-2 text-sm" style={{ color: branding.colors.muted }}>
        {upgradeCta}
      </p>
      <p className="mt-1 text-xs" style={{ color: branding.colors.muted }}>
        {pricing.description}
      </p>
      <a
        href={upgradeUrl}
        className="mt-4 inline-block rounded-lg px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        Upgrade to {pricing.name}
      </a>
    </div>
  );
}

// ─── Server-Side Helpers ────────────────────────────────────────────────────

/**
 * Get tenant config from request headers (set by middleware).
 * Use in server components / route handlers.
 */
export function getTenantFromHeaders(headers: Headers): string {
  return headers.get('x-tenant-id') || '';
}

export function getTenantConfigFromHeaders(headers: Headers): string {
  return headers.get('x-tenant-config') || '';
}

/**
 * Parse tenant config that was serialized into a header by middleware.
 */
export function parseTenantHeader(headerValue: string): TenantConfig | null {
  if (!headerValue) return null;
  try {
    return JSON.parse(decodeURIComponent(headerValue)) as TenantConfig;
  } catch {
    return null;
  }
}
