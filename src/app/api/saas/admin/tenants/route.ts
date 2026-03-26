import { NextRequest, NextResponse } from 'next/server';

// Mock tenant data - in production this would query Airtable/database
const tenants = [
  { id: 't_001', name: 'Glow Medical Spa', slug: 'glow-medical', email: 'admin@glowmedspa.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 3240, lastActive: '2026-03-24T10:30:00Z', createdAt: '2025-10-15', location: 'Seattle, WA', owner: 'Dr. Lisa Park', providers: 3, monthlyClients: 210 },
  { id: 't_002', name: 'Radiance Aesthetics', slug: 'radiance', email: 'hello@radianceaesthetics.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 8760, lastActive: '2026-03-24T09:15:00Z', createdAt: '2025-09-01', location: 'Portland, OR', owner: 'Dr. Sarah Mitchell', providers: 5, monthlyClients: 340 },
  { id: 't_003', name: 'Luxe Skin Studio', slug: 'luxe-skin', email: 'ops@luxeskinstudio.com', plan: 'starter', status: 'trial', mrr: 0, aiCalls: 420, lastActive: '2026-03-23T16:45:00Z', createdAt: '2026-03-10', location: 'San Francisco, CA', owner: 'Maria Santos', providers: 1, monthlyClients: 45 },
  { id: 't_004', name: 'Derma Elite Clinic', slug: 'derma-elite', email: 'admin@dermaelite.com', plan: 'growth', status: 'active', mrr: 499, aiCalls: 5100, lastActive: '2026-03-24T08:00:00Z', createdAt: '2025-11-20', location: 'Austin, TX', owner: 'Dr. James Reed', providers: 4, monthlyClients: 280 },
  { id: 't_005', name: 'Bella Vita Med Spa', slug: 'bella-vita', email: 'info@bellavitamedspa.com', plan: 'growth', status: 'suspended', mrr: 499, aiCalls: 0, lastActive: '2026-02-28T14:00:00Z', createdAt: '2025-12-01', location: 'Miami, FL', owner: 'Isabella Cruz', providers: 2, monthlyClients: 0 },
  { id: 't_006', name: 'Pure Aesthetics', slug: 'pure-aesthetics', email: 'team@pureaesthetics.com', plan: 'starter', status: 'churned', mrr: 0, aiCalls: 0, lastActive: '2026-01-15T12:00:00Z', createdAt: '2025-08-15', location: 'Denver, CO', owner: 'Rachel Kim', providers: 1, monthlyClients: 0 },
  { id: 't_007', name: 'Zen Medspa & Wellness', slug: 'zen-medspa', email: 'hello@zenmedspa.com', plan: 'enterprise', status: 'active', mrr: 999, aiCalls: 12300, lastActive: '2026-03-24T11:00:00Z', createdAt: '2025-09-15', location: 'Los Angeles, CA', owner: 'Dr. Amanda Zhao', providers: 8, monthlyClients: 520 },
  { id: 't_008', name: 'Aura Skin Clinic', slug: 'aura-skin', email: 'admin@auraskin.com', plan: 'starter', status: 'active', mrr: 199, aiCalls: 1560, lastActive: '2026-03-23T18:30:00Z', createdAt: '2026-01-05', location: 'Chicago, IL', owner: 'Dr. Nadia Patel', providers: 2, monthlyClients: 95 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const plan = searchParams.get('plan');
  const search = searchParams.get('search')?.toLowerCase();
  const id = searchParams.get('id');

  // Single tenant lookup
  if (id) {
    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    return NextResponse.json({ tenant });
  }

  // Filtered list
  let result = [...tenants];

  if (status) {
    result = result.filter((t) => t.status === status);
  }
  if (plan) {
    result = result.filter((t) => t.plan === plan);
  }
  if (search) {
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search) ||
        t.location.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    tenants: result,
    total: result.length,
    stats: {
      active: tenants.filter((t) => t.status === 'active').length,
      trial: tenants.filter((t) => t.status === 'trial').length,
      suspended: tenants.filter((t) => t.status === 'suspended').length,
      churned: tenants.filter((t) => t.status === 'churned').length,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, plan, location, owner } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const newTenant = {
      id: `t_${String(tenants.length + 1).padStart(3, '0')}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      email,
      plan: plan || 'starter',
      status: 'trial' as const,
      mrr: 0,
      aiCalls: 0,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
      location: location || '',
      owner: owner || '',
      providers: 1,
      monthlyClients: 0,
    };

    // In production: create Airtable base, provision tenant, send welcome email
    return NextResponse.json({ tenant: newTenant, message: 'Tenant created successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const tenant = tenants.find((t) => t.id === id);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const updatedTenant = { ...tenant, ...updates };

    return NextResponse.json({ tenant: updatedTenant, message: 'Tenant updated successfully' });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
  }

  const tenant = tenants.find((t) => t.id === id);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // In production: soft delete, archive data, cancel subscription
  return NextResponse.json({ message: `Tenant ${id} deleted successfully` });
}
