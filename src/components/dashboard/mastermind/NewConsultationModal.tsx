'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  X, Loader2, Sparkles, Upload, Camera, Check, ChevronLeft, ChevronRight,
  User, Heart, Stethoscope, Clock, ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { convertPdfFirstPageToJpeg, extractPdfTextSummary } from '@/lib/client/pdf-image';

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
      { value: 'microneedling-arrissence-undereye', label: 'Microneedling w/ Arrissence (Undereye)' },
      { value: 'peels', label: 'Peels' },
      { value: 'cosmelan-peel', label: 'Cosmelan Peel' },
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

const CONCERN_TO_SCHEMA: Record<string, string[]> = {
  acne: ['acne'],
  'acne-scars': ['acne', 'dull-skin'],
  hyperpigmentation: ['hyperpigmentation'],
  'fine-lines': ['aging-skin'],
  texture: ['dull-skin', 'large-pores'],
  laxity: ['skin-laxity'],
  dryness: ['dull-skin'],
  'hair-removal': ['unwanted-hair'],
  scars: ['dull-skin'],
  undereye: ['aging-skin', 'hyperpigmentation'],
  rosacea: ['sun-damage'],
  'large-pores': ['large-pores'],
};

const BUDGET_TO_SCHEMA: Record<string, string> = {
  'under-500': 'starter',
  '500-1500': 'moderate',
  '1500-3000': 'premium',
  '3000-5000': 'investment',
  '5000-plus': 'investment',
};

const SESSION_READY_RETRY_DELAYS_MS = [120, 300, 700];
const MAX_INITIAL_SUBMIT_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_AURA_INLINE_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_SKIN_UPLOAD_FILES = 5;
const MAX_AURA_UPLOAD_FILES = 3;

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

function normalizePhoneForSubmit(rawPhone: string): string | undefined {
  const trimmed = rawPhone.trim();
  if (!trimmed) return undefined;

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    const local = digits.slice(1);
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return undefined;
}

function normalizeDobForSubmit(rawDob: string): string | undefined {
  if (!rawDob) return undefined;
  const parsed = new Date(rawDob);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDelta = now.getMonth() - parsed.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age >= 18 ? rawDob : undefined;
}

function normalizeConcernSelections(rawConcerns: string[]): string[] {
  const normalized = new Set<string>();

  for (const concern of rawConcerns) {
    const key = concern.toLowerCase();
    const mapped = CONCERN_TO_SCHEMA[key] ?? [key];
    for (const item of mapped) normalized.add(item);
  }

  return Array.from(normalized);
}

function isPdfFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type === 'application/pdf' || name.endsWith('.pdf');
}

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function buildAuraInlineUploadSet(files: File[]): {
  inlineFiles: File[];
  rawPdfFiles: File[];
  skippedPdfCount: number;
  skippedOversizeCount: number;
} {
  let skippedPdfCount = 0;
  let skippedOversizeCount = 0;
  const inlineFiles: File[] = [];
  const rawPdfFiles: File[] = [];

  for (const file of files) {
    if (isPdfFile(file)) {
      skippedPdfCount += 1;
      rawPdfFiles.push(file);
      continue;
    }

    if (!file.type.startsWith('image/')) continue;

    if (file.size > MAX_AURA_INLINE_UPLOAD_BYTES) {
      skippedOversizeCount += 1;
      continue;
    }

    inlineFiles.push(file);
  }

  return { inlineFiles, rawPdfFiles, skippedPdfCount, skippedOversizeCount };
}

async function parseJsonResponse(
  response: Response
): Promise<{ json: Record<string, unknown> | null; text: string }> {
  const text = await response.text().catch(() => '');
  if (!text) return { json: null, text: '' };

  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object') {
      return { json: parsed as Record<string, unknown>, text };
    }
  } catch {
    // non-JSON response
  }

  return { json: null, text };
}

function normalizeSubmissionError(message: string): string {
  const normalized = message.trim();
  if (!normalized) return 'Submission failed. Please try again.';

  if (
    /request entity too large|payload too large|body exceeded|unexpected token.*request en/i.test(
      normalized
    )
  ) {
    return 'Your upload is too large. Please use fewer or smaller files, then retry.';
  }

  if (
    /unexpected token.*internal s|internal server error|unexpected token.*not valid json|not valid json/i.test(
      normalized
    )
  ) {
    return 'The server returned an invalid response. Please retry in a moment.';
  }

  if (/invalid form data payload|invalid consultation payload|invalid form data json/i.test(normalized)) {
    return 'Some form fields were formatted unexpectedly. Please retry; we adjusted the submission format.';
  }

  if (/unauthorized|forbidden|session expired/i.test(normalized)) {
    return 'Your dashboard session expired. Please sign in again and retry.';
  }

  return normalized;
}

function getApiErrorMessage(
  response: Response,
  parsed: { json: Record<string, unknown> | null; text: string },
  fallback: string
): string {
  const payload = parsed.json;
  const payloadError = payload && typeof payload.error === 'string' ? payload.error.trim() : '';
  const payloadMessage = payload && typeof payload.message === 'string' ? payload.message.trim() : '';

  if (payloadError) return normalizeSubmissionError(payloadError);
  if (payloadMessage) return normalizeSubmissionError(payloadMessage);

  if (response.status === 401 || response.status === 403) {
    return 'Your dashboard session expired. Please sign in again and retry.';
  }
  if (response.status === 413) return 'Your upload is too large. Please use fewer or smaller files, then retry.';
  if (response.status >= 500) return 'Server is temporarily unavailable. Please try again shortly.';

  if (parsed.text) return normalizeSubmissionError(parsed.text.slice(0, 220));
  return normalizeSubmissionError(fallback);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitForSessionReady(sessionId: string): Promise<void> {
  let lastMessage = 'Session is still initializing. Please retry.';

  for (let index = 0; index < SESSION_READY_RETRY_DELAYS_MS.length; index += 1) {
    const response = await fetch(`/api/mastermind/sessions/${sessionId}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (response.ok) return;

    const parsed = await parseJsonResponse(response);
    if (response.status === 401 || response.status === 403) {
      // Session exists, but auth middleware blocked verification. Continue best-effort.
      return;
    }
    lastMessage = getApiErrorMessage(response, parsed, lastMessage);
    const retryable = response.status === 404 || /session not found|still initializing/i.test(lastMessage);
    if (!retryable || index === SESSION_READY_RETRY_DELAYS_MS.length - 1) {
      throw new Error(lastMessage);
    }

    await sleep(SESSION_READY_RETRY_DELAYS_MS[index]);
  }

  throw new Error(lastMessage);
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
  allowPdf = false,
  icon: Icon = Camera,
}: {
  label: string;
  sublabel: string;
  files: File[];
  onFiles: (files: File[]) => void | Promise<void>;
  onRemove: (index: number) => void;
  maxFiles?: number;
  allowPdf?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || (allowPdf && isPdfFile(f))
    );
    void onFiles(dropped.slice(0, maxFiles - files.length));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    void onFiles(selected.slice(0, maxFiles - files.length));
    e.target.value = '';
  };

  const previewUrls = useMemo(
    () =>
      files.map((file) => (isPdfFile(file) ? null : URL.createObjectURL(file))),
    [files]
  );

  useEffect(
    () => () => {
      for (const url of previewUrls) {
        if (url) URL.revokeObjectURL(url);
      }
    },
    [previewUrls]
  );

  return (
    <div className="space-y-3">
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={inputRef}
        type="file"
        accept={allowPdf ? 'image/jpeg,image/png,image/webp,image/heic,application/pdf' : 'image/jpeg,image/png,image/webp,image/heic'}
        multiple
        className="sr-only"
        onChange={handleSelect}
      />

      {files.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#C9A96E]/30 flex items-center justify-center bg-[#0F1D2C]">
                {isPdfFile(f) ? (
                  <div className="text-center">
                    <div className="text-[#C9A96E] text-lg">📄</div>
                    <div className="text-[8px] text-[#F8F6F1]/50 mt-0.5 px-1 truncate max-w-[76px]">{f.name}</div>
                  </div>
                ) : (
                  <img
                    src={previewUrls[i] || ''}
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

      {files.length < maxFiles ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
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
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/5">
          <span className="text-xs text-[#C9A96E]/60" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Maximum {maxFiles} {maxFiles === 1 ? 'file' : 'files'} reached — remove one to add more
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
  const [smokingAlcohol, setSmokingAlcohol] = useState<string[]>([]);
  const [waterIntake, setWaterIntake] = useState<string[]>([]);

  // ── Step 4: Skincare Routine & Schedule ──
  const [skincareRoutine, setSkincareRoutine] = useState<string[]>([]);
  const [amRoutine, setAmRoutine] = useState('');
  const [pmRoutine, setPmRoutine] = useState('');
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [preferredTime, setPreferredTime] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);

  // ── Step 3: Clinical Notes (provider observations) ──
  const [clinicalNotes, setClinicalNotes] = useState('');

  // ── Step 5: Photos ──
  const [skinPhotos, setSkinPhotos] = useState<File[]>([]);
  const [auraPhotos, setAuraPhotos] = useState<File[]>([]);
  const [isConvertingAuraPdf, setIsConvertingAuraPdf] = useState(false);
  const [auraPdfFallbackNotes, setAuraPdfFallbackNotes] = useState<string[]>([]);

  // ── Draft auto-save / restore (localStorage) ──
  const DRAFT_KEY = 'rani_consult_draft';

  // Restore draft on mount
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.firstName) setFirstName(d.firstName);
      if (d.lastName) setLastName(d.lastName);
      if (d.dob) setDob(d.dob);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.contactPref) setContactPref(d.contactPref);
      if (d.referralSource) setReferralSource(d.referralSource);
      if (d.concerns) setConcerns(d.concerns);
      if (d.targetAreas) setTargetAreas(d.targetAreas);
      if (d.treatmentInterests) setTreatmentInterests(d.treatmentInterests);
      if (d.hasEvent) setHasEvent(d.hasEvent);
      if (d.eventDate) setEventDate(d.eventDate);
      if (d.eventType) setEventType(d.eventType);
      if (d.hadTreatments) setHadTreatments(d.hadTreatments);
      if (d.previousTreatments) setPreviousTreatments(d.previousTreatments);
      if (d.hasMedical) setHasMedical(d.hasMedical);
      if (d.medicalConditions) setMedicalConditions(d.medicalConditions);
      if (d.hasAllergies) setHasAllergies(d.hasAllergies);
      if (d.allergies) setAllergies(d.allergies);
      if (d.hasMedications) setHasMedications(d.hasMedications);
      if (d.medications) setMedications(d.medications);
      if (d.smokingAlcohol) setSmokingAlcohol(d.smokingAlcohol);
      if (d.waterIntake) setWaterIntake(d.waterIntake);
      if (d.clinicalNotes) setClinicalNotes(d.clinicalNotes);
      if (d.skincareRoutine) setSkincareRoutine(d.skincareRoutine);
      if (d.amRoutine) setAmRoutine(d.amRoutine);
      if (d.pmRoutine) setPmRoutine(d.pmRoutine);
      if (d.preferredDays) setPreferredDays(d.preferredDays);
      if (d.preferredTime) setPreferredTime(d.preferredTime);
      if (d.budget) setBudget(d.budget);
      if (d.currentStep && d.currentStep > 1) setCurrentStep(d.currentStep);
    } catch { /* ignore corrupt drafts */ }
  }, [open]);

  // Save draft whenever any field changes
  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        currentStep,
        firstName, lastName, dob, email, phone, contactPref, referralSource,
        concerns, targetAreas, treatmentInterests, hasEvent, eventDate, eventType,
        hadTreatments, previousTreatments, hasMedical, medicalConditions,
        hasAllergies, allergies, hasMedications, medications, smokingAlcohol, waterIntake,
        clinicalNotes,
        skincareRoutine, amRoutine, pmRoutine, preferredDays, preferredTime, budget,
      }));
    } catch { /* ignore storage errors */ }
  }, [
    open, currentStep,
    firstName, lastName, dob, email, phone, contactPref, referralSource,
    concerns, targetAreas, treatmentInterests, hasEvent, eventDate, eventType,
    hadTreatments, previousTreatments, hasMedical, medicalConditions,
    hasAllergies, allergies, hasMedications, medications, smokingAlcohol, waterIntake,
    clinicalNotes,
    skincareRoutine, amRoutine, pmRoutine, preferredDays, preferredTime, budget,
  ]);

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
      if (!email.trim()) errors.email = true;
    }
    if (step === 2) {
      if (concerns.length === 0) errors.concerns = true;
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
  const addSkinPhotos = (files: File[]) =>
    setSkinPhotos((prev) => [...prev, ...files].slice(0, MAX_SKIN_UPLOAD_FILES));
  const removeSkinPhoto = (i: number) => setSkinPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const addAuraPhotos = async (files: File[]) => {
    const pdfFiles = files.filter((file) => isPdfFile(file));
    const nonPdfFiles = files.filter((file) => !isPdfFile(file));

    let convertedPdfImages: File[] = [];
    const fallbackNotes: string[] = [];
    let failedPdfCount = 0;
    if (pdfFiles.length > 0) {
      setIsConvertingAuraPdf(true);
      for (const pdfFile of pdfFiles) {
        try {
          const converted = await convertPdfFirstPageToJpeg(pdfFile, {
            maxDimension: 1700,
            quality: 0.82,
          });
          convertedPdfImages.push(converted);
        } catch {
          failedPdfCount += 1;
          try {
            const extracted = await extractPdfTextSummary(pdfFile, { maxPages: 3, maxChars: 2000 });
            if (extracted.trim()) {
              fallbackNotes.push(
                `Aura PDF fallback extracted from ${pdfFile.name}:\n${extracted.trim()}`
              );
            } else {
              fallbackNotes.push(`Aura PDF fallback extracted from ${pdfFile.name}.`);
            }
          } catch {
            fallbackNotes.push(`Aura PDF attached (${pdfFile.name}) but image conversion failed.`);
          }
        }
      }
      setIsConvertingAuraPdf(false);
    }
    if (fallbackNotes.length > 0) {
      setAuraPdfFallbackNotes((prev) => [...prev, ...fallbackNotes].slice(0, 5));
    }

    const oversizeAuraImages = [...nonPdfFiles, ...convertedPdfImages].filter(
      (file) => file.type.startsWith('image/') && file.size > MAX_AURA_INLINE_UPLOAD_BYTES
    );
    if (failedPdfCount > 0) {
      setError(
        `${failedPdfCount} Aura PDF file${failedPdfCount > 1 ? 's could not' : ' could not'} be converted to image. Extracted report text will be used as fallback analysis input.`
      );
    } else if (oversizeAuraImages.length > 0) {
      setError(
        `Skipped ${oversizeAuraImages.length} Aura image${oversizeAuraImages.length > 1 ? 's' : ''} over ${formatMb(MAX_AURA_INLINE_UPLOAD_BYTES)} MB.`
      );
    } else {
      setError(null);
    }

    const acceptedFiles = [...nonPdfFiles, ...convertedPdfImages].filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_AURA_INLINE_UPLOAD_BYTES
    );
    setAuraPhotos((prev) => [...prev, ...acceptedFiles].slice(0, MAX_AURA_UPLOAD_FILES));
  };
  const removeAuraPhoto = (i: number) => setAuraPhotos((prev) => prev.filter((_, idx) => idx !== i));

  const auraInlineUploadPreview = useMemo(() => buildAuraInlineUploadSet(auraPhotos), [auraPhotos]);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setError(null);
    setSubmitting(true);

    try {
      const goalMap: Record<string, string> = {
        'fine-lines': 'reduce fine lines and support collagen',
        'hyperpigmentation': 'improve pigmentation and even skin tone',
        'dryness': 'improve hydration and barrier strength',
        acne: 'clear active breakouts',
        laxity: 'tighten skin and improve firmness',
        'acne-scars': 'soften acne scarring and refine texture',
        scars: 'improve scar appearance and smoothness',
        undereye: 'brighten and refresh the under-eye area',
        rosacea: 'reduce redness and sensitivity',
        texture: 'smooth texture and refine pore appearance',
        'hair-removal': 'reduce unwanted hair growth',
        'large-pores': 'minimize pore visibility',
      };

      const normalizedSkinConcerns = normalizeConcernSelections(concerns);
      const normalizedPhone = normalizePhoneForSubmit(phone);
      const normalizedDob = normalizeDobForSubmit(dob);
      const normalizedBudget = BUDGET_TO_SCHEMA[budget[0] || ''];
      const normalizedTimeline = hasEvent === 'yes' ? 'event' : undefined;
      const goalsText = concerns
        .map((concern) => goalMap[concern] || concern)
        .filter((value) => value.trim().length > 0)
        .join(', ');

      const formData = new FormData();
      const auraInline = buildAuraInlineUploadSet(auraPhotos);
      const auraNotes: string[] = [];
      if (auraInline.skippedPdfCount > 0) {
        auraNotes.push(
          `${auraInline.skippedPdfCount} Aura PDF file${auraInline.skippedPdfCount > 1 ? 's were' : ' was'} attached but not uploaded as raw file due payload limits.`
        );
      }
      if (auraPdfFallbackNotes.length > 0) {
        auraNotes.push(
          `${auraPdfFallbackNotes.length} Aura PDF fallback note${auraPdfFallbackNotes.length > 1 ? 's' : ''} extracted for scan context.`
        );
        auraNotes.push(...auraPdfFallbackNotes);
      }
      if (auraInline.skippedOversizeCount > 0) {
        auraNotes.push(
          `${auraInline.skippedOversizeCount} Aura image${auraInline.skippedOversizeCount > 1 ? 's were' : ' was'} over ${formatMb(MAX_AURA_INLINE_UPLOAD_BYTES)} MB and excluded.`
        );
      }
      const combinedClinicalNotes = [clinicalNotes.trim(), ...auraNotes].filter(Boolean).join('\n');
      const initialUploadBytes = [...skinPhotos, ...auraInline.inlineFiles]
        .reduce((sum, file) => sum + file.size, 0);
      if (initialUploadBytes > MAX_INITIAL_SUBMIT_UPLOAD_BYTES) {
        throw new Error(
          `Initial upload exceeds ${formatMb(MAX_INITIAL_SUBMIT_UPLOAD_BYTES)} MB. Remove some files and retry.`
        );
      }

      formData.append(
        'data',
        JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dob: normalizedDob,
          email: email.trim() || undefined,
          phone: normalizedPhone,
          age: calculatedAge ?? undefined,
          contactPreference: contactPref[0] || undefined,
          referralSource: referralSource[0] || undefined,

          skinConcerns: normalizedSkinConcerns.length > 0 ? normalizedSkinConcerns : undefined,
          targetAreas,
          treatmentInterests,
          concerns,
          goals: goalsText || undefined,
          timeline: normalizedTimeline,

          hasUpcomingEvent: hasEvent === 'yes',
          eventDetails: hasEvent === 'yes' ? `${eventType} - ${eventDate}` : undefined,

          previousTreatments: hadTreatments === 'yes' && previousTreatments
            ? previousTreatments.split(',').map((t) => t.trim())
            : [],
          treatmentHistory: hadTreatments === 'yes' ? previousTreatments : '',

          medicalHistory: hasMedical === 'yes' ? medicalConditions : 'None',
          hasAutoimmune: hasMedical === 'yes',
          allergies: hasAllergies === 'yes' ? allergies : 'None',
          hasAllergies: hasAllergies === 'yes',
          medications: hasMedications === 'yes' ? medications : 'None',
          hasMedications: hasMedications === 'yes',

          smokingAlcohol: smokingAlcohol[0] || 'neither',
          smokingStatus: smokingAlcohol[0] === 'smoke-only' || smokingAlcohol[0] === 'both' ? 'current' : 'never',
          waterIntake: waterIntake[0] || undefined,
          skincareRoutine: skincareRoutine[0] || undefined,

          skincareAM: amRoutine || undefined,
          skincarePM: pmRoutine || undefined,

          requiresLabWork: needsLabWork,

          preferredDays: preferredDays.length > 0 ? preferredDays : undefined,
          preferredTime: preferredTime[0] || undefined,

          budget: normalizedBudget,

          clinicalNotes: combinedClinicalNotes || undefined,
        })
      );

      for (const file of skinPhotos) {
        formData.append('photos', file);
      }
      for (const file of auraInline.inlineFiles) {
        formData.append('aura', file);
      }

      const res = await fetch('/api/consultation/submit', {
        method: 'POST',
        body: formData,
      });

      const parsedSubmit = await parseJsonResponse(res);
      if (!res.ok) {
        throw new Error(getApiErrorMessage(res, parsedSubmit, 'Submission failed. Please retry.'));
      }
      if (!parsedSubmit.json) {
        throw new Error('Server returned an invalid response. Please retry.');
      }

      const submitPayload = parsedSubmit.json as {
        success?: boolean;
        error?: string;
        message?: string;
        data?: { sessionId?: string };
        sessionId?: string;
      };
      if (!submitPayload.success) {
        throw new Error(
          normalizeSubmissionError(
            (typeof submitPayload.error === 'string' && submitPayload.error) ||
              (typeof submitPayload.message === 'string' && submitPayload.message) ||
              'Submission failed'
          )
        );
      }

      // Clear saved draft on successful submit
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setAuraPdfFallbackNotes([]);

      const sessionId =
        submitPayload.data?.sessionId ||
        (typeof submitPayload.sessionId === 'string' ? submitPayload.sessionId : '');
      if (!sessionId) {
        throw new Error('Submission succeeded but no session ID was returned. Please retry.');
      }

      // Cross-function persistence can lag briefly; poll before downstream calls.
      try {
        await waitForSessionReady(sessionId);

        let planRes = await fetch('/api/mastermind/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ sessionId }),
        });
        let parsedPlan = await parseJsonResponse(planRes);
        let planMessage = getApiErrorMessage(planRes, parsedPlan, 'Plan generation failed.');

        // If plan runs before scan is ready, run scan explicitly once, then retry plan.
        if (!planRes.ok && /missing scan|scan result|missing intake data/i.test(planMessage)) {
          const scanRes = await fetch('/api/mastermind/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ sessionId }),
          });
          const parsedScan = await parseJsonResponse(scanRes);
          if (!scanRes.ok && scanRes.status !== 401 && scanRes.status !== 403) {
            throw new Error(getApiErrorMessage(scanRes, parsedScan, 'Aura scan processing failed.'));
          }

          if (scanRes.ok) {
            planRes = await fetch('/api/mastermind/plan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ sessionId }),
            });
            parsedPlan = await parseJsonResponse(planRes);
            planMessage = getApiErrorMessage(planRes, parsedPlan, 'Plan generation failed.');
          }
        }

        if (!planRes.ok && planRes.status !== 401 && planRes.status !== 403) {
          throw new Error(planMessage);
        }

        if (planRes.ok) {
          const simulateRes = await fetch('/api/mastermind/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ sessionId }),
          });
          const parsedSimulate = await parseJsonResponse(simulateRes);
          if (!simulateRes.ok && simulateRes.status !== 401 && simulateRes.status !== 403) {
            throw new Error(
              getApiErrorMessage(simulateRes, parsedSimulate, 'Simulation generation failed.')
            );
          }
        }
      } catch (downstreamError) {
        console.warn('[Mastermind] Consultation saved but downstream generation deferred:', downstreamError);
      }

      onCreated(sessionId);
    } catch (err) {
      setError(
        err instanceof Error ? normalizeSubmissionError(err.message) : 'Something went wrong'
      );
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
        <FieldLabel>Email *</FieldLabel>
        <GoldInput
          type="email"
          placeholder="client@email.com"
          value={email}
          onChange={setEmail}
          error={validationErrors.email}
        />
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

      {/* Clinical Notes — provider observations fed directly into AI */}
      <div>
        <FieldLabel>Clinical Observations</FieldLabel>
        <p className="text-[10px] text-[#C9A96E]/50 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Provider notes injected directly into AI analysis — skin texture, buildup, tone irregularities, anything you observe in person
        </p>
        <textarea
          value={clinicalNotes}
          onChange={(e) => setClinicalNotes(e.target.value)}
          placeholder="e.g. Keratin buildup around nose and forehead, visible sebaceous filaments, mild perioral hyperpigmentation, skin appears dehydrated despite oily T-zone…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[#C9A96E]/30 text-[#F8F6F1] placeholder-[#F8F6F1]/20 text-sm resize-none focus:outline-none focus:border-[#C9A96E]/60 focus:bg-white/8 transition-all duration-200"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <StepTitle>Skincare Routine & Schedule</StepTitle>
        <StepSubtitle>Help us understand their current routine and availability</StepSubtitle>
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
        sublabel="Drag & drop or click to upload (up to 5 photos, 4MB initial submit cap)"
        files={skinPhotos}
        onFiles={addSkinPhotos}
        onRemove={removeSkinPhoto}
        maxFiles={MAX_SKIN_UPLOAD_FILES}
        allowPdf={false}
        icon={Camera}
      />

      {/* Aura Scan */}
      <PhotoDropZone
        label="Upload Aura Skin Scan"
        sublabel="Upload Aura PDF or screenshots (PDF auto-converts to image for scan)"
        files={auraPhotos}
        onFiles={addAuraPhotos}
        onRemove={removeAuraPhoto}
        maxFiles={MAX_AURA_UPLOAD_FILES}
        allowPdf={true}
        icon={Upload}
      />
      {isConvertingAuraPdf && (
        <p className="text-xs text-[#C9A96E]/80" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Converting Aura PDF to image for secure upload...
        </p>
      )}

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

          {skincareRoutine.length > 0 && (
            <SummaryRow
              label="Routine"
              value={SKINCARE_ROUTINE.find((o) => o.value === skincareRoutine[0])?.label || skincareRoutine[0]}
            />
          )}
          {preferredDays.length > 0 && <SummaryRow label="Days" value={preferredDays.join(', ')} />}
          {preferredTime.length > 0 && <SummaryRow label="Time" value={preferredTime.join(', ')} />}
          {budget.length > 0 && (
            <SummaryRow label="Budget" value={BUDGET_OPTIONS.find((o) => o.value === budget[0])?.label || budget[0]} />
          )}

          <SummaryRow label="Skin Photos" value={`${skinPhotos.length} uploaded`} />
          <SummaryRow
            label="Aura Scan"
            value={`${auraPhotos.length} attached (${auraInlineUploadPreview.inlineFiles.length} images sent${auraPdfFallbackNotes.length > 0 ? `, ${auraPdfFallbackNotes.length} PDF fallback note${auraPdfFallbackNotes.length > 1 ? 's' : ''}` : ''})`}
          />
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
