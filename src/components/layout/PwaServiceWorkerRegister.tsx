"use client";

import { useEffect } from "react";
import { useClientSession } from "@/components/providers/QueryProvider";
import { logger } from "@/lib/logger";

export function PwaServiceWorkerRegister() {
 const { isResolved, userId } = useClientSession();

 useEffect(() => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
   return;
  }

  // Only register on secure origin or localhost
  const isLocalhost =
   window.location.hostname === "localhost" ||
   window.location.hostname === "127.0.0.1" ||
   window.location.hostname.endsWith(".localhost");

  const isSecure =
   window.location.protocol === "https:" || isLocalhost || Boolean(window.isSecureContext);

  if (!isSecure) {
   return;
  }

  const sendWarmup = (controller: ServiceWorker) => {
   controller.postMessage({
    type: "WARMUP_OFFLINE_CACHE",
    routes: [
     window.location.pathname,
     "/vi/hanzihome",
     "/vi/hsk/han-thuong-mai",
     "/vi/hsk/nhip-cau-han-ngu",
     "/vi/hsk/doc-hieu",
    ],
   });
  };

  const handleLoad = () => {
   navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then((registration) => {
     if (navigator.serviceWorker.controller) {
      sendWarmup(navigator.serviceWorker.controller);
     }

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

  const handleControllerChange = () => {
   if (navigator.serviceWorker.controller) {
    sendWarmup(navigator.serviceWorker.controller);
   }
  };

  navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

  if (document.readyState === "complete") {
   handleLoad();
   return () => {
    navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
   };
  }

  window.addEventListener("load", handleLoad);
  return () => {
   window.removeEventListener("load", handleLoad);
   navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  };
 }, []);

 useEffect(() => {
  if (!isResolved || typeof window === "undefined" || !("serviceWorker" in navigator)) {
   return;
  }

  let active = true;
  const sendOwner = (worker: ServiceWorker | null) => {
   if (!active || !worker) return;
   worker.postMessage({ type: "SET_OFFLINE_OWNER", ownerId: userId });
  };
  const handleControllerChange = () => sendOwner(navigator.serviceWorker.controller);

  sendOwner(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
  void navigator.serviceWorker.ready
   .then((registration) => sendOwner(registration.active))
   .catch(() => {});

  return () => {
   active = false;
   navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
  };
 }, [isResolved, userId]);

 return null;
}
