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

import type { JsonFieldValue } from "@/types/json";
import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import { stripLocaleFromPathname } from "@/i18n/config";
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
 fallback: {},
 migrateLegacy: (value: JsonFieldValue) => {
  const parsed = routeOverridesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
 },
};

/**
 * Determine the "route key" for grouping pages.
 * Notes pages share one key, everything else is ON by default.
 */
function getRouteKey(pathname: string): string {
 const logicalPathname = stripLocaleFromPathname(pathname);
 if (logicalPathname.startsWith("/notes")) return "/notes";
 return "global";
}

function getDefaultForRoute(routeKey: string): boolean {
 // Notes pages default to OFF, everything else ON
 return routeKey !== "/notes";
}

type DictionaryLookupState = {
 overrides: RouteOverrides;
 hasHydrated: boolean;
};

export const dictionaryLookupStore = createStore<
 DictionaryLookupState,
 {
  hydrate: () => void;
  isEnabled: (pathname: string) => boolean;
  toggle: (pathname: string) => void;
  setEnabled: (pathname: string, enabled: boolean) => void;
 }
>(
 {
  // Must be stable for SSR + first client render.
  // Do not read localStorage here, otherwise Header hydration can mismatch.
  overrides: {},
  hasHydrated: false,
 },
 ({ setState, get }) => ({
  hydrate: () => {
   if (get().hasHydrated) return;
   setState((state) => ({
    ...state,
    overrides: readVersionedStorage(getBrowserStorage(), storageConfig),
    hasHydrated: true,
   }));
  },

  isEnabled: (pathname: string) => {
   const key = getRouteKey(pathname);
   const { overrides } = get();

   if (key in overrides) return overrides[key];
   return getDefaultForRoute(key);
  },

  toggle: (pathname: string) => {
   const key = getRouteKey(pathname);
   const current = getDefaultForRoute(key);
   const overrides = get().overrides;
   const enabled = key in overrides ? overrides[key] : current;
   const next = !enabled;
   const newOverrides = { ...get().overrides, [key]: next };

   writeVersionedStorage(getBrowserStorage(), storageConfig, newOverrides);
   setState((state) => ({ ...state, overrides: newOverrides, hasHydrated: true }));
  },

  setEnabled: (pathname: string, enabled: boolean) => {
   const key = getRouteKey(pathname);
   const newOverrides = { ...get().overrides, [key]: enabled };

   writeVersionedStorage(getBrowserStorage(), storageConfig, newOverrides);
   setState((state) => ({ ...state, overrides: newOverrides, hasHydrated: true }));
  },
 }),
);
