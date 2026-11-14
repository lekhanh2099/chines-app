"use client";

import { createStoreContext } from "@tanstack/react-store";

import type { HanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import type { HanziHomeFeatureActions } from "./actions";
import type { HanziHomeFeatureServices } from "./services";
import type { HanziHomeFeatureRuntime } from "./types";

export type HanziHomeFeatureContextValue = {
 store: HanziHomeFeatureStore;
 actions: HanziHomeFeatureActions;
 services: HanziHomeFeatureServices;
 runtime: HanziHomeFeatureRuntime;
};

export const {
 StoreProvider: HanziHomeFeatureStoreProvider,
 useStoreContext: useHanziHomeFeatureContext,
} = createStoreContext<HanziHomeFeatureContextValue>();
