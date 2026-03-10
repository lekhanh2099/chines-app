/**
 * Dictionary Lookup Toggle Store
 *
 * Controls whether automatic dictionary lookup (on Chinese text selection)
 * is enabled. State is per-route with defaults:
 *  - Notes/note detail pages: OFF by default
 *  - All other pages (Home, Vocabulary, Dashboard): ON by default
 *
 * Persists user overrides in localStorage.
 */

import { create } from "zustand";

const STORAGE_KEY = "dictionary-lookup-overrides";

type RouteOverrides = Record<string, boolean>;

function loadOverrides(): RouteOverrides {
 if (typeof window === "undefined") return {};
 try {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
 } catch {
  return {};
 }
}

function saveOverrides(overrides: RouteOverrides) {
 try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
 } catch {
  // storage full or unavailable
 }
}

/**
 * Determine the "route key" for grouping pages.
 * Notes pages share one key, everything else is ON by default.
 */
function getRouteKey(pathname: string): string {
 if (pathname.startsWith("/notes")) return "/notes";
 return "global";
}

function getDefaultForRoute(routeKey: string): boolean {
 // Notes pages default to OFF, everything else ON
 return routeKey !== "/notes";
}

type DictionaryLookupState = {
 overrides: RouteOverrides;
 /** Whether lookup is enabled for the given pathname */
 isEnabled: (pathname: string) => boolean;
 /** Toggle lookup for the given pathname */
 toggle: (pathname: string) => void;
 /** Explicitly set lookup for a pathname */
 setEnabled: (pathname: string, enabled: boolean) => void;
};

export const useDictionaryLookupStore = create<DictionaryLookupState>(
 (set, get) => ({
  overrides: loadOverrides(),

  isEnabled: (pathname: string) => {
   const key = getRouteKey(pathname);
   const { overrides } = get();
   if (key in overrides) return overrides[key];
   return getDefaultForRoute(key);
  },

  toggle: (pathname: string) => {
   const key = getRouteKey(pathname);
   const current = get().isEnabled(pathname);
   const next = !current;
   const newOverrides = { ...get().overrides, [key]: next };
   saveOverrides(newOverrides);
   set({ overrides: newOverrides });
  },

  setEnabled: (pathname: string, enabled: boolean) => {
   const key = getRouteKey(pathname);
   const newOverrides = { ...get().overrides, [key]: enabled };
   saveOverrides(newOverrides);
   set({ overrides: newOverrides });
  },
 }),
);
