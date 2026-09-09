"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
 DailyReadingLibrary,
 DailyReadingView,
} from "@/features/daily-reading/DailyReadingLibrary";

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

 if (selectedId === null) return <DailyReadingLibrary />;
 return <DailyReadingView key={selectedId} id={selectedId} onBack={clearSelection} />;
}
