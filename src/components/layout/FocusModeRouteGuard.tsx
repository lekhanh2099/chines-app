"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { focusModeStore, isFocusNavigationAllowed } from "@/stores/focus-mode-store";
import { noteTabsStore } from "@/stores/note-tabs-store";

function getOpenNoteIds() {
 return noteTabsStore.get().tabs.map((tab) => tab.noteId);
}

function warnFocusBlocked(message: string) {
 toast.warning(message, { duration: 4200 });
}

export function FocusModeRouteGuard() {
 const t = useTranslations("Shell");
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { hydrate: hydrateFocusMode } = focusModeStore.actions;
 const currentHrefRef = useRef({ initialized: false, href: "" });
 const focusModeWarning = t("header.focusModeWarning");

 useEffect(() => {
  hydrateFocusMode();
 }, [hydrateFocusMode]);

 useEffect(() => {
  if (!focusModeEnabled || typeof window === "undefined") return;

  currentHrefRef.current = { initialized: true, href: window.location.href };
  window.history.pushState(
   { ...(window.history.state ?? {}), hanzihomeFocusMode: true },
   "",
   window.location.href,
  );
 }, [focusModeEnabled, pathname, searchParamsString]);

 useEffect(() => {
  if (!focusModeEnabled || typeof window === "undefined") return;

  const handleClick = (event: MouseEvent) => {
   if (event.defaultPrevented || event.button !== 0) return;

   const target = event.target;
   if (!(target instanceof Element)) return;

   const anchor = target.closest<HTMLAnchorElement>("a[href]");
   if (!anchor || anchor.hasAttribute("download")) return;

   const currentHref = window.location.href;
   const targetHref = anchor.href;
   const allowed = isFocusNavigationAllowed({
    currentHref,
    targetHref,
    openNoteIds: getOpenNoteIds(),
   });

   if (allowed) {
    currentHrefRef.current = { initialized: true, href: targetHref };
    return;
   }

   event.preventDefault();
   event.stopPropagation();
   warnFocusBlocked(focusModeWarning);
  };

  const handlePopState = () => {
   const currentHref = currentHrefRef.current.initialized
    ? currentHrefRef.current.href
    : window.location.href;
   window.history.pushState(
    { ...(window.history.state ?? {}), hanzihomeFocusMode: true },
    "",
    currentHref,
   );
   warnFocusBlocked(focusModeWarning);
  };

  document.addEventListener("click", handleClick, true);
  window.addEventListener("popstate", handlePopState);

  return () => {
   document.removeEventListener("click", handleClick, true);
   window.removeEventListener("popstate", handlePopState);
  };
 }, [focusModeEnabled, focusModeWarning]);

 return null;
}
