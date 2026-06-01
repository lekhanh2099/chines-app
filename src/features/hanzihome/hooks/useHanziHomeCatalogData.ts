"use client";

import { useMemo } from "react";

import { getHanziHomeCatalogSummary } from "@/features/hanzihome/static-data";

export function useHanziHomeCatalogData({
 includeLessons = false,
}: {
 includeLessons?: boolean;
} = {}) {
 return useMemo(
  () => getHanziHomeCatalogSummary(includeLessons),
  [includeLessons],
 );
}
