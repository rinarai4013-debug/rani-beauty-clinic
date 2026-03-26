/**
 * Consultation Wizard - Conditional Logic
 *
 * Pure functions that determine which follow-up questions to show
 * based on the user's selections. No side effects, no state.
 */

import { UNIFIED_CATALOG } from '@/data/services/unified-catalog';

// ── Types ──

export interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'select' | 'multiselect' | 'text' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required: boolean;
}

// ── Injectable Categories ──

const INJECTABLE_CATEGORY_IDS = ['injectables'] as const;
const WEIGHT_MANAGEMENT_CATEGORY_IDS = ['weight-management'] as const;

const INJECTABLE_PARENT_SLUGS = ['botox', 'fillers', 'kybella'];
const WEIGHT_PARENT_SLUGS = ['glp1', 'weight-management'];

// ── Concern-to-Service Mapping ──

const CONCERN_SERVICE_MAP: Record<string, string[]> = {
  acne: [
    'hydrafacial-signature',
    'vi-peel',
    'biorepeel-face',
    'prx-t33',
    'rf-micro-face',
    'laser-facial-ndyag',
  ],
  'aging-skin': [
    'sofwave-full-face',
    'sofwave-lower-face',
    'rf-micro-face',
    'rf-micro-face-neck',
    'prx-t33',
    'hydrafacial-signature',
    'vi-peel',
    'biorepeel-face',
    'laser-facial-ndyag',
  ],
  hyperpigmentation: [
    'vi-peel',
    'prx-t33',
    'laser-facial-ndyag',
    'hydrafacial-signature',
    'biorepeel-face',
    'picoway-single',
  ],
  'skin-laxity': [
    'sofwave-full-face',
    'sofwave-lower-face',
    'sofwave-neck',
    'sofwave-brow',
    'rf-micro-face',
    'rf-micro-face-neck',
  ],
  'unwanted-hair': [
    'lhr-full-face',
    'lhr-full-brazilian',
    'lhr-underarms',
    'lhr-full-legs',
    'lhr-full-body',
    'lhr-full-back',
    'lhr-full-arms',
  ],
  'dull-skin': [
    'hydrafacial-signature',
    'hydrafacial-express',
    'biorepeel-face',
    'prx-t33',
    'vi-peel',
  ],
  'body-contouring': [
    'rf-micro-abdomen-small',
    'rf-micro-abdomen-large',
    'rf-micro-back-legs',
    'rf-micro-buttocks',
    'rf-micro-arms',
    'rf-micro-legs',
  ],
  'sun-damage': [
    'vi-peel',
    'laser-facial-ndyag',
    'hydrafacial-signature',
    'picoway-single',
  ],
  'large-pores': [
    'hydrafacial-signature',
    'hydrafacial-express',
    'rf-micro-face',
    'biorepeel-face',
  ],
};

// ── Public Functions ──

/**
 * Returns additional follow-up questions based on the user's selected
 * concerns and treatment interests. Used to show conditional fields
 * in the wizard.
 */
export function getFollowUpQuestions(
  concerns: string[],
  interests: string[]
): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];

  // Acne-specific questions
  if (concerns.includes('acne')) {
    questions.push({
      id: 'acneSeverity',
      question: 'How would you describe your acne?',
      type: 'select',
      options: [
        { value: 'mild', label: 'Mild - occasional breakouts' },
        { value: 'moderate', label: 'Moderate - regular breakouts, some scarring' },
        { value: 'severe', label: 'Severe - persistent, cystic, or widespread' },
      ],
      required: true,
    });
    questions.push({
      id: 'acneMedications',
      question: 'Are you currently using any prescription acne treatments?',
      type: 'text',
      placeholder: 'e.g., Accutane, tretinoin, antibiotics (or "none")',
      required: false,
    });
  }

  // Aging-specific questions
  if (concerns.includes('aging-skin') || concerns.includes('skin-laxity')) {
    questions.push({
      id: 'agingPriority',
      question: 'What bothers you the most?',
      type: 'multiselect',
      options: [
        { value: 'fine-lines', label: 'Fine lines & wrinkles' },
        { value: 'sagging', label: 'Sagging or loss of firmness' },
        { value: 'volume-loss', label: 'Volume loss (cheeks, temples)' },
        { value: 'jowls', label: 'Jowls or double chin' },
        { value: 'neck-lines', label: 'Neck lines (tech neck)' },
        { value: 'crepey-skin', label: 'Crepey or thin skin' },
      ],
      required: true,
    });
  }

  // Hyperpigmentation-specific questions
  if (concerns.includes('hyperpigmentation')) {
    questions.push({
      id: 'pigmentType',
      question: 'What type of discoloration do you experience?',
      type: 'multiselect',
      options: [
        { value: 'dark-spots', label: 'Dark spots or age spots' },
        { value: 'melasma', label: 'Melasma (hormonal patches)' },
        { value: 'pih', label: 'Post-acne marks' },
        { value: 'uneven-tone', label: 'General uneven skin tone' },
        { value: 'sun-spots', label: 'Sun spots or freckles' },
      ],
      required: true,
    });
  }

  // Injectable-specific history question
  if (shouldShowInjectableHistory(interests)) {
    questions.push({
      id: 'injectableHistory',
      question: 'Have you had injectable treatments before?',
      type: 'select',
      options: [
        { value: 'never', label: 'No, this would be my first time' },
        { value: 'botox-only', label: 'Yes - Botox/neurotoxin only' },
        { value: 'fillers-only', label: 'Yes - dermal fillers only' },
        { value: 'both', label: 'Yes - both Botox and fillers' },
      ],
      required: true,
    });
    questions.push({
      id: 'injectableAllergies',
      question: 'Any known allergies to injectables or lidocaine?',
      type: 'boolean',
      required: true,
    });
  }

  // Weight management-specific questions
  if (shouldShowWeightHistory(interests)) {
    questions.push({
      id: 'weightGoal',
      question: 'What is your weight management goal?',
      type: 'select',
      options: [
        { value: 'lose-10-20', label: 'Lose 10-20 lbs' },
        { value: 'lose-20-40', label: 'Lose 20-40 lbs' },
        { value: 'lose-40-plus', label: 'Lose 40+ lbs' },
        { value: 'maintain', label: 'Maintain current weight' },
        { value: 'body-recomp', label: 'Body recomposition (tone & tighten)' },
      ],
      required: true,
    });
    questions.push({
      id: 'glp1Experience',
      question: 'Have you used GLP-1 medications (Ozempic, Wegovy, etc.) before?',
      type: 'select',
      options: [
        { value: 'never', label: 'No, never' },
        { value: 'currently', label: 'Yes, I am currently using one' },
        { value: 'previously', label: 'Yes, but I stopped' },
      ],
      required: true,
    });
    questions.push({
      id: 'medicalConditions',
      question: 'Do you have any of the following conditions?',
      type: 'multiselect',
      options: [
        { value: 'diabetes-2', label: 'Type 2 Diabetes' },
        { value: 'thyroid', label: 'Thyroid disorder' },
        { value: 'pcos', label: 'PCOS' },
        { value: 'high-bp', label: 'High blood pressure' },
        { value: 'none', label: 'None of the above' },
      ],
      required: true,
    });
  }

  // Hair removal - ask about skin tone for laser safety
  if (concerns.includes('unwanted-hair')) {
    questions.push({
      id: 'fitzpatrickType',
      question: 'What best describes your natural skin tone?',
      type: 'select',
      options: [
        { value: 'i-ii', label: 'Very fair to fair (burns easily)' },
        { value: 'iii', label: 'Medium (sometimes burns, sometimes tans)' },
        { value: 'iv', label: 'Olive (rarely burns, tans easily)' },
        { value: 'v-vi', label: 'Brown to dark brown (rarely to never burns)' },
      ],
      required: true,
    });
  }

  return questions;
}

/**
 * Whether to show the full body map selector (front + back body diagram).
 * Needed when concerns involve physical body areas beyond the face.
 */
export function shouldShowBodyMap(concerns: string[]): boolean {
  return concerns.includes('unwanted-hair') || concerns.includes('body-contouring');
}

/**
 * Whether to show injectable-specific history questions.
 * True when treatment interests include any injectable service.
 */
export function shouldShowInjectableHistory(interests: string[]): boolean {
  return interests.some((id) => {
    const service = UNIFIED_CATALOG.find((s) => s.id === id);
    if (!service) return false;
    return (
      service.category === 'injectables' ||
      INJECTABLE_PARENT_SLUGS.some((slug) => service.parentSlug === slug)
    );
  });
}

/**
 * Whether to show weight management history questions.
 * True when treatment interests include GLP-1 or weight management services.
 */
export function shouldShowWeightHistory(interests: string[]): boolean {
  return interests.some((id) => {
    const service = UNIFIED_CATALOG.find((s) => s.id === id);
    if (!service) return false;
    return (
      service.category === 'weight-management' ||
      WEIGHT_PARENT_SLUGS.some((slug) => service.parentSlug === slug)
    );
  });
}

/**
 * Given a list of skin concerns, returns recommended service IDs from the
 * unified catalog that address those concerns. De-duplicated and sorted
 * by number of matching concerns (most relevant first).
 */
export function getRecommendedServices(concerns: string[]): string[] {
  if (concerns.length === 0) return [];

  // Collect service IDs with match counts
  const matchCounts = new Map<string, number>();

  for (const concern of concerns) {
    const serviceIds = CONCERN_SERVICE_MAP[concern];
    if (!serviceIds) continue;

    for (const serviceId of serviceIds) {
      // Verify the service exists in the catalog
      const exists = UNIFIED_CATALOG.some((s) => s.id === serviceId);
      if (exists) {
        matchCounts.set(serviceId, (matchCounts.get(serviceId) || 0) + 1);
      }
    }
  }

  // Sort by match count (descending) then by catalog order
  return Array.from(matchCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}
