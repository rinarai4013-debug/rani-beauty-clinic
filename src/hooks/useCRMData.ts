'use client';

/**
 * SWR Hooks for CRM Data
 *
 * Pre-configured hooks for pipeline, lifecycle, segments, automations, tasks, notes.
 * Built on the existing useDashboardData pattern.
 */

import { useDashboardData } from './useDashboardData';
import type {
  CRMOverviewData,
  CRMKanbanData,
  CRM360Data,
  PipelineMetrics,
  PipelineLead,
  PipelineForecast,
  LifecycleMetrics,
  ClientLifecycle,
  SegmentMetrics,
  ClientSegment,
  CustomSegment,
  AutomationRecipe,
  AutomationMetrics,
  AutomationExecution,
  TaskMetrics,
  CRMTask,
  TaskDigest,
  CRMNote,
  ClientTimeline,
} from '@/types/crm';

// ─────────────────────────────────────────────────────────────
// CRM OVERVIEW
// ─────────────────────────────────────────────────────────────

/** Full CRM overview data (pipeline + lifecycle + segments + automations + tasks) */
export function useCRMOverview() {
  return useDashboardData<CRMOverviewData>('/crm/overview', {
    refreshInterval: 60000,
  });
}

// ─────────────────────────────────────────────────────────────
// PIPELINE HOOKS
// ─────────────────────────────────────────────────────────────

/** Pipeline kanban data with leads grouped by stage */
export function usePipelineKanban() {
  return useDashboardData<CRMKanbanData>('/crm/pipeline', {
    refreshInterval: 30000,
  });
}

/** Pipeline metrics (conversion rates, velocity, forecasts) */
export function usePipelineMetrics() {
  return useDashboardData<PipelineMetrics>('/crm/pipeline/metrics', {
    refreshInterval: 60000,
  });
}

/** Pipeline forecasts */
export function usePipelineForecasts() {
  return useDashboardData<PipelineForecast[]>('/crm/pipeline/forecasts', {
    refreshInterval: 300000,
  });
}

/** Single pipeline lead */
export function usePipelineLead(leadId: string | null) {
  return useDashboardData<PipelineLead>(
    leadId ? `/crm/pipeline/leads/${leadId}` : null,
    { refreshInterval: 30000 },
  );
}

/** Stale leads */
export function useStaleLeads() {
  return useDashboardData<PipelineLead[]>('/crm/pipeline/stale', {
    refreshInterval: 120000,
  });
}

// ─────────────────────────────────────────────────────────────
// LIFECYCLE HOOKS
// ─────────────────────────────────────────────────────────────

/** Lifecycle metrics for all clients */
export function useLifecycleMetrics() {
  return useDashboardData<LifecycleMetrics>('/crm/lifecycle', {
    refreshInterval: 120000,
  });
}

/** Single client lifecycle data */
export function useClientLifecycle(clientId: string | null) {
  return useDashboardData<ClientLifecycle>(
    clientId ? `/crm/lifecycle/${clientId}` : null,
    { refreshInterval: 60000 },
  );
}

// ─────────────────────────────────────────────────────────────
// SEGMENT HOOKS
// ─────────────────────────────────────────────────────────────

/** Segment analysis with RFM matrix */
export function useSegmentAnalysis() {
  return useDashboardData<SegmentMetrics>('/crm/segments', {
    refreshInterval: 300000,
  });
}

/** Client segments list */
export function useClientSegments() {
  return useDashboardData<ClientSegment[]>('/crm/segments/clients', {
    refreshInterval: 300000,
  });
}

/** Single client segment */
export function useClientSegment(clientId: string | null) {
  return useDashboardData<ClientSegment>(
    clientId ? `/crm/segments/clients/${clientId}` : null,
    { refreshInterval: 60000 },
  );
}

/** Custom segments */
export function useCustomSegments() {
  return useDashboardData<CustomSegment[]>('/crm/segments/custom', {
    refreshInterval: 300000,
  });
}

// ─────────────────────────────────────────────────────────────
// AUTOMATION HOOKS
// ─────────────────────────────────────────────────────────────

/** All automations with metrics */
export function useAutomations() {
  return useDashboardData<{ automations: AutomationRecipe[]; metrics: AutomationMetrics }>('/crm/automations', {
    refreshInterval: 60000,
  });
}

/** Automation execution history */
export function useAutomationExecutions(automationId?: string) {
  const endpoint = automationId
    ? `/crm/automations/${automationId}/executions`
    : '/crm/automations/executions';
  return useDashboardData<AutomationExecution[]>(endpoint, {
    refreshInterval: 30000,
  });
}

// ─────────────────────────────────────────────────────────────
// TASK HOOKS
// ─────────────────────────────────────────────────────────────

/** Task board with metrics */
export function useCRMTasks(filter?: string) {
  const endpoint = filter ? `/crm/tasks?${filter}` : '/crm/tasks';
  return useDashboardData<{ tasks: CRMTask[]; metrics: TaskMetrics }>(endpoint, {
    refreshInterval: 30000,
  });
}

/** Daily task digest for a team member */
export function useTaskDigest(teamMember: string) {
  return useDashboardData<TaskDigest>(
    `/crm/tasks/digest?member=${encodeURIComponent(teamMember)}`,
    { refreshInterval: 60000 },
  );
}

/** Overdue tasks */
export function useOverdueTasks() {
  return useDashboardData<CRMTask[]>('/crm/tasks/overdue', {
    refreshInterval: 30000,
  });
}

// ─────────────────────────────────────────────────────────────
// NOTES / ACTIVITY HOOKS
// ─────────────────────────────────────────────────────────────

/** Recent activity notes */
export function useCRMNotes(clientId?: string) {
  const endpoint = clientId
    ? `/crm/notes?clientId=${clientId}`
    : '/crm/notes';
  return useDashboardData<CRMNote[]>(endpoint, {
    refreshInterval: 30000,
  });
}

/** Client timeline */
export function useClientTimeline(clientId: string | null) {
  return useDashboardData<ClientTimeline>(
    clientId ? `/crm/notes/timeline/${clientId}` : null,
    { refreshInterval: 30000 },
  );
}

// ─────────────────────────────────────────────────────────────
// 360-DEGREE CLIENT VIEW
// ─────────────────────────────────────────────────────────────

/** Complete 360-degree client CRM view */
export function useCRM360(clientId: string | null) {
  return useDashboardData<CRM360Data>(
    clientId ? `/crm/clients/${clientId}/360` : null,
    { refreshInterval: 60000 },
  );
}
