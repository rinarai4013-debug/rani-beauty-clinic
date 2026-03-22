'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type {
  BuilderState,
  BuilderAction,
  SelectedService,
  PlanPhase,
  GeneratedPackage,
} from '@/lib/plan-builder/types';
import { PHASE_LABELS } from '@/lib/plan-builder/types';
import { generatePackages } from '@/lib/plan-builder/package-generator';
import type { UnifiedService } from '@/data/services/unified-catalog';

function createPhase(id: 1 | 2 | 3): PlanPhase {
  return {
    id,
    label: PHASE_LABELS[id].label,
    description: PHASE_LABELS[id].description,
    services: [],
  };
}

const initialState: BuilderState = {
  client: null,
  planName: '',
  phases: [createPhase(1), createPhase(2), createPhase(3)],
  searchQuery: '',
  activeCategory: 'all',
  packages: [],
  isDirty: false,
  savedPlanId: null,
};

let instanceCounter = 0;

function reducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_CLIENT':
      return { ...state, client: action.client, isDirty: true };

    case 'SET_PLAN_NAME':
      return { ...state, planName: action.name, isDirty: true };

    case 'ADD_SERVICE': {
      const newService: SelectedService = {
        id: `svc-${++instanceCounter}-${Date.now()}`,
        serviceId: action.serviceId,
        service: action.service,
        quantity: 1,
        notes: '',
        phase: action.phase,
      };
      const phases = [...state.phases] as [PlanPhase, PlanPhase, PlanPhase];
      phases[action.phase - 1] = {
        ...phases[action.phase - 1],
        services: [...phases[action.phase - 1].services, newService],
      };
      return { ...state, phases, isDirty: true };
    }

    case 'REMOVE_SERVICE': {
      const phases = state.phases.map((phase) => ({
        ...phase,
        services: phase.services.filter((s) => s.id !== action.instanceId),
      })) as [PlanPhase, PlanPhase, PlanPhase];
      return { ...state, phases, isDirty: true };
    }

    case 'SET_QUANTITY': {
      const phases = state.phases.map((phase) => ({
        ...phase,
        services: phase.services.map((s) =>
          s.id === action.instanceId
            ? { ...s, quantity: Math.max(1, Math.min(10, action.quantity)) }
            : s
        ),
      })) as [PlanPhase, PlanPhase, PlanPhase];
      return { ...state, phases, isDirty: true };
    }

    case 'SET_NOTES': {
      const phases = state.phases.map((phase) => ({
        ...phase,
        services: phase.services.map((s) =>
          s.id === action.instanceId ? { ...s, notes: action.notes } : s
        ),
      })) as [PlanPhase, PlanPhase, PlanPhase];
      return { ...state, phases, isDirty: true };
    }

    case 'MOVE_TO_PHASE': {
      let movedService: SelectedService | null = null;
      const phasesWithout = state.phases.map((phase) => ({
        ...phase,
        services: phase.services.filter((s) => {
          if (s.id === action.instanceId) {
            movedService = { ...s, phase: action.phase };
            return false;
          }
          return true;
        }),
      })) as [PlanPhase, PlanPhase, PlanPhase];

      if (movedService) {
        phasesWithout[action.phase - 1] = {
          ...phasesWithout[action.phase - 1],
          services: [...phasesWithout[action.phase - 1].services, movedService],
        };
      }
      return { ...state, phases: phasesWithout, isDirty: true };
    }

    case 'REORDER': {
      const phaseIdx = action.phase - 1;
      const services = [...state.phases[phaseIdx].services];
      const [moved] = services.splice(action.fromIndex, 1);
      services.splice(action.toIndex, 0, moved);
      const phases = [...state.phases] as [PlanPhase, PlanPhase, PlanPhase];
      phases[phaseIdx] = { ...phases[phaseIdx], services };
      return { ...state, phases, isDirty: true };
    }

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };

    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.category };

    case 'SET_PACKAGES':
      return { ...state, packages: action.packages };

    case 'MARK_SAVED':
      return { ...state, isDirty: false, savedPlanId: action.planId };

    case 'CLEAR':
      return { ...initialState };

    default:
      return state;
  }
}

export function usePlanBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addService = useCallback(
    (serviceId: string, service: UnifiedService, phase: 1 | 2 | 3 = 1) => {
      dispatch({ type: 'ADD_SERVICE', serviceId, service, phase });
    },
    []
  );

  const removeService = useCallback((instanceId: string) => {
    dispatch({ type: 'REMOVE_SERVICE', instanceId });
  }, []);

  const setQuantity = useCallback((instanceId: string, quantity: number) => {
    dispatch({ type: 'SET_QUANTITY', instanceId, quantity });
  }, []);

  const setNotes = useCallback((instanceId: string, notes: string) => {
    dispatch({ type: 'SET_NOTES', instanceId, notes });
  }, []);

  const moveToPhase = useCallback((instanceId: string, phase: 1 | 2 | 3) => {
    dispatch({ type: 'MOVE_TO_PHASE', instanceId, phase });
  }, []);

  const packages = useMemo(() => generatePackages(state.phases), [state.phases]);

  const totalServices = useMemo(
    () => state.phases.reduce((sum, p) => sum + p.services.length, 0),
    [state.phases]
  );

  const totalValue = useMemo(
    () =>
      state.phases.reduce(
        (sum, p) =>
          sum +
          p.services.reduce(
            (s, svc) => s + svc.service.price * svc.quantity * svc.service.sessions,
            0
          ),
        0
      ),
    [state.phases]
  );

  return {
    state,
    dispatch,
    addService,
    removeService,
    setQuantity,
    setNotes,
    moveToPhase,
    packages,
    totalServices,
    totalValue,
  };
}
