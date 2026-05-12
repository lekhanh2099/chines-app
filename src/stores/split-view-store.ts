/**
 * Split View Store — Manages split view state per note.
 *
 * Persists split-view preferences per note ID in localStorage.
 * Tracks the resizable divider position.
 */

import { create } from "zustand";

interface SplitViewState {
 /** Map of noteId → whether split view is active */
 activeNotes: Record<string, boolean>;
 /** Map of noteId → left pane width percentage (30-70) */
 dividerPositions: Record<string, number>;

 /** Toggle split view for a note */
 toggleSplitView: (noteId: string) => void;
 /** Explicitly set split view state */
 setSplitView: (noteId: string, enabled: boolean) => void;
 /** Set divider position */
 setDividerPosition: (noteId: string, percent: number) => void;
 /** Check if split view is active for a note */
 isSplitView: (noteId: string) => boolean;
 /** Get divider position for a note */
 getDividerPosition: (noteId: string) => number;
}

const STORAGE_KEY = "split-view-state";
const DEFAULT_SPLIT = 50;

function loadState(): {
 activeNotes: Record<string, boolean>;
 dividerPositions: Record<string, number>;
} {
 try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
 } catch {}
 return { activeNotes: {}, dividerPositions: {} };
}

function saveState(
 activeNotes: Record<string, boolean>,
 dividerPositions: Record<string, number>,
) {
 try {
  localStorage.setItem(
   STORAGE_KEY,
   JSON.stringify({ activeNotes, dividerPositions }),
  );
 } catch {}
}

export const useSplitViewStore = create<SplitViewState>((set, get) => {
 const initial = loadState();

 return {
  activeNotes: initial.activeNotes,
  dividerPositions: initial.dividerPositions,

  toggleSplitView: (noteId) => {
   set((state) => {
    const current = state.activeNotes[noteId] ?? false;
    const activeNotes = { ...state.activeNotes, [noteId]: !current };
    saveState(activeNotes, state.dividerPositions);
    return { activeNotes };
   });
  },

  setSplitView: (noteId, enabled) => {
   set((state) => {
    const activeNotes = { ...state.activeNotes, [noteId]: enabled };
    saveState(activeNotes, state.dividerPositions);
    return { activeNotes };
   });
  },

  setDividerPosition: (noteId, percent) => {
   const clamped = Math.min(70, Math.max(30, percent));
   set((state) => {
    const dividerPositions = { ...state.dividerPositions, [noteId]: clamped };
    saveState(state.activeNotes, dividerPositions);
    return { dividerPositions };
   });
  },

  isSplitView: (noteId) => get().activeNotes[noteId] ?? false,
  getDividerPosition: (noteId) =>
   get().dividerPositions[noteId] ?? DEFAULT_SPLIT,
 };
});
