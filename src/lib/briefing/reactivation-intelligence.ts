import { fetchAll, Tables } from '@/lib/airtable/client';
import { FIELDS } from '@/lib/airtable/tables';

export interface ReactivationOpportunity {
  clientName: string;
  status: string;
  preferredContact: string;
  estimatedValue: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
}

export interface ReactivationIntelligence {
  totalRecoverableValue: number;
  lapsed30: number;
  lapsed60: number;
  lapsed90: number;
  churned: number;
  highPriorityCount: number;
  topOpportunities: ReactivationOpportunity[];
}

const STATUS_VALUES = ['Lapsed 30', 'Lapsed 60', 'Lapsed 90', 'Churned'] as const;

const STATUS_VALUE_MAP: Record<(typeof STATUS_VALUES)[number], number> = {
  'Lapsed 30': 350,
  'Lapsed 60': 550,
  'Lapsed 90': 850,
  Churned: 250,
};

function getPriority(status: string): ReactivationOpportunity['priority'] {
  if (status === 'Lapsed 90') return 'high';
  if (status === 'Lapsed 60') return 'medium';
  return 'low';
}

function getAction(status: string, preferredContact: string): string {
  const channel = preferredContact?.trim() || 'text';
  if (status === 'Lapsed 90') return `Personal ${channel.toLowerCase()} outreach with a strong win-back offer`;
  if (status === 'Lapsed 60') return `Send ${channel.toLowerCase()} reactivation message with consult availability`;
  if (status === 'Lapsed 30') return `Nudge via ${channel.toLowerCase()} before the lapse hardens`;
  return `Test a low-friction ${channel.toLowerCase()} win-back touchpoint`;
}

export async function fetchReactivationIntelligence(): Promise<ReactivationIntelligence> {
  try {
    const formula = `OR(${STATUS_VALUES.map((status) => `{${FIELDS.clients.status}} = '${status}'`).join(',')})`;
    const clients = await fetchAll<Record<string, unknown>>(
      Tables.clients(),
      {
        filterByFormula: formula,
        fields: [FIELDS.clients.name, FIELDS.clients.status, FIELDS.clients.preferredContact],
      },
      true,
    );

    let lapsed30 = 0;
    let lapsed60 = 0;
    let lapsed90 = 0;
    let churned = 0;

    const opportunities: ReactivationOpportunity[] = clients
      .map((record) => {
        const status = String(record.fields[FIELDS.clients.status] || '');
        const preferredContact = String(record.fields[FIELDS.clients.preferredContact] || 'Text');
        const clientName = String(record.fields[FIELDS.clients.name] || 'Unnamed client');

        if (status === 'Lapsed 30') lapsed30 += 1;
        if (status === 'Lapsed 60') lapsed60 += 1;
        if (status === 'Lapsed 90') lapsed90 += 1;
        if (status === 'Churned') churned += 1;

        const estimatedValue = STATUS_VALUE_MAP[status as keyof typeof STATUS_VALUE_MAP] ?? 200;

        return {
          clientName,
          status,
          preferredContact,
          estimatedValue,
          priority: getPriority(status),
          action: getAction(status, preferredContact),
        };
      })
      .sort((a, b) => b.estimatedValue - a.estimatedValue);

    return {
      totalRecoverableValue: opportunities.reduce((sum, opportunity) => sum + opportunity.estimatedValue, 0),
      lapsed30,
      lapsed60,
      lapsed90,
      churned,
      highPriorityCount: opportunities.filter((opportunity) => opportunity.priority === 'high').length,
      topOpportunities: opportunities.slice(0, 5),
    };
  } catch (error) {
    console.error('[Briefing] Failed to fetch reactivation intelligence:', error);
    return {
      totalRecoverableValue: 0,
      lapsed30: 0,
      lapsed60: 0,
      lapsed90: 0,
      churned: 0,
      highPriorityCount: 0,
      topOpportunities: [],
    };
  }
}
