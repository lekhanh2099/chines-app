"use client";

import { useMemo } from "react";
import { getHanziHomeData } from "@/features/hanzihome/static-data";

export function useHanziHomeData() {
 return useMemo(() => getHanziHomeData(), []);
}
