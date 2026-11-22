import type { ReactNode } from "react";
import { createStore } from "@tanstack/react-store";

type HeaderToolbarOwnerId = string | null;

type HeaderToolbarState = {
 content: ReactNode;
 ownerId: HeaderToolbarOwnerId;
 settingsOwnerId: HeaderToolbarOwnerId;
 readingSettings: ReactNode;
 listeningSettings: ReactNode;
};

export const headerToolbarStore = createStore<
 HeaderToolbarState,
 {
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
  setOwnedContent: (ownerId: string, content: ReactNode) => void;
  clearOwnedContent: (ownerId: string) => void;
  setOwnedSettings: (
   ownerId: string,
   readingSettings: ReactNode,
   listeningSettings: ReactNode,
  ) => void;
  clearOwnedSettings: (ownerId: string) => void;
 }
>(
 {
  content: null,
  ownerId: null,
  settingsOwnerId: null,
  readingSettings: null,
  listeningSettings: null,
 },
 ({ setState }) => ({
  setOwnedSettings: (settingsOwnerId, readingSettings, listeningSettings) =>
   setState((state) =>
    state.settingsOwnerId === settingsOwnerId &&
    state.readingSettings === readingSettings &&
    state.listeningSettings === listeningSettings
     ? state
     : { ...state, settingsOwnerId, readingSettings, listeningSettings },
   ),
  clearOwnedSettings: (ownerId) =>
   setState((state) =>
    state.settingsOwnerId === ownerId
     ? { ...state, settingsOwnerId: null, readingSettings: null, listeningSettings: null }
     : state,
   ),
  setContent: (content) =>
   setState((state) => {
    if (state.ownerId !== null) return state;
    return state.content === content ? state : { ...state, content };
   }),
  clearContent: () =>
   setState((state) =>
    state.ownerId !== null || state.content === null ? state : { ...state, content: null },
   ),
  setOwnedContent: (ownerId, content) =>
   setState((state) =>
    state.ownerId === ownerId && state.content === content ? state : { ...state, content, ownerId },
   ),
  clearOwnedContent: (ownerId) =>
   setState((state) =>
    state.ownerId === ownerId ? { ...state, content: null, ownerId: null } : state,
   ),
 }),
);
