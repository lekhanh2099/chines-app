import { create } from "zustand";

type AppShellState = {
 isContentFullscreen: boolean;
 setContentFullscreen: (fullscreen: boolean) => void;
};

export const useAppShellStore = create<AppShellState>((set) => ({
 isContentFullscreen: false,
 setContentFullscreen: (isContentFullscreen) => set({ isContentFullscreen }),
}));
