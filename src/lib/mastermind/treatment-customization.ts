import { UNIFIED_CATALOG, getServiceById, type UnifiedService } from '@/data/services/unified-catalog';
import type {
  MastermindSession,
  MastermindTreatment,
  TreatmentPlanCustomization,
  TreatmentPlanCustomizationItem,
} from '@/types/mastermind';

const BOTOX_AREAS = [
  'Forehead',
  'Glabella / frown lines',
  "Crow's feet",
  'Brow lift',
  'Bunny lines',
  'Lip flip',
  'DAO / mouth corners',
  'Chin dimpling',
  'Masseters / jaw slimming',
  'Neck bands',
  'Underarms / sweating',
];

const FILLER_AREAS = [
  'Lips',
  'Cheeks',
  'Chin',
  'Jawline',
  'Temples',
  'Nasolabial folds',
  'Marionette lines',
  'Tear troughs',
  'Hands',
];

const SCULPTRA_AREAS = [
  'Temples',
  'Cheeks',
  'Lower face',
  'Jawline',
  'Neck',
  'Hip dips',
  'Buttocks',
];

function normalizeLabel(value: string): string {
  return value
    .replace(/^Laser Hair Removal - /i, '')
    .replace(/^RF Microneedling - /i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date): string {
  if (Number.isNaN(date.getTime())) return toDateInputValue(new Date());
  return date.toISOString().slice(0, 10);
}

export function daysFromSubmission(submissionDate: string, scheduledDate: string): number {
  const start = new Date(submissionDate);
  const scheduled = new Date(scheduledDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(scheduled.getTime())) return 0;
  return Math.max(0, Math.round((scheduled.getTime() - start.getTime()) / 86_400_000));
}

function getSequenceWeek(treatmentId: string | undefined, session: MastermindSession): number {
  if (!treatmentId || !session.mastermindPlan?.sequencing) return 0;
  for (const phase of session.mastermindPlan.sequencing) {
    const found = phase.treatments.find((t) => t.treatmentId === treatmentId);
    if (found) return found.week || 0;
  }
  return 0;
}

function findCatalogMatch(treatment: MastermindTreatment): UnifiedService | undefined {
  const normalizedTreatment = treatment.treatmentName.toLowerCase();
  return UNIFIED_CATALOG.find((service) => {
    const normalizedService = service.name.toLowerCase();
    return normalizedTreatment === normalizedService ||
      normalizedTreatment.includes(normalizedService) ||
      normalizedService.includes(normalizedTreatment);
  });
}

function recalculateItemTotal(
  item: TreatmentPlanCustomizationItem,
): TreatmentPlanCustomizationItem {
  const service = item.serviceId ? getServiceById(item.serviceId) : undefined;
  const discount = service?.packageDiscounts
    ?.filter((d) => item.sessions >= d.qty)
    .sort((a, b) => b.discount - a.discount)[0]?.discount ?? 0;
  const base = Math.max(0, item.perSession) * Math.max(1, item.sessions);
  return {
    ...item,
    totalEstimate: Math.round(base * (1 - discount / 100)),
  };
}

function itemFromTreatment(
  treatment: MastermindTreatment,
  session: MastermindSession,
): TreatmentPlanCustomizationItem {
  const service = findCatalogMatch(treatment);
  const recommendedWeek = getSequenceWeek(treatment.id, session);
  const submissionDate = session.createdAt || new Date().toISOString();
  const scheduledDate = toDateInputValue(addDays(new Date(submissionDate), recommendedWeek * 7));
  return recalculateItemTotal({
    id: `ai_${treatment.id}`,
    treatmentId: treatment.id,
    serviceId: service?.id,
    treatmentName: treatment.treatmentName,
    category: treatment.category,
    selected: true,
    sessions: Math.max(1, treatment.sessionsRequired || service?.sessions || 1),
    perSession: Math.max(0, treatment.perSession || service?.price || 0),
    totalEstimate: Math.max(0, treatment.totalEstimate || treatment.perSession || service?.price || 0),
    recommendedWeek,
    scheduledDate,
    scheduledDay: daysFromSubmission(submissionDate, scheduledDate),
    targetAreas: treatment.targetZones?.map((zone) => zone.replace(/_/g, ' ')) ?? service?.bodyAreas ?? [],
    priority: treatment.priority,
    source: 'ai',
  });
}

export function createCustomizationItemFromService(
  service: UnifiedService,
  session: MastermindSession,
  index: number,
): TreatmentPlanCustomizationItem {
  const submissionDate = session.createdAt || new Date().toISOString();
  const recommendedWeek = Math.max(0, index);
  const scheduledDate = toDateInputValue(addDays(new Date(submissionDate), recommendedWeek * 7));
  return recalculateItemTotal({
    id: `staff_${service.id}_${Date.now()}`,
    serviceId: service.id,
    treatmentName: service.name,
    category: service.category,
    selected: true,
    sessions: Math.max(1, service.sessions || 1),
    perSession: service.price,
    totalEstimate: service.price * Math.max(1, service.sessions || 1),
    recommendedWeek,
    scheduledDate,
    scheduledDay: daysFromSubmission(submissionDate, scheduledDate),
    targetAreas: service.parentSlug === 'laser-hair-removal'
      ? [normalizeLabel(service.name)]
      : service.bodyAreas.map(normalizeLabel),
    priority: 'recommended',
    source: 'staff',
  });
}

export function summarizeTreatmentCustomization(
  customization: Omit<TreatmentPlanCustomization, 'selectedTotal' | 'selectedSessionCount'>,
): TreatmentPlanCustomization {
  const items = customization.items.map((item) => {
    const scheduledDay = daysFromSubmission(customization.submissionDate, item.scheduledDate);
    return recalculateItemTotal({ ...item, scheduledDay });
  });
  const selected = items.filter((item) => item.selected);
  return {
    ...customization,
    items,
    selectedTotal: selected.reduce((sum, item) => sum + item.totalEstimate, 0),
    selectedSessionCount: selected.reduce((sum, item) => sum + item.sessions, 0),
  };
}

export function buildTreatmentPlanCustomization(
  session: MastermindSession,
): TreatmentPlanCustomization | null {
  if (session.treatmentPlanCustomization) {
    return summarizeTreatmentCustomization(session.treatmentPlanCustomization);
  }

  const plan = session.mastermindPlan;
  if (!plan) return null;

  const recommendations = plan.recommendations || { primary: [], complementary: [], maintenance: [] };
  const items = [
    ...(recommendations.primary || []),
    ...(recommendations.complementary || []),
    ...(recommendations.maintenance || []),
  ].map((treatment) => itemFromTreatment(treatment, session));

  return summarizeTreatmentCustomization({
    updatedAt: new Date().toISOString(),
    submissionDate: session.createdAt || new Date().toISOString(),
    items,
  });
}

export function getTreatmentAreaOptions(item: TreatmentPlanCustomizationItem): string[] {
  const name = item.treatmentName.toLowerCase();
  const service = item.serviceId ? getServiceById(item.serviceId) : undefined;

  if (name.includes('botox') || name.includes('dysport') || name.includes('neurotoxin')) {
    return BOTOX_AREAS;
  }

  if (name.includes('sculptra')) {
    return SCULPTRA_AREAS;
  }

  if (name.includes('filler') || name.includes('radiesse') || name.includes('juvederm') || name.includes('restylane')) {
    return FILLER_AREAS;
  }

  if (item.category === 'laser-hair-removal' || service?.parentSlug === 'laser-hair-removal') {
    return UNIFIED_CATALOG
      .filter((svc) => svc.parentSlug === 'laser-hair-removal')
      .map((svc) => normalizeLabel(svc.name));
  }

  const areas = service?.bodyAreas?.length ? service.bodyAreas : item.targetAreas;
  return Array.from(new Set(areas.map(normalizeLabel).filter(Boolean)));
}

export function formatTreatmentCategory(value: string): string {
  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

export function treatmentItemKey(item: TreatmentPlanCustomizationItem): string {
  return item.serviceId || item.treatmentId || slug(item.treatmentName);
}
