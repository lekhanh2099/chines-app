"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "@tanstack/react-store";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { focusModeStore, isFocusNavigationAllowed } from "@/stores/focus-mode-store";
import { noteTabsStore } from "@/stores/note-tabs-store";

const FOCUS_MODE_WARNING =
 "Focus mode đang bật. Bạn chỉ có thể ở lại bài hiện tại hoặc chọn tab ghi chú đang mở.";

function getOpenNoteIds() {
 return noteTabsStore.get().tabs.map((tab) => tab.noteId);
}

function warnFocusBlocked() {
 toast.warning(FOCUS_MODE_WARNING, { duration: 4200 });
}

export function FocusModeRouteGuard() {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const searchParamsString = searchParams.toString();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { hydrate: hydrateFocusMode } = focusModeStore.actions;
 const currentHrefRef = useRef({ initialized: false, href: "" });

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
   warnFocusBlocked();
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
   warnFocusBlocked();
  };

  document.addEventListener("click", handleClick, true);
  window.addEventListener("popstate", handlePopState);

  return () => {
   document.removeEventListener("click", handleClick, true);
   window.removeEventListener("popstate", handlePopState);
  };
 }, [focusModeEnabled]);

 return null;
}
