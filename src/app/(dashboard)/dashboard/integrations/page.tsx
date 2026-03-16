'use client';

import { useState, useCallback } from 'react';
import {
  Plug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Zap,
  Clock,
  ArrowRight,
  FileText,
  CreditCard,
  Building2,
  CalendarDays,
  HeartPulse,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDashboardData } from '@/hooks/useDashboardData';

interface PlatformStatus {
  configured: boolean;
  description: string;
  action: string;
  environment?: string;
}

interface IntegrationStatusData {
  integrations: {
    jotform: PlatformStatus;
    square: PlatformStatus;
    plaid: PlatformStatus;
    mangomint: PlatformStatus;
    cherry: PlatformStatus;
  };
}

interface SyncResult {
  syncedAt: string;
  platforms: Record<string, {
    status: string;
    newClientsAdded?: number;
    newTransactionsAdded?: number;
    totalSubmissions?: number;
    totalPayments?: number;
    alreadyExisted?: number;
    added?: number;
    error?: string;
    message?: string;
  }>;
}

const PLATFORM_CONFIG = {
  jotform: {
    name: 'Jotform',
    icon: FileText,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Medical consent forms (LHR, Injectables, Microneedling, Facial, Lymphatic)',
    setupUrl: 'https://www.jotform.com/myaccount/api',
    setupLabel: 'Get API Key',
    syncLabel: 'Sync Clients',
    dataType: 'clients',
  },
  square: {
    name: 'Square',
    icon: CreditCard,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Payment processing & transaction history',
    setupUrl: 'https://developer.squareup.com',
    setupLabel: 'Get Access Token',
    syncLabel: 'Sync Payments',
    dataType: 'transactions',
  },
  plaid: {
    name: 'Plaid (BECU)',
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Bank account connection — auto-import transactions',
    setupUrl: 'https://dashboard.plaid.com',
    setupLabel: 'Complete Setup',
    syncLabel: 'Sync Transactions',
    dataType: 'bank transactions',
  },
  mangomint: {
    name: 'Mangomint',
    icon: CalendarDays,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Booking & scheduling (2,181 clients) — Webhooks enabled',
    setupUrl: 'https://app.mangomint.com/876418/settings',
    setupLabel: 'Get API Key',
    syncLabel: 'Sync Clients',
    dataType: 'clients & appointments',
  },
  cherry: {
    name: 'Cherry',
    icon: HeartPulse,
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'Patient financing applications & approvals',
    setupUrl: 'https://provider.withcherry.com',
    setupLabel: 'View Dashboard',
    syncLabel: 'Sync Applications',
    dataType: 'financing',
  },
};

export default function IntegrationsPage() {
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const { data: statusData, isLoading, mutate } = useDashboardData<IntegrationStatusData>(
    '/integrations/sync-all',
    { refreshInterval: 300000 }
  );

  const handleSyncAll = useCallback(async () => {
    setSyncingAll(true);
    setLastSyncResult(null);
    try {
      const res = await fetch('/api/dashboard/integrations/sync-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastSyncResult(data);
        toast.success('All platforms synced!');
        mutate();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Network error during sync');
    } finally {
      setSyncingAll(false);
    }
  }, [mutate]);

  const handleSyncPlatform = useCallback(async (platform: string) => {
    setSyncingPlatform(platform);
    try {
      const endpoint = platform === 'plaid'
        ? '/api/dashboard/plaid/transactions/sync'
        : `/api/dashboard/integrations/${platform}`;
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const added = data.newClientsAdded ?? data.newTransactionsAdded ?? data.added ?? 0;
        toast.success(`${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].name}: ${added} new records synced`);
        mutate();
      } else {
        toast.error(`${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].name}: ${data.error || 'Sync failed'}`);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSyncingPlatform(null);
    }
  }, [mutate]);

  const integrations = statusData?.integrations;
  const card = 'bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border';

  const connectedCount = integrations
    ? Object.values(integrations).filter((p) => p.configured).length
    : 0;
  const totalCount = integrations ? Object.keys(integrations).length : 5;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading text-rani-navy flex items-center gap-2">
            <Plug className="w-6 h-6 text-rani-gold" />
            Integrations
          </h1>
          <p className="text-sm font-body text-rani-muted mt-1">
            Connect platforms to auto-sync live data into your dashboard
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rani-navy text-white text-sm font-body font-medium rounded-lg hover:bg-rani-navy/90 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          {syncingAll ? 'Syncing All...' : 'Sync All Platforms'}
        </motion.button>
      </div>

      {/* Connection Status Bar */}
      <div className={`${card} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rani-gold" />
              <span className="text-sm font-body font-semibold text-rani-navy">
                {connectedCount}/{totalCount} Connected
              </span>
            </div>
            <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(connectedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-rani-gold to-amber-400 rounded-full"
              />
            </div>
          </div>
          {lastSyncResult && (
            <div className="flex items-center gap-1.5 text-xs font-body text-rani-muted">
              <Clock className="w-3 h-3" />
              Last sync: {new Date(lastSyncResult.syncedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Platform Cards */}
      <div className="space-y-4">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${card} p-6 animate-pulse`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))
        ) : (
          Object.entries(PLATFORM_CONFIG).map(([key, config], index) => {
            const status = integrations?.[key as keyof typeof integrations];
            const isConfigured = status?.configured ?? false;
            const isSyncing = syncingPlatform === key;
            const syncResult = lastSyncResult?.platforms?.[key];
            const Icon = config.icon;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`${card} p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icon + Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-body font-semibold text-rani-navy">{config.name}</h3>
                        {isConfigured ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            <XCircle className="w-3 h-3" />
                            Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-body text-rani-muted mt-0.5 truncate">
                        {config.description}
                      </p>
                      {!isConfigured && status?.action && (
                        <p className="text-xs font-body text-amber-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {status.action}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {isConfigured ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSyncPlatform(key)}
                        disabled={isSyncing || syncingAll}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium text-rani-navy bg-rani-gold/10 hover:bg-rani-gold/20 border border-rani-gold/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : config.syncLabel}
                      </motion.button>
                    ) : (
                      <a
                        href={config.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium text-rani-navy bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                      >
                        {config.setupLabel}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Sync Result (after sync) */}
                <AnimatePresence>
                  {syncResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-rani-border/50"
                    >
                      {syncResult.status === 'success' ? (
                        <div className="flex items-center gap-6 text-sm font-body">
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Synced successfully</span>
                          </div>
                          {syncResult.newClientsAdded !== undefined && (
                            <span className="text-rani-muted">
                              +{syncResult.newClientsAdded} new clients
                            </span>
                          )}
                          {syncResult.newTransactionsAdded !== undefined && (
                            <span className="text-rani-muted">
                              +{syncResult.newTransactionsAdded} new transactions
                            </span>
                          )}
                          {syncResult.added !== undefined && (
                            <span className="text-rani-muted">
                              +{syncResult.added} new records
                            </span>
                          )}
                          {syncResult.alreadyExisted !== undefined && syncResult.alreadyExisted > 0 && (
                            <span className="text-rani-muted">
                              ({syncResult.alreadyExisted} duplicates skipped)
                            </span>
                          )}
                        </div>
                      ) : syncResult.status === 'not_configured' || syncResult.status === 'not_connected' ? (
                        <div className="flex items-center gap-1.5 text-sm font-body text-amber-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{syncResult.message || 'Not configured'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-sm font-body text-red-500">
                          <XCircle className="w-4 h-4" />
                          <span>{syncResult.error || 'Sync failed'}</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Setup Guide */}
      <div className={`${card} p-6`}>
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-rani-gold" />
          Quick Setup Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="font-medium text-rani-navy">Jotform (Auto-ready)</p>
                <p className="text-rani-muted">API key already configured. Click Sync to import consent form clients.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="font-medium text-rani-navy">Square</p>
                <p className="text-rani-muted">Get Access Token from developer.squareup.com &rarr; Credentials &rarr; add to .env.local</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold flex-shrink-0">3</span>
              <div>
                <p className="font-medium text-rani-navy">Plaid (BECU)</p>
                <p className="text-rani-muted">Complete Plaid questionnaires at dashboard.plaid.com for production access</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex-shrink-0">4</span>
              <div>
                <p className="font-medium text-rani-navy">Mangomint</p>
                <p className="text-rani-muted">Webhooks enabled. Add MANGOMINT_API_KEY from Settings &rarr; Developer for full sync.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex-shrink-0">5</span>
              <div>
                <p className="font-medium text-rani-navy">Cherry</p>
                <p className="text-rani-muted">No API available — data is manually synced via dashboard extraction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
