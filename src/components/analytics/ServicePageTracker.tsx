"use client";

import { useServicePageTracking } from "@/lib/analytics/hooks";

/** Drop-in client component that fires service_page_view on mount. */
export default function ServicePageTracker({
  serviceName,
  serviceCategory,
}: {
  serviceName: string;
  serviceCategory?: string;
}) {
  useServicePageTracking(serviceName, serviceCategory);
  return null;
}
