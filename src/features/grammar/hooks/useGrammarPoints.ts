"use client";

import { useQuery } from "@tanstack/react-query";
import type { GrammarCourseWithLessons } from "@/types/database";

export class GrammarSchemaMissingError extends Error {
 constructor(message: string) {
  super(message);
  this.name = "GrammarSchemaMissingError";
 }
}

export function useGrammarPoints() {
 return useQuery({
  queryKey: ["grammar-points"],
  queryFn: async () => {
   const response = await fetch("/api/grammar/points", { method: "GET" });
   if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string; migrationRequired?: boolean } | null;
    if (error?.migrationRequired) {
     throw new GrammarSchemaMissingError(error.error || "Cần apply migration grammar trước.");
    }
    throw new Error(error?.error || "Không tải được ngữ pháp");
   }
   return (await response.json()) as GrammarCourseWithLessons | {
    course: null;
    lessons: [];
    points: [];
    exercises: [];
   };
  },
  staleTime: 1000 * 30,
 });
}
