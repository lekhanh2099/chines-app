"use client";

import { useEffect, useMemo } from "react";
import { useSelector } from "@tanstack/react-store";

import { isWeakPracticeProgress } from "./practice-progress";
import { practiceProgressStore } from "./practice-progress-store";

export function usePracticeProgress() {
 const items = useSelector(practiceProgressStore, (state) => state.items);
 const hasHydrated = useSelector(practiceProgressStore, (state) => state.hasHydrated);
 const { hydrate, recordAttempt } = practiceProgressStore.actions;

 useEffect(() => {
  hydrate();
 }, [hydrate]);

 const weakCount = useMemo(
  () => Object.values(items).filter(isWeakPracticeProgress).length,
  [items],
 );

 return {
  items,
  weakCount,
  hasHydrated,
  recordAttempt,
 };
}
