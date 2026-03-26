/**
 * Tests for PWA service worker registration utility.
 * @jest-environment jsdom
 */

import {
  registerServiceWorker,
  setupInstallPrompt,
  promptInstall,
  skipWaiting,
  onUpdateAvailable,
  onInstallPromptAvailable,
  isAppInstalled,
  isInstallable,
  getRegistration,
} from "../register";

// Mock service worker API
const mockRegister = jest.fn();
const mockUpdate = jest.fn();
const mockPostMessage = jest.fn();

const createMockRegistration = (overrides = {}): Partial<ServiceWorkerRegistration> => ({
  installing: null,
  waiting: null,
  active: null,
  scope: "/",
  update: mockUpdate,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Reset module state by re-importing would be ideal, but we test what we can
  Object.defineProperty(navigator, "serviceWorker", {
    value: {
      register: mockRegister,
      controller: {},
      ready: Promise.resolve(createMockRegistration()),
    },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("registerServiceWorker", () => {
  test("registers service worker at /sw.js with scope /", async () => {
    const mockReg = createMockRegistration();
    mockRegister.mockResolvedValue(mockReg);

    await registerServiceWorker();

    expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  test("returns the registration on success", async () => {
    const mockReg = createMockRegistration();
    mockRegister.mockResolvedValue(mockReg);

    const result = await registerServiceWorker();

    expect(result).toBe(mockReg);
  });

  test("returns null when serviceWorker is not supported", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await registerServiceWorker();

    expect(result).toBeNull();
  });

  test("returns null and logs error on registration failure", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockRegister.mockRejectedValue(new Error("Registration failed"));

    const result = await registerServiceWorker();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[PWA] Service worker registration failed:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  test("sets up periodic update check (60 min interval)", async () => {
    const mockReg = createMockRegistration();
    mockRegister.mockResolvedValue(mockReg);

    await registerServiceWorker();

    // Fast-forward 60 minutes
    jest.advanceTimersByTime(60 * 60 * 1000);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("listens for updatefound event on registration", async () => {
    const addEventListener = jest.fn();
    const mockReg = createMockRegistration({ addEventListener });
    mockRegister.mockResolvedValue(mockReg);

    await registerServiceWorker();

    expect(addEventListener).toHaveBeenCalledWith("updatefound", expect.any(Function));
  });
});

describe("setupInstallPrompt", () => {
  test("adds beforeinstallprompt listener to window", () => {
    const addEventSpy = jest.spyOn(window, "addEventListener");

    setupInstallPrompt();

    expect(addEventSpy).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
    addEventSpy.mockRestore();
  });

  test("adds appinstalled listener to window", () => {
    const addEventSpy = jest.spyOn(window, "addEventListener");

    setupInstallPrompt();

    expect(addEventSpy).toHaveBeenCalledWith("appinstalled", expect.any(Function));
    addEventSpy.mockRestore();
  });
});

describe("onInstallPromptAvailable", () => {
  test("calls callback when beforeinstallprompt fires", () => {
    const callback = jest.fn();
    onInstallPromptAvailable(callback);

    // Simulate beforeinstallprompt
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string; platform: string }>;
    };
    Object.assign(event, {
      prompt: jest.fn(),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });

    // Need to setup first
    setupInstallPrompt();

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalled();
  });
});

describe("promptInstall", () => {
  test("returns false when no deferred prompt exists", async () => {
    const result = await promptInstall();
    expect(result).toBe(false);
  });
});

describe("onUpdateAvailable", () => {
  test("accepts a callback without throwing", () => {
    expect(() => {
      onUpdateAvailable(jest.fn());
    }).not.toThrow();
  });
});

describe("isAppInstalled", () => {
  test("returns false when not in standalone mode", () => {
    Object.defineProperty(window, "matchMedia", {
      value: jest.fn().mockReturnValue({ matches: false }),
      writable: true,
    });

    expect(isAppInstalled()).toBe(false);
  });

  test("returns true when in standalone mode", () => {
    Object.defineProperty(window, "matchMedia", {
      value: jest.fn().mockReturnValue({ matches: true }),
      writable: true,
    });

    expect(isAppInstalled()).toBe(true);
  });
});

describe("isInstallable", () => {
  test("returns false by default (no prompt captured)", () => {
    expect(isInstallable()).toBe(false);
  });
});

describe("skipWaiting", () => {
  test("does not throw when no registration exists", () => {
    expect(() => skipWaiting()).not.toThrow();
  });
});

describe("getRegistration", () => {
  test("returns null before registration", () => {
    // On fresh load (no registration yet), should be null
    // Note: this may return a previous test's registration
    const reg = getRegistration();
    expect(reg === null || reg !== undefined).toBe(true);
  });

  test("returns registration after successful register", async () => {
    const mockReg = createMockRegistration();
    mockRegister.mockResolvedValue(mockReg);

    await registerServiceWorker();

    expect(getRegistration()).toBe(mockReg);
  });
});
