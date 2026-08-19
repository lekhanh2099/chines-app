/**
 * Sidebar Store — Collapsible sidebar state.
 *
 * Persists collapsed/expanded in localStorage.
 * Default: expanded (not collapsed).
 */

import type { JsonFieldValue } from "@/types/json";
import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

const STORAGE_KEY = "sidebar-collapsed";

const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: z.boolean(),
 fallback: false,
 migrateLegacy: (value: JsonFieldValue) => (typeof value === "boolean" ? value : null),
};

type SidebarState = {
 isCollapsed: boolean;
};

export const sidebarStore = createStore<
 SidebarState,
 {
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  hydrate: () => void;
 }
>(
 {
  isCollapsed: false,
 },
 ({ setState, get }) => ({
  toggle: () => {
   const next = !get().isCollapsed;
   writeVersionedStorage(getBrowserStorage(), storageConfig, next);
   setState((state) => ({ ...state, isCollapsed: next }));
  },

  setCollapsed: (collapsed: boolean) => {
   writeVersionedStorage(getBrowserStorage(), storageConfig, collapsed);
   setState((state) => ({ ...state, isCollapsed: collapsed }));
  },

  hydrate: () => {
   setState((state) => ({
    ...state,
    isCollapsed: readVersionedStorage(getBrowserStorage(), storageConfig),
   }));
  },
 }),
);
