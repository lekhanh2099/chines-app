"use client";

import { useSearchParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import { GeneratedDailyReadingLibrary, GeneratedDailyReadingView } from "./GeneratedDailyReading";

export function GeneratedDailyReadingArea() {
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const selectedId = searchParams.get("generated");

 const updateSelection = (id: string | null) => {
  const next = new URLSearchParams(searchParams.toString());
  if (id === null) next.delete("generated");
  else next.set("generated", id);
  router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, { scroll: false });
 };

 return selectedId === null ? (
  <GeneratedDailyReadingLibrary onOpen={(id) => updateSelection(id)} />
 ) : (
  <GeneratedDailyReadingView id={selectedId} onBack={() => updateSelection(null)} />
 );
}
