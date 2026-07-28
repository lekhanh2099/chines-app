/**
 * Split View Store — Manages split view state per note.
 *
 * Persists split-view preferences per note ID in localStorage.
 * Tracks the resizable divider position.
 */

import { createStore } from "@tanstack/react-store";
import { z } from "zod";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

interface SplitViewState {
 /** Map of noteId → whether split view is active */
 activeNotes: Record<string, boolean>;
 /** Map of noteId → left pane width percentage (30-70) */
 dividerPositions: Record<string, number>;
}

const STORAGE_KEY = "split-view-state";
const DEFAULT_SPLIT = 50;
const splitViewDataSchema = z.object({
 activeNotes: z.record(z.string(), z.boolean()),
 dividerPositions: z.record(z.string(), z.number().min(30).max(70)),
});
type SplitViewData = z.output<typeof splitViewDataSchema>;
const fallbackState: SplitViewData = { activeNotes: {}, dividerPositions: {} };
const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: splitViewDataSchema,
 fallback: fallbackState,
 migrateLegacy: (value: unknown) => {
  const parsed = splitViewDataSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
 },
};

function loadState(): SplitViewData {
 return readVersionedStorage(getBrowserStorage(), storageConfig);
}

function saveState(activeNotes: Record<string, boolean>, dividerPositions: Record<string, number>) {
 writeVersionedStorage(getBrowserStorage(), storageConfig, { activeNotes, dividerPositions });
}

const initialSplitViewState = loadState();

export const splitViewStore = createStore<
 SplitViewState,
 {
  toggleSplitView: (noteId: string) => void;
  setSplitView: (noteId: string, enabled: boolean) => void;
  setDividerPosition: (noteId: string, percent: number) => void;
  isSplitView: (noteId: string) => boolean;
  getDividerPosition: (noteId: string) => number;
 }
>(
 {
  activeNotes: initialSplitViewState.activeNotes,
  dividerPositions: initialSplitViewState.dividerPositions,
 },
 ({ setState, get }) => ({
  toggleSplitView: (noteId) => {
   setState((state) => {
    const current = state.activeNotes[noteId] ?? false;
    const activeNotes = { ...state.activeNotes, [noteId]: !current };
    saveState(activeNotes, state.dividerPositions);
    return { ...state, activeNotes };
   });
  },

  setSplitView: (noteId, enabled) => {
   setState((state) => {
    const activeNotes = { ...state.activeNotes, [noteId]: enabled };
    saveState(activeNotes, state.dividerPositions);
    return { ...state, activeNotes };
   });
  },

  setDividerPosition: (noteId, percent) => {
   const clamped = Math.min(70, Math.max(30, percent));
   setState((state) => {
    const dividerPositions = { ...state.dividerPositions, [noteId]: clamped };
    saveState(state.activeNotes, dividerPositions);
    return { ...state, dividerPositions };
   });
  },

  isSplitView: (noteId) => get().activeNotes[noteId] ?? false,
  getDividerPosition: (noteId) => get().dividerPositions[noteId] ?? DEFAULT_SPLIT,
 }),
);
