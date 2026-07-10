import { create } from "zustand";

const STORAGE_KEY = "hanzihome-focus-mode";

type FocusModeState = {
 enabled: boolean;
 hasHydrated: boolean;
 hydrate: () => void;
 setEnabled: (enabled: boolean) => void;
 toggle: () => void;
};

function loadFocusMode(): boolean {
 if (typeof window === "undefined") return false;

 try {
  return localStorage.getItem(STORAGE_KEY) === "true";
 } catch {
  return false;
 }
}

function saveFocusMode(enabled: boolean) {
 if (typeof window === "undefined") return;

 try {
  localStorage.setItem(STORAGE_KEY, String(enabled));
 } catch {
  // Storage can be unavailable in private browsing or locked contexts.
 }
}

export const useFocusModeStore = create<FocusModeState>((set, get) => ({
 enabled: false,
 hasHydrated: false,

 hydrate: () => {
  if (get().hasHydrated) return;
  set({ enabled: loadFocusMode(), hasHydrated: true });
 },

 setEnabled: (enabled) => {
  saveFocusMode(enabled);
  set({ enabled, hasHydrated: true });
 },

 toggle: () => {
  const enabled = !get().enabled;
  saveFocusMode(enabled);
  set({ enabled, hasHydrated: true });
 },
}));

export function getNoteIdFromNotesPath(pathname: string): string | null {
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
