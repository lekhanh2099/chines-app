"use client";

import { useHanziHomeFeatureContext } from "./hanzihomeFeatureContext";

export function useHanziHomeRuntime() {
 return useHanziHomeFeatureContext().runtime;
}

