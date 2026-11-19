"use client";

import { useSyncExternalStore } from "react";

import { WorkspaceCommandHeader } from "@/components/layout/workspace/workspace-command-header";
import {
 noteLibraryViewSchema,
 readNoteLibraryView,
 subscribeNoteLibraryView,
 type NoteLibraryView,
} from "@/features/notes/local/note-library-view";

const serverView = (): NoteLibraryView => noteLibraryViewSchema.enum.grid;

/** Mirrors the library layout (header, navigator, view toggle, grid or list) so loading does not jump. */
export function NotesWorkspaceSkeleton() {
 const view = useSyncExternalStore(subscribeNoteLibraryView, readNoteLibraryView, serverView);

 return (
  <div
   className="flex h-full min-h-0 animate-pulse flex-col overflow-hidden bg-bg-primary"
   aria-busy="true"
   aria-live="polite"
  >
   <WorkspaceCommandHeader
    title={<span className="block h-6 w-28 rounded-md bg-bg-subtle" />}
    badge={<span className="block h-6 w-16 rounded-full bg-bg-subtle" />}
    description={<span className="block h-4 w-full max-w-96 rounded-md bg-bg-subtle" />}
    controls={
     <>
      <div className="h-11 min-w-0 flex-1 rounded-xl bg-bg-subtle md:max-w-sm" />
      {Array.from({ length: 3 }, (_, index) => (
       <div key={index} className="size-11 shrink-0 rounded-xl bg-bg-subtle" />
      ))}
     </>
    }
   >
    <div className="flex gap-2">
     <div className="h-9 w-28 rounded-lg bg-bg-subtle" />
     <div className="h-9 w-32 rounded-lg bg-bg-subtle" />
    </div>
   </WorkspaceCommandHeader>

   <div className="grid min-h-0 flex-1 xl:grid-cols-[17rem_minmax(0,1fr)]">
    <aside className="hidden border-r border-border-default bg-bg-card p-3 xl:grid xl:content-start xl:gap-3">
     {Array.from({ length: 9 }, (_, index) => (
      <div key={index} className="h-10 rounded-lg bg-bg-subtle" />
     ))}
    </aside>
    <div className="min-h-0 overflow-hidden px-3 py-3 sm:px-4 lg:px-6 lg:py-4 xl:px-8">
     <div className="grid gap-4">
      <div className="flex justify-end">
       <div className="h-10 w-48 rounded-lg bg-bg-subtle" />
      </div>
      {view === "grid" ? (
       <div className="grid grid-cols-[repeat(auto-fill,minmax(min(10rem,42vw),1fr))] gap-x-4 gap-y-5">
        {Array.from({ length: 10 }, (_, index) => (
         <div key={index} className="grid content-start gap-2">
          <div className="aspect-[3/4] rounded-xl bg-bg-subtle" />
          <div className="h-4 w-3/4 rounded-md bg-bg-subtle" />
          <div className="h-3 w-1/3 rounded-full bg-bg-subtle" />
         </div>
        ))}
       </div>
      ) : (
       <div className="overflow-hidden rounded-xl border border-border-default bg-bg-card shadow-theme-sm">
        {Array.from({ length: 6 }, (_, index) => (
         <div
          key={index}
          className="flex min-h-24 items-center gap-3 border-b border-border-default px-4 py-3 last:border-b-0"
         >
          <div className="size-9 shrink-0 rounded-xl bg-bg-subtle" />
          <div className="grid min-w-0 flex-1 gap-2">
           <div className="h-4 w-full max-w-64 rounded-md bg-bg-subtle" />
           <div className="h-3 w-40 rounded-full bg-bg-subtle" />
           <div className="h-5 w-24 rounded-full bg-bg-subtle" />
          </div>
         </div>
        ))}
       </div>
      )}
     </div>
    </div>
   </div>
   <span className="sr-only">Đang tải thư viện ghi chú</span>
  </div>
 );
}
