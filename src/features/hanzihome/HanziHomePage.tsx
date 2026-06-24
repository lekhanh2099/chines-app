"use client";

import { useSearchParams } from "next/navigation";

import { HanziHomeLibraryHome } from "@/features/hanzihome/HanziHomeLibraryHome";
import { HanziHomeWorkspace } from "@/features/hanzihome/HanziHomeWorkspace";

export function HanziHomePage() {
 const searchParams = useSearchParams();
 const hasWorkspaceTarget =
  searchParams.has("courseId") ||
  searchParams.has("lesson") ||
  searchParams.has("lessonId") ||
  searchParams.has("module");

 return hasWorkspaceTarget ? <HanziHomeWorkspace /> : <HanziHomeLibraryHome />;
}
