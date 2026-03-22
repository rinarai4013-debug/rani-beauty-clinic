'use client';

import { useReducer, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Sparkles,
  User,
  HeartPulse,
  ClipboardList,
  History,
  Target,
  Camera,
  CheckCircle2,
} from 'lucide-react';

import WizardProgressBar from './WizardProgressBar';
import WizardTrustBar from './WizardTrustBar';
import {
  type ConsultationFormData,
  stepSchemas,
  validateStep,
  SKIN_CONCERN_OPTIONS,
  FACE_ZONES,
  BODY_ZONES,
  SKIN_TYPES,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
} from '@/lib/consultation/schema';
import {
  getFollowUpQuestions,
  shouldShowBodyMap,
  getRecommendedServices,
} from '@/lib/consultation/conditional-logic';
import { UNIFIED_CATALOG, type ServiceCategory } from '@/data/services/unified-catalog';

// ── Constants ──

const STEP_LABELS = [
  'Welcome',
  'About You',
  'Concerns',
  'Interests',
  'History',
  'Goals',
  'Photos',
  'Summary',
] as const;

const TOTAL_STEPS = STEP_LABELS.length;

const STEP_ICONS = [
  Sparkles,
  User,
  HeartPulse,
  ClipboardList,
  History,
  Target,
  Camera,
  CheckCircle2,
] as const;

// Treatment interest category groups for display
const TREATMENT_CATEGORIES: { label: string; categories: ServiceCategory[] }[] = [
  { label: 'Facials & Peels', categories: ['facial', 'chemical-peel'] },
  { label: 'Laser Treatments', categories: ['laser', 'laser-hair-removal'] },
  { label: 'Skin Tightening', categories: ['skin-tightening', 'rf-microneedling'] },
  { label: 'Injectables', categories: ['injectables'] },
  { label: 'Wellness & Weight', categories: ['wellness', 'weight-management', 'hormones'] },
  { label: 'Skincare & Hair', categories: ['skincare', 'hair'] },
];

// Readable labels for skin concerns
const CONCERN_LABELS: Record<string, string> = {
  acne: 'Acne & Breakouts',
  'aging-skin': 'Aging & Fine Lines',
  hyperpigmentation: 'Dark Spots & Uneven Tone',
  'skin-laxity': 'Sagging & Loss of Firmness',
  'unwanted-hair': 'Unwanted Hair',
  'dull-skin': 'Dull or Tired Skin',
  'body-contouring': 'Body Contouring & Tightening',
  'sun-damage': 'Sun Damage',
  'large-pores': 'Large Pores',
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  dry: 'Dry',
  oily: 'Oily',
  combination: 'Combination',
  sensitive: 'Sensitive',
};

const TIMELINE_LABELS: Record<string, string> = {
  event: 'Preparing for an event',
  gradual: 'Gradual improvement over time',
  ongoing: 'Ongoing maintenance',
  asap: 'As soon as possible',
};

const BUDGET_LABELS: Record<string, string> = {
  starter: 'Starter ($100\u2013$500)',
  moderate: 'Moderate ($500\u2013$1,500)',
  premium: 'Premium ($1,500\u2013$3,500)',
  investment: 'Investment ($3,500+)',
};

// ── State ──

interface WizardState {
  currentStep: number;
  direction: 1 | -1;
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

type WizardAction =
  | { type: 'SET_FIELD'; field: string; value: unknown }
  | { type: 'SET_STEP'; step: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END'; success: boolean }
  | { type: 'GO_TO_STEP'; step: number };

const initialState: WizardState = {
  currentStep: 0,
  direction: 1,
  formData: {
    skinConcerns: [],
    targetAreas: [],
    treatmentInterests: [],
    photos: [],
    smsConsent: false,
    treatmentHistory: '',
  },
  errors: {},
  isSubmitting: false,
  isSubmitted: false,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: { ...state.formData, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.step,
        direction: action.step > state.currentStep ? 1 : -1,
        errors: {},
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
        direction: 1,
        errors: {},
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
        direction: -1,
        errors: {},
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true };
    case 'SUBMIT_END':
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: action.success,
      };
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.step,
        direction: action.step > state.currentStep ? 1 : -1,
        errors: {},
      };
    default:
      return state;
  }
}

// ── Animation Variants ──

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ── Component ──

export default function ConsultationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { currentStep, direction, formData, errors, isSubmitting, isSubmitted } = state;

  // ── Handlers ──

  const setField = useCallback(
    (field: string, value: unknown) => {
      dispatch({ type: 'SET_FIELD', field, value });
    },
    []
  );

  const toggleArrayField = useCallback(
    (field: string, value: string) => {
      const current = (formData[field as keyof ConsultationFormData] as string[]) || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      dispatch({ type: 'SET_FIELD', field, value: next });
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    const { success, errors: stepErrors } = validateStep(currentStep, formData);
    if (!success) {
      dispatch({ type: 'SET_ERRORS', errors: stepErrors });
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  }, [currentStep, formData]);

  const handlePrev = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const handleSubmit = useCallback(async () => {
    const { success, errors: stepErrors } = validateStep(currentStep, formData);
    if (!success) {
      dispatch({ type: 'SET_ERRORS', errors: stepErrors });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      // Build multipart form data for file uploads
      const body = new FormData();
      const { photos, ...jsonData } = formData;
      body.append('data', JSON.stringify(jsonData));

      if (photos && photos.length > 0) {
        for (const photo of photos) {
          body.append('photos', photo);
        }
      }

      const res = await fetch('/api/consultation/submit', {
        method: 'POST',
        body,
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      dispatch({ type: 'SUBMIT_END', success: true });
    } catch {
      dispatch({ type: 'SUBMIT_END', success: false });
      dispatch({
        type: 'SET_ERRORS',
        errors: { submit: 'Something went wrong. Please try again.' },
      });
    }
  }, [currentStep, formData]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const existing = (formData.photos as File[]) || [];
      const combined = [...existing, ...files].slice(0, 3);
      setField('photos', combined);
    },
    [formData.photos, setField]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const current = (formData.photos as File[]) || [];
      setField(
        'photos',
        current.filter((_, i) => i !== index)
      );
    },
    [formData.photos, setField]
  );

  // ── Computed ──

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isFirstStep = currentStep === 0;
  const recommendedServices = getRecommendedServices(
    (formData.skinConcerns as string[]) || []
  );
  const showBodyMap = shouldShowBodyMap((formData.skinConcerns as string[]) || []);

  // Unique services for interest display
  const servicesByCategory = TREATMENT_CATEGORIES.map((group) => ({
    ...group,
    services: UNIFIED_CATALOG.filter(
      (s) =>
        group.categories.includes(s.category) &&
        !s.name.includes('Add-On') &&
        s.category !== 'consultation'
    ).filter(
      // De-duplicate by parentSlug, keep first (cheapest/most common)
      (service, i, arr) =>
        !service.parentSlug ||
        arr.findIndex((s) => s.parentSlug === service.parentSlug) === i
    ),
  })).filter((group) => group.services.length > 0);

  // ── Test Auto-Fill (dev only) ──

  const fillTestData = useCallback(() => {
    const testData: Record<string, unknown> = {
      firstName: 'Jasmine',
      lastName: 'Patel',
      email: 'jasmine.test@example.com',
      phone: '(425) 555-0199',
      dob: '1992-06-15',
      skinConcerns: ['aging-skin', 'hyperpigmentation', 'dull-skin'],
      targetAreas: ['forehead', 'cheeks', 'jawline'],
      treatmentInterests: ['facial', 'chemical-peel', 'skin-tightening'],
      skinType: 'combination',
      treatmentHistory: 'Had a HydraFacial 6 months ago and loved it. First time considering peels.',
      currentRoutine: 'Cetaphil cleanser, vitamin C serum, SPF 50 daily.',
      allergies: 'None known',
      goals: 'I want glowing, even-toned skin for my sister\'s wedding in September. Also interested in preventative treatments for fine lines.',
      timeline: 'event',
      eventDate: '2026-09-15',
      budget: 'premium',
      smsConsent: true,
    };
    Object.entries(testData).forEach(([field, value]) => {
      dispatch({ type: 'SET_FIELD', field, value });
    });
    // Jump to summary step
    dispatch({ type: 'GO_TO_STEP', step: TOTAL_STEPS - 1 });
  }, []);

  // ── Success State ──

  if (isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#C9A96E]/10 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-[#C9A96E]" />
          </motion.div>
          <h2 className="font-heading text-3xl text-[#0F1D2C] mb-3">
            You&apos;re All Set
          </h2>
          <p className="font-body text-[#0F1D2C]/60 max-w-md mx-auto mb-8">
            Thank you, {formData.firstName}! Our team will review your consultation
            and reach out within 24 hours with a personalized treatment plan.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1D2C] text-white font-body font-medium rounded-xl hover:bg-[#0F1D2C]/90 transition-colors"
          >
            Return to Homepage
          </a>
        </motion.div>
      </div>
    );
  }

  // ── Step Renderers ──

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepWelcome />;
      case 1:
        return (
          <StepAboutYou
            formData={formData}
            errors={errors}
            setField={setField}
          />
        );
      case 2:
        return (
          <StepConcerns
            formData={formData}
            errors={errors}
            toggleArrayField={toggleArrayField}
            showBodyMap={showBodyMap}
          />
        );
      case 3:
        return (
          <StepInterests
            formData={formData}
            errors={errors}
            toggleArrayField={toggleArrayField}
            servicesByCategory={servicesByCategory}
            recommendedServices={recommendedServices}
          />
        );
      case 4:
        return (
          <StepHistory
            formData={formData}
            errors={errors}
            setField={setField}
          />
        );
      case 5:
        return (
          <StepGoals
            formData={formData}
            errors={errors}
            setField={setField}
          />
        );
      case 6:
        return (
          <StepPhotos
            formData={formData}
            errors={errors}
            handleFileChange={handleFileChange}
            removePhoto={removePhoto}
          />
        );
      case 7:
        return (
          <StepSummary
            formData={formData}
            errors={errors}
            setField={setField}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-6 md:pt-10">
        {/* Progress bar */}
        <div className="bg-[#0F1D2C] rounded-2xl p-4 md:p-5 mb-6">
          <WizardProgressBar
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={[...STEP_LABELS]}
          />
        </div>

        {/* Test Response button (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={fillTestData}
            className="mb-4 w-full py-2 px-4 rounded-xl text-xs font-body font-medium text-[#C9A96E] border border-dashed border-[#C9A96E]/30 bg-[#C9A96E]/5 hover:bg-[#C9A96E]/10 transition-colors"
          >
            Fill Test Response (Dev Only)
          </button>
        )}

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[460px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="p-6 md:p-10"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-4">
          {!isFirstStep ? (
            <button
              onClick={handlePrev}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-body font-medium text-[#0F1D2C] bg-white border border-[#0F1D2C]/10 hover:border-[#C9A96E]/40 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-body font-semibold text-white bg-[#C9A96E] hover:bg-[#B8944D] transition-colors disabled:opacity-60 shadow-lg shadow-[#C9A96E]/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Consultation
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-body font-semibold text-white bg-[#0F1D2C] hover:bg-[#1A2D3E] transition-colors shadow-lg shadow-[#0F1D2C]/20"
            >
              {isFirstStep ? 'Get Started' : 'Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit error */}
        {errors.submit && (
          <p className="mt-3 text-center text-sm font-body text-red-600">
            {errors.submit}
          </p>
        )}
      </div>

      {/* Trust bar */}
      <WizardTrustBar />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP COMPONENTS (co-located — internal to wizard)
// ═══════════════════════════════════════════════════════════════════

/** Step 0: Welcome */
function StepWelcome() {
  return (
    <div className="text-center py-6">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-[#C9A96E]" />
      </div>
      <h1 className="font-heading text-3xl md:text-4xl text-[#0F1D2C] mb-4">
        Your Transformation Begins Here
      </h1>
      <p className="font-body text-[#0F1D2C]/60 max-w-lg mx-auto mb-6 leading-relaxed">
        Welcome to Rani Beauty Clinic. This brief consultation helps us understand
        your unique skin goals so we can craft a personalized treatment plan
        tailored just for you.
      </p>
      <div className="flex flex-wrap justify-center gap-4 text-sm font-body text-[#0F1D2C]/50">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
          Takes 3-5 minutes
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
          100% confidential
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#C9A96E]" />
          No commitment required
        </span>
      </div>
    </div>
  );
}

/** Step 1: About You */
function StepAboutYou({
  formData,
  errors,
  setField,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  setField: (field: string, value: unknown) => void;
}) {
  return (
    <div>
      <StepHeader
        icon={User}
        title="Tell Us About Yourself"
        subtitle="We'll use this information to create your personalized profile."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <InputField
          label="First Name"
          value={(formData.firstName as string) || ''}
          onChange={(v) => setField('firstName', v)}
          error={errors.firstName}
          placeholder="Your first name"
        />
        <InputField
          label="Last Name"
          value={(formData.lastName as string) || ''}
          onChange={(v) => setField('lastName', v)}
          error={errors.lastName}
          placeholder="Your last name"
        />
        <InputField
          label="Email"
          type="email"
          value={(formData.email as string) || ''}
          onChange={(v) => setField('email', v)}
          error={errors.email}
          placeholder="you@example.com"
        />
        <InputField
          label="Phone"
          type="tel"
          value={(formData.phone as string) || ''}
          onChange={(v) => setField('phone', v)}
          error={errors.phone}
          placeholder="(206) 555-1234"
        />
        <div className="md:col-span-2">
          <InputField
            label="Date of Birth"
            type="date"
            value={(formData.dob as string) || ''}
            onChange={(v) => setField('dob', v)}
            error={errors.dob}
          />
        </div>
      </div>
    </div>
  );
}

/** Step 2: Concerns */
function StepConcerns({
  formData,
  errors,
  toggleArrayField,
  showBodyMap,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  toggleArrayField: (field: string, value: string) => void;
  showBodyMap: boolean;
}) {
  const selectedConcerns = (formData.skinConcerns as string[]) || [];
  const selectedAreas = (formData.targetAreas as string[]) || [];

  return (
    <div>
      <StepHeader
        icon={HeartPulse}
        title="What Are Your Concerns?"
        subtitle="Select all that apply — we'll tailor recommendations to address each one."
      />

      {/* Concern chips */}
      <div className="flex flex-wrap gap-2.5 mt-6">
        {SKIN_CONCERN_OPTIONS.map((concern) => (
          <ChipButton
            key={concern}
            label={CONCERN_LABELS[concern] || concern}
            selected={selectedConcerns.includes(concern)}
            onClick={() => toggleArrayField('skinConcerns', concern)}
          />
        ))}
      </div>
      {errors.skinConcerns && (
        <p className="mt-2 text-sm font-body text-red-600">{errors.skinConcerns}</p>
      )}

      {/* Target areas */}
      {selectedConcerns.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading text-lg text-[#0F1D2C] mb-3">
            Which areas would you like to treat?
          </h3>

          <div className="mb-4">
            <p className="text-xs font-body text-[#0F1D2C]/50 mb-2 uppercase tracking-wider">
              Face & Neck
            </p>
            <div className="flex flex-wrap gap-2">
              {FACE_ZONES.map((zone) => (
                <ChipButton
                  key={zone}
                  label={zone.replace(/-/g, ' ')}
                  selected={selectedAreas.includes(zone)}
                  onClick={() => toggleArrayField('targetAreas', zone)}
                  size="sm"
                />
              ))}
            </div>
          </div>

          {showBodyMap && (
            <div>
              <p className="text-xs font-body text-[#0F1D2C]/50 mb-2 uppercase tracking-wider">
                Body
              </p>
              <div className="flex flex-wrap gap-2">
                {BODY_ZONES.map((zone) => (
                  <ChipButton
                    key={zone}
                    label={zone.replace(/-/g, ' ')}
                    selected={selectedAreas.includes(zone)}
                    onClick={() => toggleArrayField('targetAreas', zone)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {errors.targetAreas && (
            <p className="mt-2 text-sm font-body text-red-600">{errors.targetAreas}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Step 3: Treatment Interests */
function StepInterests({
  formData,
  errors,
  toggleArrayField,
  servicesByCategory,
  recommendedServices,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  toggleArrayField: (field: string, value: string) => void;
  servicesByCategory: {
    label: string;
    categories: ServiceCategory[];
    services: (typeof UNIFIED_CATALOG)[number][];
  }[];
  recommendedServices: string[];
}) {
  const selectedInterests = (formData.treatmentInterests as string[]) || [];

  return (
    <div>
      <StepHeader
        icon={ClipboardList}
        title="Treatments That Interest You"
        subtitle="Select any treatments you're curious about. Don't worry — no commitment."
      />

      {/* Recommended badge */}
      {recommendedServices.length > 0 && (
        <div className="mt-4 mb-2 px-3 py-2 rounded-lg bg-[#C9A96E]/8 border border-[#C9A96E]/20">
          <p className="text-xs font-body text-[#C9A96E] font-semibold">
            Based on your concerns, we recommend exploring the highlighted treatments.
          </p>
        </div>
      )}

      <div className="mt-4 space-y-6 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {servicesByCategory.map((group) => (
          <div key={group.label}>
            <h4 className="text-xs font-body text-[#0F1D2C]/50 uppercase tracking-wider mb-2">
              {group.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {group.services.map((service) => {
                const isRecommended = recommendedServices.includes(service.id);
                return (
                  <ChipButton
                    key={service.id}
                    label={service.name}
                    selected={selectedInterests.includes(service.id)}
                    onClick={() => toggleArrayField('treatmentInterests', service.id)}
                    size="sm"
                    highlighted={isRecommended}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {errors.treatmentInterests && (
        <p className="mt-3 text-sm font-body text-red-600">{errors.treatmentInterests}</p>
      )}
    </div>
  );
}

/** Step 4: History */
function StepHistory({
  formData,
  errors,
  setField,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  setField: (field: string, value: unknown) => void;
}) {
  const followUps = getFollowUpQuestions(
    (formData.skinConcerns as string[]) || [],
    (formData.treatmentInterests as string[]) || []
  );

  return (
    <div>
      <StepHeader
        icon={History}
        title="Your Skin & Treatment History"
        subtitle="This helps us recommend the safest, most effective options for you."
      />

      <div className="mt-6 space-y-5">
        {/* Skin type */}
        <div>
          <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
            How would you describe your skin type?
          </label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map((type) => (
              <ChipButton
                key={type}
                label={SKIN_TYPE_LABELS[type]}
                selected={formData.skinType === type}
                onClick={() => setField('skinType', type)}
                size="sm"
              />
            ))}
          </div>
          {errors.skinType && (
            <p className="mt-1.5 text-sm font-body text-red-600">{errors.skinType}</p>
          )}
        </div>

        {/* Treatment history textarea */}
        <div>
          <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
            Previous aesthetic treatments
            <span className="text-[#0F1D2C]/40 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={(formData.treatmentHistory as string) || ''}
            onChange={(e) => setField('treatmentHistory', e.target.value)}
            placeholder="Tell us about any previous treatments, surgeries, or procedures (e.g., Botox, fillers, laser, peels, etc.)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#0F1D2C]/10 bg-[#F8F6F1]/50 font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:border-[#C9A96E] transition-all resize-none"
          />
          {errors.treatmentHistory && (
            <p className="mt-1.5 text-sm font-body text-red-600">
              {errors.treatmentHistory}
            </p>
          )}
        </div>

        {/* Dynamic follow-up questions */}
        {followUps.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-[#0F1D2C]/5">
            <p className="text-xs font-body text-[#0F1D2C]/50 uppercase tracking-wider">
              Additional Questions
            </p>
            {followUps.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
                  {q.question}
                  {q.required && <span className="text-[#C9A96E] ml-0.5">*</span>}
                </label>
                {q.type === 'select' && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        label={opt.label}
                        selected={
                          (formData as Record<string, unknown>)[q.id] === opt.value
                        }
                        onClick={() => setField(q.id, opt.value)}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
                {q.type === 'multiselect' && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const current =
                        ((formData as Record<string, unknown>)[q.id] as string[]) || [];
                      return (
                        <ChipButton
                          key={opt.value}
                          label={opt.label}
                          selected={current.includes(opt.value)}
                          onClick={() => {
                            const next = current.includes(opt.value)
                              ? current.filter((v) => v !== opt.value)
                              : [...current, opt.value];
                            setField(q.id, next);
                          }}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                )}
                {q.type === 'text' && (
                  <input
                    type="text"
                    value={
                      ((formData as Record<string, unknown>)[q.id] as string) || ''
                    }
                    onChange={(e) => setField(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#0F1D2C]/10 bg-[#F8F6F1]/50 font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:border-[#C9A96E] transition-all"
                  />
                )}
                {q.type === 'boolean' && (
                  <div className="flex gap-2">
                    <ChipButton
                      label="Yes"
                      selected={
                        (formData as Record<string, unknown>)[q.id] === true
                      }
                      onClick={() => setField(q.id, true)}
                      size="sm"
                    />
                    <ChipButton
                      label="No"
                      selected={
                        (formData as Record<string, unknown>)[q.id] === false
                      }
                      onClick={() => setField(q.id, false)}
                      size="sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Step 5: Goals */
function StepGoals({
  formData,
  errors,
  setField,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  setField: (field: string, value: unknown) => void;
}) {
  return (
    <div>
      <StepHeader
        icon={Target}
        title="Your Goals & Preferences"
        subtitle="Help us understand what success looks like for you."
      />

      <div className="mt-6 space-y-6">
        {/* Goals textarea */}
        <div>
          <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
            What are your aesthetic goals?
          </label>
          <textarea
            value={(formData.goals as string) || ''}
            onChange={(e) => setField('goals', e.target.value)}
            placeholder="Describe what you'd like to achieve — e.g., clearer skin, more youthful appearance, smoother texture, confidence for an upcoming event..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#0F1D2C]/10 bg-[#F8F6F1]/50 font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:border-[#C9A96E] transition-all resize-none"
          />
          {errors.goals && (
            <p className="mt-1.5 text-sm font-body text-red-600">{errors.goals}</p>
          )}
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
            What&apos;s your ideal timeline?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TIMELINE_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                label={TIMELINE_LABELS[option]}
                selected={formData.timeline === option}
                onClick={() => setField('timeline', option)}
              />
            ))}
          </div>
          {errors.timeline && (
            <p className="mt-1.5 text-sm font-body text-red-600">{errors.timeline}</p>
          )}
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-2">
            What investment range are you comfortable with?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BUDGET_OPTIONS.map((option) => (
              <ChipButton
                key={option}
                label={BUDGET_LABELS[option]}
                selected={formData.budget === option}
                onClick={() => setField('budget', option)}
              />
            ))}
          </div>
          {errors.budget && (
            <p className="mt-1.5 text-sm font-body text-red-600">{errors.budget}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Step 6: Photos */
function StepPhotos({
  formData,
  errors,
  handleFileChange,
  removePhoto,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
}) {
  const photos = (formData.photos as File[]) || [];

  return (
    <div>
      <StepHeader
        icon={Camera}
        title="Upload Photos"
        subtitle="Optional — photos help our team provide more accurate recommendations."
      />

      <div className="mt-6">
        <div className="grid grid-cols-3 gap-3">
          {photos.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#F8F6F1] border border-[#0F1D2C]/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#0F1D2C]/70 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                aria-label="Remove photo"
              >
                &times;
              </button>
            </div>
          ))}

          {photos.length < 3 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-[#C9A96E]/30 bg-[#F8F6F1]/50 flex flex-col items-center justify-center cursor-pointer hover:border-[#C9A96E]/60 hover:bg-[#C9A96E]/5 transition-all">
              <Camera className="w-6 h-6 text-[#C9A96E]/60 mb-1" />
              <span className="text-xs font-body text-[#0F1D2C]/40">Add Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </label>
          )}
        </div>

        {errors.photos && (
          <p className="mt-2 text-sm font-body text-red-600">{errors.photos}</p>
        )}

        <div className="mt-4 p-3 rounded-lg bg-[#F8F6F1]/80 border border-[#0F1D2C]/5">
          <p className="text-xs font-body text-[#0F1D2C]/50 leading-relaxed">
            Upload up to 3 photos (JPEG, PNG, WebP, or HEIC, max 10 MB each). Good
            lighting and a clean background produce the best results. All photos are
            stored securely and kept strictly confidential.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Step 7: Summary */
function StepSummary({
  formData,
  errors,
  setField,
}: {
  formData: Partial<ConsultationFormData>;
  errors: Record<string, string>;
  setField: (field: string, value: unknown) => void;
}) {
  const concerns = (formData.skinConcerns as string[]) || [];
  const interests = (formData.treatmentInterests as string[]) || [];
  const photos = (formData.photos as File[]) || [];

  const interestNames = interests
    .map((id) => UNIFIED_CATALOG.find((s) => s.id === id)?.name)
    .filter(Boolean);

  return (
    <div>
      <StepHeader
        icon={CheckCircle2}
        title="Review Your Consultation"
        subtitle="Please review your information before submitting."
      />

      <div className="mt-6 space-y-4 text-sm font-body">
        <SummaryRow
          label="Name"
          value={`${formData.firstName || ''} ${formData.lastName || ''}`}
        />
        <SummaryRow label="Email" value={formData.email as string} />
        <SummaryRow label="Phone" value={formData.phone as string} />
        <SummaryRow
          label="Concerns"
          value={concerns.map((c) => CONCERN_LABELS[c] || c).join(', ')}
        />
        <SummaryRow
          label="Interested In"
          value={interestNames.join(', ')}
        />
        <SummaryRow
          label="Skin Type"
          value={SKIN_TYPE_LABELS[(formData.skinType as string) || ''] || ''}
        />
        <SummaryRow
          label="Timeline"
          value={TIMELINE_LABELS[(formData.timeline as string) || ''] || ''}
        />
        <SummaryRow
          label="Budget"
          value={BUDGET_LABELS[(formData.budget as string) || ''] || ''}
        />
        {photos.length > 0 && (
          <SummaryRow label="Photos" value={`${photos.length} uploaded`} />
        )}
      </div>

      {/* SMS consent */}
      <div className="mt-6 p-4 rounded-xl bg-[#F8F6F1] border border-[#0F1D2C]/5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={(formData.smsConsent as boolean) || false}
            onChange={(e) => setField('smsConsent', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#0F1D2C]/20 text-[#C9A96E] focus:ring-[#C9A96E]/30 accent-[#C9A96E]"
          />
          <span className="text-xs font-body text-[#0F1D2C]/60 leading-relaxed">
            I consent to receive text messages from Rani Beauty Clinic regarding my
            consultation, appointment reminders, and personalized offers. Message &
            data rates may apply. Reply STOP to unsubscribe at any time.
          </span>
        </label>
      </div>

      {errors.submit && (
        <p className="mt-3 text-sm font-body text-red-600 text-center">
          {errors.submit}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#C9A96E]" />
      </div>
      <div>
        <h2 className="font-heading text-xl md:text-2xl text-[#0F1D2C]">{title}</h2>
        <p className="font-body text-sm text-[#0F1D2C]/50 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-body font-medium text-[#0F1D2C] mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-xl border font-body text-sm text-[#0F1D2C] placeholder:text-[#0F1D2C]/30 bg-[#F8F6F1]/50 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 transition-all ${
          error
            ? 'border-red-400 focus:border-red-400'
            : 'border-[#0F1D2C]/10 focus:border-[#C9A96E]'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs font-body text-red-600">{error}</p>
      )}
    </div>
  );
}

function ChipButton({
  label,
  selected,
  onClick,
  size = 'md',
  highlighted = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
  highlighted?: boolean;
}) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sizeClasses} rounded-xl font-body font-medium transition-all capitalize ${
        selected
          ? 'bg-[#0F1D2C] text-white shadow-md'
          : highlighted
            ? 'bg-[#C9A96E]/10 text-[#0F1D2C] border border-[#C9A96E]/40 hover:border-[#C9A96E] hover:bg-[#C9A96E]/15'
            : 'bg-[#F8F6F1] text-[#0F1D2C]/70 border border-[#0F1D2C]/5 hover:border-[#C9A96E]/30 hover:bg-[#C9A96E]/5'
      }`}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value || value.trim() === '') return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-[#0F1D2C]/5 last:border-0">
      <span className="text-[#0F1D2C]/50 flex-shrink-0">{label}</span>
      <span className="text-[#0F1D2C] text-right">{value}</span>
    </div>
  );
}
