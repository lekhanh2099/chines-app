"use client";

import { createStoreContext } from "@tanstack/react-store";

import type { HanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import type { HanziHomeFeatureActions } from "./actions";
import type { HanziHomeFeatureRuntime } from "./types";

type HanziHomeFeatureContextValue = {
 store: HanziHomeFeatureStore;
 actions: HanziHomeFeatureActions;
 runtime: HanziHomeFeatureRuntime;
};

export const {
 StoreProvider: HanziHomeFeatureStoreProvider,
 useStoreContext: useHanziHomeFeatureContext,
} = createStoreContext<HanziHomeFeatureContextValue>();
