"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import { getNoteByLessonNoteLink, type LessonNoteRelationType } from "@/services/notes.service";

export function useLessonLinkedNote(
 lessonId: z.input<z.ZodOptional<z.ZodNullable<z.ZodString>>>,
 relationType: LessonNoteRelationType = "main",
 fallbackLessonIds: string[] = [],
) {
 const { supabase, userId, isResolved } = useClientSession();

 const lessonIds = [lessonId, ...fallbackLessonIds]
  .flatMap((value) => (value ? [value] : []))
  .filter((value, index, source) => source.indexOf(value) === index);

 return useQuery({
  queryKey: noteQueryKeys.lessonLinked(userId, lessonIds, relationType),
  enabled: isResolved && Boolean(userId) && lessonIds.length > 0,
  queryFn: async () => {
   if (!userId || lessonIds.length === 0) return null;

   for (const currentLessonId of lessonIds) {
    const note = await getNoteByLessonNoteLink(
     supabase,
     userId,
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
