import type { ReactNode } from "react";
import { createStore } from "@tanstack/react-store";

type HeaderToolbarState = {
 content: ReactNode;
};

export const headerToolbarStore = createStore<
 HeaderToolbarState,
 {
  setContent: (content: ReactNode) => void;
  clearContent: () => void;
 }
>({ content: null }, ({ setState }) => ({
 setContent: (content) => setState((state) => ({ ...state, content })),
 clearContent: () => setState((state) => ({ ...state, content: null })),
}));
