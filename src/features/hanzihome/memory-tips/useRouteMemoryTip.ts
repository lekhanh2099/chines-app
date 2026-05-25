"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { MemoryTip } from "./memory-tip.schema";

const recentIdsStorageKey = "hanzihome.memoryTips.recentIds";
const maxRecentIds = 8;

function readRecentIds() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(recentIdsStorageKey);
  if (!raw) return [];

  const parsed: unknown = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  if (!Array.isArray(parsed)) return [];
  return parsed.filter((value): value is string => typeof value === "string");
}

function writeRecentIds(ids: string[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    recentIdsStorageKey,
    JSON.stringify(ids.slice(0, maxRecentIds)),
  );
}

function isTypingTarget(element: Element | null) {
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

function pickWeightedTip(tips: MemoryTip[], recentIds: string[]) {
  const activeTips = tips.filter((tip) => !tip.isArchived);
  const candidates = activeTips.filter((tip) => !recentIds.includes(tip.id));
  const pool = candidates.length > 0 ? candidates : activeTips;

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
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);

  const selectedTip = useMemo(
    () => tips.find((tip) => tip.id === selectedTipId) ?? null,
    [selectedTipId, tips],
  );

  const pickNextTip = useCallback(() => {
    if (typeof document !== "undefined" && isTypingTarget(document.activeElement)) {
      return;
    }

    const recentIds = readRecentIds();
    const pickedTip = pickWeightedTip(tips, recentIds);

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
  }, [pickNextTip, routeKey]);

  return {
    selectedTip,
    pickNextTip,
  };
}
