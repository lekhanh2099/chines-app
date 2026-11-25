import { createStore } from "@tanstack/react-store";

type ReadingFocusState = {
 /** The learner's choice; kept while switching lesson tabs and lessons, not persisted. */
 enabled: boolean;
 /** The mounted workspace that offers the control; empty when there is none. */
 ownerId: string;
};

export const readingFocusStore = createStore<
 ReadingFocusState,
 {
  setEnabled: (enabled: boolean) => void;
  claim: (ownerId: string) => void;
  release: (ownerId: string) => void;
 }
>({ enabled: false, ownerId: "" }, ({ setState }) => ({
 setEnabled: (enabled) =>
  setState((state) => (state.enabled === enabled ? state : { ...state, enabled })),
 claim: (ownerId) =>
  setState((state) => (state.ownerId === ownerId ? state : { ...state, ownerId })),
 release: (ownerId) =>
  setState((state) => (state.ownerId === ownerId ? { ...state, ownerId: "" } : state)),
}));

/** Shell navigation hides only while a workspace that can turn focus off is mounted. */
export function selectReadingFocusActive(state: ReadingFocusState) {
 return state.enabled && state.ownerId !== "";
}
