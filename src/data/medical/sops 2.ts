/**
 * Medical Standard Operating Procedures (SOPs)
 * Rani Beauty Clinic
 *
 * Step-by-step protocols for all medical weight loss operations.
 */

import type { SOP, SOPStep } from '../../lib/medical/types';

// ============================================================
// NEW GLP-1 PATIENT SOP
// ============================================================

export const NEW_GLP1_SOP: SOP = {
  id: 'new-glp1',
  name: 'New GLP-1 Patient: Intake to First Dose',
  description: 'Complete onboarding workflow for new GLP-1 weight loss patients. From initial intake form through first dose instruction.',
  triggerEvent: 'New intake form received for GLP-1 service (Semaglutide or Tirzepatide).',
  steps: [
    {
      stepNumber: 1,
      title: 'Process Intake Form',
      description: 'Review intake form for completeness. Parse patient data including demographics, medical history, current medications, allergies, and pregnancy status.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 5,
      systemActions: [
        'Run intake processor to parse form data',
        'Calculate BMI and verify GLP-1 eligibility',
        'Create patient record in Airtable',
        'Apply initial Mangomint tags (GLP1-PATIENT, NEW-PATIENT)',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Run Contraindication Screening',
      description: 'Check patient medical history against hard stop and soft flag contraindications. Block if any hard stops found.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 2,
      systemActions: [
        'Run contraindication check against medical history',
        'Flag hard stops (MTC, MEN2, Type 1 Diabetes, pregnancy, breastfeeding)',
        'Flag soft conditions for MD review (pancreatitis, gastroparesis, active cancer)',
        'If hard stop: STOP pipeline, notify owner, send patient notice',
        'If soft flag: add MD-REVIEW-NEEDED tag, queue for review',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Send Welcome Messages',
      description: 'Send welcome SMS and email to patient. Introduce Rina, set expectations for the process.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 2,
      systemActions: [
        'Generate welcome SMS (under 300 chars)',
        'Generate welcome email with next steps',
        'Send via message router',
        'Log communication in patient timeline',
      ],
      requiredBefore: ['Step 2 (passed screening)'],
    },
    {
      stepNumber: 4,
      title: 'Order Labs',
      description: 'Determine required labs based on service. Send lab order instructions to patient.',
      owner: 'Rina (Automated) + Patient',
      estimatedMinutes: 10,
      systemActions: [
        'Identify required labs (CMP, Lipid Panel, HbA1c, TSH, Free T4)',
        'Generate lab order document',
        'Send lab instructions to patient (SMS + email)',
        'Move pipeline to LABS_NEEDED stage',
        'Set SLA timer (5 days max)',
        'Add LABS-DUE tag',
      ],
      requiredBefore: ['Step 3'],
    },
    {
      stepNumber: 5,
      title: 'Receive & Review Labs',
      description: 'Receive lab results. Review for any abnormalities. Clear patient for GFE or flag for provider review.',
      owner: 'Rina + Provider',
      estimatedMinutes: 15,
      systemActions: [
        'Log lab results in patient record',
        'Flag any out-of-range values',
        'Update lab status to received',
        'Remove LABS-DUE tag',
        'If all clear: advance to GFE_PENDING',
        'If abnormal: flag for provider review before advancing',
      ],
      requiredBefore: ['Step 4 (labs received)'],
    },
    {
      stepNumber: 6,
      title: 'Schedule Good Faith Exam (GFE)',
      description: 'Enter patient data into Qualiphy. Schedule GFE virtual appointment. Send patient instructions.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Generate Qualiphy quick-entry block',
        'Enter patient data into Qualiphy platform',
        'Send GFE scheduling link to patient',
        'Add GFE-PENDING tag',
        'Set SLA timer (7 days max)',
        'Send GFE reminder if no action in 3 days',
      ],
      requiredBefore: ['Step 5 (labs cleared)'],
    },
    {
      stepNumber: 7,
      title: 'GFE Completion & Prescription',
      description: 'GFE completed via Qualiphy. Provider reviews and writes prescription. Patient approved for treatment.',
      owner: 'Provider + Rina',
      estimatedMinutes: 15,
      systemActions: [
        'Log GFE completion in patient record',
        'Set GFE expiration date (1 year)',
        'Remove GFE-PENDING tag',
        'Advance pipeline to RX_APPROVED',
        'Send approval celebration message to patient',
        'Place pharmacy order for compounded medication',
        'Collect first payment',
      ],
      requiredBefore: ['Step 6 (GFE completed)'],
    },
    {
      stepNumber: 8,
      title: 'Medication Shipment',
      description: 'Pharmacy ships compounded medication to patient. Track shipment and confirm delivery.',
      owner: 'Rina + Pharmacy',
      estimatedMinutes: 5,
      systemActions: [
        'Log tracking number when available',
        'Send shipping notification to patient',
        'Advance pipeline to MED_SHIPPED',
        'Monitor tracking for delivery confirmation',
        'Send delivery check-in text 5 days after shipping',
      ],
      requiredBefore: ['Step 7 (order placed)'],
    },
    {
      stepNumber: 9,
      title: 'First Dose Instructions & Activation',
      description: 'Patient receives medication. Send first dose instructions. Mark patient as active. Schedule first follow-up.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Send first dose instruction SMS + email',
        'Set initial dose tag (SEMA-D1 or TIRZ-D1)',
        'Advance pipeline to ACTIVE_PATIENT',
        'Remove NEW-PATIENT tag',
        'Add FOLLOW-UP-DUE tag',
        'Schedule Week 1 check-in',
        'Create first refill record (30 days out)',
        'Log estimated monthly revenue',
        'Flag cross-sell opportunities for Month 2+',
      ],
      requiredBefore: ['Step 8 (delivery confirmed)'],
    },
  ],
  totalEstimatedMinutes: 74,
  tags: ['GLP1-PATIENT', 'NEW-PATIENT', 'LABS-DUE', 'GFE-PENDING', 'FOLLOW-UP-DUE'],
};

// ============================================================
// NEW PEPTIDE PATIENT SOP
// ============================================================

export const NEW_PEPTIDE_SOP: SOP = {
  id: 'new-peptide',
  name: 'New Peptide Patient Onboarding',
  description: 'Onboarding workflow for new peptide therapy patients (NAD+, Sermorelin, BPC-157, GHK-Cu, PT-141).',
  triggerEvent: 'New intake form received for peptide service.',
  steps: [
    {
      stepNumber: 1,
      title: 'Process Intake & Screen',
      description: 'Process intake form. Run contraindication screening specific to the peptide requested.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 5,
      systemActions: [
        'Parse intake form data',
        'Run contraindication check (peptide-specific)',
        'Create patient record',
        'Apply PEPTIDE-PATIENT tag',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Determine Lab Requirements',
      description: 'Check if the specific peptide requires labs. Sermorelin needs IGF-1, CMP, CBC. Others may not require labs.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 2,
      systemActions: [
        'Check service catalog for lab requirements',
        'If labs needed: send lab order, move to LABS_NEEDED',
        'If no labs: skip to GFE step',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'GFE via Qualiphy',
      description: 'All peptide services require GFE. Enter patient in Qualiphy, schedule exam.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Generate Qualiphy quick-entry',
        'Send GFE scheduling link',
        'Track completion',
      ],
      requiredBefore: ['Step 2 (labs complete, if needed)'],
    },
    {
      stepNumber: 4,
      title: 'Prescription & Fulfillment',
      description: 'Provider approves treatment. Order medication. Process payment.',
      owner: 'Provider + Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Provider review and prescription',
        'Place pharmacy order',
        'Collect payment',
        'Send approval message',
      ],
      requiredBefore: ['Step 3'],
    },
    {
      stepNumber: 5,
      title: 'Treatment Initiation',
      description: 'Deliver medication or schedule in-clinic appointment. Send instructions. Activate patient.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Send treatment instructions',
        'Mark ACTIVE_PATIENT',
        'Schedule first follow-up',
        'Set refill cadence if applicable',
      ],
      requiredBefore: ['Step 4'],
    },
  ],
  totalEstimatedMinutes: 37,
  tags: ['PEPTIDE-PATIENT', 'NEW-PATIENT'],
};

// ============================================================
// NEW HORMONE PATIENT SOP
// ============================================================

export const NEW_HORMONE_SOP: SOP = {
  id: 'new-hormone',
  name: 'New Hormone Optimization Patient Onboarding',
  description: 'Onboarding workflow for hormone optimization patients (Testosterone, Thyroid, DHEA).',
  triggerEvent: 'New intake form received for hormone optimization service.',
  steps: [
    {
      stepNumber: 1,
      title: 'Process Intake & Screen',
      description: 'Process intake form. Hormone patients require comprehensive screening for contraindications.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 5,
      systemActions: [
        'Parse intake form data',
        'Run hormone-specific contraindication check',
        'Check for prostate cancer, breast cancer, polycythemia',
        'Apply HORMONE-PATIENT tag',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Comprehensive Lab Panel',
      description: 'Hormone patients require extensive lab work. Order full hormone panel.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Order labs: Total/Free Testosterone, Estradiol, DHEA-S, Cortisol, TSH/FT4, CMP, CBC, PSA (if male)',
        'Send lab instructions to patient',
        'Add LABS-DUE tag',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Lab Review & Treatment Plan',
      description: 'Provider reviews comprehensive labs. Develops personalized hormone treatment plan.',
      owner: 'Provider',
      estimatedMinutes: 20,
      systemActions: [
        'Log all lab results',
        'Provider creates treatment plan based on levels',
        'Determine starting dose and frequency',
        'Document in patient record',
      ],
      requiredBefore: ['Step 2 (labs received)'],
    },
    {
      stepNumber: 4,
      title: 'GFE & Prescription',
      description: 'Complete GFE via Qualiphy. Provider writes prescription based on treatment plan.',
      owner: 'Provider + Rina',
      estimatedMinutes: 15,
      systemActions: [
        'Complete GFE',
        'Write prescription',
        'Place pharmacy order',
        'Collect payment',
      ],
      requiredBefore: ['Step 3'],
    },
    {
      stepNumber: 5,
      title: 'Treatment Start & Monitoring',
      description: 'Start hormone therapy. Schedule follow-up labs at 6-8 weeks. Monthly check-ins.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Send treatment instructions',
        'Mark ACTIVE_PATIENT',
        'Schedule 6-week follow-up labs',
        'Set monthly check-in cadence',
        'Create refill schedule',
      ],
      requiredBefore: ['Step 4'],
    },
  ],
  totalEstimatedMinutes: 60,
  tags: ['HORMONE-PATIENT', 'NEW-PATIENT', 'LABS-DUE'],
};

// ============================================================
// TITRATION SOP
// ============================================================

export const TITRATION_SOP: SOP = {
  id: 'titration',
  name: 'GLP-1 Dose Increase Protocol',
  description: 'Protocol for titrating GLP-1 medication to the next dose level.',
  triggerEvent: 'Patient has completed minimum weeks at current dose and is eligible for titration.',
  steps: [
    {
      stepNumber: 1,
      title: 'Assess Eligibility',
      description: 'Verify patient has been at current dose for minimum required weeks. Review side effect reports.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 5,
      systemActions: [
        'Check dose tracker for weeks at current dose',
        'Review recent side effect reports',
        'Verify no unresolved moderate/severe side effects',
        'Check weight progress',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Provider Review',
      description: 'Provider reviews patient progress and approves dose increase.',
      owner: 'Provider',
      estimatedMinutes: 5,
      systemActions: [
        'Review weight loss progress',
        'Review side effect history',
        'Approve or hold titration',
        'Document decision',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Process Dose Change',
      description: 'Update dose level. Order new dose medication. Update patient records.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Update dose record (e.g., SEMA-D1 to SEMA-D2)',
        'Update Mangomint dose tag',
        'Place pharmacy order for new dose',
        'Send patient notification about dose change',
        'Update next titration date',
      ],
      requiredBefore: ['Step 2 (approved)'],
    },
    {
      stepNumber: 4,
      title: 'Patient Education',
      description: 'Send dose change instructions. What to expect at new dose.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'Send dose change instructions SMS + email',
        'Include expected side effects for new dose',
        'Schedule 1-week check-in for new dose',
        'Remind about hydration and diet tips',
      ],
      requiredBefore: ['Step 3'],
    },
  ],
  totalEstimatedMinutes: 25,
  tags: ['GLP1-PATIENT', 'FOLLOW-UP-DUE'],
};

// ============================================================
// REFILL SOP
// ============================================================

export const REFILL_SOP: SOP = {
  id: 'refill',
  name: 'Monthly Refill Processing',
  description: 'Standard monthly medication refill processing workflow.',
  triggerEvent: 'Refill due date approaching (7 days out).',
  steps: [
    {
      stepNumber: 1,
      title: 'Send Refill Reminder (Day -7)',
      description: 'Send first refill reminder text 7 days before due date.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 1,
      systemActions: [
        'Generate refill reminder text',
        'Send SMS to patient',
        'Add REFILL-DUE tag',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Second Reminder (Day -3)',
      description: 'If no response, send second reminder 3 days before due date.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 1,
      systemActions: [
        'Check if patient has confirmed',
        'If not confirmed: send second reminder',
        'Log communication',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Process Refill',
      description: 'Patient confirms. Process payment and place pharmacy order.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'Charge payment on file',
        'If payment fails: initiate payment failure protocol',
        'Place pharmacy order',
        'Update refill status to processing',
      ],
      requiredBefore: ['Step 2 (patient confirmed)'],
    },
    {
      stepNumber: 4,
      title: 'Ship & Confirm',
      description: 'Medication ships. Notify patient. Remove refill-due tag.',
      owner: 'Rina + Pharmacy',
      estimatedMinutes: 2,
      systemActions: [
        'Log shipping/tracking info',
        'Send shipping notification',
        'Remove REFILL-DUE tag',
        'Create next refill record (30 days out)',
      ],
      requiredBefore: ['Step 3'],
    },
  ],
  totalEstimatedMinutes: 9,
  tags: ['REFILL-DUE'],
};

// ============================================================
// QUARTERLY LABS SOP
// ============================================================

export const QUARTERLY_LABS_SOP: SOP = {
  id: 'quarterly-labs',
  name: '90-Day Lab Re-Check',
  description: 'Quarterly lab re-check protocol to monitor treatment safety and effectiveness.',
  triggerEvent: 'Patient approaching 90-day lab cycle (7 days before due).',
  steps: [
    {
      stepNumber: 1,
      title: 'Send Lab Reminder',
      description: 'Notify patient that quarterly labs are due.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 2,
      systemActions: [
        'Generate lab reminder message',
        'Send SMS + email',
        'Add LABS-DUE tag',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Lab Completion',
      description: 'Patient completes labs. Results received.',
      owner: 'Patient + Lab',
      estimatedMinutes: 5,
      systemActions: [
        'Receive lab results',
        'Log in patient record',
        'Update lab expiration date (+90 days)',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Provider Review',
      description: 'Provider reviews labs. Check for changes, flag any concerns.',
      owner: 'Provider',
      estimatedMinutes: 10,
      systemActions: [
        'Compare with previous lab results',
        'Flag significant changes',
        'Document findings',
        'Approve continuation or adjust treatment',
      ],
      requiredBefore: ['Step 2'],
    },
    {
      stepNumber: 4,
      title: 'Patient Update',
      description: 'Notify patient of lab results and any treatment adjustments.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'Send lab results summary to patient',
        'Remove LABS-DUE tag',
        'If adjustments needed: initiate appropriate protocol',
        'Schedule next quarterly labs',
      ],
      requiredBefore: ['Step 3'],
    },
  ],
  totalEstimatedMinutes: 22,
  tags: ['LABS-DUE'],
};

// ============================================================
// EMERGENCY SOP
// ============================================================

export const EMERGENCY_SOP: SOP = {
  id: 'emergency',
  name: 'Severe Side Effects Emergency Response',
  description: 'Emergency protocol for patients reporting severe side effects: abdominal pain, allergic reaction, suicidal ideation, chest pain.',
  triggerEvent: 'Patient reports severe side effects or emergency symptoms.',
  steps: [
    {
      stepNumber: 1,
      title: 'Assess Severity',
      description: 'Quickly assess the severity and type of the reported symptom.',
      owner: 'Rina',
      estimatedMinutes: 2,
      systemActions: [
        'Identify emergency type',
        'Pull emergency protocol for specific type',
        'Log incident start time',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Direct to ER if Critical',
      description: 'If critical (breathing difficulty, severe pain, suicidal ideation, chest pain): direct to ER or 911 immediately.',
      owner: 'Rina',
      estimatedMinutes: 3,
      systemActions: [
        'Send emergency response text with ER instructions',
        'For suicidal ideation: provide 988 Suicide & Crisis Lifeline',
        'Instruct patient to stop medication',
        'Stay in contact until patient confirms getting help',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Notify Owner',
      description: 'Immediately notify clinic owner (Sukhi) via text with incident details.',
      owner: 'Rina',
      estimatedMinutes: 1,
      systemActions: [
        'Send owner alert with patient name, symptoms, and actions taken',
        'Include patient contact info',
        'Flag for urgent follow-up',
      ],
      requiredBefore: ['Step 2'],
    },
    {
      stepNumber: 4,
      title: 'Document & Stop Medication',
      description: 'Document the incident. Mark medication as discontinued pending review.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'Create incident report in patient record',
        'Mark medication on hold',
        'Cancel upcoming refill if applicable',
        'Add AT-RISK tag',
      ],
      requiredBefore: ['Step 3'],
    },
    {
      stepNumber: 5,
      title: 'Follow-Up',
      description: 'Follow up with patient next day. Require MD clearance before restarting any medication.',
      owner: 'Rina + Provider',
      estimatedMinutes: 15,
      systemActions: [
        'Schedule follow-up call for next day',
        'Require MD clearance note before restart',
        'For suicidal ideation: require psychiatric clearance',
        'Update patient status based on outcome',
      ],
      requiredBefore: ['Step 4'],
    },
  ],
  totalEstimatedMinutes: 26,
  tags: ['AT-RISK'],
};

// ============================================================
// CHURN-SAVE SOP
// ============================================================

export const CHURN_SAVE_SOP: SOP = {
  id: 'churn-save',
  name: 'Patient Wants to Cancel',
  description: 'Retention protocol when a patient expresses desire to cancel or discontinue treatment.',
  triggerEvent: 'Patient requests cancellation or stops responding to refill reminders.',
  steps: [
    {
      stepNumber: 1,
      title: 'Understand the Reason',
      description: 'Reach out personally. Understand why the patient wants to cancel. Listen without pressure.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Send personalized re-engagement text',
        'If no response in 24h: follow up with phone call',
        'Document reason for potential cancellation',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'Address Concerns',
      description: 'Based on reason, offer appropriate resolution.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Side effects: discuss dose adjustment or medication switch',
        'Cost: discuss payment plans or alternative services',
        'Not seeing results: review timeline expectations, consider titration',
        'Lifestyle: offer flexible scheduling or pause option',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Offer Alternatives',
      description: 'If patient still wants to cancel, offer alternatives before processing.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'Offer 1-month pause instead of cancellation',
        'Offer to switch medication (Semaglutide to Tirzepatide or vice versa)',
        'Offer to step down to wellness injections only',
        'Document patient decision',
      ],
      requiredBefore: ['Step 2'],
    },
    {
      stepNumber: 4,
      title: 'Process Decision',
      description: 'Process the patient\'s final decision. If cancelling, handle gracefully.',
      owner: 'Rina',
      estimatedMinutes: 5,
      systemActions: [
        'If staying: document new plan, update records',
        'If cancelling: process cancellation respectfully',
        'Cancel upcoming refills',
        'Remove active service tags',
        'Send graceful farewell message',
        'Add to win-back list (re-engage in 30 days)',
        'Calculate revenue lost',
      ],
      requiredBefore: ['Step 3'],
    },
  ],
  totalEstimatedMinutes: 30,
  tags: ['AT-RISK'],
};

// ============================================================
// PAYMENT FAILED SOP
// ============================================================

export const PAYMENT_FAILED_SOP: SOP = {
  id: 'payment-failed',
  name: 'Card Declined / Payment Failed',
  description: 'Protocol for handling failed payments on medication refills.',
  triggerEvent: 'Payment processing fails for a scheduled refill.',
  steps: [
    {
      stepNumber: 1,
      title: 'Send Payment Update Request',
      description: 'Send friendly text asking patient to update payment method.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 1,
      systemActions: [
        'Generate payment failure text (friendly tone)',
        'Send SMS to patient',
        'Add PAYMENT-ISSUE tag',
        'Schedule auto-retry for 3 days',
      ],
      requiredBefore: [],
    },
    {
      stepNumber: 2,
      title: 'First Auto-Retry (Day 3)',
      description: 'Automatically retry payment. If fails again, send second notice.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 1,
      systemActions: [
        'Retry payment on file',
        'If success: process refill, remove PAYMENT-ISSUE tag',
        'If fail: send second notice via email',
        'Schedule second retry for Day 6',
      ],
      requiredBefore: ['Step 1'],
    },
    {
      stepNumber: 3,
      title: 'Second Auto-Retry (Day 6)',
      description: 'Second retry. If fails, send urgent notice.',
      owner: 'Rina (Automated)',
      estimatedMinutes: 1,
      systemActions: [
        'Retry payment',
        'If success: process refill',
        'If fail: send urgent SMS',
        'Schedule final retry for Day 9',
      ],
      requiredBefore: ['Step 2'],
    },
    {
      stepNumber: 4,
      title: 'Final Retry & Manual Outreach (Day 9)',
      description: 'Final automated retry. If fails, manual phone outreach.',
      owner: 'Rina',
      estimatedMinutes: 10,
      systemActions: [
        'Final payment retry',
        'If success: process refill',
        'If fail: personal phone call from Rina',
        'If no resolution: cancel refill, mark AT-RISK',
        'Initiate churn-save protocol if needed',
      ],
      requiredBefore: ['Step 3'],
    },
  ],
  totalEstimatedMinutes: 13,
  tags: ['PAYMENT-ISSUE', 'AT-RISK'],
};

// ============================================================
// ALL SOPS
// ============================================================

/** Complete list of all medical SOPs */
export const ALL_SOPS: SOP[] = [
  NEW_GLP1_SOP,
  NEW_PEPTIDE_SOP,
  NEW_HORMONE_SOP,
  TITRATION_SOP,
  REFILL_SOP,
  QUARTERLY_LABS_SOP,
  EMERGENCY_SOP,
  CHURN_SAVE_SOP,
  PAYMENT_FAILED_SOP,
];

// ============================================================
// SOP HELPERS
// ============================================================

/**
 * Finds a SOP by its ID.
 */
export function getSOPById(sopId: string): SOP | undefined {
  return ALL_SOPS.find((s) => s.id === sopId);
}

/**
 * Returns the total estimated time for a SOP.
 */
export function getSOPDuration(sopId: string): number {
  const sop = getSOPById(sopId);
  return sop?.totalEstimatedMinutes ?? 0;
}

/**
 * Formats a SOP as a readable checklist.
 */
export function formatSOPChecklist(sop: SOP): string {
  const lines = [
    `SOP: ${sop.name}`,
    '='.repeat(50),
    '',
    `Description: ${sop.description}`,
    `Trigger: ${sop.triggerEvent}`,
    `Estimated Time: ${sop.totalEstimatedMinutes} minutes`,
    '',
    'Steps:',
  ];

  for (const step of sop.steps) {
    lines.push(`\n  ${step.stepNumber}. ${step.title} (${step.estimatedMinutes} min)`);
    lines.push(`     Owner: ${step.owner}`);
    lines.push(`     ${step.description}`);
    if (step.systemActions.length > 0) {
      lines.push('     Actions:');
      for (const action of step.systemActions) {
        lines.push(`       - ${action}`);
      }
    }
  }

  return lines.join('\n');
}
