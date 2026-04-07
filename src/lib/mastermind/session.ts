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
  ClinicStatus,
  ActivityLogEntry,
} from '@/types/mastermind';

// ── Activity Log Helper ──

function appendLog(
  existing: ActivityLogEntry[] | undefined,
  action: string,
  detail: string,
  actor?: string
): ActivityLogEntry[] {
  const entry: ActivityLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    detail,
    ...(actor ? { actor } : {}),
  };
  return [...(existing || []), entry];
}

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
        activityLog: appendLog(state.activityLog, 'scan_completed', `Aura scan completed (score: ${action.result?.auraScore?.overall ?? '?'})`),
      };

    case 'SET_PLAN':
      return {
        ...state,
        updatedAt: now,
        phase: 'plan_ready',
        mastermindPlan: action.plan,
        activityLog: appendLog(state.activityLog, 'plan_generated', `Treatment plan generated (${action.plan?.packages?.length ?? 0} packages)`),
      };

    case 'SET_PROVIDER_REVIEW':
      return {
        ...state,
        updatedAt: now,
        phase: 'provider_review',
        providerReview: action.review,
        activityLog: appendLog(
          state.activityLog,
          'provider_review_started',
          `Provider review initiated by ${action.review.providerName || 'provider'}`,
          action.review.providerName || undefined
        ),
      };

    case 'ADD_MODIFICATION': {
      const modLabels: Record<string, string> = {
        add: 'Treatment added', remove: 'Treatment removed', adjust_dosage: 'Dosage adjusted',
        reorder: 'Treatment reordered', swap: 'Treatment swapped', note: 'Clinical note added',
      };
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
        activityLog: appendLog(
          state.activityLog,
          'modification_added',
          `${modLabels[action.modification.type] || 'Plan modified'}: ${action.modification.details}`,
          action.modification.providerId
        ),
      };
    }

    case 'SET_APPROVAL_STATUS': {
      const statusLabels: Record<string, string> = {
        approved: 'Plan approved by provider',
        rejected: 'Plan rejected by provider',
        modified: 'Provider requested changes to plan',
        pending: 'Plan review status reset to pending',
      };
      const actionKey = action.status === 'approved' ? 'plan_approved'
        : action.status === 'rejected' ? 'plan_rejected'
        : action.status === 'modified' ? 'changes_requested'
        : 'status_changed';
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
        activityLog: appendLog(
          state.activityLog,
          actionKey,
          statusLabels[action.status] || `Plan status set to ${action.status}`,
          action.actor || state.providerReview?.providerName || undefined
        ),
      };
    }

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
      return {
        ...state, updatedAt: now, phase: 'completed',
        activityLog: appendLog(state.activityLog, 'completed', 'Consultation completed'),
      };

    case 'SET_CLINIC_STATUS': {
      const prev = state.clinicStatus || 'new';
      return {
        ...state, updatedAt: now, clinicStatus: action.status,
        activityLog: appendLog(state.activityLog, 'status_changed', `Status changed from "${prev}" to "${action.status}"`, action.actor),
      };
    }

    case 'SET_CLINIC_NOTES':
      return {
        ...state, updatedAt: now, clinicNotes: action.notes,
        activityLog: appendLog(state.activityLog, 'note_updated', 'Staff notes updated', action.actor),
      };

    case 'SET_SHARE_TOKEN':
      return {
        ...state, updatedAt: now, shareToken: action.token,
        activityLog: appendLog(state.activityLog, 'share_link_generated', 'Patient plan link generated', action.actor),
      };

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

// ── Session Store ──
// Server-side: Airtable-backed via session-store.ts (persists across
// Vercel serverless invocations). Client-side: localStorage.
// In-memory Map used as read cache within a single invocation.

const sessions = new Map<string, MastermindSession>();

/**
 * Get session by ID.
 * Sync version — checks memory + localStorage only.
 * For server-side Airtable reads, use getSessionByIdAsync.
 */
export function getSessionById(id: string): MastermindSession | null {
  // Check memory
  if (sessions.has(id)) return sessions.get(id)!;

  // Client-side: try localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`mastermind_session_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const session = hydrateSession(parsed);
        sessions.set(id, session);
        return session;
      }
    } catch {
      try { localStorage.removeItem(`mastermind_session_${id}`); } catch { /* noop */ }
    }
  }

  return null;
}

/**
 * Get session by ID — async version with Airtable fallback.
 * Use this in API routes for persistent cross-invocation reads.
 */
export async function getSessionByIdAsync(id: string): Promise<MastermindSession | null> {
  // Check memory first
  const memSession = getSessionById(id);
  if (memSession) return memSession;

  // Server-side: try Airtable
  if (typeof window === 'undefined') {
    try {
      const { getSessionFromAirtable } = await import('./session-store');
      const atSession = await getSessionFromAirtable(id);
      if (atSession) {
        const hydrated = hydrateSession(atSession as unknown as Record<string, unknown>);
        sessions.set(id, hydrated);
        return hydrated;
      }
    } catch (err) {
      console.warn('[Session] Airtable read failed:', err);
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
    clinicStatus: isValidClinicStatus(parsed.clinicStatus) ? parsed.clinicStatus : undefined,
    clinicNotes: typeof parsed.clinicNotes === 'string' ? parsed.clinicNotes : undefined,
    shareToken: typeof parsed.shareToken === 'string' ? parsed.shareToken : undefined,
    activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog as ActivityLogEntry[] : undefined,
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

const VALID_CLINIC_STATUSES: ClinicStatus[] = ['new', 'reviewed', 'contacted', 'booked', 'no_response', 'closed'];

function isValidClinicStatus(val: unknown): val is ClinicStatus {
  return typeof val === 'string' && VALID_CLINIC_STATUSES.includes(val as ClinicStatus);
}

export function saveSession(session: MastermindSession): void {
  sessions.set(session.id, session);

  // Server-side: persist to Airtable (fire-and-forget)
  if (typeof window === 'undefined') {
    import('./session-store').then(({ saveSessionToAirtable }) => {
      saveSessionToAirtable(session).catch((err) => {
        console.error(`[Session] Airtable fire-and-forget save failed for ${session.id}:`, err);
      });
    }).catch((err) => {
      console.error('[Session] session-store import failed:', err);
    });
  }

  // Client-side: persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        `mastermind_session_${session.id}`,
        JSON.stringify(session)
      );
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

/**
 * Async save — waits for Airtable write to complete.
 * Use in API routes where persistence must be confirmed.
 */
export async function saveSessionAsync(session: MastermindSession): Promise<void> {
  sessions.set(session.id, session);

  if (typeof window === 'undefined') {
    try {
      const { saveSessionToAirtable } = await import('./session-store');
      await saveSessionToAirtable(session);
    } catch (err) {
      // Log as error — if this fails, session only exists in memory
      // and will be lost on Vercel cold start
      console.error(
        `[Session] CRITICAL: Airtable save failed for session ${session.id} (phase: ${session.phase}, patient: ${session.patientName || 'unknown'})`,
        err
      );
    }
  }
}

export function getAllSessions(): MastermindSession[] {
  // Sync version — returns cached sessions only
  if (typeof window !== 'undefined') {
    try {
      const index = getSessionIndex();
      return index
        .map((id) => getSessionById(id))
        .filter((s): s is MastermindSession => s !== null)
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0));
    } catch { /* fall through */ }
  }
  return Array.from(sessions.values()).sort(
    (a, b) => (b.updatedAt > a.updatedAt ? 1 : b.updatedAt < a.updatedAt ? -1 : 0)
  );
}

/**
 * Async version — fetches from Airtable for server-side routes.
 */
export async function getAllSessionsAsync(): Promise<MastermindSession[]> {
  if (typeof window === 'undefined') {
    try {
      const { getAllSessionsFromAirtable } = await import('./session-store');
      const atSessions = await getAllSessionsFromAirtable();
      console.log(`[Session] getAllSessionsAsync: ${atSessions.length} from Airtable, ${sessions.size} in memory`);
      // Rehydrate in-memory cache from Airtable results
      for (const s of atSessions) {
        if (!sessions.has(s.id)) sessions.set(s.id, s);
      }
      // Return Airtable results (authoritative) merged with any memory-only sessions
      const merged = new Map<string, MastermindSession>();
      for (const s of atSessions) merged.set(s.id, s);
      for (const [id, s] of sessions) { if (!merged.has(id)) merged.set(id, s); }
      return Array.from(merged.values());
    } catch (err) {
      console.error('[Session] getAllSessionsAsync Airtable failed, falling back to memory:', err);
    }
  }
  return getAllSessions();
}

export function deleteSession(id: string): void {
  sessions.delete(id);

  if (typeof window === 'undefined') {
    import('./session-store').then(({ deleteSessionFromAirtable }) => {
      deleteSessionFromAirtable(id).catch(() => {});
    }).catch(() => {});
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`mastermind_session_${id}`);
      const index = getSessionIndex().filter((sid) => sid !== id);
      localStorage.setItem('mastermind_sessions', JSON.stringify(index));
    } catch { /* Ignore */ }
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
