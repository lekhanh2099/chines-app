"use client";

import { createStore } from "@tanstack/react-store";

import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";
import {
 getPracticeProgressKey,
 nextPracticeProgress,
 PracticeProgressStateSchema,
 type PracticeAttemptInput,
 type PracticeProgressState,
} from "./practice-progress";

const STORAGE_KEY = "hanzihome-practice-progress";

const storageConfig = {
 key: STORAGE_KEY,
 version: 1,
 schema: PracticeProgressStateSchema,
 fallback: {},
};

type PracticeProgressStoreState = {
 items: PracticeProgressState;
 hasHydrated: boolean;
};

function readPersistedItems() {
 return readVersionedStorage(getBrowserStorage(), storageConfig);
}

export const practiceProgressStore = createStore<
 PracticeProgressStoreState,
 {
  hydrate: () => void;
  recordAttempt: (input: PracticeAttemptInput) => void;
 }
>(
 {
  items: {},
  hasHydrated: false,
 },
 ({ setState, get }) => ({
  hydrate: () => {
   if (get().hasHydrated) return;
   setState((state) => ({
    ...state,
    items: readPersistedItems(),
    hasHydrated: true,
   }));
  },

  recordAttempt: (input) => {
   const currentState = get();
   const items = currentState.hasHydrated ? currentState.items : readPersistedItems();
   const key = getPracticeProgressKey(input);
   const nextItems = {
    ...items,
    [key]: nextPracticeProgress(items[key], input),
   };

   writeVersionedStorage(getBrowserStorage(), storageConfig, nextItems);
   setState({ items: nextItems, hasHydrated: true });
  },
 }),
);
