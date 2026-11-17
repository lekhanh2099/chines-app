import type { ReactNode } from "react";

import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { RawDataDetails } from "../CommonCards";

export function SectionContentFrame({
 section,
 debugMode,
 children,
}: {
 section: Section;
 debugMode: boolean;
 children: ReactNode;
}) {
 return (
  <div className="grid gap-3">
   {children}
   {debugMode && <RawDataDetails value={section} label="Dữ liệu gốc của section" />}
  </div>
 );
}
