'use client';

import { useState, useMemo, useRef, useCallback, DragEvent } from 'react';
import {
  X, Loader2, Sparkles, Upload, Camera, Check, ChevronLeft, ChevronRight,
  User, Heart, Stethoscope, Clock, ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ══════════════════════════════════════════════════════════════
// OPTION CONSTANTS — matching all 25 Typeform questions
// ══════════════════════════════════════════════════════════════

const CONTACT_PREFS = [
  { value: 'call', label: 'Call' },
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const REFERRAL_SOURCES = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'referral', label: 'Referral' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'other', label: 'Other' },
];

const CONCERN_OPTIONS = [
  { value: 'hyperpigmentation', label: 'Hyperpigmentation', icon: '🎨' },
  { value: 'acne', label: 'Acne', icon: '💧' },
  { value: 'fine-lines', label: 'Fine Lines & Wrinkles', icon: '✨' },
  { value: 'texture', label: 'Texture', icon: '🪞' },
  { value: 'laxity', label: 'Laxity / Loose Skin', icon: '🔄' },
  { value: 'dryness', label: 'Dryness', icon: '🏜️' },
  { value: 'hair-removal', label: 'Hair Removal', icon: '⚡' },
  { value: 'acne-scars', label: 'Acne Scars', icon: '🩹' },
  { value: 'scars', label: 'Scars', icon: '🔧' },
  { value: 'undereye', label: 'Undereye Darkness', icon: '👁️' },
  { value: 'rosacea', label: 'Rosacea', icon: '🌹' },
  { value: 'large-pores', label: 'Large Pores', icon: '🔍' },
];

const TARGET_AREAS = [
  { value: 'face', label: 'Face' },
  { value: 'neck', label: 'Neck' },
  { value: 'chest', label: 'Chest / Decolletage' },
  { value: 'hands', label: 'Hands' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'back', label: 'Back' },
  { value: 'bikini', label: 'Bikini Area' },
  { value: 'full-body', label: 'Full Body' },
];

const TREATMENT_CATEGORIES = [
  {
    category: 'Skin',
    treatments: [
      { value: 'hydrafacial', label: 'HydraFacial' },
      { value: 'laser-facials', label: 'Laser Facials' },
      { value: 'rf-microneedling', label: 'RF Microneedling' },
      { value: 'peels', label: 'Peels' },
      { value: 'skin-boosters', label: 'Skin Boosters' },
      { value: 'sofwave', label: 'Sofwave' },
    ],
  },
  {
    category: 'Injectable',
    treatments: [
      { value: 'botox', label: 'Botox' },
      { value: 'dermal-fillers', label: 'Dermal Fillers' },
      { value: 'sculptra', label: 'Sculptra' },
    ],
  },
  {
    category: 'Body',
    treatments: [
      { value: 'laser-hair', label: 'Laser Hair Removal' },
    ],
  },
  {
    category: 'Wellness',
    treatments: [
      { value: 'hormones', label: 'Hormones', requiresLabs: true },
      { value: 'glp1', label: 'GLP-1', requiresLabs: true },
    ],
  },
] as const;

const ALL_TREATMENTS: ReadonlyArray<{ value: string; label: string; requiresLabs?: boolean }> =
  TREATMENT_CATEGORIES.flatMap((cat) => cat.treatments as ReadonlyArray<{ value: string; label: string; requiresLabs?: boolean }>);
const LAB_REQUIRED_TREATMENTS = ALL_TREATMENTS
  .filter((t) => t.requiresLabs)
  .map((t) => t.value);

const SMOKING_OPTIONS = [
  { value: 'neither', label: 'Neither' },
  { value: 'smoke-only', label: 'Smoke Only' },
  { value: 'alcohol-only', label: 'Alcohol Only' },
  { value: 'both', label: 'Both' },
];

const WATER_INTAKE = [
  { value: 'less-than-4', label: 'Less than 4 cups' },
  { value: '4-6', label: '4-6 cups' },
  { value: '6-8', label: '6-8 cups' },
  { value: '8-plus', label: '8+ cups' },
];

const SKINCARE_ROUTINE = [
  { value: 'none', label: 'None / Minimal' },
  { value: 'basic', label: 'Basic (Cleanser + Moisturizer)' },
  { value: 'moderate', label: 'Moderate (3-5 products)' },
  { value: 'advanced', label: 'Advanced (6+ products)' },
];

const DAYS_OPTIONS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
];

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (9-12)' },
  { value: 'afternoon', label: 'Afternoon (12-3)' },
  { value: 'evening', label: 'Evening (3-6)' },
];

const BUDGET_OPTIONS = [
  { value: 'under-500', label: 'Under $500' },
  { value: '500-1500', label: '$500 - $1,500' },
  { value: '1500-3000', label: '$1,500 - $3,000' },
  { value: '3000-5000', label: '$3,000 - $5,000' },
  { value: '5000-plus', label: '$5,000+' },
];

const SKIN_TYPE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'dry', label: 'Dry' },
  { value: 'oily', label: 'Oily' },
  { value: 'combination', label: 'Combination' },
  { value: 'sensitive', label: 'Sensitive' },
];

const TIMELINE_PREF_OPTIONS = [
  { value: 'event', label: 'Event-driven' },
  { value: 'asap', label: 'ASAP' },
  { value: 'gradual', label: 'Gradual' },
  { value: 'ongoing', label: 'Ongoing Maintenance' },
];

const SUN_PROTECTION_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'usually', label: 'Usually' },
  { value: 'always', label: 'Always' },
];

const DOWNTIME_TOLERANCE_OPTIONS = [
  { value: 'none', label: 'No downtime' },
  { value: 'minimal', label: '1-2 days max' },
  { value: 'moderate', label: '3-5 days okay' },
  { value: 'flexible', label: '1+ week okay' },
];

const PAIN_TOLERANCE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const AUTOIMMUNE_TERMS = [
  'autoimmune',
  'lupus',
  'hashimoto',
  'graves',
  'psoriasis',
  'rheumatoid',
  'crohn',
  'ulcerative colitis',
  'multiple sclerosis',
  'sjogren',
  'scleroderma',
  'celiac',
] as const;

function inferAutoimmuneFromHistory(history: string): boolean {
  const normalized = history.trim().toLowerCase();
  if (!normalized) return false;
  return AUTOIMMUNE_TERMS.some((term) => normalized.includes(term));
}

// ══════════════════════════════════════════════════════════════
// STEP DEFINITIONS
// ══════════════════════════════════════════════════════════════

const STEPS = [
  { number: 1, label: 'Personal', icon: User },
  { number: 2, label: 'Concerns', icon: Heart },
  { number: 3, label: 'Medical', icon: Stethoscope },
  { number: 4, label: 'Routine', icon: Clock },
  { number: 5, label: 'Photos', icon: ImageIcon },
];

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000);
  return age >= 0 && age < 150 ? age : null;
}

// ══════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ══════════════════════════════════════════════════════════════

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
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const conditionalVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 12 },
};

// ══════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS (dark glassmorphic theme)
// ══════════════════════════════════════════════════════════════

function GoldPill({
  label,
  selected,
  onClick,
  icon,
  showCheck = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: string;
  showCheck?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`
        relative px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
        ${selected
          ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] text-[#0F1D2C] border-[#C9A96E] shadow-[0_0_15px_rgba(201,169,110,0.3)]'
          : 'bg-transparent text-[#F8F6F1]/80 border-[#C9A96E]/30 hover:border-[#C9A96E]/70 hover:shadow-[0_0_10px_rgba(201,169,110,0.15)]'
        }
      `}
    >
      <span className="flex items-center gap-1.5">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
        {showCheck && selected && (
          <Check className="w-3.5 h-3.5 ml-0.5" />
        )}
      </span>
    </motion.button>
  );
}

function GoldInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  ...rest
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-4 py-3 rounded-xl text-sm
        bg-white/5 text-[#F8F6F1] placeholder:text-white/30
        border-b-2 transition-all duration-200 outline-none
        focus:bg-white/[0.07]
        ${error ? 'border-b-red-400' : 'border-b-transparent focus:border-b-[#C9A96E]'}
      `}
      style={{ fontFamily: 'Montserrat, sans-serif' }}
      {...rest}
    />
  );
}

function GoldTextArea({
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="
        w-full px-4 py-3 rounded-xl text-sm resize-none
        bg-white/5 text-[#F8F6F1] placeholder:text-white/30
        border-b-2 border-b-transparent focus:border-b-[#C9A96E]
        transition-all duration-200 outline-none focus:bg-white/[0.07]
      "
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    />
  );
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: 'yes' | 'no' | '';
  onChange: (v: 'yes' | 'no') => void;
}) {
  return (
    <div className="flex gap-2">
      {(['yes', 'no'] as const).map((v) => (
        <motion.button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className={`
            px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border
            ${value === v
              ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] text-[#0F1D2C] border-[#C9A96E]'
              : 'bg-transparent text-[#F8F6F1]/60 border-[#C9A96E]/30 hover:border-[#C9A96E]/60'
            }
          `}
        >
          {v === 'yes' ? 'Yes' : 'No'}
        </motion.button>
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs font-semibold text-[#C9A96E]/80 uppercase tracking-wider mb-2"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {children}
    </label>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-2xl font-bold text-[#F8F6F1] mb-1"
      style={{ fontFamily: 'Playfair Display, serif' }}
    >
      {children}
    </h3>
  );
}

function StepSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[#F8F6F1]/40 mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {children}
    </p>
  );
}

// ══════════════════════════════════════════════════════════════
// PHOTO DROP ZONE
// ══════════════════════════════════════════════════════════════

function PhotoDropZone({
  label,
  sublabel,
  files,
  onFiles,
  onRemove,
  maxFiles = 5,
  icon: Icon = Camera,
}: {
  label: string;
  sublabel: string;
  files: File[];
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  maxFiles?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    onFiles(dropped.slice(0, maxFiles - files.length));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    onFiles(selected.slice(0, maxFiles - files.length));
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        multiple
        className="hidden"
        onChange={handleSelect}
      />

      {files.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#C9A96E]/30 flex items-center justify-center bg-[#0F1D2C]">
                {f.type === 'application/pdf' ? (
                  <div className="text-center">
                    <div className="text-[#C9A96E] text-lg">📄</div>
                    <div className="text-[8px] text-[#F8F6F1]/50 mt-0.5 px-1 truncate max-w-[76px]">{f.name}</div>
                  </div>
                ) : (
                  <img
                    src={URL.createObjectURL(f)}
                    alt={`Upload ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length < maxFiles && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer
            border-2 border-dashed transition-all duration-200
            ${dragOver
              ? 'border-[#C9A96E] bg-[#C9A96E]/20'
              : 'border-[#C9A96E]/30 hover:border-[#C9A96E]/60 bg-[#C9A96E]/5 hover:bg-[#C9A96E]/10'
            }
          `}
        >
          <Icon className="w-6 h-6 text-[#C9A96E]/60" />
          <span className="text-xs text-[#F8F6F1]/40" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {sublabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export default function NewConsultationModal({ open, onClose, onCreated }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // ── Step 1: Personal Information ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPref, setContactPref] = useState<string[]>([]);
  const [referralSource, setReferralSource] = useState<string[]>([]);

  // ── Step 2: Skin Concerns & Goals ──
  const [concerns, setConcerns] = useState<string[]>([]);
  const [targetAreas, setTargetAreas] = useState<string[]>([]);
  const [treatmentInterests, setTreatmentInterests] = useState<string[]>([]);
  const [hasEvent, setHasEvent] = useState<'yes' | 'no' | ''>('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('');

  // ── Step 3: Medical History ──
  const [hadTreatments, setHadTreatments] = useState<'yes' | 'no' | ''>('');
  const [previousTreatments, setPreviousTreatments] = useState('');
  const [hasMedical, setHasMedical] = useState<'yes' | 'no' | ''>('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [hasAllergies, setHasAllergies] = useState<'yes' | 'no' | ''>('');
  const [allergies, setAllergies] = useState('');
  const [hasMedications, setHasMedications] = useState<'yes' | 'no' | ''>('');
  const [medications, setMedications] = useState('');
  const [skinType, setSkinType] = useState<string[]>([]);
  const [pregnant, setPregnant] = useState<'yes' | 'no' | ''>('');
  const [breastfeeding, setBreastfeeding] = useState<'yes' | 'no' | ''>('');
  const [bloodThinners, setBloodThinners] = useState<'yes' | 'no' | ''>('');
  const [keloidHistory, setKeloidHistory] = useState<'yes' | 'no' | ''>('');
  const [activeSkinInfection, setActiveSkinInfection] = useState<'yes' | 'no' | ''>('');
  const [recentSunExposure, setRecentSunExposure] = useState<'yes' | 'no' | ''>('');
  const [isotretinoinHistory, setIsotretinoinHistory] = useState<'yes' | 'no' | ''>('');
  const [isotretinoinEndDate, setIsotretinoinEndDate] = useState('');
  const [smokingAlcohol, setSmokingAlcohol] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState<string[]>([]);
  const [sunProtectionHabit, setSunProtectionHabit] = useState<string[]>([]);

  // ── Step 4: Skincare Routine & Schedule ──
  const [skincareRoutine, setSkincareRoutine] = useState<string[]>([]);
  const [amRoutine, setAmRoutine] = useState('');
  const [pmRoutine, setPmRoutine] = useState('');
  const [timelinePreference, setTimelinePreference] = useState<string[]>([]);
  const [downtimeTolerance, setDowntimeTolerance] = useState<string[]>([]);
  const [painTolerance, setPainTolerance] = useState<string[]>([]);
  const [primaryGoalNarrative, setPrimaryGoalNarrative] = useState('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);

  // ── Step 5: Photos ──
  const [skinPhotos, setSkinPhotos] = useState<File[]>([]);
  const [auraPhotos, setAuraPhotos] = useState<File[]>([]);

  // ── Derived ──
  const calculatedAge = useMemo(() => calculateAge(dob), [dob]);
  const needsLabWork = useMemo(
    () => treatmentInterests.some((t) => LAB_REQUIRED_TREATMENTS.includes(t)),
    [treatmentInterests]
  );

  // ── Togglers ──
  const toggleMulti = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (val: string) => {
      setter((prev) => (prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]));
    },
    []
  );

  const toggleSingle = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string[]>>) => (val: string) => {
      setter((prev) => (prev[0] === val ? [] : [val]));
    },
    []
  );

  // ── Validation per step ──
  const validateStep = (step: number): boolean => {
    const errors: Record<string, boolean> = {};

    if (step === 1) {
      if (!firstName.trim()) errors.firstName = true;
      if (!lastName.trim()) errors.lastName = true;
    }
    if (step === 2) {
      if (concerns.length === 0) errors.concerns = true;
    }
    if (step === 3) {
      if (skinType.length === 0) errors.skinType = true;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Navigation ──
  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 5));
    setError(null);
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
    setError(null);
    setValidationErrors({});
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setDirection(-1);
      setCurrentStep(step);
    } else if (step === currentStep + 1) {
      goNext();
    }
  };

  // ── Photo handlers ──
  const addSkinPhotos = (files: File[]) => setSkinPhotos((prev) => [...prev, ...files].slice(0, 5));
  const removeSkinPhoto = (i: number) => setSkinPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const addAuraPhotos = (files: File[]) => setAuraPhotos((prev) => [...prev, ...files].slice(0, 3));
  const removeAuraPhoto = (i: number) => setAuraPhotos((prev) => prev.filter((_, idx) => idx !== i));

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setError(null);
    setSubmitting(true);

    try {
      const goalMap: Record<string, string> = {
        'fine-lines': 'anti-aging',
        'hyperpigmentation': 'pigment-correction',
        'dryness': 'brightening',
        'acne': 'acne-treatment',
        'laxity': 'skin-tightening',
        'acne-scars': 'scar-treatment',
        'scars': 'scar-treatment',
        'undereye': 'undereye-treatment',
        'rosacea': 'redness-reduction',
      };
      const mappedGoalSummary = concerns.map((c) => goalMap[c] || c).join(', ');
      const goalsNarrative = primaryGoalNarrative.trim()
        || mappedGoalSummary
        || 'Improve skin health, tone, texture, and confidence';
      const hasAutoimmuneCondition = hasMedical === 'yes' && inferAutoimmuneFromHistory(medicalConditions);

      const formData = new FormData();

      formData.append(
        'data',
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: dob || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          age: calculatedAge ?? undefined,
          contactPreference: contactPref[0] || undefined,
          referralSource: referralSource[0] || undefined,

          skinConcerns: concerns,
          targetAreas,
          treatmentInterests,
          concerns,
          goals: goalsNarrative,
          timeline: timelinePreference[0] || (hasEvent === 'yes' ? 'event' : 'ongoing'),

          hasUpcomingEvent: hasEvent === 'yes',
          eventDetails: hasEvent === 'yes' ? `${eventType} - ${eventDate}` : undefined,

          previousTreatments: hadTreatments === 'yes' && previousTreatments
            ? previousTreatments.split(',').map((t) => t.trim())
            : [],
          treatmentHistory: hadTreatments === 'yes' ? previousTreatments : '',

          medicalHistory: hasMedical === 'yes' ? medicalConditions : 'None',
          hasAutoimmune: hasAutoimmuneCondition,
          allergies: hasAllergies === 'yes' ? allergies : 'None',
          hasAllergies: hasAllergies === 'yes',
          medications: hasMedications === 'yes' ? medications : 'None',
          hasMedications: hasMedications === 'yes',
          skinType: skinType[0] || undefined,
          pregnant: pregnant === 'yes',
          breastfeeding: breastfeeding === 'yes',
          bloodThinners: bloodThinners === 'yes',
          keloidHistory: keloidHistory === 'yes',
          activeSkinInfection: activeSkinInfection === 'yes',
          recentSunExposure: recentSunExposure === 'yes',
          isotretinoinHistory: isotretinoinHistory === 'yes',
          isotretinoinEndDate: isotretinoinHistory === 'yes' ? (isotretinoinEndDate || undefined) : undefined,

          smokingAlcohol: smokingAlcohol[0] || 'neither',
          smokingStatus: smokingAlcohol[0] === 'smoke-only' || smokingAlcohol[0] === 'both' ? 'current' : 'never',
          waterIntake: waterIntake[0] || undefined,
          skincareRoutine: skincareRoutine[0] || undefined,
          sunProtectionHabit: sunProtectionHabit[0] || undefined,

          skincareAM: amRoutine || undefined,
          skincarePM: pmRoutine || undefined,
          downtimeTolerance: downtimeTolerance[0] || undefined,
          painTolerance: painTolerance[0] || undefined,

          requiresLabWork: needsLabWork,

          preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
          preferredTime: preferredTime[0] || undefined,

          budget: budget[0] || undefined,
        })
      );

      for (const file of skinPhotos) {
        formData.append('photos', file);
      }
      for (const file of auraPhotos) {
        formData.append('aura', file);
      }

      const res = await fetch('/api/consultation/submit', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Submission failed');

      const sessionId = json.data.sessionId;

      await fetch('/api/mastermind/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      await fetch('/api/mastermind/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      onCreated(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // STEP RENDERERS
  // ══════════════════════════════════════════════════════════════

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Personal Information</StepTitle>
        <StepSubtitle>Let&apos;s get to know your client</StepSubtitle>
      </div>

      {/* First + Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>First Name *</FieldLabel>
          <GoldInput
            placeholder="First name"
            value={firstName}
            onChange={setFirstName}
            error={validationErrors.firstName}
          />
        </div>
        <div>
          <FieldLabel>Last Name *</FieldLabel>
          <GoldInput
            placeholder="Last name"
            value={lastName}
            onChange={setLastName}
            error={validationErrors.lastName}
          />
        </div>
      </div>

      {/* Date of Birth with auto-age */}
      <div>
        <FieldLabel>Date of Birth</FieldLabel>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <GoldInput
              type="date"
              value={dob}
              onChange={setDob}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {calculatedAge !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] text-[#0F1D2C] text-sm font-bold shadow-[0_0_15px_rgba(201,169,110,0.3)]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Age: {calculatedAge}
            </motion.div>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <FieldLabel>Email</FieldLabel>
        <GoldInput type="email" placeholder="client@email.com" value={email} onChange={setEmail} />
      </div>

      {/* Phone */}
      <div>
        <FieldLabel>Phone Number</FieldLabel>
        <GoldInput type="tel" placeholder="(555) 000-0000" value={phone} onChange={setPhone} />
      </div>

      {/* Contact Preference */}
      <div>
        <FieldLabel>How would you prefer we contact you?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CONTACT_PREFS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={contactPref.includes(o.value)}
              onClick={() => toggleSingle(setContactPref)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Referral Source */}
      <div>
        <FieldLabel>How did you hear about us?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {REFERRAL_SOURCES.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={referralSource.includes(o.value)}
              onClick={() => toggleSingle(setReferralSource)(o.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Skin Concerns & Goals</StepTitle>
        <StepSubtitle>Select everything that applies</StepSubtitle>
      </div>

      {/* Concerns */}
      <div>
        <FieldLabel>What are your top skin concerns? *</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {CONCERN_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              icon={o.icon}
              selected={concerns.includes(o.value)}
              onClick={() => toggleMulti(setConcerns)(o.value)}
              showCheck
            />
          ))}
        </div>
        {validationErrors.concerns && (
          <p className="text-xs text-red-400 mt-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Please select at least one skin concern
          </p>
        )}
      </div>

      {/* Target Areas */}
      <div>
        <FieldLabel>What areas would you like to address?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {TARGET_AREAS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={targetAreas.includes(o.value)}
              onClick={() => toggleMulti(setTargetAreas)(o.value)}
              showCheck
            />
          ))}
        </div>
      </div>

      {/* Treatment Interests by Category */}
      <div>
        <FieldLabel>What treatments are you most interested in?</FieldLabel>
        <div className="space-y-4">
          {TREATMENT_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <p
                className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-2"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {cat.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.treatments.map((t) => (
                  <GoldPill
                    key={t.value}
                    label={t.label}
                    selected={treatmentInterests.includes(t.value)}
                    onClick={() => toggleMulti(setTreatmentInterests)(t.value)}
                    showCheck
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lab Work Notice */}
        <AnimatePresence>
          {needsLabWork && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 rounded-xl bg-amber-900/30 border border-amber-600/30">
                <p className="text-xs font-semibold text-amber-300" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Lab work will be required for selected wellness services
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Special Event */}
      <div>
        <FieldLabel>Are you preparing for a special event?</FieldLabel>
        <YesNoToggle value={hasEvent} onChange={setHasEvent} />
        <AnimatePresence>
          {hasEvent === 'yes' && (
            <motion.div
              variants={conditionalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="overflow-hidden space-y-3"
            >
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div>
                  <FieldLabel>Event Date</FieldLabel>
                  <GoldInput
                    type="date"
                    value={eventDate}
                    onChange={setEventDate}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <FieldLabel>Event Type</FieldLabel>
                  <GoldInput placeholder="Wedding, gala, reunion..." value={eventType} onChange={setEventType} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Medical History</StepTitle>
        <StepSubtitle>This helps us keep your client safe and create the best plan</StepSubtitle>
      </div>

      {/* Skin Type */}
      <div>
        <FieldLabel>How would you describe your skin type?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPE_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={skinType.includes(o.value)}
              onClick={() => toggleSingle(setSkinType)(o.value)}
            />
          ))}
        </div>
        {validationErrors.skinType && (
          <p className="text-xs text-red-400 mt-2">Please select a skin type.</p>
        )}
      </div>

      {/* Previous Cosmetic Treatments */}
      <div>
        <FieldLabel>Have you had any cosmetic treatments before?</FieldLabel>
        <YesNoToggle value={hadTreatments} onChange={setHadTreatments} />
        <AnimatePresence>
          {hadTreatments === 'yes' && (
            <motion.div variants={conditionalVariants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
              <div className="pt-3">
                <GoldTextArea placeholder="Which treatments have you had? (e.g. Botox, HydraFacial, Laser Hair Removal)" value={previousTreatments} onChange={setPreviousTreatments} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Medical Conditions */}
      <div>
        <FieldLabel>Do you have any medical conditions?</FieldLabel>
        <YesNoToggle value={hasMedical} onChange={setHasMedical} />
        <AnimatePresence>
          {hasMedical === 'yes' && (
            <motion.div variants={conditionalVariants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
              <div className="pt-3">
                <GoldInput placeholder="Please list your medical conditions" value={medicalConditions} onChange={setMedicalConditions} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Allergies */}
      <div>
        <FieldLabel>Do you have any known skin allergies?</FieldLabel>
        <YesNoToggle value={hasAllergies} onChange={setHasAllergies} />
        <AnimatePresence>
          {hasAllergies === 'yes' && (
            <motion.div variants={conditionalVariants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
              <div className="pt-3">
                <GoldInput placeholder="Please list your allergies" value={allergies} onChange={setAllergies} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Medications */}
      <div>
        <FieldLabel>Are you currently taking any skin medications?</FieldLabel>
        <YesNoToggle value={hasMedications} onChange={setHasMedications} />
        <AnimatePresence>
          {hasMedications === 'yes' && (
            <motion.div variants={conditionalVariants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
              <div className="pt-3">
                <GoldInput placeholder="Please list your medications" value={medications} onChange={setMedications} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Clinical Risk Screen */}
      <div className="rounded-xl border border-[#C9A96E]/20 bg-white/[0.03] p-4 space-y-4">
        <FieldLabel>Clinical Safety Screen</FieldLabel>

        <div>
          <FieldLabel>Are you currently pregnant?</FieldLabel>
          <YesNoToggle value={pregnant} onChange={setPregnant} />
        </div>

        <div>
          <FieldLabel>Are you currently breastfeeding?</FieldLabel>
          <YesNoToggle value={breastfeeding} onChange={setBreastfeeding} />
        </div>

        <div>
          <FieldLabel>Are you taking blood thinners?</FieldLabel>
          <YesNoToggle value={bloodThinners} onChange={setBloodThinners} />
        </div>

        <div>
          <FieldLabel>History of keloid or hypertrophic scarring?</FieldLabel>
          <YesNoToggle value={keloidHistory} onChange={setKeloidHistory} />
        </div>

        <div>
          <FieldLabel>Any active rash, infection, or broken skin in treatment areas?</FieldLabel>
          <YesNoToggle value={activeSkinInfection} onChange={setActiveSkinInfection} />
        </div>

        <div>
          <FieldLabel>Significant sun exposure or tanning in the last 14 days?</FieldLabel>
          <YesNoToggle value={recentSunExposure} onChange={setRecentSunExposure} />
        </div>

        <div>
          <FieldLabel>Used isotretinoin (Accutane) in the last 12 months?</FieldLabel>
          <YesNoToggle value={isotretinoinHistory} onChange={setIsotretinoinHistory} />
          <AnimatePresence>
            {isotretinoinHistory === 'yes' && (
              <motion.div variants={conditionalVariants} initial="hidden" animate="visible" exit="hidden" className="overflow-hidden">
                <div className="pt-3">
                  <GoldInput type="date" value={isotretinoinEndDate} onChange={setIsotretinoinEndDate} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Smoking / Alcohol */}
      <div>
        <FieldLabel>Do you smoke or consume alcohol?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SMOKING_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={smokingAlcohol.includes(o.value)}
              onClick={() => toggleSingle(setSmokingAlcohol)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* SPF Habit */}
      <div>
        <FieldLabel>How consistent are you with daily SPF?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SUN_PROTECTION_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={sunProtectionHabit.includes(o.value)}
              onClick={() => toggleSingle(setSunProtectionHabit)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Water Intake */}
      <div>
        <FieldLabel>How much water do you drink daily?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {WATER_INTAKE.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={waterIntake.includes(o.value)}
              onClick={() => toggleSingle(setWaterIntake)(o.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Skincare Routine & Schedule</StepTitle>
        <StepSubtitle>Help us understand their current routine and availability</StepSubtitle>
      </div>

      {/* Treatment Outcome Priorities */}
      <div>
        <FieldLabel>Main goal in their own words</FieldLabel>
        <GoldTextArea
          placeholder="Describe what success looks like (for example: clearer skin before wedding in 10 weeks, minimal downtime)..."
          value={primaryGoalNarrative}
          onChange={setPrimaryGoalNarrative}
          rows={4}
        />
      </div>

      {/* Timeline */}
      <div>
        <FieldLabel>Preferred treatment timeline</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {TIMELINE_PREF_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={timelinePreference.includes(o.value)}
              onClick={() => toggleSingle(setTimelinePreference)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Downtime tolerance */}
      <div>
        <FieldLabel>Downtime tolerance</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DOWNTIME_TOLERANCE_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={downtimeTolerance.includes(o.value)}
              onClick={() => toggleSingle(setDowntimeTolerance)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Pain tolerance */}
      <div>
        <FieldLabel>Pain tolerance</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PAIN_TOLERANCE_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={painTolerance.includes(o.value)}
              onClick={() => toggleSingle(setPainTolerance)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Skincare Routine Level */}
      <div>
        <FieldLabel>How would you describe your skincare routine?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SKINCARE_ROUTINE.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={skincareRoutine.includes(o.value)}
              onClick={() => toggleSingle(setSkincareRoutine)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* AM Products */}
      <div>
        <FieldLabel>Current AM Products</FieldLabel>
        <GoldTextArea
          placeholder="List your morning skincare products..."
          value={amRoutine}
          onChange={setAmRoutine}
          rows={3}
        />
      </div>

      {/* PM Products */}
      <div>
        <FieldLabel>Current PM Products</FieldLabel>
        <GoldTextArea
          placeholder="List your evening skincare products..."
          value={pmRoutine}
          onChange={setPmRoutine}
          rows={3}
        />
      </div>

      {/* Preferred Days */}
      <div>
        <FieldLabel>Which days work best for appointments?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {DAYS_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={preferredDays.includes(o.value)}
              onClick={() => toggleMulti(setPreferredDays)(o.value)}
              showCheck
            />
          ))}
        </div>
      </div>

      {/* Preferred Time */}
      <div>
        <FieldLabel>What time of day do you prefer?</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={preferredTime.includes(o.value)}
              onClick={() => toggleSingle(setPreferredTime)(o.value)}
            />
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <FieldLabel>Budget Range</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((o) => (
            <GoldPill
              key={o.value}
              label={o.label}
              selected={budget.includes(o.value)}
              onClick={() => toggleSingle(setBudget)(o.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Photos & Review</StepTitle>
        <StepSubtitle>Upload photos and review the consultation intake</StepSubtitle>
      </div>

      {/* Skin Photos */}
      <PhotoDropZone
        label="Upload Skin Photos"
        sublabel="Drag & drop or click to upload (up to 5 photos)"
        files={skinPhotos}
        onFiles={addSkinPhotos}
        onRemove={removeSkinPhoto}
        maxFiles={5}
        icon={Camera}
      />

      {/* Aura Scan */}
      <PhotoDropZone
        label="Upload Aura Skin Scan"
        sublabel="Drag & drop scan image or click to upload"
        files={auraPhotos}
        onFiles={addAuraPhotos}
        onRemove={removeAuraPhoto}
        maxFiles={3}
        icon={Upload}
      />

      {/* Quick Summary */}
      <div>
        <FieldLabel>Quick Summary</FieldLabel>
        <div className="rounded-xl bg-white/5 border border-[#C9A96E]/20 p-4 space-y-3">
          {/* Client Name */}
          <SummaryRow label="Client" value={`${firstName} ${lastName}`.trim() || 'Not entered'} />
          {calculatedAge !== null && <SummaryRow label="Age" value={`${calculatedAge} years old`} />}
          {email && <SummaryRow label="Email" value={email} />}
          {phone && <SummaryRow label="Phone" value={phone} />}
          {contactPref.length > 0 && <SummaryRow label="Contact Pref" value={contactPref.join(', ')} />}
          {referralSource.length > 0 && <SummaryRow label="Referral" value={referralSource.join(', ')} />}

          {concerns.length > 0 && (
            <SummaryRow
              label="Concerns"
              value={concerns.map((c) => CONCERN_OPTIONS.find((o) => o.value === c)?.label || c).join(', ')}
            />
          )}
          {targetAreas.length > 0 && (
            <SummaryRow
              label="Areas"
              value={targetAreas.map((a) => TARGET_AREAS.find((o) => o.value === a)?.label || a).join(', ')}
            />
          )}
          {treatmentInterests.length > 0 && (
            <SummaryRow
              label="Treatments"
              value={treatmentInterests
                .map((t) => ALL_TREATMENTS.find((o) => o.value === t)?.label || t)
                .join(', ')}
            />
          )}

          {hadTreatments === 'yes' && previousTreatments && (
            <SummaryRow label="Previous Treatments" value={previousTreatments} />
          )}
          {hasMedical === 'yes' && medicalConditions && (
            <SummaryRow label="Medical Conditions" value={medicalConditions} />
          )}
          {hasAllergies === 'yes' && allergies && (
            <SummaryRow label="Allergies" value={allergies} />
          )}
          {hasMedications === 'yes' && medications && (
            <SummaryRow label="Medications" value={medications} />
          )}
          {skinType.length > 0 && (
            <SummaryRow
              label="Skin Type"
              value={SKIN_TYPE_OPTIONS.find((o) => o.value === skinType[0])?.label || skinType[0]}
            />
          )}
          {pregnant && <SummaryRow label="Pregnant" value={pregnant === 'yes' ? 'Yes' : 'No'} />}
          {breastfeeding && <SummaryRow label="Breastfeeding" value={breastfeeding === 'yes' ? 'Yes' : 'No'} />}
          {bloodThinners && <SummaryRow label="Blood Thinners" value={bloodThinners === 'yes' ? 'Yes' : 'No'} />}
          {keloidHistory && <SummaryRow label="Keloid History" value={keloidHistory === 'yes' ? 'Yes' : 'No'} />}
          {activeSkinInfection && <SummaryRow label="Active Skin Infection" value={activeSkinInfection === 'yes' ? 'Yes' : 'No'} />}
          {recentSunExposure && <SummaryRow label="Recent Sun Exposure" value={recentSunExposure === 'yes' ? 'Yes' : 'No'} />}
          {isotretinoinHistory && <SummaryRow label="Recent Isotretinoin" value={isotretinoinHistory === 'yes' ? 'Yes' : 'No'} />}
          {isotretinoinEndDate && <SummaryRow label="Isotretinoin End Date" value={isotretinoinEndDate} />}
          {sunProtectionHabit.length > 0 && (
            <SummaryRow
              label="SPF Habit"
              value={SUN_PROTECTION_OPTIONS.find((o) => o.value === sunProtectionHabit[0])?.label || sunProtectionHabit[0]}
            />
          )}

          {skincareRoutine.length > 0 && (
            <SummaryRow
              label="Routine"
              value={SKINCARE_ROUTINE.find((o) => o.value === skincareRoutine[0])?.label || skincareRoutine[0]}
            />
          )}
          {primaryGoalNarrative && <SummaryRow label="Main Goal" value={primaryGoalNarrative} />}
          {timelinePreference.length > 0 && (
            <SummaryRow
              label="Timeline"
              value={TIMELINE_PREF_OPTIONS.find((o) => o.value === timelinePreference[0])?.label || timelinePreference[0]}
            />
          )}
          {downtimeTolerance.length > 0 && (
            <SummaryRow
              label="Downtime"
              value={DOWNTIME_TOLERANCE_OPTIONS.find((o) => o.value === downtimeTolerance[0])?.label || downtimeTolerance[0]}
            />
          )}
          {painTolerance.length > 0 && (
            <SummaryRow
              label="Pain Tolerance"
              value={PAIN_TOLERANCE_OPTIONS.find((o) => o.value === painTolerance[0])?.label || painTolerance[0]}
            />
          )}
          {preferredDays.length > 0 && <SummaryRow label="Days" value={preferredDays.join(', ')} />}
          {preferredTime.length > 0 && <SummaryRow label="Time" value={preferredTime.join(', ')} />}
          {budget.length > 0 && (
            <SummaryRow label="Budget" value={BUDGET_OPTIONS.find((o) => o.value === budget[0])?.label || budget[0]} />
          )}

          <SummaryRow label="Skin Photos" value={`${skinPhotos.length} uploaded`} />
          <SummaryRow label="Aura Scan" value={`${auraPhotos.length} uploaded`} />
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[80%] lg:w-[70%] xl:w-[60%] z-50 flex flex-col"
            style={{
              background: 'rgba(15, 29, 44, 0.95)',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* ── Custom Scrollbar Styles ── */}
            <style jsx global>{`
              .consultation-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .consultation-scroll::-webkit-scrollbar-track {
                background: rgba(15, 29, 44, 0.3);
              }
              .consultation-scroll::-webkit-scrollbar-thumb {
                background: rgba(201, 169, 110, 0.4);
                border-radius: 3px;
              }
              .consultation-scroll::-webkit-scrollbar-thumb:hover {
                background: rgba(201, 169, 110, 0.7);
              }
              @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
              .shimmer-btn {
                background-size: 200% 100%;
                animation: shimmer 2s ease-in-out infinite;
              }
            `}</style>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#C9A96E]/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#E8D5A8] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0F1D2C]" />
                </div>
                <h2
                  className="text-lg font-bold text-[#F8F6F1]"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  New Consultation
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-[#F8F6F1]/40" />
              </button>
            </div>

            {/* ── Step Indicator ── */}
            <div className="px-6 py-4 border-b border-[#C9A96E]/10">
              <div className="flex items-center justify-between">
                {STEPS.map((step, i) => {
                  const isCompleted = currentStep > step.number;
                  const isCurrent = currentStep === step.number;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.number} className="flex items-center flex-1 last:flex-none">
                      {/* Dot / icon */}
                      <button
                        type="button"
                        onClick={() => goToStep(step.number)}
                        className={`
                          relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 flex-shrink-0
                          ${isCompleted
                            ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] shadow-[0_0_15px_rgba(201,169,110,0.3)] cursor-pointer'
                            : isCurrent
                              ? 'bg-[#C9A96E]/20 border-2 border-[#C9A96E] shadow-[0_0_15px_rgba(201,169,110,0.2)]'
                              : 'bg-white/5 border border-white/10'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-[#0F1D2C]" />
                        ) : (
                          <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-[#C9A96E]' : 'text-white/30'}`} />
                        )}
                      </button>

                      {/* Label under dot */}
                      <span
                        className={`
                          hidden sm:block absolute mt-14 text-[10px] font-semibold uppercase tracking-wider
                          ${isCompleted || isCurrent ? 'text-[#C9A96E]' : 'text-white/20'}
                        `}
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        {step.label}
                      </span>

                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-[2px] mx-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              background: isCompleted
                                ? 'linear-gradient(90deg, #C9A96E, #E8D5A8)'
                                : 'rgba(255,255,255,0.08)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Step label for mobile */}
              <p
                className="sm:hidden text-center text-xs text-[#C9A96E] mt-3 font-semibold"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Step {currentStep} of 5 &mdash; {STEPS[currentStep - 1].label}
              </p>
            </div>

            {/* ── Animated Step Content ── */}
            <div className="flex-1 overflow-y-auto consultation-scroll">
              <div className="px-6 py-6">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    {stepRenderers[currentStep - 1]()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Footer Navigation ── */}
            <div className="px-6 py-4 border-t border-[#C9A96E]/10 space-y-3">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 text-center"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3">
                {/* Back Button */}
                {currentStep > 1 && (
                  <motion.button
                    type="button"
                    onClick={goBack}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                      border border-[#C9A96E]/30 text-[#C9A96E] text-sm font-semibold
                      hover:bg-[#C9A96E]/10 transition-all duration-200
                    "
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </motion.button>
                )}

                {/* Next / Submit Button */}
                {currentStep < 5 ? (
                  <motion.button
                    type="button"
                    onClick={goNext}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                      bg-gradient-to-r from-[#C9A96E] to-[#E8D5A8] text-[#0F1D2C] text-sm font-bold
                      hover:shadow-[0_0_25px_rgba(201,169,110,0.4)] transition-all duration-200
                    "
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    whileHover={submitting ? {} : { scale: 1.02 }}
                    whileTap={submitting ? {} : { scale: 0.98 }}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                      text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                      ${submitting
                        ? 'bg-[#C9A96E]/50 text-[#0F1D2C]'
                        : 'shimmer-btn bg-gradient-to-r from-[#C9A96E] via-[#E8D5A8] to-[#C9A96E] text-[#0F1D2C] hover:shadow-[0_0_30px_rgba(201,169,110,0.5)]'
                      }
                    `}
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Session & Running AI Analysis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Start AI Consultation
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Summary Row Helper ──
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span
        className="text-xs text-[#C9A96E]/60 font-semibold uppercase tracking-wider flex-shrink-0"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {label}
      </span>
      <span
        className="text-xs text-[#F8F6F1]/80 text-right"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        {value}
      </span>
    </div>
  );
}
