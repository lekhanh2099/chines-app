import type { JsonFieldValue } from "@/types/json";
import { createStore } from "@tanstack/react-store";
import { z } from "zod";

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

export function getNoteIdFromNotesPath(pathname: string): z.infer<z.ZodNullable<z.ZodString>> {
 const match = pathname.match(/^\/notes\/([^/?#]+)/);
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

 if (current.origin !== target.origin) return false;
 if (current.href === target.href) return true;

 if (current.pathname.startsWith("/notes")) {
  if (!target.pathname.startsWith("/notes")) return false;
  const targetNoteId = getNoteIdFromNotesPath(target.pathname);
  return Boolean(targetNoteId && openNoteIds.includes(targetNoteId));
 }

 if (current.pathname === "/hanzihome") {
  if (target.pathname !== "/hanzihome") return false;

  const sameCourse = current.searchParams.get("courseId") === target.searchParams.get("courseId");
  const sameLesson =
   current.searchParams.get("lesson") === target.searchParams.get("lesson") &&
   current.searchParams.get("lessonId") === target.searchParams.get("lessonId");

  return sameCourse && sameLesson;
 }

 return current.pathname === target.pathname && current.search === target.search;
}
