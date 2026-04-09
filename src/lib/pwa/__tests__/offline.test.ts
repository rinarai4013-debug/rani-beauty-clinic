/**
 * Tests for PWA offline detection and request queuing.
 * @vitest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import {
  useOnlineStatus,
  queueRequest,
  replayQueuedRequests,
  getQueuedRequestCount,
  clearRequestQueue,
  useOfflineSync,
} from "../offline";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();

  // Default: online
  Object.defineProperty(navigator, "onLine", {
    value: true,
    writable: true,
    configurable: true,
  });
});

describe("useOnlineStatus", () => {
  test("returns true when navigator.onLine is true", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  test("returns false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  test("updates to false when offline event fires", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });

  test("updates to true when online event fires", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });

    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  test("cleans up event listeners on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe("queueRequest", () => {
  test("adds a request to the queue", () => {
    queueRequest("/api/contact", { method: "POST", body: '{"name":"test"}' });

    expect(getQueuedRequestCount()).toBe(1);
  });

  test("queues multiple requests", () => {
    queueRequest("/api/contact", { method: "POST", body: '{"a":1}' });
    queueRequest("/api/waitlist", { method: "POST", body: '{"b":2}' });

    expect(getQueuedRequestCount()).toBe(2);
  });

  test("stores request URL and method", () => {
    queueRequest("/api/test", { method: "PUT", body: '{"data":true}' });

    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored[0].url).toBe("/api/test");
    expect(stored[0].method).toBe("PUT");
  });

  test("defaults method to POST when not provided", () => {
    queueRequest("/api/test");

    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored[0].method).toBe("POST");
  });

  test("stores body as string", () => {
    const body = JSON.stringify({ email: "test@example.com" });
    queueRequest("/api/waitlist", { body });

    const stored = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(stored[0].body).toBe(body);
  });
});

describe("replayQueuedRequests", () => {
  test("returns 0 when queue is empty", async () => {
    const count = await replayQueuedRequests();
    expect(count).toBe(0);
  });

  test("replays queued requests via fetch", async () => {
    queueRequest("/api/test", { method: "POST", body: '{"a":1}' });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const count = await replayQueuedRequests();

    expect(count).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      body: '{"a":1}',
    }));
  });

  test("keeps failed requests in queue", async () => {
    queueRequest("/api/test1", { method: "POST", body: "{}" });
    queueRequest("/api/test2", { method: "POST", body: "{}" });

    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("Network error"));

    const count = await replayQueuedRequests();

    expect(count).toBe(1);
    expect(getQueuedRequestCount()).toBe(1);
  });

  test("keeps requests that return non-ok response", async () => {
    queueRequest("/api/test", { method: "POST", body: "{}" });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const count = await replayQueuedRequests();

    expect(count).toBe(0);
    expect(getQueuedRequestCount()).toBe(1);
  });
});

describe("clearRequestQueue", () => {
  test("clears all queued requests", () => {
    queueRequest("/api/a", { body: "{}" });
    queueRequest("/api/b", { body: "{}" });

    clearRequestQueue();

    expect(getQueuedRequestCount()).toBe(0);
  });
});

describe("getQueuedRequestCount", () => {
  test("returns 0 for empty queue", () => {
    expect(getQueuedRequestCount()).toBe(0);
  });

  test("returns correct count after queuing", () => {
    queueRequest("/api/a");
    queueRequest("/api/b");
    queueRequest("/api/c");

    expect(getQueuedRequestCount()).toBe(3);
  });
});

describe("useOfflineSync", () => {
  test("returns online status", () => {
    const { result } = renderHook(() => useOfflineSync());
    expect(result.current.isOnline).toBe(true);
  });

  test("returns queued count", () => {
    queueRequest("/api/test");
    const { result } = renderHook(() => useOfflineSync());
    // Count is loaded async in useEffect
    expect(typeof result.current.queuedCount).toBe("number");
  });

  test("provides replay function", () => {
    const { result } = renderHook(() => useOfflineSync());
    expect(typeof result.current.replay).toBe("function");
  });

  test("replay function returns a number", async () => {
    const { result } = renderHook(() => useOfflineSync());

    let count: number = 0;
    await act(async () => {
      count = await result.current.replay();
    });

    expect(typeof count).toBe("number");
  });
});
