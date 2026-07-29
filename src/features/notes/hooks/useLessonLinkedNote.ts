"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { getNoteByLessonNoteLink, type LessonNoteRelationType } from "@/services/notes.service";
import { z } from "zod";

export function useLessonLinkedNote(
 lessonId: z.input<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
 relationType: LessonNoteRelationType = "main",
 fallbackLessonIds: string[] = [],
) {
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 const lessonIds = [lessonId, ...fallbackLessonIds]
  .flatMap((value) => (value ? [value] : []))
  .filter((value, index, source) => source.indexOf(value) === index);

 return useQuery({
  queryKey: noteQueryKeys.lessonLinked(lessonIds, relationType),
  enabled: lessonIds.length > 0,
  queryFn: async () => {
   if (lessonIds.length === 0) return null;

   const user = await getClientSessionUser(supabase);
   if (!user) return null;

   for (const currentLessonId of lessonIds) {
    const note = await getNoteByLessonNoteLink(
     supabase,
     user.id,
     currentLessonId,
     "hanzihome_lesson",
     relationType,
    );
    if (note) return note;
   }

   return null;
  },
 });
}
