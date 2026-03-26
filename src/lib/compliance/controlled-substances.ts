/**
 * Controlled Substances Engine
 * DEA Schedule tracking, reconciliation logs, waste witnessing,
 * chain of custody documentation.
 */

import type {
  ControlledSubstance,
  SubstanceReconciliation,
  WasteLog,
  ChainOfCustody,
  DEASchedule,
} from '@/types/compliance';
import { createAuditEntry } from './audit-trail';

// ── In-memory stores ─────────────────────────────────────────────────

let substances: ControlledSubstance[] = [];
let reconciliations: SubstanceReconciliation[] = [];
let wasteLogs: WasteLog[] = [];
let custodyChain: ChainOfCustody[] = [];

// ── Substance Management ─────────────────────────────────────────────

export function addSubstance(params: Omit<ControlledSubstance, 'id'>): ControlledSubstance {
  const substance: ControlledSubstance = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  substances = [...substances, substance];
  return substance;
}

export function updateSubstance(
  id: string,
  updates: Partial<ControlledSubstance>
): ControlledSubstance | null {
  const index = substances.findIndex((s) => s.id === id);
  if (index === -1) return null;
  substances[index] = { ...substances[index], ...updates };
  return substances[index];
}

export function getSubstances(filters?: {
  schedule?: DEASchedule;
  status?: ControlledSubstance['status'];
}): ControlledSubstance[] {
  let result = [...substances];
  if (filters?.schedule) result = result.filter((s) => s.schedule === filters.schedule);
  if (filters?.status) result = result.filter((s) => s.status === filters.status);
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function getSubstanceAlerts(): {
  lowStock: ControlledSubstance[];
  expiringSoon: ControlledSubstance[];
  expired: ControlledSubstance[];
  reconciliationDue: ControlledSubstance[];
} {
  const now = new Date();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  // Reconciliation is due if last reconciliation was more than 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return {
    lowStock: substances.filter((s) => s.status === 'low' || s.currentQuantity <= 5),
    expiringSoon: substances.filter(
      (s) => s.status !== 'expired' && new Date(s.expirationDate) <= thirtyDaysOut && new Date(s.expirationDate) > now
    ),
    expired: substances.filter(
      (s) => new Date(s.expirationDate) <= now
    ),
    reconciliationDue: substances.filter(
      (s) => s.status !== 'expired' && s.status !== 'destroyed' &&
             new Date(s.lastReconciliationDate) <= sevenDaysAgo
    ),
  };
}

// ── Reconciliation ───────────────────────────────────────────────────

export function performReconciliation(params: Omit<SubstanceReconciliation, 'id' | 'discrepancy' | 'status'>): SubstanceReconciliation {
  const discrepancy = params.actualCount - params.expectedCount;
  const status: SubstanceReconciliation['status'] = discrepancy === 0 ? 'matched' : 'discrepancy';

  const reconciliation: SubstanceReconciliation = {
    id: `recon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    discrepancy,
    status,
    ...params,
  };
  reconciliations = [...reconciliations, reconciliation];

  // Update substance last reconciliation date
  const substanceIndex = substances.findIndex((s) => s.id === params.substanceId);
  if (substanceIndex !== -1) {
    substances[substanceIndex] = {
      ...substances[substanceIndex],
      lastReconciliationDate: params.date,
      lastReconciliationBy: params.performedBy,
      currentQuantity: params.actualCount,
    };
  }

  createAuditEntry({
    userId: params.performedBy,
    userName: params.performedBy,
    userRole: 'provider',
    action: 'substance_reconcile',
    resourceType: 'controlled_substance',
    resourceId: params.substanceId,
    details: `Reconciliation of ${params.substanceName}: expected ${params.expectedCount}, actual ${params.actualCount}${discrepancy !== 0 ? ` (DISCREPANCY: ${discrepancy > 0 ? '+' : ''}${discrepancy})` : ''}`,
    ipAddress: '0.0.0.0',
  });

  return reconciliation;
}

export function resolveDiscrepancy(
  id: string,
  resolutionNotes: string
): SubstanceReconciliation | null {
  const index = reconciliations.findIndex((r) => r.id === id);
  if (index === -1) return null;
  reconciliations[index] = {
    ...reconciliations[index],
    status: 'resolved',
    resolutionNotes,
  };
  return reconciliations[index];
}

export function getReconciliations(substanceId?: string): SubstanceReconciliation[] {
  const result = substanceId
    ? reconciliations.filter((r) => r.substanceId === substanceId)
    : [...reconciliations];
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getUnresolvedDiscrepancies(): SubstanceReconciliation[] {
  return reconciliations.filter((r) => r.status === 'discrepancy');
}

// ── Waste Logging ────────────────────────────────────────────────────

export function logWaste(params: Omit<WasteLog, 'id'>): WasteLog {
  // Validate witness requirement
  if (!params.witnessedBy) {
    throw new Error('Controlled substance waste must be witnessed');
  }
  if (params.wastedBy === params.witnessedBy) {
    throw new Error('Witness must be a different person than the one wasting the substance');
  }

  const log: WasteLog = {
    id: `waste_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  wasteLogs = [...wasteLogs, log];

  // Update substance quantity
  const substanceIndex = substances.findIndex((s) => s.id === params.substanceId);
  if (substanceIndex !== -1) {
    const newQty = substances[substanceIndex].currentQuantity - params.quantityWasted;
    substances[substanceIndex] = {
      ...substances[substanceIndex],
      currentQuantity: Math.max(0, newQty),
      status: newQty <= 0 ? 'expired' : newQty <= 5 ? 'low' : 'in_stock',
    };
  }

  createAuditEntry({
    userId: params.wastedBy,
    userName: params.wastedBy,
    userRole: 'provider',
    action: 'substance_waste',
    resourceType: 'controlled_substance',
    resourceId: params.substanceId,
    details: `Wasted ${params.quantityWasted} ${params.unit} of ${params.substanceName} (Schedule ${params.schedule}). Reason: ${params.reason}. Witnessed by: ${params.witnessedBy}. Method: ${params.method}`,
    ipAddress: '0.0.0.0',
  });

  return log;
}

export function getWasteLogs(substanceId?: string): WasteLog[] {
  const result = substanceId
    ? wasteLogs.filter((w) => w.substanceId === substanceId)
    : [...wasteLogs];
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ── Chain of Custody ─────────────────────────────────────────────────

export function recordCustodyEvent(params: Omit<ChainOfCustody, 'id'>): ChainOfCustody {
  const event: ChainOfCustody = {
    id: `coc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  custodyChain = [...custodyChain, event];

  // Update substance quantity for dispensing/administering
  if (params.action === 'dispensed' || params.action === 'administered') {
    const substanceIndex = substances.findIndex((s) => s.id === params.substanceId);
    if (substanceIndex !== -1) {
      const newQty = substances[substanceIndex].currentQuantity - params.quantity;
      substances[substanceIndex] = {
        ...substances[substanceIndex],
        currentQuantity: Math.max(0, newQty),
        status: newQty <= 0 ? 'expired' : newQty <= 5 ? 'low' : 'in_stock',
      };
    }

    createAuditEntry({
      userId: params.toPerson,
      userName: params.toPerson,
      userRole: 'provider',
      action: 'substance_dispense',
      resourceType: 'controlled_substance',
      resourceId: params.substanceId,
      details: `${params.action} ${params.quantity} ${params.unit} of ${params.substanceName} from ${params.fromPerson} to ${params.toPerson}${params.patientId ? ` for patient ${params.patientId}` : ''}`,
      ipAddress: '0.0.0.0',
    });
  }

  return event;
}

export function getCustodyChain(substanceId: string): ChainOfCustody[] {
  return custodyChain
    .filter((c) => c.substanceId === substanceId)
    .sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
}

export function getFullCustodyChain(): ChainOfCustody[] {
  return [...custodyChain].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ── DEA Compliance Score ─────────────────────────────────────────────

export function calculateDEAScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];
  const alerts = getSubstanceAlerts();

  // Reconciliation currency (30 points)
  let reconScore = 30;
  const reconIssues: string[] = [];
  if (alerts.reconciliationDue.length > 0) {
    reconScore -= alerts.reconciliationDue.length * 10;
    reconIssues.push(`${alerts.reconciliationDue.length} substance(s) overdue for reconciliation`);
  }
  const unresolvedDisc = getUnresolvedDiscrepancies();
  if (unresolvedDisc.length > 0) {
    reconScore -= unresolvedDisc.length * 15;
    reconIssues.push(`${unresolvedDisc.length} unresolved discrepancy(ies) - CRITICAL`);
  }
  areas.push({ area: 'Reconciliation', score: Math.max(0, reconScore), maxScore: 30, issues: reconIssues });

  // Inventory management (25 points)
  let invScore = 25;
  const invIssues: string[] = [];
  if (alerts.expired.length > 0) {
    invScore -= alerts.expired.length * 10;
    invIssues.push(`${alerts.expired.length} expired substance(s)`);
  }
  if (alerts.expiringSoon.length > 0) {
    invScore -= alerts.expiringSoon.length * 3;
    invIssues.push(`${alerts.expiringSoon.length} substance(s) expiring within 30 days`);
  }
  areas.push({ area: 'Inventory', score: Math.max(0, invScore), maxScore: 25, issues: invIssues });

  // Waste documentation (25 points)
  let wasteScore = 25;
  const wasteIssues: string[] = [];
  // Check that all waste logs have proper witnessing
  const unwitnessed = wasteLogs.filter((w) => !w.witnessedBy);
  if (unwitnessed.length > 0) {
    wasteScore = 0;
    wasteIssues.push(`${unwitnessed.length} waste event(s) without witness - CRITICAL`);
  }
  areas.push({ area: 'Waste Documentation', score: wasteScore, maxScore: 25, issues: wasteIssues });

  // Chain of custody (20 points)
  let cocScore = 20;
  const cocIssues: string[] = [];
  // Verify all dispensing events have proper documentation
  const dispensingEvents = custodyChain.filter((c) => c.action === 'dispensed' || c.action === 'administered');
  const undocumented = dispensingEvents.filter((c) => !c.lotNumber);
  if (undocumented.length > 0) {
    cocScore -= undocumented.length * 5;
    cocIssues.push(`${undocumented.length} dispensing event(s) missing lot number`);
  }
  areas.push({ area: 'Chain of Custody', score: Math.max(0, cocScore), maxScore: 20, issues: cocIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedDEAData(data: {
  substances?: ControlledSubstance[];
  reconciliations?: SubstanceReconciliation[];
  wasteLogs?: WasteLog[];
  custodyChain?: ChainOfCustody[];
}): void {
  if (data.substances) substances = [...substances, ...data.substances];
  if (data.reconciliations) reconciliations = [...reconciliations, ...data.reconciliations];
  if (data.wasteLogs) wasteLogs = [...wasteLogs, ...data.wasteLogs];
  if (data.custodyChain) custodyChain = [...custodyChain, ...data.custodyChain];
}

export function clearDEAData(): void {
  substances = [];
  reconciliations = [];
  wasteLogs = [];
  custodyChain = [];
}
