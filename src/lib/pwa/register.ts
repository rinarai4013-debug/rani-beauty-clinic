"use client";

type UpdateCallback = (registration: ServiceWorkerRegistration) => void;
type InstallCallback = (event: BeforeInstallPromptEvent) => void;

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let updateCallback: UpdateCallback | null = null;
let installCallback: InstallCallback | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker and set up update + install listeners.
 * Call once on app mount.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    swRegistration = registration;

    // Check for updates periodically (every 60 minutes)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listen for new service worker installing
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // New SW is ready - notify the app
          updateCallback?.(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("[PWA] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Listen for the `beforeinstallprompt` event (install prompt intercept).
 */
export function setupInstallPrompt(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    installCallback?.(deferredPrompt);
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });
}

/**
 * Trigger the install prompt.
 * Returns true if the user accepted.
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;

  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted";
}

/**
 * Skip waiting on the new service worker to activate it immediately.
 */
export function skipWaiting(): void {
  swRegistration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  window.location.reload();
}

/**
 * Register a callback for when a new SW update is available.
 */
export function onUpdateAvailable(callback: UpdateCallback): void {
  updateCallback = callback;
}

/**
 * Register a callback for when the install prompt is available.
 */
export function onInstallPromptAvailable(callback: InstallCallback): void {
  installCallback = callback;
  // If prompt was already captured, fire immediately
  if (deferredPrompt) callback(deferredPrompt);
}

/**
 * Check if the app is currently installed (standalone mode).
 */
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if install prompt is available.
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Get the current service worker registration.
 */
export function getRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}
