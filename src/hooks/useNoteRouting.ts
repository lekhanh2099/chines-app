"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { NoteListItem } from "@/services/notes.service";

export function useNoteRouting(
 notes: NoteListItem[] | undefined,
 isLoading: boolean,
) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const handled = useRef(false);

 const isListView = searchParams.get("view") === "all";
 const isNewAction = searchParams.get("action") === "new";

 useEffect(() => {
  if (isLoading || handled.current || isListView || isNewAction) return;
  if (notes === undefined) return;

  handled.current = true;

  if (notes.length === 0) {
   router.replace("/notes?action=new");
  } else {
   router.replace(`/notes/${notes[0].id}`);
  }
 }, [notes, isLoading, isListView, isNewAction, router]);

 useEffect(() => {
  handled.current = false;
 }, [searchParams]);

 const isRedirecting = !isListView && !isNewAction;

 return { isRedirecting, isListView, isNewAction };
}
