import type { IntakeForm } from "@/lib/booking/types";

export interface CriticalConsentTemplate {
  type: string;
  [key: string]: unknown;
}

export function buildIntakeForm(
  clientId: string,
  appointmentId?: string,
  serviceId?: string,
  previousData?: Partial<Record<string, string | string[] | boolean | number>>
): IntakeForm;
export function getRequiredConsents(serviceId: string): CriticalConsentTemplate[];
export function calculateFormProgress(
  form: IntakeForm,
  requiredConsents: CriticalConsentTemplate[]
): { isReady: boolean; [key: string]: unknown };
export function updateFormField(
  form: IntakeForm,
  sectionId: string,
  fieldId: string,
  value: string | string[] | boolean | number
): IntakeForm;
export function signConsent(
  form: IntakeForm,
  consent: CriticalConsentTemplate,
  signatureData?: string
): IntakeForm;
