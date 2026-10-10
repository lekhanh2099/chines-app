"use client";

import { useEffect, useState } from "react";
import type {
 TranslationDirection,
 TranslationSegment,
} from "@/features/hanzihome/practice/translation-practice";
import {
 advanceTranslationPreparation,
 translationPreparationRemaining,
 type createTranslationSubmission,
} from "./translation-workspace-utils";

export function useTranslationPreparation(
 segmentId: TranslationSegment["id"],
 direction: TranslationDirection,
 evaluation: Parameters<typeof createTranslationSubmission>[4],
) {
 const [state, setState] = useState({ key: "", remaining: 0 });
 const key = `${segmentId}:${direction}`;
 const enabled = evaluation?.mode === "interpreting";
 const limit = enabled ? (evaluation.preparationSeconds ?? 0) : 0;
 const remaining = translationPreparationRemaining(state, key, limit);

 useEffect(() => {
  if (!enabled || remaining <= 0) return;
  const timer = window.setTimeout(
   () => setState((current) => advanceTranslationPreparation(current, key, limit)),
   1000,
  );
  return () => window.clearTimeout(timer);
 }, [enabled, key, limit, remaining]);

 return { remaining, reset: () => setState({ key: "", remaining: 0 }) };
}
