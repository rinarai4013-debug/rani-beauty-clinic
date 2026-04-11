import type { Appointment, IntakeForm, WaitlistEntry } from "@/lib/booking/types";

export function loadAppointmentsForRange(startDate: string, endDate: string): Promise<Appointment[]>;
export function loadAppointmentsForDate(date: string): Promise<Appointment[]>;
export function createAppointmentRecord(appointment: Appointment): Promise<string>;
export function updateAppointmentRecord(
  appointmentId: string,
  fields: Record<string, unknown>
): Promise<void>;
export function loadWaitlistEntries(serviceId?: string): Promise<WaitlistEntry[]>;
export function addWaitlistEntry(entry: WaitlistEntry): Promise<string>;
export function removeWaitlistEntry(entryId: string, reason?: string): Promise<void>;
export function getOrCreateIntakeDraft(
  clientId: string,
  appointmentId: string | undefined,
  serviceId: string | undefined,
  createForm: () => IntakeForm
): Promise<{ form: IntakeForm; recordId: string }>;
export function getIntakeDraftByFormId(formId: string): Promise<IntakeForm | null>;
export function updateIntakeDraftByFormId(
  formId: string,
  form: IntakeForm,
  status?: "draft" | "submitted"
): Promise<void>;
