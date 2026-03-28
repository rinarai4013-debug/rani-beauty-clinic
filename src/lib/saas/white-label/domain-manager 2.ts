// =============================================================================
// RaniOS Custom Domain Manager
// Subdomain provisioning, DNS verification, SSL tracking, domain routing
// =============================================================================

import type {
  DomainConfig,
  DomainStatus,
  SslStatus,
  DnsRecord,
  DnsRecordType,
  VanityUrl,
  DomainHealthCheck,
  DomainRouting,
  RedirectRule,
  CorsConfig,
} from './types';

// =============================================================================
// Constants
// =============================================================================

const RANIOS_BASE_DOMAIN = 'ranios.com';
const RANIOS_IP_V4 = '76.76.21.21'; // Vercel IP
const RANIOS_IP_V6 = '2606:4700:3033::6815:1551';
const SSL_RENEWAL_THRESHOLD_DAYS = 30;
const HEALTH_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/;

const RESERVED_SUBDOMAINS = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'docs', 'help', 'support',
  'status', 'blog', 'mail', 'smtp', 'ftp', 'cdn', 'assets', 'static',
  'staging', 'dev', 'test', 'demo', 'sandbox', 'preview',
  'login', 'auth', 'sso', 'oauth', 'webhook', 'webhooks',
  'billing', 'pay', 'checkout', 'store', 'shop',
  'ns1', 'ns2', 'ns3', 'ns4',
]);

// =============================================================================
// Subdomain Provisioning
// =============================================================================

export function validateSubdomain(subdomain: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lower = subdomain.toLowerCase().trim();

  if (lower.length < 3) {
    errors.push('Subdomain must be at least 3 characters');
  }
  if (lower.length > 63) {
    errors.push('Subdomain cannot exceed 63 characters');
  }
  if (!SUBDOMAIN_REGEX.test(lower)) {
    errors.push('Subdomain can only contain lowercase letters, numbers, and hyphens (no leading/trailing hyphens)');
  }
  if (RESERVED_SUBDOMAINS.has(lower)) {
    errors.push(`"${lower}" is a reserved subdomain and cannot be used`);
  }

  return { valid: errors.length === 0, errors };
}

export function generateSubdomainUrl(subdomain: string): string {
  return `https://${subdomain}.${RANIOS_BASE_DOMAIN}`;
}

export function provisionSubdomain(tenantId: string, subdomain: string): DomainConfig {
  const validation = validateSubdomain(subdomain);
  if (!validation.valid) {
    throw new Error(`Invalid subdomain: ${validation.errors.join(', ')}`);
  }

  const now = new Date().toISOString();

  return {
    id: `domain-${tenantId}`,
    tenantId,
    subdomain: subdomain.toLowerCase().trim(),
    customDomain: null,
    status: 'active',
    sslStatus: 'active',
    sslExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    dnsRecords: [
      {
        type: 'CNAME',
        name: `${subdomain}.${RANIOS_BASE_DOMAIN}`,
        value: `cname.vercel-dns.com`,
        ttl: 3600,
        verified: true,
      },
    ],
    vanityUrls: [],
    healthCheck: {
      lastChecked: now,
      httpStatus: 200,
      sslValid: true,
      dnsResolved: true,
      responseTimeMs: 45,
      issues: [],
    },
    routingConfig: createDefaultRouting(),
    createdAt: now,
    updatedAt: now,
  };
}

// =============================================================================
// Custom Domain DNS Verification
// =============================================================================

export function generateDnsRecordsForCustomDomain(customDomain: string): DnsRecord[] {
  return [
    {
      type: 'CNAME',
      name: customDomain,
      value: 'cname.vercel-dns.com',
      ttl: 3600,
      verified: false,
    },
    {
      type: 'TXT',
      name: `_vercel.${customDomain}`,
      value: `vc-domain-verify=${customDomain}-${generateVerificationToken()}`,
      ttl: 3600,
      verified: false,
    },
  ];
}

export function generateDnsRecordsForApexDomain(apexDomain: string): DnsRecord[] {
  return [
    {
      type: 'A',
      name: apexDomain,
      value: RANIOS_IP_V4,
      ttl: 3600,
      verified: false,
    },
    {
      type: 'AAAA',
      name: apexDomain,
      value: RANIOS_IP_V6,
      ttl: 3600,
      verified: false,
    },
    {
      type: 'TXT',
      name: `_vercel.${apexDomain}`,
      value: `vc-domain-verify=${apexDomain}-${generateVerificationToken()}`,
      ttl: 3600,
      verified: false,
    },
  ];
}

function generateVerificationToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 20; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function validateCustomDomain(domain: string): {
  valid: boolean;
  errors: string[];
  isApex: boolean;
} {
  const errors: string[] = [];
  const lower = domain.toLowerCase().trim();

  if (!DOMAIN_REGEX.test(lower)) {
    errors.push('Invalid domain format. Example: clinic.example.com');
  }

  if (lower.endsWith(`.${RANIOS_BASE_DOMAIN}`)) {
    errors.push(`Custom domain cannot use the ${RANIOS_BASE_DOMAIN} base domain`);
  }

  const parts = lower.split('.');
  const isApex = parts.length === 2;

  if (lower.length > 253) {
    errors.push('Domain name cannot exceed 253 characters');
  }

  return { valid: errors.length === 0, errors, isApex };
}

export function initiateDomainVerification(
  domainConfig: DomainConfig,
  customDomain: string
): DomainConfig {
  const validation = validateCustomDomain(customDomain);
  if (!validation.valid) {
    throw new Error(`Invalid domain: ${validation.errors.join(', ')}`);
  }

  const dnsRecords = validation.isApex
    ? generateDnsRecordsForApexDomain(customDomain)
    : generateDnsRecordsForCustomDomain(customDomain);

  return {
    ...domainConfig,
    customDomain,
    status: 'pending_verification',
    sslStatus: 'pending',
    dnsRecords: [...domainConfig.dnsRecords, ...dnsRecords],
    updatedAt: new Date().toISOString(),
  };
}

export async function checkDnsVerification(
  domainConfig: DomainConfig
): Promise<{
  allVerified: boolean;
  records: DnsRecord[];
  issues: string[];
}> {
  const issues: string[] = [];
  const updatedRecords = domainConfig.dnsRecords.map((record) => {
    // In production, this would perform actual DNS lookups
    // For now, return the record with verification status
    if (!record.verified) {
      issues.push(`${record.type} record for ${record.name} not yet verified. Expected value: ${record.value}`);
    }
    return record;
  });

  const allVerified = updatedRecords
    .filter((r) => r.name.includes(domainConfig.customDomain || ''))
    .every((r) => r.verified);

  return { allVerified, records: updatedRecords, issues };
}

export function getDnsInstructions(records: DnsRecord[]): string[] {
  return records.map((record) => {
    switch (record.type) {
      case 'CNAME':
        return `Add a CNAME record:\n  Name: ${record.name}\n  Value: ${record.value}\n  TTL: ${record.ttl}`;
      case 'A':
        return `Add an A record:\n  Name: ${record.name}\n  Value: ${record.value}\n  TTL: ${record.ttl}`;
      case 'AAAA':
        return `Add an AAAA record:\n  Name: ${record.name}\n  Value: ${record.value}\n  TTL: ${record.ttl}`;
      case 'TXT':
        return `Add a TXT record:\n  Name: ${record.name}\n  Value: ${record.value}\n  TTL: ${record.ttl}`;
      case 'MX':
        return `Add an MX record:\n  Name: ${record.name}\n  Value: ${record.value}\n  Priority: ${record.priority || 10}\n  TTL: ${record.ttl}`;
      default:
        return `Add a ${record.type} record for ${record.name} with value ${record.value}`;
    }
  });
}

// =============================================================================
// SSL Certificate Tracking
// =============================================================================

export function checkSslStatus(domainConfig: DomainConfig): {
  status: SslStatus;
  daysUntilExpiry: number | null;
  needsRenewal: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!domainConfig.sslExpiresAt) {
    return { status: 'pending', daysUntilExpiry: null, needsRenewal: false, issues: ['SSL certificate not provisioned'] };
  }

  const expiryDate = new Date(domainConfig.sslExpiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 0) {
    issues.push('SSL certificate has expired');
    return { status: 'expired', daysUntilExpiry: 0, needsRenewal: true, issues };
  }

  if (daysUntilExpiry <= SSL_RENEWAL_THRESHOLD_DAYS) {
    issues.push(`SSL certificate expires in ${daysUntilExpiry} days`);
    return { status: 'renewal_pending', daysUntilExpiry, needsRenewal: true, issues };
  }

  return { status: 'active', daysUntilExpiry, needsRenewal: false, issues };
}

export function initiateSslProvisioning(domainConfig: DomainConfig): DomainConfig {
  if (domainConfig.status !== 'verified' && domainConfig.status !== 'active') {
    throw new Error('Domain must be verified before SSL provisioning');
  }

  return {
    ...domainConfig,
    sslStatus: 'provisioning',
    updatedAt: new Date().toISOString(),
  };
}

export function completeSslProvisioning(domainConfig: DomainConfig): DomainConfig {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // Let's Encrypt 90-day certs

  return {
    ...domainConfig,
    sslStatus: 'active',
    sslExpiresAt: expiresAt.toISOString(),
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Domain Routing Configuration
// =============================================================================

function createDefaultRouting(): DomainRouting {
  return {
    defaultPath: '/dashboard',
    redirectRules: [],
    customHeaders: {
      'X-Powered-By': 'RaniOS',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    cors: {
      allowedOrigins: [],
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      maxAge: 86400,
    },
  };
}

export function addRedirectRule(
  domainConfig: DomainConfig,
  rule: Omit<RedirectRule, 'isActive'>
): DomainConfig {
  const newRule: RedirectRule = { ...rule, isActive: true };

  // Validate no circular redirects
  const existing = domainConfig.routingConfig.redirectRules;
  const circular = existing.find((r) => r.to === newRule.from && r.from === newRule.to);
  if (circular) {
    throw new Error(`Circular redirect detected: ${newRule.from} -> ${newRule.to}`);
  }

  return {
    ...domainConfig,
    routingConfig: {
      ...domainConfig.routingConfig,
      redirectRules: [...existing, newRule],
    },
    updatedAt: new Date().toISOString(),
  };
}

export function removeRedirectRule(
  domainConfig: DomainConfig,
  from: string
): DomainConfig {
  return {
    ...domainConfig,
    routingConfig: {
      ...domainConfig.routingConfig,
      redirectRules: domainConfig.routingConfig.redirectRules.filter((r) => r.from !== from),
    },
    updatedAt: new Date().toISOString(),
  };
}

export function updateCorsConfig(
  domainConfig: DomainConfig,
  cors: Partial<CorsConfig>
): DomainConfig {
  return {
    ...domainConfig,
    routingConfig: {
      ...domainConfig.routingConfig,
      cors: { ...domainConfig.routingConfig.cors, ...cors },
    },
    updatedAt: new Date().toISOString(),
  };
}

// =============================================================================
// Vanity URL Management
// =============================================================================

export function createVanityUrl(
  domainConfig: DomainConfig,
  slug: string,
  targetPath: string
): DomainConfig {
  const slugLower = slug.toLowerCase().trim();

  if (!/^[a-z0-9-]+$/.test(slugLower)) {
    throw new Error('Vanity URL slug can only contain lowercase letters, numbers, and hyphens');
  }

  if (slugLower.length < 2 || slugLower.length > 64) {
    throw new Error('Vanity URL slug must be between 2 and 64 characters');
  }

  const existing = domainConfig.vanityUrls.find((v) => v.slug === slugLower);
  if (existing) {
    throw new Error(`Vanity URL "/${slugLower}" already exists`);
  }

  const reservedPaths = ['api', 'admin', 'dashboard', 'auth', 'login', 'signup'];
  if (reservedPaths.includes(slugLower)) {
    throw new Error(`"/${slugLower}" is a reserved path`);
  }

  const vanityUrl: VanityUrl = {
    id: `vanity-${Date.now()}`,
    slug: slugLower,
    targetPath,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  return {
    ...domainConfig,
    vanityUrls: [...domainConfig.vanityUrls, vanityUrl],
    updatedAt: new Date().toISOString(),
  };
}

export function removeVanityUrl(domainConfig: DomainConfig, slug: string): DomainConfig {
  return {
    ...domainConfig,
    vanityUrls: domainConfig.vanityUrls.filter((v) => v.slug !== slug),
    updatedAt: new Date().toISOString(),
  };
}

export function toggleVanityUrl(domainConfig: DomainConfig, slug: string): DomainConfig {
  return {
    ...domainConfig,
    vanityUrls: domainConfig.vanityUrls.map((v) =>
      v.slug === slug ? { ...v, isActive: !v.isActive } : v
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function resolveVanityUrl(domainConfig: DomainConfig, path: string): string | null {
  const slug = path.replace(/^\//, '').split('/')[0];
  const vanity = domainConfig.vanityUrls.find((v) => v.slug === slug && v.isActive);
  return vanity ? vanity.targetPath : null;
}

// =============================================================================
// Domain Health Monitoring
// =============================================================================

export async function performHealthCheck(domainConfig: DomainConfig): Promise<DomainHealthCheck> {
  const issues: string[] = [];

  // Check SSL status
  const ssl = checkSslStatus(domainConfig);
  if (ssl.issues.length > 0) {
    issues.push(...ssl.issues);
  }

  // Check DNS records
  const unverifiedRecords = domainConfig.dnsRecords.filter((r) => !r.verified);
  if (unverifiedRecords.length > 0) {
    issues.push(`${unverifiedRecords.length} DNS record(s) pending verification`);
  }

  // In production: make HTTP request to check domain reachability
  // Simulated response for now
  const httpStatus = domainConfig.status === 'active' ? 200 : null;
  const responseTimeMs = domainConfig.status === 'active' ? Math.floor(Math.random() * 100) + 20 : null;

  return {
    lastChecked: new Date().toISOString(),
    httpStatus,
    sslValid: ssl.status === 'active',
    dnsResolved: unverifiedRecords.length === 0,
    responseTimeMs,
    issues,
  };
}

export function getDomainHealthScore(healthCheck: DomainHealthCheck): {
  score: number;
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
} {
  let score = 100;

  if (!healthCheck.dnsResolved) score -= 40;
  if (!healthCheck.sslValid) score -= 30;
  if (healthCheck.httpStatus !== 200) score -= 20;
  if (healthCheck.responseTimeMs && healthCheck.responseTimeMs > 500) score -= 10;
  if (healthCheck.responseTimeMs && healthCheck.responseTimeMs > 1000) score -= 10;
  score -= healthCheck.issues.length * 5;

  score = Math.max(0, Math.min(100, score));

  const grade =
    score >= 90 ? 'excellent' :
    score >= 75 ? 'good' :
    score >= 50 ? 'fair' :
    score >= 25 ? 'poor' : 'critical';

  return { score, grade };
}

// =============================================================================
// DNS Record Generator
// =============================================================================

export function generateDnsInstructionsByProvider(
  records: DnsRecord[],
  provider: string
): string {
  const providerInstructions: Record<string, (record: DnsRecord) => string> = {
    godaddy: (record) =>
      `GoDaddy DNS Manager:\n  1. Go to DNS Management\n  2. Click "Add Record"\n  3. Type: ${record.type}\n  4. Name: ${record.name.split('.')[0]}\n  5. Value: ${record.value}\n  6. TTL: ${record.ttl}\n  7. Click "Save"`,

    cloudflare: (record) =>
      `Cloudflare Dashboard:\n  1. Go to DNS > Records\n  2. Click "Add Record"\n  3. Type: ${record.type}\n  4. Name: ${record.name.split('.')[0]}\n  5. Target: ${record.value}\n  6. Proxy status: DNS only (gray cloud)\n  7. TTL: Auto\n  8. Click "Save"`,

    namecheap: (record) =>
      `Namecheap Advanced DNS:\n  1. Go to Domain List > Manage > Advanced DNS\n  2. Click "Add New Record"\n  3. Type: ${record.type}\n  4. Host: ${record.name.split('.')[0]}\n  5. Value: ${record.value}\n  6. TTL: ${record.ttl}\n  7. Click the green checkmark`,

    route53: (record) =>
      `AWS Route 53:\n  1. Go to Hosted Zones > your domain\n  2. Click "Create Record"\n  3. Record name: ${record.name.split('.')[0]}\n  4. Record type: ${record.type}\n  5. Value: ${record.value}\n  6. TTL: ${record.ttl}\n  7. Click "Create records"`,

    google_domains: (record) =>
      `Google Domains:\n  1. Go to DNS > Custom records\n  2. Host name: ${record.name.split('.')[0]}\n  3. Type: ${record.type}\n  4. Data: ${record.value}\n  5. TTL: ${record.ttl}\n  6. Click "Save"`,

    default: (record) =>
      `DNS Provider:\n  1. Navigate to your DNS management panel\n  2. Add a new ${record.type} record\n  3. Name/Host: ${record.name}\n  4. Value/Target: ${record.value}\n  5. TTL: ${record.ttl} seconds\n  6. Save the record`,
  };

  const formatter = providerInstructions[provider.toLowerCase()] || providerInstructions.default;
  return records.map((record) => formatter(record)).join('\n\n');
}

export function getSupportedDnsProviders(): Array<{ id: string; name: string }> {
  return [
    { id: 'godaddy', name: 'GoDaddy' },
    { id: 'cloudflare', name: 'Cloudflare' },
    { id: 'namecheap', name: 'Namecheap' },
    { id: 'route53', name: 'AWS Route 53' },
    { id: 'google_domains', name: 'Google Domains' },
    { id: 'hover', name: 'Hover' },
    { id: 'bluehost', name: 'Bluehost' },
    { id: 'hostgator', name: 'HostGator' },
    { id: 'netlify', name: 'Netlify DNS' },
    { id: 'vercel', name: 'Vercel DNS' },
  ];
}

// =============================================================================
// Domain Resolution
// =============================================================================

export function resolveTenantFromHost(host: string): {
  tenantSubdomain: string | null;
  isCustomDomain: boolean;
} {
  const lower = host.toLowerCase().replace(/:\d+$/, ''); // Strip port

  // Check if it's a subdomain of ranios.com
  if (lower.endsWith(`.${RANIOS_BASE_DOMAIN}`)) {
    const subdomain = lower.replace(`.${RANIOS_BASE_DOMAIN}`, '');
    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      return { tenantSubdomain: null, isCustomDomain: false };
    }
    return { tenantSubdomain: subdomain, isCustomDomain: false };
  }

  // Otherwise, it's a custom domain - needs lookup
  return { tenantSubdomain: null, isCustomDomain: true };
}

// =============================================================================
// Domain Configuration Summary
// =============================================================================

export function getDomainSummary(domainConfig: DomainConfig): {
  primaryUrl: string;
  customUrl: string | null;
  status: DomainStatus;
  sslStatus: SslStatus;
  healthGrade: string;
  activeVanityUrls: number;
  activeRedirects: number;
  pendingDnsRecords: number;
} {
  const health = getDomainHealthScore(domainConfig.healthCheck);

  return {
    primaryUrl: generateSubdomainUrl(domainConfig.subdomain),
    customUrl: domainConfig.customDomain ? `https://${domainConfig.customDomain}` : null,
    status: domainConfig.status,
    sslStatus: domainConfig.sslStatus,
    healthGrade: health.grade,
    activeVanityUrls: domainConfig.vanityUrls.filter((v) => v.isActive).length,
    activeRedirects: domainConfig.routingConfig.redirectRules.filter((r) => r.isActive).length,
    pendingDnsRecords: domainConfig.dnsRecords.filter((r) => !r.verified).length,
  };
}
