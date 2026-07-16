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
import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

const STORAGE_KEY = "dictionary-lookup-overrides";

type RouteOverrides = Record<string, boolean>;
const routeOverridesSchema = z.record(z.string(), z.boolean());
const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: routeOverridesSchema,
 fallback: {} as RouteOverrides,
 migrateLegacy: (value: unknown) => {
  const parsed = routeOverridesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
 },
};

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
 hasHydrated: boolean;
 hydrate: () => void;
 /** Whether lookup is enabled for the given pathname */
 isEnabled: (pathname: string) => boolean;
 /** Toggle lookup for the given pathname */
 toggle: (pathname: string) => void;
 /** Explicitly set lookup for a pathname */
 setEnabled: (pathname: string, enabled: boolean) => void;
};

export const useDictionaryLookupStore = create<DictionaryLookupState>((set, get) => ({
 // Must be stable for SSR + first client render.
 // Do not read localStorage here, otherwise Header hydration can mismatch.
 overrides: {},
 hasHydrated: false,

 hydrate: () => {
  if (get().hasHydrated) return;
  set({
   overrides: readVersionedStorage(getBrowserStorage(), storageConfig),
   hasHydrated: true,
  });
 },

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

  writeVersionedStorage(getBrowserStorage(), storageConfig, newOverrides);
  set({ overrides: newOverrides, hasHydrated: true });
 },

 setEnabled: (pathname: string, enabled: boolean) => {
  const key = getRouteKey(pathname);
  const newOverrides = { ...get().overrides, [key]: enabled };

  writeVersionedStorage(getBrowserStorage(), storageConfig, newOverrides);
  set({ overrides: newOverrides, hasHydrated: true });
 },
}));
