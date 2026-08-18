"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import { GeneratedDailyReadingLibrary, GeneratedDailyReadingView } from "./GeneratedDailyReading";

export function GeneratedDailyReadingArea() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const selectedId = searchParams.get("generated");

 const clearSelection = () => {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("generated");
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 return selectedId === null ? (
  <GeneratedDailyReadingLibrary />
 ) : (
  <GeneratedDailyReadingView id={selectedId} onBack={clearSelection} />
 );
}
