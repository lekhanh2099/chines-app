/**
 * Note Tabs Store — Manages open note tabs like browser tabs.
 *
 * Each tab = { noteId, title }. One tab is "active" at a time.
 * Persists open tabs to localStorage so they survive refresh.
 */
import { create } from "zustand";

const STORAGE_KEY = "note-tabs";
const MAX_TABS = 20;

export type NoteTab = {
 noteId: string;
 title: string;
};

type NoteTabsState = {
 tabs: NoteTab[];
 activeNoteId: string | null;
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

function loadState(): { tabs: NoteTab[]; activeNoteId: string | null } {
 if (typeof window === "undefined") return { tabs: [], activeNoteId: null };
 try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
   const parsed = JSON.parse(raw);
   return {
    tabs: Array.isArray(parsed.tabs) ? parsed.tabs : [],
    activeNoteId: parsed.activeNoteId || null,
   };
  }
 } catch {
  // corrupted
 }
 return { tabs: [], activeNoteId: null };
}

function saveState(tabs: NoteTab[], activeNoteId: string | null) {
 try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeNoteId }));
 } catch {
  // full
 }
}

const initial = loadState();

export const useNoteTabsStore = create<NoteTabsState>((set, get) => ({
 tabs: initial.tabs,
 activeNoteId: initial.activeNoteId,

 openTab: (noteId, title) => {
  const { tabs } = get();
  const existing = tabs.find((t) => t.noteId === noteId);

  if (existing) {
   // Already open — just activate
   set({ activeNoteId: noteId });
   saveState(tabs, noteId);
   return;
  }

  // Add new tab
  const newTab: NoteTab = { noteId, title: title || "Đang tải..." };
  let newTabs = [...tabs, newTab];

  // Evict oldest if over limit
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
   // Activate adjacent tab
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
  const newTabs = tabs.map((t) =>
   t.noteId === noteId ? { ...t, title } : t,
  );
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
