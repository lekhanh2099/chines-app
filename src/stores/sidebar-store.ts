/**
 * Sidebar Store — Collapsible sidebar state.
 *
 * Persists collapsed/expanded in localStorage.
 * Default: expanded (not collapsed).
 */

import { create } from "zustand";
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
 migrateLegacy: (value: unknown) => (typeof value === "boolean" ? value : null),
};

type SidebarState = {
 isCollapsed: boolean;
 toggle: () => void;
 setCollapsed: (collapsed: boolean) => void;
 hydrate: () => void;
};

export const useSidebarStore = create<SidebarState>((set, get) => ({
 isCollapsed: false,

 toggle: () => {
  const next = !get().isCollapsed;
  writeVersionedStorage(getBrowserStorage(), storageConfig, next);
  set({ isCollapsed: next });
 },

 setCollapsed: (collapsed: boolean) => {
  writeVersionedStorage(getBrowserStorage(), storageConfig, collapsed);
  set({ isCollapsed: collapsed });
 },

 hydrate: () => {
  set({ isCollapsed: readVersionedStorage(getBrowserStorage(), storageConfig) });
 },
}));
