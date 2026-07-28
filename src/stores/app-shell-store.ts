import { createStore } from "@tanstack/react-store";

type AppShellState = {
 isContentFullscreen: boolean;
};

export const appShellStore = createStore<
 AppShellState,
 {
  setContentFullscreen: (fullscreen: boolean) => void;
 }
>({ isContentFullscreen: false }, ({ setState }) => ({
 setContentFullscreen: (isContentFullscreen) =>
  setState((state) => ({ ...state, isContentFullscreen })),
}));
