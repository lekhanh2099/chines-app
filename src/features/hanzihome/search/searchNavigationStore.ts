"use client";

import { createStore, useSelector } from "@tanstack/react-store";

import type { HanziHomeSearchNavigationIntent } from "./types";

type SearchNavigationState = {
 intent: HanziHomeSearchNavigationIntent | null;
};

const searchNavigationStore = createStore<SearchNavigationState>({
 intent: null,
});

export function setHanziHomeSearchNavigationIntent(
 intent: Omit<HanziHomeSearchNavigationIntent, "id">,
) {
 searchNavigationStore.setState(() => ({
  intent: {
   ...intent,
   id: crypto.randomUUID(),
  },
 }));
}

export function clearHanziHomeSearchNavigationIntent() {
 searchNavigationStore.setState(() => ({ intent: null }));
}

export function useHanziHomeSearchNavigationIntent() {
 return useSelector(searchNavigationStore, (state) => state.intent);
}
