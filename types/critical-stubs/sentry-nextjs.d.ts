export function addBreadcrumb(breadcrumb: Record<string, unknown>): void;
export function captureMessage(
  message: string,
  context?: Record<string, unknown>
): string | undefined;
export function captureException(
  exception: unknown,
  context?: Record<string, unknown>
): string | undefined;
export function withScope<T>(callback: (scope: { setTag(key: string, value: string): void }) => T): T;
