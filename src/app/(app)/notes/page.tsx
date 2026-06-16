"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { NotesWorkspace } from "@/features/notes/components/NotesWorkspace";

export default function NotesPage() {
 return (
  <Suspense
   fallback={
    <div className="flex h-full items-center justify-center">
     <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
    </div>
   }
  >
   <NotesWorkspace />
  </Suspense>
 );
}
