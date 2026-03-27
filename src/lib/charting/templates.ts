// Charting Template Definitions - Rani Beauty Clinic
// Based on 10-CHARTING-TEMPLATES.md (6 clinical templates)
// COMPLIANCE: Every treatment must be charted before checkout. No exceptions.

// ─── Types ───

export type ChartTemplateType =
  | 'injection_log'
  | 'soap_note'
  | 'consultation'
  | 'program_note'
  | 'body_treatment'
  | 'lab_draw';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'signature';

export interface FieldOption {
  value: string;
  label: string;
}

export interface ChartField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  section: string;
  options?: FieldOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
  conditionalOn?: { field: string; value: string | string[] };
  defaultValue?: string | boolean;
}

export interface ChartTemplate {
  type: ChartTemplateType;
  name: string;
  description: string;
  useFor: string;
  requiresMedicalDirectorReview: boolean;
  blocksCheckout: boolean;
  sections: string[];
  fields: ChartField[];
}

// ─── Option Constants ───

const MANUFACTURERS: FieldOption[] = [
  { value: 'olympia', label: 'Olympia Pharmacy' },
  { value: 'empower', label: 'Empower Pharmacy' },
  { value: 'other', label: 'Other' },
];

const INJECTION_PRODUCTS: FieldOption[] = [
  { value: 'b12', label: 'B12' },
  { value: 'lipo_mino', label: 'Lipo-Mino' },
  { value: 'glutathione', label: 'Glutathione' },
  { value: 'biotin', label: 'Biotin' },
  { value: 'vitamin_d3', label: 'Vitamin D3' },
  { value: 'tri_immune', label: 'Tri-Immune Boost' },
  { value: 'nad_plus', label: 'NAD+' },
  { value: 'semaglutide', label: 'Semaglutide' },
  { value: 'tirzepatide', label: 'Tirzepatide' },
  { value: 'liraglutide', label: 'Liraglutide' },
  { value: 'testosterone', label: 'Testosterone Cypionate' },
  { value: 'estradiol', label: 'Estradiol' },
  { value: 'progesterone', label: 'Progesterone' },
  { value: 'sermorelin', label: 'Sermorelin' },
  { value: 'bpc_157', label: 'BPC-157' },
  { value: 'tb_500', label: 'TB-500' },
  { value: 'ghk_cu', label: 'GHK-Cu' },
  { value: 'cjc_ipamorelin', label: 'CJC/Ipamorelin' },
];

const VIAL_STATUS: FieldOption[] = [
  { value: 'new', label: 'New vial' },
  { value: 'continuing', label: 'Continuing vial' },
  { value: 'last_dose', label: 'Last dose from vial' },
];

const ROUTE_OPTIONS: FieldOption[] = [
  { value: 'im', label: 'IM (intramuscular)' },
  { value: 'subq', label: 'SubQ (subcutaneous)' },
];

const INJECTION_SITES: FieldOption[] = [
  { value: 'deltoid_l', label: 'Deltoid L' },
  { value: 'deltoid_r', label: 'Deltoid R' },
  { value: 'abdomen_l', label: 'Abdomen L' },
  { value: 'abdomen_r', label: 'Abdomen R' },
  { value: 'glute_l', label: 'Glute L' },
  { value: 'glute_r', label: 'Glute R' },
  { value: 'thigh_l', label: 'Thigh L' },
  { value: 'thigh_r', label: 'Thigh R' },
  { value: 'other', label: 'Other' },
];

const POST_INJECTION_REACTIONS: FieldOption[] = [
  { value: 'none', label: 'None' },
  { value: 'mild_redness', label: 'Mild redness (expected)' },
  { value: 'swelling', label: 'Swelling' },
  { value: 'pain', label: 'Pain (beyond expected)' },
  { value: 'vasovagal', label: 'Vasovagal response' },
  { value: 'allergic', label: 'Allergic reaction' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS: FieldOption[] = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const AFTERCARE_METHOD: FieldOption[] = [
  { value: 'verbal', label: 'Verbal' },
  { value: 'written', label: 'Written' },
  { value: 'both', label: 'Both' },
];

const FITZPATRICK_TYPES: FieldOption[] = [
  { value: 'I', label: 'Type I' },
  { value: 'II', label: 'Type II' },
  { value: 'III', label: 'Type III' },
  { value: 'IV', label: 'Type IV' },
  { value: 'V', label: 'Type V' },
  { value: 'VI', label: 'Type VI' },
];

const SKIN_CONDITION: FieldOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'dry', label: 'Dry' },
  { value: 'oily', label: 'Oily' },
  { value: 'combination', label: 'Combination' },
  { value: 'sensitive', label: 'Sensitive' },
];

const NONE_TO_SEVERE: FieldOption[] = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const TOLERANCE_OPTIONS: FieldOption[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const PROGRESS_OPTIONS: FieldOption[] = [
  { value: 'first_visit', label: 'First visit - baseline' },
  { value: 'improvement', label: 'Improvement noted' },
  { value: 'stable', label: 'Stable/maintaining' },
  { value: 'no_improvement', label: 'No improvement' },
  { value: 'regression', label: 'Regression - investigate' },
];

const CONSULT_TYPE: FieldOption[] = [
  { value: 'new_client', label: 'New Client' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'treatment_plan_review', label: 'Treatment Plan Review' },
];

const BUDGET_RANGES: FieldOption[] = [
  { value: 'open', label: 'Open' },
  { value: '500_1k', label: '$500-$1K' },
  { value: '1k_3k', label: '$1K-$3K' },
  { value: '3k_5k', label: '$3K-$5K' },
  { value: '5k_plus', label: '$5K+' },
];

const TIER_SELECTED: FieldOption[] = [
  { value: 'good', label: 'Good (Tier 1)' },
  { value: 'better', label: 'Better (Tier 2)' },
  { value: 'best', label: 'Best (Tier 3)' },
  { value: 'undecided', label: 'Undecided' },
];

const FINANCING_PROVIDER: FieldOption[] = [
  { value: 'patientfi', label: 'PatientFi' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'not_needed', label: 'Not needed' },
];

const MEMBERSHIP_TIERS: FieldOption[] = [
  { value: 'halo_199', label: 'HALO ($199/mo)' },
  { value: 'glow_349', label: 'GLOW ($349/mo)' },
  { value: 'elite_549', label: 'ELITE AURA ($549/mo)' },
];

const CONSULT_OUTCOME: FieldOption[] = [
  { value: 'booked', label: 'Booked treatment' },
  { value: 'thinking', label: 'Thinking about it' },
  { value: 'needs_financing', label: 'Needs financing' },
  { value: 'declined', label: 'Declined' },
];

const PROGRAM_TYPES: FieldOption[] = [
  { value: 'glp1_semaglutide', label: 'GLP-1 Semaglutide' },
  { value: 'glp1_tirzepatide', label: 'GLP-1 Tirzepatide' },
  { value: 'glp1_liraglutide', label: 'GLP-1 Liraglutide' },
  { value: 'hrt_female', label: 'HRT Female' },
  { value: 'hrt_male', label: 'HRT Male' },
  { value: 'peptide', label: 'Peptide Therapy' },
];

const GLP1_SYMPTOM_LEVEL: FieldOption[] = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
];

const HRT_IMPROVEMENT: FieldOption[] = [
  { value: 'resolved', label: 'Resolved' },
  { value: 'improved', label: 'Improved' },
  { value: 'unchanged', label: 'Unchanged' },
  { value: 'worsened', label: 'Worsened' },
  { value: 'na', label: 'N/A' },
];

const BODY_AREAS: FieldOption[] = [
  { value: 'abdomen_small', label: 'Abdomen (small)' },
  { value: 'abdomen_large', label: 'Abdomen (large)' },
  { value: 'arms', label: 'Arms' },
  { value: 'back_of_legs', label: 'Back of Legs' },
  { value: 'front_of_legs', label: 'Front of Legs' },
  { value: 'buttocks', label: 'Buttocks' },
  { value: 'full_legs', label: 'Full Legs' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
];

const SKIN_ASSESSMENT_BODY: FieldOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'stretch_marks', label: 'Stretch marks' },
  { value: 'scarring', label: 'Scarring' },
  { value: 'laxity', label: 'Laxity' },
  { value: 'cellulite', label: 'Cellulite' },
];

const DRAW_SITES: FieldOption[] = [
  { value: 'antecubital_l', label: 'Antecubital L' },
  { value: 'antecubital_r', label: 'Antecubital R' },
  { value: 'hand_l', label: 'Hand L' },
  { value: 'hand_r', label: 'Hand R' },
  { value: 'other', label: 'Other' },
];

const DRAW_ATTEMPTS: FieldOption[] = [
  { value: '1', label: '1 (success)' },
  { value: '2', label: '2 attempts' },
  { value: '3_plus', label: '3+ attempts' },
  { value: 'unable', label: 'Unable - referred' },
];

const REFERENCE_LABS: FieldOption[] = [
  { value: 'quest', label: 'Quest Diagnostics' },
  { value: 'labcorp', label: 'LabCorp' },
  { value: 'olympia', label: 'Olympia' },
  { value: 'other', label: 'Other' },
];

const FASTING_STATUS: FieldOption[] = [
  { value: 'fasting', label: 'Fasting' },
  { value: 'non_fasting', label: 'Non-fasting' },
  { value: 'not_required', label: 'Not required' },
];

const SPECIMEN_STORAGE: FieldOption[] = [
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'room_temp', label: 'Room temperature' },
  { value: 'centrifuged', label: 'Centrifuged' },
];

const PICKUP_METHOD: FieldOption[] = [
  { value: 'courier', label: 'Courier scheduled' },
  { value: 'client_dropoff', label: 'Client drop-off' },
  { value: 'in_house', label: 'In-house processing' },
];

const RESULTS_NOTIFICATION: FieldOption[] = [
  { value: 'portal', label: 'Patient portal' },
  { value: 'phone', label: 'Phone call' },
  { value: 'in_person', label: 'In-person review' },
];

// ─── Template 1: Injection Log ───

export const INJECTION_LOG_TEMPLATE: ChartTemplate = {
  type: 'injection_log',
  name: 'Injection Log',
  description: 'For ALL IM injections: vitamins, GLP-1, HRT, peptides',
  useFor: 'B12, Lipo-Mino, Glutathione, Biotin, Vitamin D3, Tri-Immune, NAD+, Semaglutide, Tirzepatide, Liraglutide, Testosterone, Estradiol, Sermorelin, BPC-157, TB-500, GHK-Cu, CJC/Ipamorelin',
  requiresMedicalDirectorReview: true,
  blocksCheckout: true,
  sections: [
    'Product Information',
    'Dosing',
    'GLP-1/Peptide Specific',
    'HRT Specific',
    'Pre-Injection Assessment',
    'Post-Injection Assessment',
    'Aftercare',
    'Adverse Event',
    'Inventory',
    'Provider Signature',
  ],
  fields: [
    // Product Information
    { id: 'product_name', label: 'Product Name', type: 'select', required: true, section: 'Product Information', options: INJECTION_PRODUCTS },
    { id: 'manufacturer', label: 'Manufacturer/Pharmacy', type: 'select', required: true, section: 'Product Information', options: MANUFACTURERS },
    { id: 'manufacturer_other', label: 'Other Manufacturer', type: 'text', required: false, section: 'Product Information', conditionalOn: { field: 'manufacturer', value: 'other' } },
    { id: 'lot_batch_number', label: 'Lot/Batch Number', type: 'text', required: true, section: 'Product Information', placeholder: 'Enter lot number' },
    { id: 'bud', label: 'BUD (Beyond Use Date)', type: 'date', required: true, section: 'Product Information' },
    { id: 'vial_status', label: 'Vial Status', type: 'select', required: true, section: 'Product Information', options: VIAL_STATUS },

    // Dosing
    { id: 'dose_prescribed', label: 'Dose Prescribed', type: 'text', required: true, section: 'Dosing', placeholder: 'e.g. 0.5mg' },
    { id: 'dose_prescribed_unit', label: 'Unit', type: 'select', required: true, section: 'Dosing', options: [{ value: 'mg', label: 'mg' }, { value: 'mcg', label: 'mcg' }, { value: 'mL', label: 'mL' }, { value: 'units', label: 'units' }] },
    { id: 'dose_administered', label: 'Dose Administered', type: 'text', required: true, section: 'Dosing', placeholder: 'e.g. 0.5mg' },
    { id: 'dose_administered_unit', label: 'Unit', type: 'select', required: true, section: 'Dosing', options: [{ value: 'mg', label: 'mg' }, { value: 'mcg', label: 'mcg' }, { value: 'mL', label: 'mL' }, { value: 'units', label: 'units' }] },
    { id: 'route', label: 'Route', type: 'select', required: true, section: 'Dosing', options: ROUTE_OPTIONS },
    { id: 'injection_site', label: 'Injection Site', type: 'select', required: true, section: 'Dosing', options: INJECTION_SITES },
    { id: 'injection_site_other', label: 'Other Site', type: 'text', required: false, section: 'Dosing', conditionalOn: { field: 'injection_site', value: 'other' } },
    { id: 'needle_gauge', label: 'Needle Gauge', type: 'text', required: true, section: 'Dosing', placeholder: 'e.g. 25G' },
    { id: 'needle_length', label: 'Needle Length', type: 'text', required: true, section: 'Dosing', placeholder: 'e.g. 1 inch' },

    // GLP-1/Peptide Specific
    { id: 'titration_month', label: 'Titration Phase (Month)', type: 'number', required: false, section: 'GLP-1/Peptide Specific', min: 1, max: 24 },
    { id: 'current_dose_level', label: 'Current Dose Level', type: 'text', required: false, section: 'GLP-1/Peptide Specific' },
    { id: 'next_scheduled_dose', label: 'Next Scheduled Dose', type: 'date', required: false, section: 'GLP-1/Peptide Specific' },
    { id: 'weight_today', label: 'Weight Today (lbs)', type: 'number', required: false, section: 'GLP-1/Peptide Specific', unit: 'lbs' },
    { id: 'weight_last', label: 'Last Weight (lbs)', type: 'number', required: false, section: 'GLP-1/Peptide Specific', unit: 'lbs' },
    { id: 'bmi', label: 'BMI', type: 'number', required: false, section: 'GLP-1/Peptide Specific' },

    // HRT Specific
    { id: 'hormone_panel_date', label: 'Hormone Panel Date (most recent)', type: 'date', required: false, section: 'HRT Specific' },
    { id: 'lab_values_current', label: 'Lab Values Current', type: 'radio', required: false, section: 'HRT Specific', options: [{ value: 'yes', label: 'Yes' }, { value: 'overdue', label: 'Overdue (> 90 days)' }] },
    { id: 'protocol_adjustment', label: 'Protocol Adjustment', type: 'select', required: false, section: 'HRT Specific', options: [{ value: 'none', label: 'None' }, { value: 'dose_changed', label: 'Dose changed' }] },
    { id: 'new_dose', label: 'New Dose', type: 'text', required: false, section: 'HRT Specific', conditionalOn: { field: 'protocol_adjustment', value: 'dose_changed' } },

    // Pre-Injection Assessment
    { id: 'identity_verified', label: 'Client Identity Verified', type: 'checkbox', required: true, section: 'Pre-Injection Assessment' },
    { id: 'consent_on_file', label: 'Consent on File', type: 'select', required: true, section: 'Pre-Injection Assessment', options: [{ value: 'yes', label: 'Yes' }, { value: 'obtained_today', label: 'Obtained today' }] },
    { id: 'allergies_reviewed', label: 'Allergies Reviewed', type: 'checkbox', required: true, section: 'Pre-Injection Assessment' },
    { id: 'allergies_detail', label: 'Allergies', type: 'text', required: false, section: 'Pre-Injection Assessment', placeholder: 'List allergies or NKDA' },
    { id: 'contraindications_screened', label: 'Contraindications Screened', type: 'checkbox', required: true, section: 'Pre-Injection Assessment' },
    { id: 'contraindication_flags', label: 'Contraindication Flags', type: 'text', required: false, section: 'Pre-Injection Assessment' },
    { id: 'pregnancy_status', label: 'Pregnancy/Breastfeeding Status', type: 'select', required: true, section: 'Pre-Injection Assessment', options: [{ value: 'not_applicable', label: 'Not applicable' }, { value: 'negative', label: 'Negative' }, { value: 'positive', label: 'Positive (STOP)' }] },
    { id: 'previous_site_assessment', label: 'Previous Injection Site Assessment', type: 'select', required: true, section: 'Pre-Injection Assessment', options: [{ value: 'normal', label: 'Normal' }, { value: 'residual', label: 'Residual findings' }] },
    { id: 'previous_site_detail', label: 'Residual Detail', type: 'text', required: false, section: 'Pre-Injection Assessment', conditionalOn: { field: 'previous_site_assessment', value: 'residual' } },
    { id: 'medications_reviewed', label: 'Current Medications Reviewed', type: 'checkbox', required: true, section: 'Pre-Injection Assessment' },
    { id: 'medication_changes', label: 'Medication Changes', type: 'text', required: false, section: 'Pre-Injection Assessment' },
    { id: 'vitals_bp_systolic', label: 'BP Systolic', type: 'number', required: false, section: 'Pre-Injection Assessment', unit: 'mmHg' },
    { id: 'vitals_bp_diastolic', label: 'BP Diastolic', type: 'number', required: false, section: 'Pre-Injection Assessment', unit: 'mmHg' },
    { id: 'vitals_hr', label: 'Heart Rate', type: 'number', required: false, section: 'Pre-Injection Assessment', unit: 'bpm' },
    { id: 'vitals_temp', label: 'Temperature', type: 'number', required: false, section: 'Pre-Injection Assessment', unit: 'F' },

    // Post-Injection Assessment
    { id: 'immediate_reaction', label: 'Immediate Reaction', type: 'select', required: true, section: 'Post-Injection Assessment', options: POST_INJECTION_REACTIONS },
    { id: 'reaction_detail', label: 'Reaction Detail', type: 'text', required: false, section: 'Post-Injection Assessment', conditionalOn: { field: 'immediate_reaction', value: 'other' } },
    { id: 'post_wait_time', label: 'Post-Injection Wait', type: 'select', required: true, section: 'Post-Injection Assessment', options: [{ value: '15min', label: '15 min observed' }, { value: 'not_required', label: 'Not required (routine)' }] },
    { id: 'client_tolerating', label: 'Client Tolerating Well', type: 'radio', required: true, section: 'Post-Injection Assessment', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'tolerating_action', label: 'Action Taken', type: 'text', required: false, section: 'Post-Injection Assessment', conditionalOn: { field: 'client_tolerating', value: 'no' } },

    // Aftercare
    { id: 'aftercare_method', label: 'Aftercare Instructions Provided', type: 'select', required: true, section: 'Aftercare', options: AFTERCARE_METHOD },
    { id: 'aftercare_specific', label: 'Specific Instructions', type: 'textarea', required: false, section: 'Aftercare' },
    { id: 'next_appointment_scheduled', label: 'Next Appointment Scheduled', type: 'radio', required: true, section: 'Aftercare', options: [{ value: 'yes', label: 'Yes' }, { value: 'client_will_call', label: 'Client will call' }] },
    { id: 'next_appointment_date', label: 'Next Appointment Date', type: 'date', required: false, section: 'Aftercare', conditionalOn: { field: 'next_appointment_scheduled', value: 'yes' } },

    // Adverse Event
    { id: 'adverse_event', label: 'Adverse Event Occurred', type: 'radio', required: true, section: 'Adverse Event', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    { id: 'adverse_description', label: 'Description', type: 'textarea', required: false, section: 'Adverse Event', conditionalOn: { field: 'adverse_event', value: 'yes' } },
    { id: 'adverse_severity', label: 'Severity', type: 'select', required: false, section: 'Adverse Event', options: SEVERITY_OPTIONS, conditionalOn: { field: 'adverse_event', value: 'yes' } },
    { id: 'adverse_action', label: 'Action Taken', type: 'textarea', required: false, section: 'Adverse Event', conditionalOn: { field: 'adverse_event', value: 'yes' } },
    { id: 'dr_landfield_notified', label: 'Dr. Landfield Notified', type: 'checkbox', required: false, section: 'Adverse Event', conditionalOn: { field: 'adverse_event', value: 'yes' } },
    { id: 'adverse_followup_required', label: 'Follow-Up Required', type: 'radio', required: false, section: 'Adverse Event', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], conditionalOn: { field: 'adverse_event', value: 'yes' } },
    { id: 'adverse_followup_plan', label: 'Follow-Up Plan', type: 'textarea', required: false, section: 'Adverse Event', conditionalOn: { field: 'adverse_followup_required', value: 'yes' } },

    // Inventory
    { id: 'units_used', label: 'Units/mL Used From Vial', type: 'text', required: true, section: 'Inventory' },
    { id: 'units_remaining', label: 'Units/mL Remaining in Vial', type: 'text', required: true, section: 'Inventory' },
    { id: 'vial_disposed', label: 'Vial Disposed', type: 'radio', required: true, section: 'Inventory', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    { id: 'disposal_reason', label: 'Disposal Reason', type: 'select', required: false, section: 'Inventory', options: [{ value: 'empty', label: 'Empty' }, { value: 'expired', label: 'Expired' }, { value: 'contaminated', label: 'Contaminated' }], conditionalOn: { field: 'vial_disposed', value: 'yes' } },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
    { id: 'chart_completed', label: 'Chart Completed Before Checkout', type: 'checkbox', required: true, section: 'Provider Signature' },
    { id: 'md_review_required', label: 'Medical Director Review Required', type: 'radio', required: true, section: 'Provider Signature', options: [{ value: 'yes', label: 'Yes (injection/medical)' }, { value: 'no', label: 'No (vitamin only)' }] },
  ],
};

// ─── Template 2: SOAP Note ───

export const SOAP_NOTE_TEMPLATE: ChartTemplate = {
  type: 'soap_note',
  name: 'SOAP Note - Aesthetic Treatment',
  description: 'For Hydrafacial, Laser Facial, RF Microneedling, Sofwave, Chemical Peels, Scar Reduction, Laser Hair Removal',
  useFor: 'All aesthetic/device-based treatments',
  requiresMedicalDirectorReview: false,
  blocksCheckout: true,
  sections: [
    'Subjective',
    'Objective - Skin Assessment',
    'Objective - Treatment Parameters',
    'Assessment',
    'Plan',
    'Provider Signature',
  ],
  fields: [
    // Subjective
    { id: 'chief_concern', label: 'Chief Concern', type: 'textarea', required: true, section: 'Subjective', placeholder: 'Client primary concern today' },
    { id: 'client_goals', label: 'Client Goals', type: 'textarea', required: true, section: 'Subjective' },
    { id: 'changes_since_last', label: 'Changes Since Last Visit', type: 'select', required: true, section: 'Subjective', options: [{ value: 'none', label: 'None' }, { value: 'yes', label: 'Yes' }] },
    { id: 'changes_detail', label: 'Changes Detail', type: 'text', required: false, section: 'Subjective', conditionalOn: { field: 'changes_since_last', value: 'yes' } },
    { id: 'skincare_routine_changes', label: 'Skincare Routine Changes', type: 'select', required: false, section: 'Subjective', options: [{ value: 'none', label: 'None' }, { value: 'updated', label: 'Updated' }] },
    { id: 'pain_level', label: 'Pain Level (0-10)', type: 'number', required: true, section: 'Subjective', min: 0, max: 10 },
    { id: 'skin_sensitivity', label: 'Skin Sensitivity Today', type: 'select', required: true, section: 'Subjective', options: [{ value: 'normal', label: 'Normal' }, { value: 'elevated', label: 'Elevated' }, { value: 'concerns', label: 'Concerns' }] },

    // Objective - Skin Assessment
    { id: 'fitzpatrick_type', label: 'Fitzpatrick Type', type: 'select', required: true, section: 'Objective - Skin Assessment', options: FITZPATRICK_TYPES },
    { id: 'skin_condition', label: 'Skin Condition', type: 'select', required: true, section: 'Objective - Skin Assessment', options: SKIN_CONDITION },
    { id: 'active_breakouts', label: 'Active Breakouts', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'hyperpigmentation', label: 'Hyperpigmentation', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'fine_lines', label: 'Fine Lines/Wrinkles', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'skin_laxity', label: 'Skin Laxity', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'sun_damage', label: 'Sun Damage', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'scarring', label: 'Scarring', type: 'select', required: false, section: 'Objective - Skin Assessment', options: [{ value: 'none', label: 'None' }, { value: 'present', label: 'Present' }] },
    { id: 'scarring_type', label: 'Scarring Type', type: 'text', required: false, section: 'Objective - Skin Assessment', conditionalOn: { field: 'scarring', value: 'present' } },
    { id: 'redness_rosacea', label: 'Redness/Rosacea', type: 'select', required: true, section: 'Objective - Skin Assessment', options: NONE_TO_SEVERE },
    { id: 'photos_taken', label: 'Photos Taken', type: 'select', required: true, section: 'Objective - Skin Assessment', options: [{ value: 'before', label: 'Before' }, { value: 'after', label: 'After' }, { value: 'both', label: 'Both' }, { value: 'not_taken', label: 'Not taken' }] },
    { id: 'treatment_areas', label: 'Treatment Areas', type: 'text', required: true, section: 'Objective - Skin Assessment' },

    // Treatment Parameters (generic - device-specific details in textarea)
    { id: 'device_used', label: 'Device/Product Used', type: 'text', required: true, section: 'Objective - Treatment Parameters', placeholder: 'e.g. Candela GentleMax Pro Plus' },
    { id: 'treatment_settings', label: 'Treatment Settings/Parameters', type: 'textarea', required: true, section: 'Objective - Treatment Parameters', placeholder: 'Wavelength, spot size, fluence, passes, energy levels, tips, serums, etc.' },
    { id: 'numbing_applied', label: 'Numbing Applied', type: 'radio', required: false, section: 'Objective - Treatment Parameters', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'numbing_product', label: 'Numbing Product', type: 'text', required: false, section: 'Objective - Treatment Parameters', conditionalOn: { field: 'numbing_applied', value: 'yes' } },
    { id: 'numbing_time', label: 'Numbing Time (min)', type: 'number', required: false, section: 'Objective - Treatment Parameters', conditionalOn: { field: 'numbing_applied', value: 'yes' } },
    { id: 'treatment_duration', label: 'Treatment Duration (min)', type: 'number', required: true, section: 'Objective - Treatment Parameters' },

    // Assessment
    { id: 'treatment_tolerance', label: 'Treatment Tolerance', type: 'select', required: true, section: 'Assessment', options: TOLERANCE_OPTIONS },
    { id: 'post_treatment_response', label: 'Immediate Post-Treatment Response', type: 'multiselect', required: true, section: 'Assessment', options: [
      { value: 'mild_erythema', label: 'Mild erythema (expected)' },
      { value: 'moderate_erythema', label: 'Moderate erythema' },
      { value: 'edema', label: 'Edema' },
      { value: 'petechiae', label: 'Petechiae' },
      { value: 'purpura', label: 'Purpura' },
      { value: 'frosting', label: 'Frosting' },
      { value: 'none', label: 'None' },
    ]},
    { id: 'adverse_events', label: 'Adverse Events', type: 'select', required: true, section: 'Assessment', options: [
      { value: 'none', label: 'None' },
      { value: 'burn_blister', label: 'Burn/blister' },
      { value: 'excessive_swelling', label: 'Excessive swelling' },
      { value: 'bleeding', label: 'Bleeding' },
      { value: 'allergic_reaction', label: 'Allergic reaction' },
      { value: 'pain_beyond', label: 'Pain beyond expected' },
    ]},
    { id: 'adverse_action_taken', label: 'Action Taken for Adverse Event', type: 'textarea', required: false, section: 'Assessment', conditionalOn: { field: 'adverse_events', value: ['burn_blister', 'excessive_swelling', 'bleeding', 'allergic_reaction', 'pain_beyond'] } },
    { id: 'progress_assessment', label: 'Progress Assessment', type: 'select', required: true, section: 'Assessment', options: PROGRESS_OPTIONS },
    { id: 'progress_notes', label: 'Progress Notes', type: 'textarea', required: false, section: 'Assessment' },

    // Plan
    { id: 'aftercare_provided', label: 'Aftercare Instructions Provided', type: 'select', required: true, section: 'Plan', options: AFTERCARE_METHOD },
    { id: 'specific_aftercare', label: 'Specific Aftercare', type: 'textarea', required: false, section: 'Plan' },
    { id: 'products_recommended', label: 'Products Recommended', type: 'multiselect', required: false, section: 'Plan', options: [
      { value: 'spf30', label: 'SPF 30+ daily' },
      { value: 'gentle_cleanser', label: 'Gentle cleanser' },
      { value: 'hydrating_moisturizer', label: 'Hydrating moisturizer' },
      { value: 'avoid_retinol', label: 'Avoid retinol' },
      { value: 'avoid_sun', label: 'Avoid sun exposure' },
    ]},
    { id: 'next_treatment_service', label: 'Next Treatment Recommended', type: 'text', required: false, section: 'Plan' },
    { id: 'next_treatment_weeks', label: 'Timing (weeks)', type: 'number', required: false, section: 'Plan' },
    { id: 'appointment_booked', label: 'Appointment Booked', type: 'radio', required: true, section: 'Plan', options: [{ value: 'yes', label: 'Yes' }, { value: 'client_will_call', label: 'Client will call' }] },
    { id: 'appointment_date', label: 'Appointment Date', type: 'date', required: false, section: 'Plan', conditionalOn: { field: 'appointment_booked', value: 'yes' } },
    { id: 'package_session_number', label: 'Package Session #', type: 'number', required: false, section: 'Plan' },
    { id: 'package_sessions_total', label: 'Package Sessions Total', type: 'number', required: false, section: 'Plan' },
    { id: 'package_sessions_remaining', label: 'Sessions Remaining', type: 'number', required: false, section: 'Plan' },
    { id: 'additional_recommendations', label: 'Additional Recommendations', type: 'textarea', required: false, section: 'Plan' },
    { id: 'provider_notes', label: 'Provider Notes', type: 'textarea', required: false, section: 'Plan' },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
    { id: 'chart_completed', label: 'Chart Completed Before Checkout', type: 'checkbox', required: true, section: 'Provider Signature' },
  ],
};

// ─── Template 3: Consultation Note ───

export const CONSULTATION_TEMPLATE: ChartTemplate = {
  type: 'consultation',
  name: 'Consultation Note',
  description: 'For all new client consultations, follow-up consultations, treatment plan presentations',
  useFor: 'New client consults, follow-up consults, treatment plan reviews',
  requiresMedicalDirectorReview: false,
  blocksCheckout: false,
  sections: [
    'Consult Details',
    'Client Goals',
    'Assessment',
    'Treatment Plan',
    'Financing',
    'Membership',
    'Outcome',
    'Provider Notes',
    'Provider Signature',
  ],
  fields: [
    // Consult Details
    { id: 'consult_type', label: 'Consult Type', type: 'select', required: true, section: 'Consult Details', options: CONSULT_TYPE },
    { id: 'referral_source', label: 'Referral Source', type: 'text', required: false, section: 'Consult Details' },

    // Client Goals
    { id: 'primary_concern', label: 'Primary Concern', type: 'textarea', required: true, section: 'Client Goals' },
    { id: 'secondary_concerns', label: 'Secondary Concerns', type: 'textarea', required: false, section: 'Client Goals' },
    { id: 'desired_outcome', label: 'Desired Outcome', type: 'textarea', required: true, section: 'Client Goals' },
    { id: 'timeline_expectations', label: 'Timeline Expectations', type: 'text', required: false, section: 'Client Goals' },
    { id: 'budget_discussion', label: 'Budget Discussion', type: 'select', required: false, section: 'Client Goals', options: BUDGET_RANGES },

    // Assessment
    { id: 'aura_scan_performed', label: 'Aura Skin Scan Performed', type: 'radio', required: true, section: 'Assessment', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'aura_scan_score', label: 'Aura Scan Score', type: 'number', required: false, section: 'Assessment', min: 0, max: 100, conditionalOn: { field: 'aura_scan_performed', value: 'yes' } },
    { id: 'fitzpatrick_type', label: 'Fitzpatrick Type', type: 'select', required: true, section: 'Assessment', options: FITZPATRICK_TYPES },
    { id: 'assessment_findings', label: 'Skin/Body Assessment Findings', type: 'textarea', required: true, section: 'Assessment' },
    { id: 'medical_history_review', label: 'Medical History Review', type: 'select', required: true, section: 'Assessment', options: [{ value: 'complete', label: 'Complete' }, { value: 'updated', label: 'Updated' }, { value: 'flagged', label: 'Flagged' }] },
    { id: 'medical_history_flag', label: 'Flag Detail', type: 'text', required: false, section: 'Assessment', conditionalOn: { field: 'medical_history_review', value: 'flagged' } },
    { id: 'contraindications', label: 'Contraindications Identified', type: 'select', required: true, section: 'Assessment', options: [{ value: 'none', label: 'None' }, { value: 'yes', label: 'Yes' }] },
    { id: 'contraindication_detail', label: 'Contraindication Detail', type: 'text', required: false, section: 'Assessment', conditionalOn: { field: 'contraindications', value: 'yes' } },

    // Treatment Plan
    { id: 'tier1_plan', label: 'Tier 1 (Good)', type: 'textarea', required: true, section: 'Treatment Plan' },
    { id: 'tier1_cost', label: 'Tier 1 Estimated Cost', type: 'number', required: true, section: 'Treatment Plan' },
    { id: 'tier1_sessions', label: 'Tier 1 Sessions', type: 'number', required: false, section: 'Treatment Plan' },
    { id: 'tier1_timeline', label: 'Tier 1 Timeline', type: 'text', required: false, section: 'Treatment Plan' },
    { id: 'tier2_plan', label: 'Tier 2 (Better)', type: 'textarea', required: false, section: 'Treatment Plan' },
    { id: 'tier2_cost', label: 'Tier 2 Estimated Cost', type: 'number', required: false, section: 'Treatment Plan' },
    { id: 'tier2_sessions', label: 'Tier 2 Sessions', type: 'number', required: false, section: 'Treatment Plan' },
    { id: 'tier2_timeline', label: 'Tier 2 Timeline', type: 'text', required: false, section: 'Treatment Plan' },
    { id: 'tier3_plan', label: 'Tier 3 (Best)', type: 'textarea', required: false, section: 'Treatment Plan' },
    { id: 'tier3_cost', label: 'Tier 3 Estimated Cost', type: 'number', required: false, section: 'Treatment Plan' },
    { id: 'tier3_sessions', label: 'Tier 3 Sessions', type: 'number', required: false, section: 'Treatment Plan' },
    { id: 'tier3_timeline', label: 'Tier 3 Timeline', type: 'text', required: false, section: 'Treatment Plan' },
    { id: 'tier_selected', label: 'Tier Selected by Client', type: 'select', required: true, section: 'Treatment Plan', options: TIER_SELECTED },

    // Financing
    { id: 'financing_discussed', label: 'Financing Discussed', type: 'radio', required: true, section: 'Financing', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'financing_provider', label: 'Provider Recommended', type: 'select', required: false, section: 'Financing', options: FINANCING_PROVIDER, conditionalOn: { field: 'financing_discussed', value: 'yes' } },
    { id: 'monthly_payment', label: 'Monthly Payment Quoted', type: 'number', required: false, section: 'Financing', conditionalOn: { field: 'financing_discussed', value: 'yes' } },
    { id: 'financing_months', label: 'Financing Months', type: 'number', required: false, section: 'Financing', conditionalOn: { field: 'financing_discussed', value: 'yes' } },
    { id: 'financing_status', label: 'Application Status', type: 'select', required: false, section: 'Financing', options: [{ value: 'applied', label: 'Applied' }, { value: 'approved', label: 'Approved' }, { value: 'later', label: 'Client will apply later' }, { value: 'na', label: 'N/A' }], conditionalOn: { field: 'financing_discussed', value: 'yes' } },

    // Membership
    { id: 'membership_discussed', label: 'Membership Discussed', type: 'radio', required: true, section: 'Membership', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'membership_tier_recommended', label: 'Tier Recommended', type: 'select', required: false, section: 'Membership', options: MEMBERSHIP_TIERS, conditionalOn: { field: 'membership_discussed', value: 'yes' } },
    { id: 'membership_enrolled', label: 'Enrolled', type: 'select', required: false, section: 'Membership', options: [{ value: 'yes', label: 'Yes' }, { value: 'not_yet', label: 'Not yet' }, { value: 'declined', label: 'Client declined' }], conditionalOn: { field: 'membership_discussed', value: 'yes' } },

    // Outcome
    { id: 'consult_outcome', label: 'Consult Outcome', type: 'select', required: true, section: 'Outcome', options: CONSULT_OUTCOME },
    { id: 'booked_service', label: 'Service Booked', type: 'text', required: false, section: 'Outcome', conditionalOn: { field: 'consult_outcome', value: 'booked' } },
    { id: 'booked_date', label: 'Booking Date', type: 'date', required: false, section: 'Outcome', conditionalOn: { field: 'consult_outcome', value: 'booked' } },
    { id: 'deposit_collected', label: 'Deposit Collected', type: 'radio', required: false, section: 'Outcome', options: [{ value: 'yes', label: 'Yes' }, { value: 'waived', label: 'Waived' }], conditionalOn: { field: 'consult_outcome', value: 'booked' } },
    { id: 'deposit_amount', label: 'Deposit Amount', type: 'number', required: false, section: 'Outcome', conditionalOn: { field: 'deposit_collected', value: 'yes' } },
    { id: 'followup_scheduled', label: 'Follow-Up Scheduled', type: 'radio', required: false, section: 'Outcome', options: [{ value: 'yes', label: 'Yes' }, { value: 'auto_sequence', label: 'Auto-sequence' }], conditionalOn: { field: 'consult_outcome', value: 'thinking' } },
    { id: 'followup_date', label: 'Follow-Up Date', type: 'date', required: false, section: 'Outcome', conditionalOn: { field: 'followup_scheduled', value: 'yes' } },
    { id: 'primary_hesitation', label: 'Primary Hesitation', type: 'text', required: false, section: 'Outcome', conditionalOn: { field: 'consult_outcome', value: 'thinking' } },
    { id: 'objection_handled', label: 'Objection Handled', type: 'select', required: false, section: 'Outcome', options: [{ value: 'price', label: 'Price' }, { value: 'timing', label: 'Timing' }, { value: 'fear', label: 'Fear' }, { value: 'partner_input', label: 'Need partner input' }, { value: 'other', label: 'Other' }], conditionalOn: { field: 'consult_outcome', value: 'thinking' } },
    { id: 'decline_reason', label: 'Decline Reason', type: 'text', required: false, section: 'Outcome', conditionalOn: { field: 'consult_outcome', value: 'declined' } },
    { id: 'reactivation_pool', label: 'Add to Reactivation Pool', type: 'radio', required: false, section: 'Outcome', options: [{ value: 'yes', label: 'Yes' }, { value: 'dnc', label: 'Do Not Contact' }], conditionalOn: { field: 'consult_outcome', value: 'declined' } },

    // Provider Notes
    { id: 'provider_notes', label: 'Notes', type: 'textarea', required: false, section: 'Provider Notes' },
    { id: 'confidence_level', label: 'Confidence Level (will book)', type: 'select', required: false, section: 'Provider Notes', options: [{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
  ],
};

// ─── Template 4: Program Note (GLP-1/HRT) ───

export const PROGRAM_NOTE_TEMPLATE: ChartTemplate = {
  type: 'program_note',
  name: 'Medical Program Note',
  description: 'For monthly GLP-1 check-ins, dose escalations, HRT protocol adjustments, quarterly lab reviews',
  useFor: 'GLP-1, HRT, peptide therapy program visits',
  requiresMedicalDirectorReview: true,
  blocksCheckout: true,
  sections: [
    'Program Status',
    'Vitals & Measurements',
    'Symptom Check - GLP-1',
    'Symptom Check - HRT',
    'Lab Review',
    'Assessment',
    'Plan',
    'Provider Signature',
  ],
  fields: [
    // Program Status
    { id: 'program_type', label: 'Program', type: 'select', required: true, section: 'Program Status', options: PROGRAM_TYPES },
    { id: 'peptide_name', label: 'Peptide Name', type: 'text', required: false, section: 'Program Status', conditionalOn: { field: 'program_type', value: 'peptide' } },
    { id: 'program_start_date', label: 'Program Start Date', type: 'date', required: true, section: 'Program Status' },
    { id: 'current_month', label: 'Current Month of Program', type: 'number', required: true, section: 'Program Status', min: 1 },
    { id: 'current_dose', label: 'Current Dose', type: 'text', required: true, section: 'Program Status' },
    { id: 'dose_change_today', label: 'Dose Change Today', type: 'radio', required: true, section: 'Program Status', options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] },
    { id: 'new_dose', label: 'New Dose', type: 'text', required: false, section: 'Program Status', conditionalOn: { field: 'dose_change_today', value: 'yes' } },
    { id: 'next_dose_escalation', label: 'Next Dose Escalation Due', type: 'date', required: false, section: 'Program Status' },

    // Vitals & Measurements
    { id: 'weight_current', label: 'Weight (lbs)', type: 'number', required: true, section: 'Vitals & Measurements', unit: 'lbs' },
    { id: 'weight_starting', label: 'Starting Weight (lbs)', type: 'number', required: true, section: 'Vitals & Measurements', unit: 'lbs' },
    { id: 'weight_change', label: 'Total Weight Change (lbs)', type: 'number', required: false, section: 'Vitals & Measurements' },
    { id: 'weight_change_pct', label: 'Weight Change (%)', type: 'number', required: false, section: 'Vitals & Measurements' },
    { id: 'bmi', label: 'BMI', type: 'number', required: false, section: 'Vitals & Measurements' },
    { id: 'bp_systolic', label: 'BP Systolic', type: 'number', required: true, section: 'Vitals & Measurements', unit: 'mmHg' },
    { id: 'bp_diastolic', label: 'BP Diastolic', type: 'number', required: true, section: 'Vitals & Measurements', unit: 'mmHg' },
    { id: 'heart_rate', label: 'Heart Rate', type: 'number', required: true, section: 'Vitals & Measurements', unit: 'bpm' },
    { id: 'waist_circumference', label: 'Waist Circumference (in)', type: 'number', required: false, section: 'Vitals & Measurements', unit: 'in' },

    // Symptom Check - GLP-1
    { id: 'glp1_nausea', label: 'Nausea', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: GLP1_SYMPTOM_LEVEL },
    { id: 'glp1_vomiting', label: 'Vomiting', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: [{ value: 'none', label: 'None' }, { value: 'occasional', label: 'Occasional' }, { value: 'frequent', label: 'Frequent' }] },
    { id: 'glp1_diarrhea', label: 'Diarrhea', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: GLP1_SYMPTOM_LEVEL },
    { id: 'glp1_constipation', label: 'Constipation', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: GLP1_SYMPTOM_LEVEL },
    { id: 'glp1_headache', label: 'Headache', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: [{ value: 'none', label: 'None' }, { value: 'occasional', label: 'Occasional' }, { value: 'frequent', label: 'Frequent' }] },
    { id: 'glp1_fatigue', label: 'Fatigue', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: GLP1_SYMPTOM_LEVEL },
    { id: 'glp1_injection_site', label: 'Injection Site Reactions', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: [{ value: 'none', label: 'None' }, { value: 'mild', label: 'Mild' }, { value: 'moderate', label: 'Moderate' }] },
    { id: 'glp1_appetite', label: 'Appetite Changes', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: [{ value: 'significantly_reduced', label: 'Significantly reduced' }, { value: 'moderately_reduced', label: 'Moderately reduced' }, { value: 'unchanged', label: 'Unchanged' }] },
    { id: 'glp1_dietary_compliance', label: 'Dietary Compliance', type: 'select', required: false, section: 'Symptom Check - GLP-1', options: TOLERANCE_OPTIONS },

    // Symptom Check - HRT
    { id: 'hrt_hot_flashes', label: 'Hot Flashes', type: 'select', required: false, section: 'Symptom Check - HRT', options: HRT_IMPROVEMENT },
    { id: 'hrt_night_sweats', label: 'Night Sweats', type: 'select', required: false, section: 'Symptom Check - HRT', options: HRT_IMPROVEMENT },
    { id: 'hrt_mood_energy', label: 'Mood/Energy', type: 'select', required: false, section: 'Symptom Check - HRT', options: [{ value: 'significantly_improved', label: 'Significantly improved' }, { value: 'improved', label: 'Improved' }, { value: 'unchanged', label: 'Unchanged' }, { value: 'worsened', label: 'Worsened' }] },
    { id: 'hrt_libido', label: 'Libido', type: 'select', required: false, section: 'Symptom Check - HRT', options: [{ value: 'improved', label: 'Improved' }, { value: 'unchanged', label: 'Unchanged' }, { value: 'decreased', label: 'Decreased' }, { value: 'na', label: 'N/A' }] },
    { id: 'hrt_sleep', label: 'Sleep Quality', type: 'select', required: false, section: 'Symptom Check - HRT', options: [{ value: 'improved', label: 'Improved' }, { value: 'unchanged', label: 'Unchanged' }, { value: 'worsened', label: 'Worsened' }] },
    { id: 'hrt_brain_fog', label: 'Brain Fog', type: 'select', required: false, section: 'Symptom Check - HRT', options: [{ value: 'resolved', label: 'Resolved' }, { value: 'improved', label: 'Improved' }, { value: 'unchanged', label: 'Unchanged' }, { value: 'na', label: 'N/A' }] },

    // Lab Review
    { id: 'labs_current', label: 'Labs Current', type: 'select', required: true, section: 'Lab Review', options: [{ value: 'yes', label: 'Yes (within 90 days)' }, { value: 'due', label: 'Due' }, { value: 'overdue', label: 'Overdue' }] },
    { id: 'last_lab_date', label: 'Last Lab Date', type: 'date', required: false, section: 'Lab Review' },
    { id: 'lab_a1c', label: 'A1C', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_fasting_glucose', label: 'Fasting Glucose (mg/dL)', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_lipid_total', label: 'Total Cholesterol', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_lipid_ldl', label: 'LDL', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_lipid_hdl', label: 'HDL', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_lipid_trig', label: 'Triglycerides', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_cmp', label: 'CMP', type: 'select', required: false, section: 'Lab Review', options: [{ value: 'normal', label: 'Normal' }, { value: 'abnormal', label: 'Abnormal' }] },
    { id: 'lab_cmp_detail', label: 'CMP Abnormality', type: 'text', required: false, section: 'Lab Review', conditionalOn: { field: 'lab_cmp', value: 'abnormal' } },
    { id: 'lab_cbc', label: 'CBC', type: 'select', required: false, section: 'Lab Review', options: [{ value: 'normal', label: 'Normal' }, { value: 'abnormal', label: 'Abnormal' }] },
    { id: 'lab_tsh', label: 'TSH', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_testosterone', label: 'Testosterone (ng/dL)', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_free_t', label: 'Free T (pg/mL)', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_estradiol', label: 'Estradiol (pg/mL)', type: 'number', required: false, section: 'Lab Review' },
    { id: 'lab_progesterone', label: 'Progesterone (ng/mL)', type: 'number', required: false, section: 'Lab Review' },
    { id: 'labs_ordered_today', label: 'Labs Ordered Today', type: 'select', required: false, section: 'Lab Review', options: [{ value: 'none', label: 'None' }, { value: 'quarterly', label: 'Quarterly monitoring' }, { value: 'specific', label: 'Specific panel' }] },
    { id: 'labs_ordered_detail', label: 'Labs Ordered Detail', type: 'text', required: false, section: 'Lab Review', conditionalOn: { field: 'labs_ordered_today', value: 'specific' } },
    { id: 'next_labs_due', label: 'Next Labs Due', type: 'date', required: false, section: 'Lab Review' },

    // Assessment
    { id: 'overall_progress', label: 'Overall Progress', type: 'select', required: true, section: 'Assessment', options: [{ value: 'on_track', label: 'On track' }, { value: 'ahead', label: 'Ahead of schedule' }, { value: 'behind', label: 'Behind' }] },
    { id: 'behind_plan', label: 'Behind - Plan', type: 'text', required: false, section: 'Assessment', conditionalOn: { field: 'overall_progress', value: 'behind' } },
    { id: 'client_satisfaction', label: 'Client Satisfaction', type: 'select', required: true, section: 'Assessment', options: [{ value: 'very_satisfied', label: 'Very satisfied' }, { value: 'satisfied', label: 'Satisfied' }, { value: 'neutral', label: 'Neutral' }, { value: 'dissatisfied', label: 'Dissatisfied' }] },
    { id: 'adherence', label: 'Adherence', type: 'select', required: true, section: 'Assessment', options: TOLERANCE_OPTIONS },

    // Plan
    { id: 'continue_protocol', label: 'Continue Current Protocol', type: 'radio', required: true, section: 'Plan', options: [{ value: 'yes', label: 'Yes' }, { value: 'modified', label: 'Modified' }] },
    { id: 'modification_details', label: 'Modification Details', type: 'textarea', required: false, section: 'Plan', conditionalOn: { field: 'continue_protocol', value: 'modified' } },
    { id: 'dose_change', label: 'Dose Change', type: 'select', required: true, section: 'Plan', options: [{ value: 'no', label: 'No change' }, { value: 'escalate', label: 'Escalate' }, { value: 'reduce', label: 'Reduce' }] },
    { id: 'dose_change_to', label: 'New Dose', type: 'text', required: false, section: 'Plan', conditionalOn: { field: 'dose_change', value: ['escalate', 'reduce'] } },
    { id: 'dose_change_reason', label: 'Reason for Change', type: 'textarea', required: false, section: 'Plan', conditionalOn: { field: 'dose_change', value: ['escalate', 'reduce'] } },
    { id: 'addon_recommended', label: 'Add-On Recommended', type: 'multiselect', required: false, section: 'Plan', options: [{ value: 'lipo_mino', label: 'Lipo-Mino' }, { value: 'b12', label: 'B12' }, { value: 'peptide', label: 'Peptide' }, { value: 'none', label: 'None' }] },
    { id: 'supplements_discussed', label: 'Supplements Discussed', type: 'text', required: false, section: 'Plan' },
    { id: 'lifestyle_recommendations', label: 'Lifestyle Recommendations', type: 'textarea', required: false, section: 'Plan' },
    { id: 'referral', label: 'Referral', type: 'select', required: false, section: 'Plan', options: [{ value: 'none', label: 'None' }, { value: 'nutritionist', label: 'Nutritionist' }, { value: 'trainer', label: 'Trainer' }, { value: 'specialist', label: 'Specialist' }] },
    { id: 'dr_review_required', label: 'Dr. Landfield Review Required', type: 'radio', required: true, section: 'Plan', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'dr_review_reason', label: 'Review Reason', type: 'text', required: false, section: 'Plan', conditionalOn: { field: 'dr_review_required', value: 'yes' } },
    { id: 'next_appointment_date', label: 'Next Appointment', type: 'date', required: false, section: 'Plan' },
    { id: 'next_appointment_type', label: 'Next Appointment Type', type: 'select', required: false, section: 'Plan', options: [{ value: 'injection', label: 'Injection' }, { value: 'check_in', label: 'Check-in' }, { value: 'labs', label: 'Labs' }] },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
  ],
};

// ─── Template 5: Body Treatment Note ───

export const BODY_TREATMENT_TEMPLATE: ChartTemplate = {
  type: 'body_treatment',
  name: 'Body Treatment Note',
  description: 'For RF Microneedling body, body peels, body laser treatments',
  useFor: 'RF Microneedling body (abdomen, thighs, arms, buttocks), body peels, body laser',
  requiresMedicalDirectorReview: false,
  blocksCheckout: true,
  sections: [
    'Treatment Area',
    'Pre-Treatment',
    'Treatment Parameters',
    'Post-Treatment',
    'Plan',
    'Provider Signature',
  ],
  fields: [
    // Treatment Area
    { id: 'body_area', label: 'Body Area', type: 'multiselect', required: true, section: 'Treatment Area', options: BODY_AREAS },
    { id: 'body_area_other', label: 'Other Body Area', type: 'text', required: false, section: 'Treatment Area', conditionalOn: { field: 'body_area', value: 'other' } },

    // Pre-Treatment
    { id: 'skin_assessment', label: 'Skin Assessment', type: 'multiselect', required: true, section: 'Pre-Treatment', options: SKIN_ASSESSMENT_BODY },
    { id: 'numbing_applied', label: 'Numbing Applied', type: 'radio', required: true, section: 'Pre-Treatment', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'numbing_product', label: 'Numbing Product', type: 'text', required: false, section: 'Pre-Treatment', conditionalOn: { field: 'numbing_applied', value: 'yes' } },
    { id: 'numbing_applied_time', label: 'Applied Time', type: 'time', required: false, section: 'Pre-Treatment', conditionalOn: { field: 'numbing_applied', value: 'yes' } },
    { id: 'numbing_removed_time', label: 'Removed Time', type: 'time', required: false, section: 'Pre-Treatment', conditionalOn: { field: 'numbing_applied', value: 'yes' } },
    { id: 'photos', label: 'Photos', type: 'select', required: true, section: 'Pre-Treatment', options: [{ value: 'before', label: 'Before taken' }, { value: 'after', label: 'After taken' }, { value: 'both', label: 'Both' }, { value: 'declined', label: 'Declined' }] },

    // Treatment Parameters
    { id: 'device_used', label: 'Device Used', type: 'text', required: true, section: 'Treatment Parameters', placeholder: 'e.g. Cutera Secret RF' },
    { id: 'treatment_settings', label: 'Treatment Settings', type: 'textarea', required: true, section: 'Treatment Parameters', placeholder: 'Needle depth, RF energy, mode, passes, tip used, areas treated' },
    { id: 'treatment_duration', label: 'Total Treatment Time (min)', type: 'number', required: true, section: 'Treatment Parameters' },

    // Post-Treatment
    { id: 'immediate_response', label: 'Immediate Response', type: 'multiselect', required: true, section: 'Post-Treatment', options: [
      { value: 'expected_erythema', label: 'Expected erythema' },
      { value: 'edema', label: 'Edema' },
      { value: 'petechiae', label: 'Petechiae' },
      { value: 'none', label: 'None' },
    ]},
    { id: 'adverse_events', label: 'Adverse Events', type: 'select', required: true, section: 'Post-Treatment', options: [{ value: 'none', label: 'None' }, { value: 'present', label: 'Present' }] },
    { id: 'adverse_detail', label: 'Adverse Event Detail', type: 'textarea', required: false, section: 'Post-Treatment', conditionalOn: { field: 'adverse_events', value: 'present' } },
    { id: 'aftercare_provided', label: 'Aftercare Provided', type: 'checkbox', required: true, section: 'Post-Treatment' },
    { id: 'compression_recommended', label: 'Compression Garment Recommended', type: 'checkbox', required: false, section: 'Post-Treatment' },

    // Plan
    { id: 'session_number', label: 'Session # of Package', type: 'number', required: false, section: 'Plan' },
    { id: 'sessions_total', label: 'Total Sessions in Package', type: 'number', required: false, section: 'Plan' },
    { id: 'next_session_weeks', label: 'Next Session (weeks)', type: 'number', required: false, section: 'Plan' },
    { id: 'next_session_date', label: 'Next Session Date', type: 'date', required: false, section: 'Plan' },
    { id: 'progress_vs_baseline', label: 'Progress vs. Baseline', type: 'textarea', required: false, section: 'Plan' },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
    { id: 'chart_completed', label: 'Chart Completed Before Checkout', type: 'checkbox', required: true, section: 'Provider Signature' },
  ],
};

// ─── Template 6: Lab Draw Note ───

export const LAB_DRAW_TEMPLATE: ChartTemplate = {
  type: 'lab_draw',
  name: 'Lab Draw Note',
  description: 'For all phlebotomy/blood draw services',
  useFor: 'All blood draws and lab specimen collection',
  requiresMedicalDirectorReview: false,
  blocksCheckout: true,
  sections: [
    'Specimen Collection',
    'Draw Details',
    'Post-Draw',
    'Specimen Handling',
    'Results',
    'Provider Signature',
  ],
  fields: [
    // Specimen Collection
    { id: 'fasting_status', label: 'Fasting Status', type: 'select', required: true, section: 'Specimen Collection', options: FASTING_STATUS },
    { id: 'fasting_hours', label: 'Fasting Hours', type: 'number', required: false, section: 'Specimen Collection', conditionalOn: { field: 'fasting_status', value: 'fasting' } },
    { id: 'tests_ordered', label: 'Tests Ordered', type: 'textarea', required: true, section: 'Specimen Collection', placeholder: 'CBC, CMP, Lipid Panel, TSH, etc.' },
    { id: 'lab_requisition', label: 'Lab Requisition', type: 'select', required: true, section: 'Specimen Collection', options: [{ value: 'printed', label: 'Printed' }, { value: 'electronic', label: 'Electronic' }] },
    { id: 'reference_lab', label: 'Reference Lab', type: 'select', required: true, section: 'Specimen Collection', options: REFERENCE_LABS },
    { id: 'reference_lab_other', label: 'Other Lab', type: 'text', required: false, section: 'Specimen Collection', conditionalOn: { field: 'reference_lab', value: 'other' } },

    // Draw Details
    { id: 'draw_site', label: 'Draw Site', type: 'select', required: true, section: 'Draw Details', options: DRAW_SITES },
    { id: 'draw_site_other', label: 'Other Site', type: 'text', required: false, section: 'Draw Details', conditionalOn: { field: 'draw_site', value: 'other' } },
    { id: 'needle_gauge', label: 'Needle Gauge', type: 'text', required: true, section: 'Draw Details', placeholder: 'e.g. 21G' },
    { id: 'tubes_collected', label: 'Number of Tubes Collected', type: 'number', required: true, section: 'Draw Details' },
    { id: 'tube_types', label: 'Tube Types', type: 'text', required: true, section: 'Draw Details', placeholder: 'e.g. Lavender, Red, Green' },
    { id: 'tourniquet_under_1min', label: 'Tourniquet < 1 min', type: 'radio', required: true, section: 'Draw Details', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { id: 'tourniquet_duration', label: 'Tourniquet Duration', type: 'text', required: false, section: 'Draw Details', conditionalOn: { field: 'tourniquet_under_1min', value: 'no' } },
    { id: 'attempts', label: 'Attempts', type: 'select', required: true, section: 'Draw Details', options: DRAW_ATTEMPTS },
    { id: 'complications', label: 'Complications', type: 'multiselect', required: true, section: 'Draw Details', options: [
      { value: 'none', label: 'None' },
      { value: 'hematoma', label: 'Hematoma' },
      { value: 'syncope', label: 'Syncope' },
      { value: 'difficulty', label: 'Difficulty finding vein' },
    ]},

    // Post-Draw
    { id: 'bandage_applied', label: 'Bandage Applied', type: 'checkbox', required: true, section: 'Post-Draw' },
    { id: 'post_draw_instructions', label: 'Post-Draw Instructions', type: 'select', required: true, section: 'Post-Draw', options: AFTERCARE_METHOD },
    { id: 'keep_bandage', label: 'Keep bandage 1 hour', type: 'checkbox', required: false, section: 'Post-Draw', defaultValue: true },
    { id: 'no_heavy_lifting', label: 'No heavy lifting 4 hours', type: 'checkbox', required: false, section: 'Post-Draw', defaultValue: true },
    { id: 'hydrate', label: 'Hydrate', type: 'checkbox', required: false, section: 'Post-Draw', defaultValue: true },

    // Specimen Handling
    { id: 'labeled_correctly', label: 'Labeled Correctly (2 identifiers verified)', type: 'checkbox', required: true, section: 'Specimen Handling' },
    { id: 'storage', label: 'Storage', type: 'select', required: true, section: 'Specimen Handling', options: SPECIMEN_STORAGE },
    { id: 'pickup_method', label: 'Pickup/Drop-Off', type: 'select', required: true, section: 'Specimen Handling', options: PICKUP_METHOD },
    { id: 'chain_of_custody', label: 'Chain of Custody', type: 'select', required: false, section: 'Specimen Handling', options: [{ value: 'na', label: 'N/A' }, { value: 'maintained', label: 'Maintained' }] },

    // Results
    { id: 'results_expected_days', label: 'Results Expected (business days)', type: 'number', required: true, section: 'Results' },
    { id: 'results_notification', label: 'Results Notification Method', type: 'select', required: true, section: 'Results', options: RESULTS_NOTIFICATION },
    { id: 'followup_appointment', label: 'Follow-Up Appointment', type: 'select', required: true, section: 'Results', options: [{ value: 'scheduled', label: 'Scheduled' }, { value: 'when_available', label: 'When results available' }] },
    { id: 'followup_date', label: 'Follow-Up Date', type: 'date', required: false, section: 'Results', conditionalOn: { field: 'followup_appointment', value: 'scheduled' } },

    // Provider Signature
    { id: 'provider_signature', label: 'Provider Signature', type: 'signature', required: true, section: 'Provider Signature' },
  ],
};

// ─── Template Registry ───

export const CHART_TEMPLATES: Record<ChartTemplateType, ChartTemplate> = {
  injection_log: INJECTION_LOG_TEMPLATE,
  soap_note: SOAP_NOTE_TEMPLATE,
  consultation: CONSULTATION_TEMPLATE,
  program_note: PROGRAM_NOTE_TEMPLATE,
  body_treatment: BODY_TREATMENT_TEMPLATE,
  lab_draw: LAB_DRAW_TEMPLATE,
};

export function getTemplate(type: ChartTemplateType): ChartTemplate {
  return CHART_TEMPLATES[type];
}

export function getTemplateList(): Array<{ type: ChartTemplateType; name: string; description: string }> {
  return Object.values(CHART_TEMPLATES).map((t) => ({
    type: t.type,
    name: t.name,
    description: t.description,
  }));
}
