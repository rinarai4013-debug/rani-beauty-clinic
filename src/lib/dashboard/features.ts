import { env } from '../env';

export type DashboardFeature =
  | 'revenue'
  | 'leads'
  | 'schedule'
  | 'booking'
  | 'command-center';

const DEFAULT_ENABLED: DashboardFeature[] = [
  'revenue',
  'leads',
  'schedule',
  'booking',
];

function getEnvFeatureList(): DashboardFeature[] {
  const raw = env.NEXT_PUBLIC_DASHBOARD_FEATURES || env.DASHBOARD_FEATURES || '';
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean) as DashboardFeature[];
}

export function getEnabledFeatures(): Set<DashboardFeature> {
  const enabled = new Set<DashboardFeature>(DEFAULT_ENABLED);
  for (const feature of getEnvFeatureList()) enabled.add(feature);
  return enabled;
}

export function isFeatureEnabled(feature: DashboardFeature): boolean {
  return getEnabledFeatures().has(feature);
}

const PATH_FEATURES: Array<{ prefix: string; feature: DashboardFeature }> = [
  { prefix: '/dashboard/booking', feature: 'booking' },
  { prefix: '/dashboard/revenue', feature: 'revenue' },
  { prefix: '/dashboard/leads', feature: 'leads' },
  { prefix: '/dashboard/schedule', feature: 'schedule' },
  { prefix: '/dashboard', feature: 'command-center' },
];

export function getFeatureForPath(pathname: string): DashboardFeature | null {
  for (const entry of PATH_FEATURES) {
    if (pathname.startsWith(entry.prefix)) return entry.feature;
  }
  return null;
}

export function isPathEnabled(pathname: string): boolean {
  if (!pathname.startsWith('/dashboard')) return true;
  const feature = getFeatureForPath(pathname);
  if (!feature) return false;
  return isFeatureEnabled(feature);
}
