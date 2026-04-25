import useSWR from 'swr';

export type SmokeCheckResult = {
  name: string;
  ok: boolean;
  status?: 'Pass' | 'Fail' | 'Partial';
  durationMs: number;
  detail?: string;
  spec?: string;
};

export type SmokeTestRun = {
  success: boolean;
  run: {
    id: string;
    runId?: unknown;
    status?: string;
    timestamp?: string;
    durationMs?: number;
    triggeredBy?: string;
    checks: SmokeCheckResult[];
  } | null;
  checks?: SmokeCheckResult[];
};

const smokeTestFetcher = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || 'Failed to load smoke test status');
  }

  return (await response.json()) as SmokeTestRun;
};

export function useSmokeTest() {
  const { data, error, isLoading, mutate } = useSWR<SmokeTestRun>('/api/dashboard/smoke-test', smokeTestFetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30000,
    dedupingInterval: 15000,
  });

  return {
    data,
    isLoading,
    error,
    mutate,
  };
}
