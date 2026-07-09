import type { ReactNode } from "react";
import { create } from "zustand";

type HeaderToolbarState = {
 content: ReactNode;
 setContent: (content: ReactNode) => void;
 clearContent: () => void;
};

export const useHeaderToolbarStore = create<HeaderToolbarState>((set) => ({
 content: null,
 setContent: (content) => set({ content }),
 clearContent: () => set({ content: null }),
}));
