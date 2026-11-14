import { createStore } from "@tanstack/react-store";

type NavigationPendingState = {
 isPending: boolean;
 pendingHref: string | null;
};

let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

export const navigationPendingStore = createStore<
 NavigationPendingState,
 {
  startNavigation: (href: string) => void;
  finishNavigation: () => void;
 }
>({ isPending: false, pendingHref: null }, ({ setState }) => ({
 startNavigation: (href: string) => {
  if (fallbackTimer) clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(() => {
   setState((state) => ({ ...state, isPending: false, pendingHref: null }));
  }, 8000);
  setState((state) => ({
   ...state,
   isPending: true,
   pendingHref: href,
  }));
 },
 finishNavigation: () => {
  if (fallbackTimer) {
   clearTimeout(fallbackTimer);
   fallbackTimer = null;
  }
  setState((state) => {
   if (!state.isPending && state.pendingHref === null) return state;
   return {
    ...state,
    isPending: false,
    pendingHref: null,
   };
  });
 },
}));
