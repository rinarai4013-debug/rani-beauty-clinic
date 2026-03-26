// Compliance system type definitions

// ── HIPAA ────────────────────────────────────────────────────────────

export interface PHIAccessLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  patientId: string;
  patientName: string;
  action: 'view' | 'create' | 'update' | 'delete' | 'export' | 'print';
  dataCategory: 'demographics' | 'medical_history' | 'treatment_records' | 'photos' | 'billing' | 'insurance' | 'consents' | 'lab_results';
  ipAddress: string;
  timestamp: string;
  details?: string;
}

export interface PHIDisclosure {
  id: string;
  patientId: string;
  patientName: string;
  recipientName: string;
  recipientOrg: string;
  purpose: 'treatment' | 'payment' | 'operations' | 'legal' | 'patient_request' | 'public_health' | 'research';
  dataDisclosed: string;
  method: 'fax' | 'email' | 'mail' | 'electronic' | 'verbal' | 'in_person';
  authorizedBy: string;
  authorizationDate: string;
  disclosureDate: string;
  expirationDate?: string;
  notes?: string;
}

export interface BreachNotification {
  id: string;
  discoveryDate: string;
  breachDate: string;
  reportedDate?: string;
  description: string;
  dataInvolved: string[];
  individualsAffected: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'discovered' | 'investigating' | 'contained' | 'notified' | 'resolved';
  rootCause?: string;
  correctiveActions: string[];
  hhs_reported: boolean;
  individuals_notified: boolean;
  media_notified: boolean;
  investigator: string;
  resolutionDate?: string;
}

export interface TrainingCompletion {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  trainingType: 'hipaa_privacy' | 'hipaa_security' | 'osha_bbp' | 'osha_hazcom' | 'osha_general' | 'state_regulations' | 'dea_handling' | 'device_safety' | 'consent_procedures' | 'fire_safety' | 'emergency_procedures' | 'infection_control';
  completedDate: string;
  expirationDate: string;
  score?: number;
  passingScore: number;
  passed: boolean;
  certificateUrl?: string;
  renewalRequired: boolean;
}

export interface BusinessAssociateAgreement {
  id: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  serviceDescription: string;
  effectiveDate: string;
  expirationDate: string;
  renewalDate: string;
  status: 'active' | 'expired' | 'pending_renewal' | 'terminated';
  signedBy: string;
  documentUrl?: string;
  lastReviewDate: string;
  nextReviewDate: string;
}

// ── OSHA ─────────────────────────────────────────────────────────────

export interface SharpsDisposalLog {
  id: string;
  containerId: string;
  location: string;
  fillLevel: number; // 0-100
  lastCheckedDate: string;
  lastReplacedDate: string;
  replacedBy: string;
  disposalCompany: string;
  manifestNumber?: string;
  status: 'in_use' | 'three_quarter_full' | 'awaiting_pickup' | 'disposed';
}

export interface SDSSheet {
  id: string;
  productName: string;
  manufacturer: string;
  hazardClassification: string[];
  signalWord: 'danger' | 'warning' | 'none';
  location: string;
  lastUpdated: string;
  expirationDate: string;
  documentUrl?: string;
  ghs_pictograms: string[];
}

export interface IncidentReport {
  id: string;
  type: 'injury' | 'exposure' | 'near_miss' | 'property_damage' | 'adverse_event' | 'needlestick' | 'chemical_spill' | 'slip_fall';
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  date: string;
  time: string;
  location: string;
  reportedBy: string;
  involvedParties: string[];
  description: string;
  immediateAction: string;
  rootCause?: string;
  correctiveActions: string[];
  oshaRecordable: boolean;
  status: 'reported' | 'investigating' | 'corrective_action' | 'resolved' | 'closed';
  followUpDate?: string;
  closedDate?: string;
  closedBy?: string;
  witnessNames?: string[];
}

export interface PPEInventory {
  id: string;
  itemName: string;
  category: 'gloves' | 'masks' | 'gowns' | 'eye_protection' | 'face_shields' | 'shoe_covers' | 'sharps_containers';
  currentStock: number;
  minimumStock: number;
  lastOrderDate: string;
  lastReceivedDate: string;
  supplier: string;
  unitCost: number;
  expirationDate?: string;
  location: string;
  status: 'adequate' | 'low' | 'critical' | 'ordered';
}

// ── State Regulations ────────────────────────────────────────────────

export type ProviderType = 'physician' | 'arnp' | 'pa' | 'rn' | 'lpn' | 'ma' | 'esthetician' | 'laser_technician';

export interface DelegationAgreement {
  id: string;
  supervisingPhysician: string;
  supervisingPhysicianLicense: string;
  delegateName: string;
  delegateType: ProviderType;
  delegateLicense: string;
  delegatedProcedures: string[];
  restrictions: string[];
  effectiveDate: string;
  expirationDate: string;
  renewalDate: string;
  status: 'active' | 'expired' | 'pending' | 'revoked';
  lastReviewDate: string;
  documentUrl?: string;
}

export interface ProviderLicense {
  id: string;
  providerName: string;
  providerType: ProviderType;
  licenseNumber: string;
  licenseType: string;
  issuingAuthority: string;
  state: string;
  issueDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked' | 'pending_renewal';
  ceCreditsRequired: number;
  ceCreditsCompleted: number;
  ceDeadline: string;
  verificationUrl?: string;
  documentUrl?: string;
  renewalAlertDays: number;
  lastVerified: string;
}

export interface ScopeOfPractice {
  providerType: ProviderType;
  label: string;
  allowedProcedures: string[];
  restrictedProcedures: string[];
  requiresSupervision: boolean;
  supervisionType?: 'direct' | 'indirect' | 'general';
  prescriptiveAuthority: boolean;
  deaRegistrationRequired: boolean;
  notes: string;
}

// ── Controlled Substances ────────────────────────────────────────────

export type DEASchedule = 'II' | 'III' | 'IV' | 'V';

export interface ControlledSubstance {
  id: string;
  name: string;
  genericName: string;
  schedule: DEASchedule;
  ndc: string;
  manufacturer: string;
  strength: string;
  form: 'vial' | 'syringe' | 'tablet' | 'capsule' | 'patch' | 'solution' | 'powder';
  currentQuantity: number;
  unit: string;
  location: string;
  lotNumber: string;
  expirationDate: string;
  lastReconciliationDate: string;
  lastReconciliationBy: string;
  status: 'in_stock' | 'low' | 'expired' | 'recalled' | 'destroyed';
}

export interface SubstanceReconciliation {
  id: string;
  substanceId: string;
  substanceName: string;
  date: string;
  performedBy: string;
  witnessedBy: string;
  expectedCount: number;
  actualCount: number;
  discrepancy: number;
  discrepancyExplanation?: string;
  status: 'matched' | 'discrepancy' | 'resolved' | 'reported';
  resolutionNotes?: string;
}

export interface WasteLog {
  id: string;
  substanceId: string;
  substanceName: string;
  schedule: DEASchedule;
  quantityWasted: number;
  unit: string;
  reason: 'partial_dose' | 'contaminated' | 'expired' | 'damaged' | 'patient_refusal';
  wastedBy: string;
  witnessedBy: string;
  date: string;
  time: string;
  patientId?: string;
  lotNumber: string;
  method: 'drain' | 'sharps_container' | 'pharmaceutical_waste' | 'reverse_distribution';
}

export interface ChainOfCustody {
  id: string;
  substanceId: string;
  substanceName: string;
  action: 'received' | 'dispensed' | 'administered' | 'transferred' | 'wasted' | 'returned' | 'destroyed';
  quantity: number;
  unit: string;
  fromPerson: string;
  toPerson: string;
  date: string;
  time: string;
  witnessedBy?: string;
  patientId?: string;
  notes?: string;
  lotNumber: string;
}

// ── Device Compliance ────────────────────────────────────────────────

export interface MedicalDevice {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  fda510kNumber?: string;
  fdaClearanceDate?: string;
  deviceClass: 'I' | 'II' | 'III';
  category: 'laser' | 'rf' | 'ultrasound' | 'light_based' | 'injection_device' | 'diagnostic' | 'surgical';
  purchaseDate: string;
  warrantyExpiration: string;
  location: string;
  status: 'operational' | 'maintenance_due' | 'under_repair' | 'decommissioned' | 'recalled';
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  maintenanceProvider: string;
  maintenanceContract: boolean;
  documentUrl?: string;
}

export interface MaintenanceRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  type: 'preventive' | 'corrective' | 'calibration' | 'inspection' | 'emergency';
  date: string;
  performedBy: string;
  company: string;
  description: string;
  partsReplaced?: string[];
  cost: number;
  nextScheduledDate: string;
  status: 'completed' | 'pending' | 'in_progress' | 'cancelled';
  documentUrl?: string;
}

export interface CalibrationLog {
  id: string;
  deviceId: string;
  deviceName: string;
  calibrationDate: string;
  calibratedBy: string;
  standardUsed: string;
  parametersTested: { parameter: string; expected: string; measured: string; pass: boolean }[];
  overallPass: boolean;
  nextCalibrationDate: string;
  certificateUrl?: string;
}

export interface AdverseEventReport {
  id: string;
  deviceId: string;
  deviceName: string;
  eventDate: string;
  reportDate: string;
  patientId?: string;
  eventDescription: string;
  injuryDescription?: string;
  severity: 'minor' | 'moderate' | 'serious' | 'death';
  fdaReported: boolean;
  fdaReportNumber?: string;
  manufacturerNotified: boolean;
  manufacturerReportDate?: string;
  correctiveAction: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  reportedBy: string;
}

// ── Consent Management ───────────────────────────────────────────────

export interface ConsentTemplate {
  id: string;
  treatmentName: string;
  treatmentCategory: 'injectable' | 'laser' | 'skin' | 'body' | 'wellness' | 'consultation' | 'photography';
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  contraindications: string[];
  aftercare: string[];
  providerAcknowledgments: string[];
  requiredDisclosures: string[];
  expiryDays: number;
  requiresWitness: boolean;
  requiresProviderSignature: boolean;
  status: 'active' | 'draft' | 'archived';
}

export interface SignedConsent {
  id: string;
  templateId: string;
  templateVersion: string;
  treatmentName: string;
  patientId: string;
  patientName: string;
  signatureData: string; // base64 canvas
  signedDate: string;
  expirationDate: string;
  providerId: string;
  providerName: string;
  providerSignature?: string;
  witnessName?: string;
  witnessSignature?: string;
  customNotes?: string;
  status: 'active' | 'expired' | 'revoked' | 'superseded';
  revokedDate?: string;
  revokedReason?: string;
}

// ── Audit Trail ──────────────────────────────────────────────────────

export type AuditAction =
  | 'phi_view' | 'phi_create' | 'phi_update' | 'phi_delete' | 'phi_export' | 'phi_print'
  | 'consent_sign' | 'consent_revoke'
  | 'substance_dispense' | 'substance_waste' | 'substance_reconcile'
  | 'device_maintenance' | 'device_calibration' | 'device_adverse_event'
  | 'incident_report' | 'incident_update'
  | 'license_update' | 'license_verify'
  | 'policy_acknowledge' | 'policy_update'
  | 'training_complete'
  | 'breach_report' | 'breach_update'
  | 'login' | 'logout' | 'password_change'
  | 'baa_sign' | 'baa_update'
  | 'delegation_create' | 'delegation_update';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  category: 'hipaa' | 'osha' | 'licensing' | 'dea' | 'device' | 'consent' | 'policy' | 'auth' | 'incident';
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent?: string;
  previousValue?: string;
  newValue?: string;
  severity: 'info' | 'warning' | 'critical';
}

// ── Policy Management ────────────────────────────────────────────────

export interface Policy {
  id: string;
  title: string;
  category: 'hipaa' | 'osha' | 'clinical' | 'administrative' | 'emergency' | 'infection_control' | 'hr' | 'financial';
  version: string;
  effectiveDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  approvedBy: string;
  content: string;
  status: 'active' | 'draft' | 'under_review' | 'archived';
  acknowledgments: PolicyAcknowledgment[];
  documentUrl?: string;
  changeLog: { date: string; version: string; changes: string; changedBy: string }[];
}

export interface PolicyAcknowledgment {
  staffId: string;
  staffName: string;
  acknowledgedDate: string;
  version: string;
}

// ── Compliance Score ─────────────────────────────────────────────────

export interface ComplianceScore {
  overall: number; // 0-100
  categories: {
    hipaa: { score: number; issues: number; label: string };
    osha: { score: number; issues: number; label: string };
    licensing: { score: number; issues: number; label: string };
    dea: { score: number; issues: number; label: string };
    devices: { score: number; issues: number; label: string };
    consents: { score: number; issues: number; label: string };
    policies: { score: number; issues: number; label: string };
    training: { score: number; issues: number; label: string };
  };
  status: 'critical' | 'at_risk' | 'compliant' | 'exemplary';
  upcomingDeadlines: ComplianceDeadline[];
  overdueItems: ComplianceDeadline[];
}

export interface ComplianceDeadline {
  id: string;
  type: 'license_renewal' | 'training_due' | 'baa_renewal' | 'policy_review' | 'device_maintenance' | 'device_calibration' | 'dea_reconciliation' | 'osha_inspection' | 'consent_expiry';
  title: string;
  dueDate: string;
  daysUntilDue: number;
  assignee?: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
}
