import { createStore } from "@tanstack/react-store";

type GlobalSearchState = {
 open: boolean;
 query: string;
};

const initialState: GlobalSearchState = {
 open: false,
 query: "",
};

export const globalSearchStore = createStore<
 GlobalSearchState,
 {
  setOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  clearQuery: () => void;
 }
>(initialState, ({ setState }) => ({
 setOpen: (open) => setState((state) => (state.open === open ? state : { ...state, open })),
 openSearch: () => setState((state) => (state.open ? state : { ...state, open: true })),
 closeSearch: () => setState((state) => (state.open ? { ...state, open: false } : state)),
 setQuery: (query) => setState((state) => (state.query === query ? state : { ...state, query })),
 clearQuery: () => setState((state) => (state.query ? { ...state, query: "" } : state)),
}));
