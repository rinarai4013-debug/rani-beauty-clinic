/**
 * Mastermind Session Management
 *
 * Creates, manages, and persists MastermindSession objects.
 * In-memory storage with localStorage backup.
 */

import type {
  MastermindSession,
  MastermindSessionAction,
  MastermindPhase,
} from '@/types/mastermind';

// ── Session Reducer ──

export function sessionReducer(
  state: MastermindSession,
  action: MastermindSessionAction
): MastermindSession {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'SET_INTAKE':
      return {
        ...state,
        updatedAt: now,
        intakeData: action.data,
        patientName:
          `${action.data.firstName || ''} ${action.data.lastName || ''}`.trim() ||
          state.patientName,
        patientEmail: (action.data.email as string) || state.patientEmail,
      };

    case 'SET_SOURCE_PHOTO':
      return { ...state, updatedAt: now, sourcePhotoUrl: action.url };

    case 'SET_PHASE':
      return { ...state, updatedAt: now, phase: action.phase };

    case 'SET_SCAN_RESULT':
      return {
        ...state,
        updatedAt: now,
        phase: 'scan_complete',
        auraScanResult: action.result,
      };

    case 'SET_PLAN':
      return {
        ...state,
        updatedAt: now,
        phase: 'plan_ready',
        mastermindPlan: action.plan,
      };

    case 'SET_PROVIDER_REVIEW':
      return {
        ...state,
        updatedAt: now,
        phase: 'provider_review',
        providerReview: action.review,
      };

    case 'ADD_MODIFICATION':
      return {
        ...state,
        updatedAt: now,
        providerReview: state.providerReview
          ? {
              ...state.providerReview,
              modifications: [
                ...state.providerReview.modifications,
                action.modification,
              ],
            }
          : null,
      };

    case 'SET_APPROVAL_STATUS':
      return {
        ...state,
        updatedAt: now,
        phase: action.status === 'approved' ? 'approved' : state.phase,
        providerReview: state.providerReview
          ? {
              ...state.providerReview,
              approvalStatus: action.status,
              approvedAt:
                action.status === 'approved' ? now : state.providerReview.approvedAt,
            }
          : null,
      };

    case 'SET_SIMULATION':
      return {
        ...state,
        updatedAt: now,
        phase: 'simulation_ready',
        simulationComparison: action.comparison,
      };

    case 'SELECT_PACKAGE':
      return {
        ...state,
        updatedAt: now,
        selectedPackageTier: action.tier,
      };

    case 'SET_PDF_URL':
      return { ...state, updatedAt: now, pdfUrl: action.url };

    case 'SET_BOOKED':
      return {
        ...state,
        updatedAt: now,
        bookedAppointmentId: action.appointmentId,
      };

    case 'COMPLETE':
      return { ...state, updatedAt: now, phase: 'completed' };

    default:
      return state;
  }
}

// ── Session Factory ──

export function createSession(
  overrides?: Partial<MastermindSession>
): MastermindSession {
  const now = new Date().toISOString();
  return {
    id: generateSessionId(),
    createdAt: now,
    updatedAt: now,
    phase: 'intake',
    intakeData: null,
    patientName: '',
    patientEmail: '',
    sourcePhotoUrl: null,
    auraScanResult: null,
    mastermindPlan: null,
    providerReview: null,
    simulationComparison: null,
    selectedPackageTier: null,
    pdfUrl: null,
    bookedAppointmentId: null,
    ...overrides,
  };
}

// ── In-Memory Store ──

const sessions = new Map<string, MastermindSession>();

export function getSessionById(id: string): MastermindSession | null {
  // Check memory first
  if (sessions.has(id)) return sessions.get(id)!;

  // Try localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`mastermind_session_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Hydrate with defaults for any missing fields (forward-compat)
        const session = hydrateSession(parsed);
        sessions.set(id, session);
        return session;
      }
    } catch {
      // Corrupt localStorage entry — remove it silently
      try { localStorage.removeItem(`mastermind_session_${id}`); } catch { /* noop */ }
    }
  }

  return null;
}

/**
 * Hydrate a parsed session with defaults for missing fields.
 * Prevents crashes when loading sessions saved by older code
 * that didn't have all fields.
 */
function hydrateSession(parsed: Record<string, unknown>): MastermindSession {
  return {
    id: typeof parsed.id === 'string' ? parsed.id : generateSessionId(),
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    phase: isValidPhase(parsed.phase) ? parsed.phase : 'intake',
    intakeData: parsed.intakeData as MastermindSession['intakeData'] ?? null,
    patientName: typeof parsed.patientName === 'string' ? parsed.patientName : '',
    patientEmail: typeof parsed.patientEmail === 'string' ? parsed.patientEmail : '',
    sourcePhotoUrl: typeof parsed.sourcePhotoUrl === 'string' ? parsed.sourcePhotoUrl : null,
    auraScanResult: parsed.auraScanResult as MastermindSession['auraScanResult'] ?? null,
    mastermindPlan: parsed.mastermindPlan as MastermindSession['mastermindPlan'] ?? null,
    providerReview: parsed.providerReview as MastermindSession['providerReview'] ?? null,
    simulationComparison: parsed.simulationComparison as MastermindSession['simulationComparison'] ?? null,
    selectedPackageTier: isValidTier(parsed.selectedPackageTier) ? parsed.selectedPackageTier : null,
    pdfUrl: typeof parsed.pdfUrl === 'string' ? parsed.pdfUrl : null,
    bookedAppointmentId: typeof parsed.bookedAppointmentId === 'string' ? parsed.bookedAppointmentId : null,
  };
}

const VALID_PHASES: MastermindPhase[] = [
  'intake', 'scanning', 'scan_complete', 'generating_plan', 'plan_ready',
  'provider_review', 'approved', 'simulating', 'simulation_ready', 'presenting', 'completed',
];

function isValidPhase(val: unknown): val is MastermindPhase {
  return typeof val === 'string' && VALID_PHASES.includes(val as MastermindPhase);
}

function isValidTier(val: unknown): val is 'Start' | 'Transform' | 'Elite' {
  return val === 'Start' || val === 'Transform' || val === 'Elite';
}

export function saveSession(session: MastermindSession): void {
  sessions.set(session.id, session);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `mastermind_session_${session.id}`,
        JSON.stringify(session)
      );
      // Update session index
      const index = getSessionIndex();
      if (!index.includes(session.id)) {
        index.push(session.id);
        localStorage.setItem('mastermind_sessions', JSON.stringify(index));
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export function getAllSessions(): MastermindSession[] {
  if (typeof window !== 'undefined') {
    try {
      const index = getSessionIndex();
      return index
        .map((id) => getSessionById(id))
        .filter((s): s is MastermindSession => s !== null)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    } catch {
      // Fall through
    }
  }
  return Array.from(sessions.values()).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function deleteSession(id: string): void {
  sessions.delete(id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`mastermind_session_${id}`);
      const index = getSessionIndex().filter((sid) => sid !== id);
      localStorage.setItem('mastermind_sessions', JSON.stringify(index));
    } catch {
      // Ignore
    }
  }
}

// ── Helpers ──

function getSessionIndex(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('mastermind_sessions');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `ms_${timestamp}_${random}`;
}
