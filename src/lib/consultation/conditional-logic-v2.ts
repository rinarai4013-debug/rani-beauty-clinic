/**
 * Enhanced Conditional Logic v2 — Medical Branching
 *
 * Extends the existing conditional-logic.ts with medical
 * follow-ups and contraindication warnings.
 */

import type { MedicalHistoryFormData } from './medical-schema';

// Re-export existing functions
export {
  getFollowUpQuestions,
  shouldShowBodyMap,
  getRecommendedServices,
} from './conditional-logic';

// ── Medical Follow-Up Questions ──

export interface MedicalFollowUp {
  id: string;
  question: string;
  field: string;
  type: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
  condition: (data: Partial<MedicalHistoryFormData>) => boolean;
}

export function getMedicalFollowUps(
  data: Partial<MedicalHistoryFormData>
): MedicalFollowUp[] {
  const followUps: MedicalFollowUp[] = [];

  // Blood thinners → ask medication name
  if (data.bloodThinners) {
    followUps.push({
      id: 'blood_thinner_meds',
      question: 'Which blood thinner are you taking?',
      field: 'bloodThinnerName',
      type: 'text',
      condition: (d) => d.bloodThinners === true,
    });
  }

  // Isotretinoin → ask end date
  if (data.isotretinoinHistory) {
    followUps.push({
      id: 'isotretinoin_end',
      question: 'When did you stop taking isotretinoin (Accutane)?',
      field: 'isotretinoinEndDate',
      type: 'date',
      condition: (d) => d.isotretinoinHistory === true,
    });
  }

  // Autoimmune → ask which condition
  if (data.hasAutoimmune) {
    followUps.push({
      id: 'autoimmune_type',
      question: 'Which autoimmune condition(s) do you have?',
      field: 'autoimmuneConditions',
      type: 'select',
      options: [
        { value: 'lupus', label: 'Lupus' },
        { value: 'rheumatoid_arthritis', label: 'Rheumatoid Arthritis' },
        { value: 'psoriasis', label: 'Psoriasis' },
        { value: 'scleroderma', label: 'Scleroderma' },
        { value: 'hashimotos', label: "Hashimoto's Thyroiditis" },
        { value: 'vitiligo', label: 'Vitiligo' },
        { value: 'alopecia_areata', label: 'Alopecia Areata' },
        { value: 'other', label: 'Other' },
      ],
      condition: (d) => d.hasAutoimmune === true,
    });
  }

  // Smoking → ask about frequency
  if (data.smokingStatus === 'current') {
    followUps.push({
      id: 'smoking_freq',
      question: 'How long have you been smoking?',
      field: 'smokingDuration',
      type: 'text',
      condition: (d) => d.smokingStatus === 'current',
    });
  }

  return followUps;
}

// ── Medical Warning Flags ──

export interface MedicalWarning {
  severity: 'info' | 'warning' | 'critical';
  message: string;
  affectedTreatments: string[];
  recommendation: string;
}

export function getMedicalWarnings(
  data: Partial<MedicalHistoryFormData>
): MedicalWarning[] {
  const warnings: MedicalWarning[] = [];

  if (data.pregnant || data.breastfeeding) {
    warnings.push({
      severity: 'critical',
      message: data.pregnant
        ? 'Patient is currently pregnant'
        : 'Patient is currently breastfeeding',
      affectedTreatments: [
        'Botox',
        'Fillers',
        'Chemical Peels',
        'Laser Treatments',
        'RF Microneedling',
        'GLP-1',
      ],
      recommendation:
        'Most aesthetic treatments are contraindicated during pregnancy/breastfeeding. Limit to gentle facials and medical-grade skincare.',
    });
  }

  if (data.bloodThinners) {
    warnings.push({
      severity: 'warning',
      message: 'Patient is on blood thinners',
      affectedTreatments: ['Fillers', 'Microneedling', 'RF Microneedling', 'PRP'],
      recommendation:
        'Increased bruising risk with injectable and microneedling procedures. May need to discontinue under physician guidance before treatment.',
    });
  }

  if (data.isotretinoinHistory) {
    const endDate = data.isotretinoinEndDate
      ? new Date(data.isotretinoinEndDate)
      : null;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (!endDate || endDate > sixMonthsAgo) {
      warnings.push({
        severity: 'critical',
        message: 'Isotretinoin (Accutane) use within last 6 months',
        affectedTreatments: [
          'Chemical Peels',
          'Laser Treatments',
          'Microneedling',
          'RF Microneedling',
          'Waxing',
        ],
        recommendation:
          'Must wait at least 6 months after isotretinoin before ablative/resurfacing procedures. Skin barrier is compromised.',
      });
    }
  }

  if (data.keloidHistory) {
    warnings.push({
      severity: 'warning',
      message: 'History of keloid scarring',
      affectedTreatments: [
        'Microneedling',
        'RF Microneedling',
        'Laser Treatments',
        'Chemical Peels (deep)',
      ],
      recommendation:
        'Proceed with caution on any procedure that creates controlled skin injury. Test patch recommended.',
    });
  }

  if (data.activeSkinInfection) {
    warnings.push({
      severity: 'critical',
      message: 'Active skin infection present',
      affectedTreatments: ['All treatments'],
      recommendation:
        'Resolve active infection before any aesthetic procedure. Refer to dermatologist if needed.',
    });
  }

  if (data.hasAutoimmune) {
    warnings.push({
      severity: 'warning',
      message: `Autoimmune condition: ${(data.autoimmuneConditions || []).join(', ') || 'unspecified'}`,
      affectedTreatments: [
        'Fillers',
        'Laser Treatments',
        'Chemical Peels',
        'RF Microneedling',
      ],
      recommendation:
        'Autoimmune conditions may affect healing and increase risk of flares. Physician clearance recommended before treatment.',
    });
  }

  if (data.recentSunExposure) {
    warnings.push({
      severity: 'info',
      message: 'Recent significant sun exposure',
      affectedTreatments: [
        'Laser Treatments',
        'Chemical Peels',
        'IPL',
        'PicoWay',
      ],
      recommendation:
        'Wait 2-4 weeks after significant sun exposure before laser or peel treatments to reduce hyperpigmentation risk.',
    });
  }

  if (data.smokingStatus === 'current') {
    warnings.push({
      severity: 'info',
      message: 'Current smoker — healing may be impaired',
      affectedTreatments: ['All surgical/invasive treatments'],
      recommendation:
        'Smoking reduces blood flow and delays healing. Recommend reducing or quitting before aggressive treatments.',
    });
  }

  return warnings;
}

// ── Risk Level Calculator ──

export function calculateRiskLevel(
  data: Partial<MedicalHistoryFormData>
): 'low' | 'moderate' | 'high' {
  const warnings = getMedicalWarnings(data);
  const criticalCount = warnings.filter((w) => w.severity === 'critical').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  if (criticalCount > 0) return 'high';
  if (warningCount >= 2) return 'moderate';
  return 'low';
}
