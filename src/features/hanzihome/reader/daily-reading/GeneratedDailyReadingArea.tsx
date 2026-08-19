"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
 DailyReadingV2Library,
 DailyReadingV2View,
} from "./DailyReadingV2Library";
import { GeneratedDailyReadingLibrary, GeneratedDailyReadingView } from "./GeneratedDailyReading";
import { useDailyReadingLibrary } from "./daily-reading-client";
import { useDailyReadingV2Library } from "./daily-reading-v2-client";

export function GeneratedDailyReadingArea() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const selectedId = searchParams.get("generated");
 const v2Library = useDailyReadingV2Library();
 const legacyLibrary = useDailyReadingLibrary();

 const clearSelection = () => {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("generated");
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 if (selectedId === null) {
  return v2Library.items.length > 0 ? <DailyReadingV2Library /> : <GeneratedDailyReadingLibrary />;
 }

 if (v2Library.items.some((item) => item.id === selectedId)) {
  return <DailyReadingV2View id={selectedId} onBack={clearSelection} />;
 }

 if (legacyLibrary.items.some((item) => item.id === selectedId)) {
  return <GeneratedDailyReadingView id={selectedId} onBack={clearSelection} />;
 }

 return <DailyReadingV2View id={selectedId} onBack={clearSelection} />;
}
