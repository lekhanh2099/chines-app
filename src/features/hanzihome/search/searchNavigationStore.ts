"use client";

import { createStore, useSelector } from "@tanstack/react-store";

import type { HanziHomeSearchNavigationIntent } from "./types";
import { HanziHomeSearchNavigationIntentSchema } from "./types";
import { z } from "zod";

type SearchNavigationState = {
 intent: z.infer<z.ZodNullable<typeof HanziHomeSearchNavigationIntentSchema>>;
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
