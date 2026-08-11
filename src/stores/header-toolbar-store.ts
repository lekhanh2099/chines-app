import type { ReactNode } from "react";
import { createStore } from "@tanstack/react-store";

type HeaderToolbarOwnerId = string | null;

type HeaderToolbarState = {
 content: ReactNode;
 ownerId: HeaderToolbarOwnerId;
};

export const headerToolbarStore = createStore<
 HeaderToolbarState,
 {
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
  setOwnedContent: (ownerId: string, content: ReactNode) => void;
  clearOwnedContent: (ownerId: string) => void;
 }
>({ content: null, ownerId: null }, ({ setState }) => ({
 setContent: (content) =>
  setState((state) =>
   state.ownerId === null && state.content === content
    ? state
    : { ...state, content, ownerId: null },
  ),
 clearContent: () =>
  setState((state) =>
   state.ownerId === null && state.content === null
    ? state
    : { ...state, content: null, ownerId: null },
  ),
 setOwnedContent: (ownerId, content) =>
  setState((state) =>
   state.ownerId === ownerId && state.content === content ? state : { ...state, content, ownerId },
  ),
 clearOwnedContent: (ownerId) =>
  setState((state) =>
   state.ownerId === ownerId ? { ...state, content: null, ownerId: null } : state,
  ),
}));
