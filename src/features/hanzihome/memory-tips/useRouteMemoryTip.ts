"use client";

import type { JsonFieldValue } from "@/types/json";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

import { usePathname } from "@/i18n/navigation";
import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";
import type { MemoryTip } from "./memory-tip.schema";

const recentIdsStorageKey = "hanzihome.memoryTips.recentIds";
const maxRecentIds = 8;
const emptyRecentIds: string[] = [];
const recentIdsStorageConfig = {
 key: recentIdsStorageKey,
 version: 1,
 schema: z.array(z.string()).max(maxRecentIds),
 fallback: emptyRecentIds,
 migrateLegacy: (value: JsonFieldValue) => {
  const parsed = z.array(z.string()).safeParse(value);
  return parsed.success ? parsed.data.slice(0, maxRecentIds) : null;
 },
};

function readRecentIds() {
 return readVersionedStorage(getBrowserStorage(), recentIdsStorageConfig);
}

function writeRecentIds(ids: string[]) {
 writeVersionedStorage(getBrowserStorage(), recentIdsStorageConfig, ids.slice(0, maxRecentIds));
}

function isTypingTarget(element: Document["activeElement"]) {
 if (!element) return false;

 const tagName = element.tagName.toLowerCase();
 if (tagName === "input" || tagName === "textarea" || tagName === "select") {
  return true;
 }

 if (element.getAttribute("contenteditable") === "true") return true;
 if (element.closest("[contenteditable='true']")) return true;
 if (element.closest("[data-lexical-editor='true']")) return true;
 if (element.closest("[role='textbox']")) return true;

 return false;
}

function getTipWeight(tip: MemoryTip) {
 const pinBoost = tip.isPinned ? 3 : 1;
 return Math.max(1, Math.trunc(tip.weight)) * pinBoost;
}

function pickWeightedTip(
 tips: MemoryTip[],
 recentIds: string[],
 currentTipId?: MemoryTip["id"] | null,
) {
 const activeTips = tips.filter((tip) => !tip.isArchived);
 const nonCurrentTips =
  activeTips.length > 1 ? activeTips.filter((tip) => tip.id !== currentTipId) : activeTips;
 const candidates = nonCurrentTips.filter((tip) => !recentIds.includes(tip.id));
 const pool = candidates.length > 0 ? candidates : nonCurrentTips;

 if (pool.length === 0) return null;

 const totalWeight = pool.reduce((sum, tip) => sum + getTipWeight(tip), 0);
 let cursor = Math.random() * totalWeight;

 for (const tip of pool) {
  cursor -= getTipWeight(tip);
  if (cursor <= 0) return tip;
 }

 return pool.at(-1) ?? null;
}

export function useRouteMemoryTip(tips: MemoryTip[]) {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const routeKey = `${pathname}?${searchParams.toString()}`;
 const tipsKey = useMemo(() => tips.map((tip) => tip.id).join("|"), [tips]);
 const [selectedTipId, setSelectedTipId] = useState<MemoryTip["id"] | null>(null);
 const selectedTipIdRef = useRef<MemoryTip["id"] | null>(null);

 useEffect(() => {
  selectedTipIdRef.current = selectedTipId;
 }, [selectedTipId]);

 const selectedTip = useMemo(
  () => tips.find((tip) => tip.id === selectedTipId) ?? null,
  [selectedTipId, tips],
 );

 const pickNextTip = useCallback(() => {
  if (typeof document !== "undefined" && isTypingTarget(document.activeElement)) {
   return;
  }

  const recentIds = readRecentIds();
  const pickedTip = pickWeightedTip(tips, recentIds, selectedTipIdRef.current);

  if (!pickedTip) {
   setSelectedTipId(null);
   return;
  }

  setSelectedTipId(pickedTip.id);
  writeRecentIds([pickedTip.id, ...recentIds.filter((id) => id !== pickedTip.id)]);
 }, [tips]);

 useEffect(() => {
  const timeoutId = window.setTimeout(() => {
   pickNextTip();
  }, 0);

  return () => window.clearTimeout(timeoutId);
 }, [pickNextTip, routeKey, tipsKey]);

 return {
  selectedTip,
  pickNextTip,
 };
}
