"use client";

import { useSearchParams } from "next/navigation";

import { HanziHomeLibraryHome } from "@/features/hanzihome/HanziHomeLibraryHome";
import { HanziHomeWorkspace } from "@/features/hanzihome/HanziHomeWorkspace";
import type { TextbookBookSummary } from "@/features/hanzihome/static-json/textbook-catalog";

export function HanziHomePage({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const searchParams = useSearchParams();
 const hasWorkspaceTarget =
  searchParams.has("courseId") ||
  searchParams.has("lesson") ||
  searchParams.has("lessonId") ||
  searchParams.has("module");

 return hasWorkspaceTarget ? (
  <HanziHomeWorkspace />
 ) : (
  <HanziHomeLibraryHome textbooks={textbooks} />
 );
}
