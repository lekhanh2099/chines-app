/**
 * Note Tabs Store — Manages open note tabs like browser tabs.
 *
 * Each tab = { noteId, title }. One tab is "active" at a time.
 * Persists open tabs to localStorage so they survive refresh.
 */
import type { JsonFieldValue } from "@/types/json";
import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

const STORAGE_KEY = "note-tabs";
const MAX_TABS = 20;

export type NoteTab = {
 noteId: string;
 title: string;
};

const noteTabsDataSchema = z.object({
 tabs: z.array(z.object({ noteId: z.string().min(1), title: z.string() })).max(MAX_TABS),
 activeNoteId: z.string().min(1).nullable(),
});
type NoteTabsData = z.output<typeof noteTabsDataSchema>;
const fallbackState: NoteTabsData = { tabs: [], activeNoteId: null };
const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: noteTabsDataSchema,
 fallback: fallbackState,
 migrateLegacy: (value: JsonFieldValue) => {
  const parsed = noteTabsDataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
 },
};

type NoteTabsState = {
 tabs: NoteTab[];
 activeNoteId: NoteTabsData["activeNoteId"];
 hasHydrated: boolean;
};

function loadState(): NoteTabsData {
 return readVersionedStorage(getBrowserStorage(), storageConfig);
}

function saveState(tabs: NoteTab[], activeNoteId: NoteTabsData["activeNoteId"]) {
 writeVersionedStorage(getBrowserStorage(), storageConfig, { tabs, activeNoteId });
}

export const noteTabsStore = createStore<
 NoteTabsState,
 {
  hydrate: () => void;
  openTab: (noteId: string, title?: string) => void;
  closeTab: (noteId: string) => void;
  setActive: (noteId: string) => void;
  updateTabTitle: (noteId: string, title: string) => void;
  closeOthers: (noteId: string) => void;
  closeAll: () => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
 }
>(
 {
  tabs: [],
  activeNoteId: null,
  hasHydrated: false,
 },
 ({ setState, get }) => ({
  hydrate: () => {
   if (get().hasHydrated || typeof window === "undefined") return;
   const next = loadState();
   setState(() => ({ ...next, hasHydrated: true }));
  },

  openTab: (noteId, title) => {
   const { tabs } = get();
   const existing = tabs.find((t) => t.noteId === noteId);

   if (existing) {
    setState((state) => ({ ...state, activeNoteId: noteId }));
    saveState(tabs, noteId);
    return;
   }

   const newTab: NoteTab = { noteId, title: title || "Đang tải..." };
   let newTabs = [...tabs, newTab];

   if (newTabs.length > MAX_TABS) {
    newTabs = newTabs.slice(newTabs.length - MAX_TABS);
   }

   setState((state) => ({ ...state, tabs: newTabs, activeNoteId: noteId }));
   saveState(newTabs, noteId);
  },

  closeTab: (noteId) => {
   const { tabs, activeNoteId } = get();
   const idx = tabs.findIndex((t) => t.noteId === noteId);
   if (idx === -1) return;

   const newTabs = tabs.filter((t) => t.noteId !== noteId);
   let newActive = activeNoteId;

   if (activeNoteId === noteId) {
    if (newTabs.length === 0) {
     newActive = null;
    } else if (idx >= newTabs.length) {
     newActive = newTabs[newTabs.length - 1].noteId;
    } else {
     newActive = newTabs[idx].noteId;
    }
   }

   setState((state) => ({ ...state, tabs: newTabs, activeNoteId: newActive }));
   saveState(newTabs, newActive);
  },

  setActive: (noteId) => {
   const { tabs } = get();
   if (tabs.some((t) => t.noteId === noteId)) {
    setState((state) => ({ ...state, activeNoteId: noteId }));
    saveState(tabs, noteId);
   }
  },

  updateTabTitle: (noteId, title) => {
   const { tabs, activeNoteId } = get();
   const newTabs = tabs.map((t) => (t.noteId === noteId ? { ...t, title } : t));
   setState((state) => ({ ...state, tabs: newTabs }));
   saveState(newTabs, activeNoteId);
  },

  closeOthers: (noteId) => {
   const { tabs } = get();
   const kept = tabs.filter((t) => t.noteId === noteId);
   setState((state) => ({ ...state, tabs: kept, activeNoteId: noteId }));
   saveState(kept, noteId);
  },

  closeAll: () => {
   setState((state) => ({ ...state, tabs: [], activeNoteId: null }));
   saveState([], null);
  },

  reorderTabs: (fromIndex, toIndex) => {
   const { tabs, activeNoteId } = get();
   if (fromIndex === toIndex) return;
   const newTabs = [...tabs];
   const [moved] = newTabs.splice(fromIndex, 1);
   newTabs.splice(toIndex, 0, moved);
   setState((state) => ({ ...state, tabs: newTabs }));
   saveState(newTabs, activeNoteId);
  },
 }),
);
