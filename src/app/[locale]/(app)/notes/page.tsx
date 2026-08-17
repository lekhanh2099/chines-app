"use client";

import { Suspense } from "react";

import { NotesWorkspace } from "@/features/notes/components/NotesWorkspace";
import { NotesWorkspaceSkeleton } from "@/features/notes/components/NotesWorkspaceSkeleton";

export default function NotesPage() {
 return (
  <Suspense fallback={<NotesWorkspaceSkeleton />}>
   <NotesWorkspace />
  </Suspense>
 );
}
