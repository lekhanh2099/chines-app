"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

declare global {
 interface Window {
  documentPictureInPicture?: {
   requestWindow(options?: {
    width?: number;
    height?: number;
    disallowReturnToOpener?: boolean;
   }): Promise<Window>;
   readonly window: Window | null;
   addEventListener(type: string, listener: (ev: Event) => void): void;
   removeEventListener(type: string, listener: (ev: Event) => void): void;
  };
 }
}

export function isDocumentPipSupported(): boolean {
 return (
  typeof window !== "undefined" &&
  typeof window.documentPictureInPicture?.requestWindow === "function"
 );
}

export function syncDocumentStylesToPipWindow(targetDoc: Document): void {
 const styleElements = document.querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
  "style, link[rel='stylesheet']",
 );
 for (const element of styleElements) {
  targetDoc.head.appendChild(element.cloneNode(true));
 }
 targetDoc.documentElement.className = document.documentElement.className;
 for (const key in document.documentElement.dataset) {
  const value = document.documentElement.dataset[key];
  if (typeof value === "string") {
   targetDoc.documentElement.dataset[key] = value;
  }
 }
}

export type UseDocumentPipReturn = {
 readonly isSupported: boolean;
 readonly isOpen: boolean;
 readonly pipWindow: Window | null;
 readonly openPip: (options?: { width?: number; height?: number }) => Promise<Window | null>;
 readonly closePip: () => void;
};

function emptySubscribe() {
 return () => {};
}

export function useDocumentPip(): UseDocumentPipReturn {
 const [isOpen, setIsOpen] = useState(false);
 const [pipWindow, setPipWindow] = useState<Window | null>(null);
 const pipWindowRef = useRef<Window | null>(null);
 const isSupported = useSyncExternalStore(emptySubscribe, isDocumentPipSupported, () => false);

 const closePip = useCallback(() => {
  const current = pipWindowRef.current;
  if (current) {
   current.close();
   pipWindowRef.current = null;
  }
  setPipWindow(null);
  setIsOpen(false);
 }, []);

 const openPip = useCallback(
  async (options?: { width?: number; height?: number }): Promise<Window | null> => {
   if (!isDocumentPipSupported() || !window.documentPictureInPicture) {
    return null;
   }

   try {
    const win = await window.documentPictureInPicture.requestWindow({
     width: options?.width ?? 380,
     height: options?.height ?? 260,
     disallowReturnToOpener: false,
    });

    syncDocumentStylesToPipWindow(win.document);

    const handlePageHide = () => {
     pipWindowRef.current = null;
     setPipWindow(null);
     setIsOpen(false);
    };

    win.addEventListener("pagehide", handlePageHide);

    pipWindowRef.current = win;
    setPipWindow(win);
    setIsOpen(true);
    return win;
   } catch {
    return null;
   }
  },
  [],
 );

 useEffect(() => {
  return () => {
   const current = pipWindowRef.current;
   if (current) {
    current.close();
    pipWindowRef.current = null;
   }
  };
 }, []);

 return {
  isSupported,
  isOpen,
  pipWindow,
  openPip,
  closePip,
 };
}
