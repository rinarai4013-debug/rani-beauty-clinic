// Mobile client app type definitions

/* ─── Client Profile ────────────────────────────────────────────────── */

export interface MobileClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  dateOfBirth?: string;
  medicalSummary: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    skinType?: string;
    fitzpatrickScale?: number;
  };
  communicationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
    marketingOptIn: boolean;
  };
  paymentMethods: PaymentMethod[];
  membership: MembershipInfo | null;
  treatmentPreferences: {
    preferredProvider?: string;
    preferredTimes: string[];
    avoidTreatments: string[];
    goals: string[];
  };
  joinedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'financing';
  brand?: string;
  last4: string;
  expiresAt?: string;
  isDefault: boolean;
}

export interface MembershipInfo {
  id: string;
  tier: 'Essential' | 'Premium' | 'VIP';
  status: 'active' | 'paused' | 'cancelled';
  monthlyAmount: number;
  startedAt: string;
  nextBillingDate: string;
  perks: string[];
}

/* ─── Appointments ──────────────────────────────────────────────────── */

export interface MobileAppointment {
  id: string;
  service: string;
  serviceCategory: ServiceCategory;
  provider: string;
  providerAvatar?: string;
  date: string;
  time: string;
  duration: number; // minutes
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show';
  depositPaid: boolean;
  depositAmount?: number;
  totalPrice: number;
  location: string;
  notes?: string;
  prepInstructions?: string[];
  canReschedule: boolean;
  canCancel: boolean;
}

export type ServiceCategory =
  | 'injectables'
  | 'laser'
  | 'facial'
  | 'body'
  | 'wellness'
  | 'skin-tightening'
  | 'hair-restoration'
  | 'weight-loss';

/* ─── Treatments ────────────────────────────────────────────────────── */

export interface TreatmentRecord {
  id: string;
  service: string;
  serviceCategory: ServiceCategory;
  provider: string;
  date: string;
  productsUsed: ProductUsed[];
  providerNotes: string;
  aftercareInstructions: AftercareItem[];
  photos: TreatmentPhoto[];
  results: ResultRating[];
  relatedTreatments: string[];
  nextAppointmentSuggestion?: {
    service: string;
    suggestedDate: string;
    reason: string;
  };
  treatmentPlanId?: string;
  treatmentPlanStep?: number;
}

export interface ProductUsed {
  name: string;
  brand: string;
  quantity: string;
  area?: string;
}

export interface AftercareItem {
  id: string;
  instruction: string;
  timeframe: string;
  priority: 'required' | 'recommended' | 'optional';
  completed: boolean;
  timerMinutes?: number;
  category: 'do' | 'avoid' | 'apply' | 'watch';
}

export interface TreatmentPhoto {
  id: string;
  url: string;
  type: 'before' | 'after' | 'progress';
  takenAt: string;
  area: string;
  isAnonymized: boolean;
}

export interface ResultRating {
  day: 1 | 7 | 30;
  rating: number; // 1-5
  notes?: string;
  ratedAt: string;
}

export interface TreatmentPlanProgress {
  id: string;
  name: string;
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  steps: TreatmentPlanStep[];
  startedAt: string;
  estimatedCompletionDate: string;
  goal: string;
}

export interface TreatmentPlanStep {
  id: string;
  service: string;
  scheduledDate?: string;
  completedDate?: string;
  status: 'completed' | 'scheduled' | 'upcoming' | 'skipped';
  notes?: string;
}

/* ─── Loyalty & Rewards ─────────────────────────────────────────────── */

export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface LoyaltyAccount {
  tier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
  tierProgress: number; // 0-100
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  memberSince: string;
  streakDays: number;
  streakType: 'visit' | 'skincare' | 'referral';
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  points: number;
  description: string;
  date: string;
  service?: string;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'treatment' | 'product' | 'upgrade' | 'experience';
  image?: string;
  available: boolean;
  expiresAt?: string;
  tierRequired?: LoyaltyTier;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'booking' | 'referral' | 'review' | 'purchase' | 'streak';
  progress: number;
  target: number;
  bonusPoints: number;
  expiresAt: string;
  completed: boolean;
  icon: string;
}

export interface ReferralEntry {
  id: string;
  referredName: string;
  status: 'pending' | 'booked' | 'completed' | 'rewarded';
  pointsEarned: number;
  referredAt: string;
}

/* ─── Booking ───────────────────────────────────────────────────────── */

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  duration: number; // minutes
  priceRange: { min: number; max: number };
  depositRequired: boolean;
  depositAmount?: number;
  popularityScore: number;
  image?: string;
  tags: string[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  specialties: ServiceCategory[];
  rating: number;
  reviewCount: number;
  bio: string;
  nextAvailable: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  provider: string;
  demandLevel: 'low' | 'medium' | 'high';
}

export interface BookingRequest {
  serviceId: string;
  providerId?: string;
  date: string;
  time: string;
  notes?: string;
}

/* ─── Shop / Products ───────────────────────────────────────────────── */

export interface ShopProduct {
  id: string;
  name: string;
  brand: string;
  description: string;
  category: 'cleanser' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'supplement';
  price: number;
  image?: string;
  inStock: boolean;
  isRecommended: boolean;
  recommendationReason?: string;
  isFavorite: boolean;
  subscriptionAvailable: boolean;
  subscriptionDiscount?: number;
  rating: number;
  reviewCount: number;
}

/* ─── Chat ──────────────────────────────────────────────────────────── */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'book' | 'product' | 'link' | 'escalate';
  label: string;
  payload: string;
}

/* ─── Results Gallery ───────────────────────────────────────────────── */

export interface ResultsGalleryItem {
  id: string;
  treatmentType: string;
  before: TreatmentPhoto;
  after: TreatmentPhoto;
  daysSinceTreatment: number;
  treatmentDate: string;
  area: string;
  isPublic: boolean;
}

export interface ProgressTimeline {
  treatmentType: string;
  entries: {
    date: string;
    photo: TreatmentPhoto;
    rating?: number;
    notes?: string;
  }[];
}

/* ─── Skincare Tips ─────────────────────────────────────────────────── */

export interface SkincareTip {
  id: string;
  title: string;
  content: string;
  category: 'pre-treatment' | 'post-treatment' | 'daily' | 'seasonal';
  icon: string;
}

/* ─── API Response Wrappers ─────────────────────────────────────────── */

export interface MobileAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
