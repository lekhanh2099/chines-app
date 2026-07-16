/**
 * Note Tabs Store — Manages open note tabs like browser tabs.
 *
 * Each tab = { noteId, title }. One tab is "active" at a time.
 * Persists open tabs to localStorage so they survive refresh.
 */
import { create } from "zustand";
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
 migrateLegacy: (value: unknown) => {
  const parsed = noteTabsDataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
 },
};

type NoteTabsState = {
 tabs: NoteTab[];
 activeNoteId: string | null;
 hasHydrated: boolean;
 hydrate: () => void;
 /** Open a note tab. If already open, just activate it. */
 openTab: (noteId: string, title?: string) => void;
 /** Close a tab. Activates adjacent tab if closing the active one. */
 closeTab: (noteId: string) => void;
 /** Set the active tab without adding */
 setActive: (noteId: string) => void;
 /** Update a tab's title (e.g. when user renames) */
 updateTabTitle: (noteId: string, title: string) => void;
 /** Close all tabs except the given one */
 closeOthers: (noteId: string) => void;
 /** Close all tabs */
 closeAll: () => void;
 /** Reorder tabs (drag-and-drop) */
 reorderTabs: (fromIndex: number, toIndex: number) => void;
};

function loadState(): NoteTabsData {
 return readVersionedStorage(getBrowserStorage(), storageConfig);
}

function saveState(tabs: NoteTab[], activeNoteId: string | null) {
 writeVersionedStorage(getBrowserStorage(), storageConfig, { tabs, activeNoteId });
}

export const useNoteTabsStore = create<NoteTabsState>((set, get) => ({
 tabs: [],
 activeNoteId: null,
 hasHydrated: false,

 hydrate: () => {
  if (get().hasHydrated || typeof window === "undefined") return;
  const next = loadState();
  set({ ...next, hasHydrated: true });
 },

 openTab: (noteId, title) => {
  const { tabs } = get();
  const existing = tabs.find((t) => t.noteId === noteId);

  if (existing) {
   set({ activeNoteId: noteId });
   saveState(tabs, noteId);
   return;
  }

  const newTab: NoteTab = { noteId, title: title || "Đang tải..." };
  let newTabs = [...tabs, newTab];

  if (newTabs.length > MAX_TABS) {
   newTabs = newTabs.slice(newTabs.length - MAX_TABS);
  }

  set({ tabs: newTabs, activeNoteId: noteId });
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

  set({ tabs: newTabs, activeNoteId: newActive });
  saveState(newTabs, newActive);
 },

 setActive: (noteId) => {
  const { tabs } = get();
  if (tabs.some((t) => t.noteId === noteId)) {
   set({ activeNoteId: noteId });
   saveState(tabs, noteId);
  }
 },

 updateTabTitle: (noteId, title) => {
  const { tabs, activeNoteId } = get();
  const newTabs = tabs.map((t) => (t.noteId === noteId ? { ...t, title } : t));
  set({ tabs: newTabs });
  saveState(newTabs, activeNoteId);
 },

 closeOthers: (noteId) => {
  const { tabs } = get();
  const kept = tabs.filter((t) => t.noteId === noteId);
  set({ tabs: kept, activeNoteId: noteId });
  saveState(kept, noteId);
 },

 closeAll: () => {
  set({ tabs: [], activeNoteId: null });
  saveState([], null);
 },

 reorderTabs: (fromIndex, toIndex) => {
  const { tabs, activeNoteId } = get();
  if (fromIndex === toIndex) return;
  const newTabs = [...tabs];
  const [moved] = newTabs.splice(fromIndex, 1);
  newTabs.splice(toIndex, 0, moved);
  set({ tabs: newTabs });
  saveState(newTabs, activeNoteId);
 },
}));
