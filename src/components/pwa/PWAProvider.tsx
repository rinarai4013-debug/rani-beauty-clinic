"use client";

import { useEffect } from "react";
import { registerServiceWorker, setupInstallPrompt } from "@/lib/pwa/register";
import InstallPrompt from "./InstallPrompt";
import OfflineBanner from "./OfflineBanner";
import UpdatePrompt from "./UpdatePrompt";

export default function PWAProvider() {
  useEffect(() => {
    registerServiceWorker();
    setupInstallPrompt();
  }, []);

  return (
    <>
      <OfflineBanner />
      <UpdatePrompt />
      <InstallPrompt />
    </>
  );
}
