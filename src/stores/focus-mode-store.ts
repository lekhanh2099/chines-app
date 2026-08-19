import type { JsonFieldValue } from "@/types/json";
import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import { stripLocaleFromPathname } from "@/i18n/config";
import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

const STORAGE_KEY = "hanzihome-focus-mode";

type FocusModeState = {
 enabled: boolean;
 hasHydrated: boolean;
};

const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: z.boolean(),
 fallback: false,
 migrateLegacy: (value: JsonFieldValue) => (typeof value === "boolean" ? value : null),
};

export const focusModeStore = createStore<
 FocusModeState,
 {
  hydrate: () => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
 }
>(
 {
  enabled: false,
  hasHydrated: false,
 },
 ({ setState, get }) => ({
  hydrate: () => {
   if (get().hasHydrated) return;
   setState((state) => ({
    ...state,
    enabled: readVersionedStorage(getBrowserStorage(), storageConfig),
    hasHydrated: true,
   }));
  },

  setEnabled: (enabled) => {
   writeVersionedStorage(getBrowserStorage(), storageConfig, enabled);
   setState((state) => ({ ...state, enabled, hasHydrated: true }));
  },

  toggle: () => {
   const enabled = !get().enabled;
   writeVersionedStorage(getBrowserStorage(), storageConfig, enabled);
   setState((state) => ({ ...state, enabled, hasHydrated: true }));
  },
 }),
);

export function getNoteIdFromNotesPath(pathname: string): string | null {
 const logicalPathname = stripLocaleFromPathname(pathname);
 const match = logicalPathname.match(/^\/notes\/([^/?#]+)/);
 return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function isFocusNavigationAllowed({
 currentHref,
 targetHref,
 openNoteIds,
}: {
 currentHref: string;
 targetHref: string;
 openNoteIds: string[];
}) {
 const current = new URL(currentHref, window.location.origin);
 const target = new URL(targetHref, window.location.origin);
 const currentPathname = stripLocaleFromPathname(current.pathname);
 const targetPathname = stripLocaleFromPathname(target.pathname);

 if (current.origin !== target.origin) return false;
 if (current.href === target.href) return true;

 if (currentPathname.startsWith("/notes")) {
  if (!targetPathname.startsWith("/notes")) return false;
  const targetNoteId = getNoteIdFromNotesPath(targetPathname);
  return Boolean(targetNoteId && openNoteIds.includes(targetNoteId));
 }

 if (currentPathname === "/hanzihome") {
  if (targetPathname !== "/hanzihome") return false;

  const sameCourse = current.searchParams.get("courseId") === target.searchParams.get("courseId");
  const sameLesson =
   current.searchParams.get("lesson") === target.searchParams.get("lesson") &&
   current.searchParams.get("lessonId") === target.searchParams.get("lessonId");

  return sameCourse && sameLesson;
 }

 return currentPathname === targetPathname && current.search === target.search;
}
