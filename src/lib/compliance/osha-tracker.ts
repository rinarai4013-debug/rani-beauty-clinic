/**
 * OSHA Compliance Tracker
 * Bloodborne pathogen training, sharps disposal, SDS sheets,
 * incident reports, PPE inventory management.
 */

import type {
  SharpsDisposalLog,
  SDSSheet,
  IncidentReport,
  PPEInventory,
  TrainingCompletion,
} from '@/types/compliance';

// ── In-memory stores ─────────────────────────────────────────────────

let sharpsLogs: SharpsDisposalLog[] = [];
let sdsSheets: SDSSheet[] = [];
let incidents: IncidentReport[] = [];
let ppeInventory: PPEInventory[] = [];

// ── Sharps Disposal ──────────────────────────────────────────────────

export function addSharpsLog(params: Omit<SharpsDisposalLog, 'id'>): SharpsDisposalLog {
  const log: SharpsDisposalLog = {
    id: `sharps_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  sharpsLogs = [...sharpsLogs, log];
  return log;
}

export function updateSharpsLog(
  id: string,
  updates: Partial<SharpsDisposalLog>
): SharpsDisposalLog | null {
  const index = sharpsLogs.findIndex((s) => s.id === id);
  if (index === -1) return null;
  sharpsLogs[index] = { ...sharpsLogs[index], ...updates };
  return sharpsLogs[index];
}

export function getSharpsLogs(): SharpsDisposalLog[] {
  return [...sharpsLogs].sort(
    (a, b) => new Date(b.lastCheckedDate).getTime() - new Date(a.lastCheckedDate).getTime()
  );
}

export function getSharpsAlerts(): SharpsDisposalLog[] {
  return sharpsLogs.filter(
    (s) => s.fillLevel >= 75 || s.status === 'three_quarter_full' || s.status === 'awaiting_pickup'
  );
}

// ── SDS Sheets ───────────────────────────────────────────────────────

export function addSDSSheet(params: Omit<SDSSheet, 'id'>): SDSSheet {
  const sheet: SDSSheet = {
    id: `sds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  sdsSheets = [...sdsSheets, sheet];
  return sheet;
}

export function updateSDSSheet(id: string, updates: Partial<SDSSheet>): SDSSheet | null {
  const index = sdsSheets.findIndex((s) => s.id === id);
  if (index === -1) return null;
  sdsSheets[index] = { ...sdsSheets[index], ...updates };
  return sdsSheets[index];
}

export function getSDSSheets(): SDSSheet[] {
  return [...sdsSheets].sort((a, b) => a.productName.localeCompare(b.productName));
}

export function getExpiredSDS(): SDSSheet[] {
  const now = new Date();
  return sdsSheets.filter((s) => new Date(s.expirationDate) <= now);
}

// ── Incident Reports ─────────────────────────────────────────────────

export function createIncidentReport(params: Omit<IncidentReport, 'id' | 'status'>): IncidentReport {
  const report: IncidentReport = {
    id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: 'reported',
    ...params,
  };
  incidents = [...incidents, report];
  return report;
}

export function updateIncident(id: string, updates: Partial<IncidentReport>): IncidentReport | null {
  const index = incidents.findIndex((i) => i.id === id);
  if (index === -1) return null;
  incidents[index] = { ...incidents[index], ...updates };
  return incidents[index];
}

export function getIncidents(filters?: {
  type?: IncidentReport['type'];
  severity?: IncidentReport['severity'];
  status?: IncidentReport['status'];
  startDate?: string;
  endDate?: string;
}): IncidentReport[] {
  let result = [...incidents];
  if (filters?.type) result = result.filter((i) => i.type === filters.type);
  if (filters?.severity) result = result.filter((i) => i.severity === filters.severity);
  if (filters?.status) result = result.filter((i) => i.status === filters.status);
  if (filters?.startDate) {
    const start = new Date(filters.startDate).getTime();
    result = result.filter((i) => new Date(i.date).getTime() >= start);
  }
  if (filters?.endDate) {
    const end = new Date(filters.endDate).getTime();
    result = result.filter((i) => new Date(i.date).getTime() <= end);
  }
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getOpenIncidents(): IncidentReport[] {
  return incidents
    .filter((i) => i.status !== 'resolved' && i.status !== 'closed')
    .sort((a, b) => {
      const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
}

export function isOSHARecordable(incident: IncidentReport): boolean {
  // OSHA recordability criteria for medical aesthetics
  if (incident.severity === 'critical' || incident.severity === 'serious') return true;
  if (incident.type === 'needlestick') return true;
  if (incident.type === 'chemical_spill' && incident.severity !== 'minor') return true;
  return false;
}

// ── PPE Inventory ────────────────────────────────────────────────────

export function addPPEItem(params: Omit<PPEInventory, 'id' | 'status'>): PPEInventory {
  const status: PPEInventory['status'] = params.currentStock <= 0
    ? 'critical'
    : params.currentStock <= params.minimumStock
      ? 'low'
      : 'adequate';

  const item: PPEInventory = {
    id: `ppe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status,
    ...params,
  };
  ppeInventory = [...ppeInventory, item];
  return item;
}

export function updatePPEItem(id: string, updates: Partial<PPEInventory>): PPEInventory | null {
  const index = ppeInventory.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated = { ...ppeInventory[index], ...updates };

  // Auto-calculate status
  if (updates.currentStock !== undefined || updates.minimumStock !== undefined) {
    const stock = updates.currentStock ?? ppeInventory[index].currentStock;
    const min = updates.minimumStock ?? ppeInventory[index].minimumStock;
    updated.status = stock <= 0 ? 'critical' : stock <= min ? 'low' : 'adequate';
  }

  ppeInventory[index] = updated;
  return ppeInventory[index];
}

export function getPPEInventory(): PPEInventory[] {
  return [...ppeInventory].sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export function getPPEAlerts(): PPEInventory[] {
  return ppeInventory.filter((p) => p.status === 'low' || p.status === 'critical');
}

// ── OSHA Compliance Score ────────────────────────────────────────────

export function calculateOSHAScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];

  // Sharps disposal (20 points)
  let sharpsScore = 20;
  const sharpsIssues: string[] = [];
  const overfilled = sharpsLogs.filter((s) => s.fillLevel >= 75);
  if (overfilled.length > 0) {
    sharpsScore -= overfilled.length * 5;
    sharpsIssues.push(`${overfilled.length} container(s) above 75% fill`);
  }
  areas.push({ area: 'Sharps Disposal', score: Math.max(0, sharpsScore), maxScore: 20, issues: sharpsIssues });

  // SDS sheets (20 points)
  let sdsScore = 20;
  const sdsIssues: string[] = [];
  const expiredSDS = getExpiredSDS();
  if (expiredSDS.length > 0) {
    sdsScore -= expiredSDS.length * 5;
    sdsIssues.push(`${expiredSDS.length} expired SDS sheet(s)`);
  }
  areas.push({ area: 'SDS Compliance', score: Math.max(0, sdsScore), maxScore: 20, issues: sdsIssues });

  // Incident management (20 points)
  let incidentScore = 20;
  const incidentIssues: string[] = [];
  const openIncidents = getOpenIncidents();
  const criticalOpen = openIncidents.filter((i) => i.severity === 'critical' || i.severity === 'serious');
  if (criticalOpen.length > 0) {
    incidentScore -= criticalOpen.length * 10;
    incidentIssues.push(`${criticalOpen.length} critical/serious open incident(s)`);
  }
  if (openIncidents.length > 3) {
    incidentScore -= 5;
    incidentIssues.push(`${openIncidents.length} total open incidents`);
  }
  areas.push({ area: 'Incident Management', score: Math.max(0, incidentScore), maxScore: 20, issues: incidentIssues });

  // PPE inventory (20 points)
  let ppeScore = 20;
  const ppeIssues: string[] = [];
  const ppeAlerts = getPPEAlerts();
  const critical = ppeAlerts.filter((p) => p.status === 'critical');
  const low = ppeAlerts.filter((p) => p.status === 'low');
  if (critical.length > 0) {
    ppeScore -= critical.length * 8;
    ppeIssues.push(`${critical.length} PPE item(s) at critical level`);
  }
  if (low.length > 0) {
    ppeScore -= low.length * 3;
    ppeIssues.push(`${low.length} PPE item(s) at low level`);
  }
  areas.push({ area: 'PPE Inventory', score: Math.max(0, ppeScore), maxScore: 20, issues: ppeIssues });

  // General compliance (20 points) - workplace safety
  let generalScore = 20;
  const generalIssues: string[] = [];
  // Check for recent inspections, fire safety, etc.
  areas.push({ area: 'General Safety', score: generalScore, maxScore: 20, issues: generalIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── OSHA Inspection Checklist ────────────────────────────────────────

export interface InspectionChecklistItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes?: string;
}

export function getOSHAInspectionChecklist(): InspectionChecklistItem[] {
  return [
    { id: 'osha_1', category: 'Bloodborne Pathogens', item: 'Exposure Control Plan posted and current', required: true, status: 'pending' },
    { id: 'osha_2', category: 'Bloodborne Pathogens', item: 'Annual BBP training completed for all staff', required: true, status: 'pending' },
    { id: 'osha_3', category: 'Bloodborne Pathogens', item: 'Sharps containers properly labeled and not overfilled', required: true, status: 'pending' },
    { id: 'osha_4', category: 'Bloodborne Pathogens', item: 'Post-exposure evaluation procedures documented', required: true, status: 'pending' },
    { id: 'osha_5', category: 'Bloodborne Pathogens', item: 'Hepatitis B vaccination offered to all at-risk employees', required: true, status: 'pending' },
    { id: 'osha_6', category: 'Hazard Communication', item: 'SDS sheets accessible for all hazardous chemicals', required: true, status: 'pending' },
    { id: 'osha_7', category: 'Hazard Communication', item: 'All chemical containers properly labeled', required: true, status: 'pending' },
    { id: 'osha_8', category: 'Hazard Communication', item: 'HazCom training completed for all staff', required: true, status: 'pending' },
    { id: 'osha_9', category: 'PPE', item: 'Appropriate PPE available and in good condition', required: true, status: 'pending' },
    { id: 'osha_10', category: 'PPE', item: 'PPE training documented for all employees', required: true, status: 'pending' },
    { id: 'osha_11', category: 'Emergency', item: 'Emergency action plan posted', required: true, status: 'pending' },
    { id: 'osha_12', category: 'Emergency', item: 'Fire extinguishers inspected and accessible', required: true, status: 'pending' },
    { id: 'osha_13', category: 'Emergency', item: 'First aid kit stocked and accessible', required: true, status: 'pending' },
    { id: 'osha_14', category: 'Emergency', item: 'Emergency exits clearly marked and unobstructed', required: true, status: 'pending' },
    { id: 'osha_15', category: 'Recordkeeping', item: 'OSHA 300 Log current (if applicable)', required: false, status: 'pending' },
    { id: 'osha_16', category: 'Recordkeeping', item: 'Incident reports filed within required timeframe', required: true, status: 'pending' },
    { id: 'osha_17', category: 'General Safety', item: 'Slip/trip/fall hazards addressed', required: true, status: 'pending' },
    { id: 'osha_18', category: 'General Safety', item: 'Ergonomic assessments conducted', required: false, status: 'pending' },
    { id: 'osha_19', category: 'Infection Control', item: 'Autoclave/sterilization logs current', required: true, status: 'pending' },
    { id: 'osha_20', category: 'Infection Control', item: 'Hand hygiene supplies adequate', required: true, status: 'pending' },
  ];
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedOSHAData(data: {
  sharpsLogs?: SharpsDisposalLog[];
  sdsSheets?: SDSSheet[];
  incidents?: IncidentReport[];
  ppeInventory?: PPEInventory[];
}): void {
  if (data.sharpsLogs) sharpsLogs = [...sharpsLogs, ...data.sharpsLogs];
  if (data.sdsSheets) sdsSheets = [...sdsSheets, ...data.sdsSheets];
  if (data.incidents) incidents = [...incidents, ...data.incidents];
  if (data.ppeInventory) ppeInventory = [...ppeInventory, ...data.ppeInventory];
}

export function clearOSHAData(): void {
  sharpsLogs = [];
  sdsSheets = [];
  incidents = [];
  ppeInventory = [];
}
