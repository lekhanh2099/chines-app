/**
 * Sidebar Store — Collapsible sidebar state.
 *
 * Persists collapsed/expanded in localStorage.
 * Default: expanded (not collapsed).
 */

import { create } from "zustand";

const STORAGE_KEY = "sidebar-collapsed";

function loadCollapsed(): boolean {
 if (typeof window === "undefined") return false;
 try {
  return localStorage.getItem(STORAGE_KEY) === "true";
 } catch {
  return false;
 }
}

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
  try {
   localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
   // storage unavailable
  }
  set({ isCollapsed: next });
 },

 setCollapsed: (collapsed: boolean) => {
  try {
   localStorage.setItem(STORAGE_KEY, String(collapsed));
  } catch {
   // storage unavailable
  }
  set({ isCollapsed: collapsed });
 },

 hydrate: () => {
  set({ isCollapsed: loadCollapsed() });
 },
}));
