import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchAll = vi.fn();
const fetchFirst = vi.fn();

const Tables = {
  transactions: vi.fn(() => 'transactions'),
  appointments: vi.fn(() => 'appointments'),
  alerts: vi.fn(() => 'alerts'),
  memberships: vi.fn(() => 'memberships'),
  clients: vi.fn(() => 'clients'),
  reviews: vi.fn(() => 'reviews'),
  kpis: vi.fn(() => 'kpis'),
};

vi.mock('@/lib/airtable/client', () => ({
  Tables,
  fetchAll,
  fetchFirst,
}));

vi.mock('@/lib/airtable/tables', () => ({
  FIELDS: {
    transactions: {
      date: 'Date',
      status: 'Status',
      amount: 'Amount',
      provider: 'Provider',
      serviceName: 'Service Name',
      paymentMethod: 'Payment Method',
      isFinancing: 'Is Financing',
    },
    appointments: {
      date: 'Date',
      time: 'Time',
      provider: 'Provider',
      category: 'Category',
      duration: 'Duration',
      isConsult: 'Is Consult',
      bookingSource: 'Booking Source',
      status: 'Status',
      amountPaid: 'Amount Paid',
      service: 'Service',
      depositPaid: 'Deposit Paid',
    },
    alerts: {
      status: 'Status',
      severity: 'Severity',
      type: 'Type',
      message: 'Message',
      actionRecommended: 'Action Recommended',
      createdDate: 'Created Date',
    },
    memberships: {
      status: 'Status',
      tier: 'Tier',
      startDate: 'Start Date',
      monthlyPrice: 'Monthly Price',
      churnRiskScore: 'Churn Risk Score',
    },
    clients: {
      status: 'Status',
      leadSource: 'Lead Source',
    },
    reviews: {
      reviewDate: 'Review Date',
      starRating: 'Star Rating',
    },
    kpiSnapshots: {
      date: 'Date',
      period: 'Period',
    },
  },
}));

import {
  fetchRevenue,
  fetchRevenueRange,
  fetchSchedule,
  fetchAlerts,
  fetchLoyalty,
  fetchReferrals,
  fetchMarketing,
  fetchCashFlow,
  fetchContentCalendar,
  fetchAIHighlights,
  fetchKPISnapshot,
  fetchProviderPerformance,
  fetchClientGrowth,
  formatDate,
  getToday,
  getYesterday,
  getDaysAgo,
  getMonthStart,
  getLastMonthStart,
  getLastMonthEnd,
  getWeekStart,
  getLastWeekStart,
  getLastWeekEnd,
} from '@/lib/briefing/data-fetchers';

describe('briefing/data-fetchers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats common date helper outputs from the frozen date', () => {
    expect(formatDate(new Date('2026-04-10T00:00:00Z'))).toBe('2026-04-10');
    expect(getToday()).toBe('2026-04-10');
    expect(getYesterday()).toBe('2026-04-09');
    expect(getDaysAgo(7)).toBe('2026-04-03');
    expect(getMonthStart()).toBe('2026-04-01');
    expect(getLastMonthStart()).toBe('2026-03-01');
    expect(getLastMonthEnd()).toBe('2026-03-31');
    expect(getWeekStart(new Date('2026-04-10T12:00:00Z'))).toBe('2026-04-06');
    expect(getLastWeekStart()).toBe('2026-03-30');
    expect(getLastWeekEnd()).toBe('2026-04-05');
  });

  it('aggregates completed revenue by provider, service, and payment method', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        fields: {
          Amount: 2750,
          Provider: 'Rina',
          'Service Name': 'Sofwave',
          'Payment Method': 'Card',
          'Is Financing': true,
        },
      },
      {
        fields: {
          Amount: 275,
          Provider: 'Mom',
          'Service Name': 'HydraFacial',
          'Payment Method': 'Cash',
          'Is Financing': false,
        },
      },
    ]);

    await expect(fetchRevenue('2026-04-09')).resolves.toEqual({
      total: 3025,
      byProvider: {
        Rina: 2750,
        Mom: 275,
      },
      byService: {
        Sofwave: 2750,
        HydraFacial: 275,
      },
      byCategory: {},
      byPaymentMethod: {
        Card: 2750,
        Cash: 275,
      },
      transactionCount: 2,
      avgTicket: 1512.5,
      financingTotal: 2750,
    });
  });

  it('aggregates a revenue range using the supplied date boundaries', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        fields: {
          Amount: 495,
          Provider: 'Rina',
          'Service Name': 'PRX-T33',
          'Payment Method': 'Card',
          'Is Financing': false,
        },
      },
    ]);

    const result = await fetchRevenueRange('2026-04-01', '2026-04-09');

    expect(fetchAll).toHaveBeenCalledWith(
      'transactions',
      expect.objectContaining({
        filterByFormula: expect.stringContaining("IS_AFTER({Date}, '2026-04-01')"),
      })
    );
    expect(result.total).toBe(495);
    expect(result.transactionCount).toBe(1);
  });

  it('builds schedule summaries with provider counts, consult counts, and gaps', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        fields: {
          Provider: 'Rina',
          Category: 'Laser',
          Time: '09:00',
          Duration: 60,
          'Is Consult': true,
          'Booking Source': 'New Client - Website',
        },
      },
      {
        fields: {
          Provider: 'Rina',
          Category: 'Facial',
          Time: '10:45',
          Duration: 45,
          'Is Consult': false,
          'Booking Source': 'Returning Client',
        },
      },
    ]);

    await expect(fetchSchedule('2026-04-10')).resolves.toEqual({
      totalAppointments: 2,
      byProvider: {
        Rina: 2,
      },
      byCategory: {
        Laser: 1,
        Facial: 1,
      },
      gaps: [
        {
          provider: 'Rina',
          startTime: '10:00',
          duration: 45,
        },
      ],
      consultCount: 1,
      newClientCount: 1,
    });
  });

  it('summarizes active alerts by severity', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        id: 'alert-1',
        fields: {
          Type: 'inventory',
          Severity: 'critical',
          Message: 'Sofwave gel low',
          'Action Recommended': 'Restock today',
          'Created Date': '2026-04-09',
        },
      },
      {
        id: 'alert-2',
        fields: {
          Type: 'ops',
          Severity: 'warning',
          Message: 'HydraFacial room idle',
          'Action Recommended': 'Fill gap',
          'Created Date': '2026-04-09',
        },
      },
    ]);

    await expect(fetchAlerts()).resolves.toEqual({
      total: 2,
      bySeverity: {
        critical: 1,
        warning: 1,
        info: 0,
      },
      items: [
        {
          id: 'alert-1',
          type: 'inventory',
          severity: 'critical',
          message: 'Sofwave gel low',
          actionRecommended: 'Restock today',
          createdDate: '2026-04-09',
        },
        {
          id: 'alert-2',
          type: 'ops',
          severity: 'warning',
          message: 'HydraFacial room idle',
          actionRecommended: 'Fill gap',
          createdDate: '2026-04-09',
        },
      ],
    });
  });

  it('calculates membership totals, MRR, and churn counts', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        fields: {
          Status: 'Active',
          Tier: 'VIP',
          'Start Date': '2026-04-01',
          'Monthly Price': 599,
        },
      },
      {
        fields: {
          Status: 'Cancelled',
          Tier: 'Core',
          'Start Date': '2026-03-01',
          'Monthly Price': 399,
        },
      },
    ]);

    await expect(fetchLoyalty()).resolves.toEqual({
      totalMembers: 1,
      newMembers: 1,
      churnedMembers: 1,
      membershipMRR: 599,
      tierBreakdown: {
        VIP: 1,
      },
      redemptions: 0,
      tierUpgrades: 0,
    });
  });

  it('counts referral conversions from referred clients', async () => {
    fetchAll.mockResolvedValueOnce([
      { fields: { Status: 'Referral - Active' } },
      { fields: { Status: 'Referral - Pending' } },
    ]);

    const result = await fetchReferrals();

    expect(fetchAll).toHaveBeenCalledWith(
      'clients',
      expect.any(Object),
      true
    );
    expect(result.conversions).toBe(2);
    expect(result.revenueAttributed).toBe(0);
  });

  it('summarizes marketing leads, sources, and review averages', async () => {
    fetchAll
      .mockResolvedValueOnce([
        { fields: { 'Lead Source': 'Instagram' } },
        { fields: { 'Lead Source': 'Instagram' } },
        { fields: { 'Lead Source': 'Google' } },
      ])
      .mockResolvedValueOnce([
        { fields: { 'Star Rating': 5 } },
        { fields: { 'Star Rating': 4 } },
      ]);

    await expect(fetchMarketing()).resolves.toEqual({
      newLeads: 3,
      leadsBySource: {
        Instagram: 2,
        Google: 1,
      },
      avgLeadScore: 0,
      reviewCount: 2,
      avgRating: 4.5,
      reviewVelocity: 2 / 7,
    });
  });

  it('marks cash flow as Plaid-connected when the active alert exists', async () => {
    fetchFirst.mockResolvedValueOnce([{ id: 'alert-plaid', fields: {} }]);

    await expect(fetchCashFlow()).resolves.toEqual({
      bankBalance: null,
      runway: null,
      plaidConnected: true,
      monthlyBurnRate: null,
    });
  });

  it('returns an empty content calendar placeholder', async () => {
    await expect(fetchContentCalendar()).resolves.toEqual({
      postsScheduledToday: [],
    });
  });

  it('builds AI highlights from churn risk and no-deposit appointments', async () => {
    fetchFirst
      .mockResolvedValueOnce([
        {
          fields: {
            'Churn Risk Score': 82,
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          fields: {
            Service: 'Sofwave',
            Time: '14:00',
            'Deposit Paid': false,
          },
        },
      ]);

    await expect(fetchAIHighlights()).resolves.toEqual({
      topChurnRiskClient: {
        name: 'At-risk Member',
        score: 82,
        lastVisit: '',
      },
      highestNoShowRisk: {
        clientName: 'Appointment (no deposit)',
        service: 'Sofwave',
        time: '14:00',
        score: 65,
      },
      revenueAnomaly: null,
    });
  });

  it('returns the first KPI snapshot fields when a daily snapshot exists', async () => {
    fetchFirst.mockResolvedValueOnce([
      {
        fields: {
          revenue: 3025,
          consultations: 4,
        },
      },
    ]);

    await expect(fetchKPISnapshot('2026-04-09')).resolves.toEqual({
      revenue: 3025,
      consultations: 4,
    });
  });

  it('aggregates provider performance across completed and no-show appointments', async () => {
    fetchAll.mockResolvedValueOnce([
      {
        fields: {
          Provider: 'Rina',
          Status: 'Completed',
          'Amount Paid': 2750,
        },
      },
      {
        fields: {
          Provider: 'Rina',
          Status: 'No-Show',
          'Amount Paid': 0,
        },
      },
    ]);

    await expect(fetchProviderPerformance('2026-04-01', '2026-04-09')).resolves.toEqual({
      Rina: {
        revenue: 2750,
        appointments: 2,
        shows: 1,
        noShows: 1,
      },
    });
  });

  it('summarizes client growth from status counts', async () => {
    fetchAll.mockResolvedValueOnce([
      { fields: { Status: 'New Lead' } },
      { fields: { Status: 'Churned' } },
      { fields: { Status: 'Active' } },
    ]);

    await expect(fetchClientGrowth()).resolves.toEqual({
      totalClients: 3,
      newClients: 1,
      churnedClients: 1,
      netGrowth: 2,
    });
  });
});
