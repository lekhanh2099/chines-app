"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export function PwaServiceWorkerRegister() {
 useEffect(() => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
   return;
  }

  // Only register on secure origin or localhost
  const isLocalhost =
   window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname.endsWith(".localhost");

  if (window.location.protocol !== "https:" && !isLocalhost) {
   return;
  }

  const handleLoad = () => {
   navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((registration) => {
     registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener("statechange", () => {
       if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
        logger.info("[PWA] New version available in background.");
       }
      });
     });
    })
    .catch((error: unknown) => {
     logger.error("[PWA] Service worker registration failed:", error);
    });
  };

  if (document.readyState === "complete") {
   handleLoad();
  } else {
   window.addEventListener("load", handleLoad);
   return () => window.removeEventListener("load", handleLoad);
  }
 }, []);

 return null;
}
