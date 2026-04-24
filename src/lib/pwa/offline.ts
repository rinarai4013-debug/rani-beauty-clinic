"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * React hook that tracks online/offline status.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: number;
}

const QUEUE_KEY = "rani-pwa-request-queue";

function getQueue(): QueuedRequest[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedRequest[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Queue a failed request for retry when back online.
 */
export function queueRequest(
  url: string,
  options: RequestInit = {}
): void {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    method: options.method || "POST",
    headers: (options.headers as Record<string, string>) || {},
    body: typeof options.body === "string" ? options.body : null,
    timestamp: Date.now(),
  });
  saveQueue(queue);

  // Also try registering a background sync
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((reg) => {
      (reg as ServiceWorkerRegistration & { sync: { register: (_tag: string) => Promise<void> } }).sync
        .register("rani-form-sync")
        .catch(() => {
          // Background sync not available, will use online listener
        });
    });
  }
}

/**
 * Replay all queued requests. Returns count of successfully replayed.
 */
export async function replayQueuedRequests(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let replayed = 0;
  const remaining: QueuedRequest[] = [];

  for (const req of queue) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      if (response.ok) {
        replayed++;
      } else {
        remaining.push(req);
      }
    } catch {
      remaining.push(req);
    }
  }

  saveQueue(remaining);
  return replayed;
}

/**
 * Get count of queued requests.
 */
export function getQueuedRequestCount(): number {
  return getQueue().length;
}

/**
 * Clear all queued requests.
 */
export function clearRequestQueue(): void {
  saveQueue([]);
}

/**
 * Hook that automatically replays queued requests when coming back online.
 */
export function useOfflineSync(): {
  isOnline: boolean;
  queuedCount: number;
  replay: () => Promise<number>;
} {
  const isOnline = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const hasReplayed = useRef(false);

  useEffect(() => {
    setQueuedCount(getQueuedRequestCount());
  }, []);

  const replay = useCallback(async () => {
    const count = await replayQueuedRequests();
    setQueuedCount(getQueuedRequestCount());
    return count;
  }, []);

  // Auto-replay when coming back online
  useEffect(() => {
    if (isOnline && queuedCount > 0 && !hasReplayed.current) {
      hasReplayed.current = true;
      replay().then(() => {
        hasReplayed.current = false;
      });
    }
  }, [isOnline, queuedCount, replay]);

  return { isOnline, queuedCount, replay };
}
