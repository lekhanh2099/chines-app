"use client";

import { useQuery } from "@tanstack/react-query";
import type { VocabCourseWithLessons } from "@/types/database";

export class VocabSchemaMissingError extends Error {
 constructor(message: string) {
  super(message);
  this.name = "VocabSchemaMissingError";
 }
}

export function useVocabEntries() {
 return useQuery({
  queryKey: ["vocab-entries"],
  queryFn: async () => {
   const response = await fetch("/api/vocab/entries", { method: "GET" });
   if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string; migrationRequired?: boolean } | null;
    if (error?.migrationRequired) {
     throw new VocabSchemaMissingError(error.error || "Cần apply migration vocabulary trước.");
    }
    throw new Error(error?.error || "Không tải được từ vựng");
   }
   return (await response.json()) as VocabCourseWithLessons | {
    course: null;
    lessons: [];
    entries: [];
   };
  },
  staleTime: 1000 * 30,
 });
}
