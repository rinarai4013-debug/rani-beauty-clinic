/**
 * RaniOS Onboarding - Step Pages
 *
 * Dynamic route handling steps 1-7 of the onboarding wizard.
 * Each step renders its own form with validation and progress tracking.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ONBOARDING_STEPS } from '@/lib/tenant/onboarding';
import type { OnboardingStepName } from '@/lib/tenant/onboarding';

// ─── Step Components ────────────────────────────────────────────────────────

function BusinessInfoStep({ data, onSubmit, saving }: StepProps) {
  const [form, setForm] = useState({
    name: (data?.name as string) || '',
    slug: (data?.slug as string) || '',
    address: (data?.address as string) || '',
    phone: (data?.phone as string) || '',
    email: (data?.email as string) || '',
    website: (data?.website as string) || '',
    timezone: (data?.timezone as string) || 'America/Los_Angeles',
  });

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({ ...f, name, slug: autoSlug(name) }));
          }}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Luxe Medical Aesthetics"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard URL *</label>
        <div className="flex items-center">
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            className="flex-1 rounded-l-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="luxe-medical"
          />
          <span className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-4 py-3 text-gray-500 text-sm">
            .ranios.com
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="123 Main St, Suite 100, City, ST 00000"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            placeholder="info@yourmedspa.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="https://yourmedspa.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
        <select
          value={form.timezone}
          onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
        >
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
          <option value="America/Anchorage">Alaska Time</option>
          <option value="Pacific/Honolulu">Hawaii Time</option>
        </select>
      </div>

      <button
        onClick={() => onSubmit(form)}
        disabled={saving || !form.name || !form.email || !form.phone || !form.address}
        className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function AirtableStep({ data, onSubmit, saving }: StepProps) {
  const [form, setForm] = useState({
    pat: (data?.pat as string) || '',
    baseId: (data?.baseId as string) || '',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-airtable', data: form }),
      });
      const result = await res.json();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, error: 'Connection test failed' });
    }
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <h4 className="font-medium text-blue-800 mb-2">How to get your Airtable credentials</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Go to airtable.com/create/tokens</li>
          <li>Create a new Personal Access Token</li>
          <li>Grant it access to your base with all scopes</li>
          <li>Copy the token (starts with &quot;pat&quot;)</li>
          <li>Find your Base ID in the Airtable URL (starts with &quot;app&quot;)</li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Personal Access Token *</label>
        <input
          type="password"
          value={form.pat}
          onChange={(e) => setForm((f) => ({ ...f, pat: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="pat..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Base ID *</label>
        <input
          type="text"
          value={form.baseId}
          onChange={(e) => setForm((f) => ({ ...f, baseId: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="app..."
        />
      </div>

      {testResult && (
        <div
          className={`rounded-lg p-3 text-sm ${
            testResult.success
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {testResult.success ? 'Connection successful!' : testResult.error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={testConnection}
          disabled={testing || !form.pat || !form.baseId}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={saving || !form.pat || !form.baseId}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function BrandingStep({ data, onSubmit, saving }: StepProps) {
  const [form, setForm] = useState({
    clinicName: (data?.clinicName as string) || '',
    logoUrl: (data?.logoUrl as string) || '',
    primaryColor: (data?.primaryColor as string) || '#0F1D2C',
    secondaryColor: (data?.secondaryColor as string) || '#C9A96E',
    accentColor: (data?.accentColor as string) || '#D4AF37',
    backgroundColor: (data?.backgroundColor as string) || '#F8F6F1',
    headingFont: (data?.headingFont as string) || 'Playfair Display',
    bodyFont: (data?.bodyFont as string) || 'Inter',
    tagline: (data?.tagline as string) || '',
  });

  const fontOptions = [
    'Playfair Display', 'Inter', 'Montserrat', 'Lato', 'Poppins',
    'Roboto', 'Open Sans', 'Raleway', 'Cormorant Garamond', 'DM Sans',
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
        <input
          type="text"
          value={form.clinicName}
          onChange={(e) => setForm((f) => ({ ...f, clinicName: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Your Clinic Name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          type="url"
          value={form.logoUrl}
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="https://yoursite.com/logo.png"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Brand Colors</label>
        <div className="grid grid-cols-2 gap-4">
          {(['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor'] as const).map((key) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="h-10 w-10 rounded cursor-pointer border border-gray-200"
              />
              <div>
                <span className="text-xs text-gray-500 capitalize">
                  {key.replace('Color', '')}
                </span>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="block w-24 text-xs font-mono border-b border-gray-200 py-1 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg p-6 border"
        style={{ backgroundColor: form.backgroundColor, borderColor: form.secondaryColor }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-8 w-8 rounded-full"
            style={{ backgroundColor: form.primaryColor }}
          />
          <span
            className="text-lg font-bold"
            style={{ color: form.primaryColor, fontFamily: form.headingFont }}
          >
            {form.clinicName || 'Your Clinic'}
          </span>
        </div>
        <p className="text-sm" style={{ color: '#6B7280', fontFamily: form.bodyFont }}>
          {form.tagline || 'Your tagline here'}
        </p>
        <div className="flex gap-2 mt-3">
          <span
            className="rounded px-3 py-1 text-xs text-white"
            style={{ backgroundColor: form.primaryColor }}
          >
            Primary
          </span>
          <span
            className="rounded px-3 py-1 text-xs text-white"
            style={{ backgroundColor: form.secondaryColor }}
          >
            Secondary
          </span>
          <span
            className="rounded px-3 py-1 text-xs text-white"
            style={{ backgroundColor: form.accentColor }}
          >
            Accent
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
          <select
            value={form.headingFont}
            onChange={(e) => setForm((f) => ({ ...f, headingFont: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
          <select
            value={form.bodyFont}
            onChange={(e) => setForm((f) => ({ ...f, bodyFont: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none"
          >
            {fontOptions.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          placeholder="Where Beauty Meets Science"
        />
      </div>

      <button
        onClick={() => onSubmit(form)}
        disabled={saving || !form.clinicName}
        className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}

function ServicesStep({ data, onSubmit, saving }: StepProps) {
  const [source, setSource] = useState<'template' | 'manual' | 'airtable'>('template');
  const [templateId, setTemplateId] = useState('basic-medspa');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {(['template', 'airtable', 'manual'] as const).map((s) => (
          <label
            key={s}
            className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              source === s ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="source"
              value={s}
              checked={source === s}
              onChange={() => setSource(s)}
              className="text-blue-600"
            />
            <div>
              <span className="font-medium capitalize">{s === 'template' ? 'Use a Template' : s === 'airtable' ? 'Import from Airtable' : 'Enter Manually'}</span>
              <p className="text-xs text-gray-500">
                {s === 'template' && 'Start with a pre-built service menu'}
                {s === 'airtable' && 'Pull services from your Airtable base'}
                {s === 'manual' && 'Add services one by one'}
              </p>
            </div>
          </label>
        ))}
      </div>

      {source === 'template' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Choose a template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none"
          >
            <option value="basic-medspa">Basic Medspa (8 services)</option>
            <option value="full-medspa">Full Medspa (20 services)</option>
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ source, templateId, services: data?.services })}
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <button
          onClick={() => onSubmit({ skipped: true })}
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function TeamStep({ data, onSubmit, saving }: StepProps) {
  const [members, setMembers] = useState<Array<{
    name: string;
    email: string;
    role: string;
    password: string;
  }>>(
    (data?.members as Array<{ name: string; email: string; role: string; password: string }>) || [
      { name: '', email: '', role: 'ceo', password: '' },
    ]
  );

  const addMember = () => {
    setMembers((m) => [...m, { name: '', email: '', role: 'provider', password: '' }]);
  };

  const updateMember = (index: number, field: string, value: string) => {
    setMembers((m) => m.map((member, i) => (i === index ? { ...member, [field]: value } : member)));
  };

  const removeMember = (index: number) => {
    if (members.length > 1) setMembers((m) => m.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {members.map((member, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Team Member {i + 1}</span>
            {members.length > 1 && (
              <button
                onClick={() => removeMember(i)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={member.name}
              onChange={(e) => updateMember(i, 'name', e.target.value)}
              placeholder="Full name"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <input
              type="email"
              value={member.email}
              onChange={(e) => updateMember(i, 'email', e.target.value)}
              placeholder="Email"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <select
              value={member.role}
              onChange={(e) => updateMember(i, 'role', e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none"
            >
              <option value="ceo">Owner / CEO</option>
              <option value="provider">Provider</option>
              <option value="frontdesk">Front Desk</option>
              <option value="marketing">Marketing</option>
              <option value="operations">Operations</option>
            </select>
            <input
              type="password"
              value={member.password}
              onChange={(e) => updateMember(i, 'password', e.target.value)}
              placeholder="Password (8+ chars)"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addMember}
        className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
      >
        + Add team member
      </button>

      <div className="flex gap-3">
        <button
          onClick={() => onSubmit({ members })}
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <button
          onClick={() => onSubmit({ skipped: true })}
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function SubscriptionStep({ onSubmit, saving }: StepProps) {
  const [tier, setTier] = useState<'starter' | 'professional' | 'enterprise'>('professional');

  const tiers = [
    {
      id: 'starter' as const,
      name: 'Starter',
      price: 199,
      description: 'Basic dashboard with KPIs, scheduling, and client management',
      features: ['Dashboard & KPIs', 'Schedule management', 'Client profiles', 'Gamification', 'Basic reporting'],
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      price: 499,
      description: 'AI-powered engines for growth',
      features: [
        'Everything in Starter',
        'Churn prediction AI',
        'No-show risk scoring',
        'Dynamic pricing engine',
        'P&L intelligence',
        'Schedule optimizer',
        'Inventory auto-manager',
        'Social media AI',
        'Meta Ads AI manager',
        'AI consult co-pilot',
        'Communication templates',
        'Bank connection (Plaid)',
      ],
      popular: true,
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise',
      price: 999,
      description: 'Full suite with white-label',
      features: [
        'Everything in Professional',
        'RAG knowledge base',
        'AI phone agent (Vapi)',
        'White-label branding',
        'Priority support',
        'Custom integrations',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-green-800 font-medium">14-day free trial on all plans</p>
        <p className="text-green-600 text-sm">No credit card required to start</p>
      </div>

      <div className="space-y-4">
        {tiers.map((t) => (
          <label
            key={t.id}
            className={`block rounded-xl border-2 p-6 cursor-pointer transition-all ${
              tier === t.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            } ${t.popular ? 'relative' : ''}`}
          >
            {t.popular && (
              <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-0.5 text-xs text-white font-medium">
                Most Popular
              </span>
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  checked={tier === t.id}
                  onChange={() => setTier(t.id)}
                  className="text-blue-600 mt-1"
                />
                <div>
                  <span className="text-lg font-semibold">{t.name}</span>
                  <p className="text-sm text-gray-500">{t.description}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">${t.price}</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </div>
            </div>
            <ul className="mt-4 ml-8 space-y-1">
              {t.features.map((f) => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </label>
        ))}
      </div>

      <button
        onClick={() => onSubmit({ tier })}
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Processing...' : `Start 14-Day Free Trial`}
      </button>
    </div>
  );
}

function GoLiveStep({ saving, onSubmit }: StepProps) {
  const [launched, setLaunched] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState('');

  const handleLaunch = async () => {
    const result = await onSubmit({ goLive: true });
    if (result) {
      setLaunched(true);
      setDashboardUrl(typeof result === 'object' && 'dashboardUrl' in result ? (result as { dashboardUrl: string }).dashboardUrl : '');
    }
  };

  if (launched) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You&apos;re Live!</h2>
        <p className="text-gray-600">Your dashboard is ready. Welcome to RaniOS.</p>
        {dashboardUrl && (
          <a
            href={dashboardUrl}
            className="inline-block rounded-lg bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Pre-launch checklist</h3>
        <div className="space-y-2">
          {[
            { label: 'Business info configured', step: 1 },
            { label: 'Airtable connected', step: 2 },
            { label: 'Branding customized', step: 3 },
            { label: 'Services imported', step: 4 },
            { label: 'Team members added', step: 5 },
            { label: 'Subscription selected', step: 6 },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-2 text-sm">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={saving}
        className="w-full rounded-lg bg-green-600 py-4 text-white font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Launching...' : 'Launch My Dashboard'}
      </button>
    </div>
  );
}

// ─── Step Props Interface ───────────────────────────────────────────────────

interface StepProps {
  data?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<unknown>;
  saving: boolean;
}

// ─── Step Component Map ─────────────────────────────────────────────────────

const STEP_COMPONENTS: Record<number, React.ComponentType<StepProps>> = {
  1: BusinessInfoStep,
  2: AirtableStep,
  3: BrandingStep,
  4: ServicesStep,
  5: TeamStep,
  6: SubscriptionStep,
  7: GoLiveStep,
};

// ─── Main Page Component ────────────────────────────────────────────────────

export default function OnboardingStepPage() {
  const router = useRouter();
  const params = useParams();
  const step = Number(params.step);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepData, setStepData] = useState<Record<number, Record<string, unknown>>>({});

  // Load existing progress on mount
  useEffect(() => {
    fetch('/api/tenant/onboarding')
      .then((r) => r.json())
      .then((data) => {
        if (data.stepData) setStepData(data.stepData);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      setSaving(true);
      setError(null);

      try {
        const res = await fetch('/api/tenant/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step, data }),
        });

        const result = await res.json();

        if (!res.ok) {
          setError(result.error || 'Something went wrong');
          setSaving(false);
          return null;
        }

        // Save step data locally
        setStepData((prev) => ({ ...prev, [step]: data }));

        // Navigate to next step
        if (step < 7) {
          router.push(`/onboarding/${step + 1}`);
        }

        setSaving(false);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        setSaving(false);
        return null;
      }
    },
    [step, router]
  );

  // Validate step number
  if (isNaN(step) || step < 1 || step > 7) {
    router.push('/onboarding/1');
    return null;
  }

  const StepComponent = STEP_COMPONENTS[step];
  const stepInfo = ONBOARDING_STEPS[step - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">RaniOS</span>
            <span className="text-sm text-gray-500">Step {step} of 7</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-2xl px-6">
          <div className="flex">
            {ONBOARDING_STEPS.map((s) => (
              <div key={s.step} className="flex-1 py-3">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    s.step <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                <span
                  className={`mt-1 block text-xs ${
                    s.step === step ? 'text-blue-600 font-medium' : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{stepInfo.label}</h1>
          <p className="text-gray-500 mt-1">{stepInfo.description}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <StepComponent data={stepData[step]} onSubmit={handleSubmit} saving={saving} />
        </div>

        {/* Back button */}
        {step > 1 && (
          <button
            onClick={() => router.push(`/onboarding/${step - 1}`)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to {ONBOARDING_STEPS[step - 2].label}
          </button>
        )}
      </div>
    </div>
  );
}
