import type { UnifiedService, ServiceCategory } from '@/data/services/unified-catalog';

export interface SelectedService {
  id: string; // unique instance ID (not service catalog ID)
  serviceId: string; // unified catalog ID
  service: UnifiedService;
  quantity: number;
  notes: string;
  phase: 1 | 2 | 3;
}

export interface PlanPhase {
  id: 1 | 2 | 3;
  label: string;
  description: string;
  services: SelectedService[];
}

export interface GeneratedPackage {
  tier: 'Start' | 'Transform' | 'Elite' | 'Essential';
  name: string;
  subtitle: string;
  price: number;
  /** Alias for price — used in plan presentation and copilot contexts */
  totalPrice?: number;
  originalPrice: number;
  discount: number; // percentage
  sessions: number;
  lineItems: { service: string; qty: number; unitPrice: number; total: number }[];
  monthlyPayment12: number;
  monthlyPayment24: number;
  highlighted: boolean;
  extras: string[];
  bestFor: string;
  resultIntensity: string;
  concernsAddressed: string[];
  whyBest?: string; // Only on Transform
  savingsVsStandalone: number; // Dollar amount saved
}

export interface BuilderClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  skinConcerns: string[];
  treatmentInterests: string[];
  intakeId?: string;
}

export interface BuilderState {
  client: BuilderClient | null;
  planName: string;
  phases: [PlanPhase, PlanPhase, PlanPhase];
  searchQuery: string;
  activeCategory: ServiceCategory | 'all';
  packages: GeneratedPackage[];
  isDirty: boolean;
  savedPlanId: string | null;
}

export type BuilderAction =
  | { type: 'SET_CLIENT'; client: BuilderClient | null }
  | { type: 'SET_PLAN_NAME'; name: string }
  | { type: 'ADD_SERVICE'; serviceId: string; service: UnifiedService; phase: 1 | 2 | 3 }
  | { type: 'REMOVE_SERVICE'; instanceId: string }
  | { type: 'SET_QUANTITY'; instanceId: string; quantity: number }
  | { type: 'SET_NOTES'; instanceId: string; notes: string }
  | { type: 'MOVE_TO_PHASE'; instanceId: string; phase: 1 | 2 | 3 }
  | { type: 'REORDER'; phase: 1 | 2 | 3; fromIndex: number; toIndex: number }
  | { type: 'SET_SEARCH'; query: string }
  | { type: 'SET_CATEGORY'; category: ServiceCategory | 'all' }
  | { type: 'SET_PACKAGES'; packages: GeneratedPackage[] }
  | { type: 'MARK_SAVED'; planId: string }
  | { type: 'CLEAR' };

export const PHASE_LABELS: Record<1 | 2 | 3, { label: string; description: string }> = {
  1: { label: 'Foundation & Assessment', description: 'Initial treatments and baseline establishment' },
  2: { label: 'Active Optimization', description: 'Core treatment series for maximum results' },
  3: { label: 'Maintenance & Longevity', description: 'Ongoing care to sustain and protect results' },
};
