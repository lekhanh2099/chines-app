"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useClientSession } from "@/components/providers/QueryProvider";
import { noteQueryKeys } from "@/features/notes/query-keys";
import {
 createNote,
 linkNoteToLessonTarget,
 type CreateNoteInput,
 type LessonNoteRelationType,
} from "@/services/notes.service";

type CreateLessonLinkedNoteInput = CreateNoteInput & {
 lessonId: string;
 relationType?: LessonNoteRelationType;
};

export function useCreateLessonLinkedNote() {
 const { supabase, userId } = useClientSession();
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (input: CreateLessonLinkedNoteInput) => {
   if (!userId) throw new Error("Not authenticated");

   const note = await createNote(supabase, userId, {
    title: input.title,
    tags: input.tags,
    category: input.category,
    content: input.content,
   });

   if (!note) throw new Error("Failed to create note");

   const relationType = input.relationType ?? "main";

   const linked = await linkNoteToLessonTarget(supabase, {
    userId,
    noteId: note.id,
    targetKey: input.lessonId,
    targetType: "hanzihome_lesson",
    relationType,
   });

   if (!linked) throw new Error("Failed to link note to lesson");

   return note;
  },
  onSuccess: async () => {
   await queryClient.invalidateQueries({ queryKey: noteQueryKeys.listRoot(userId) });
   await queryClient.invalidateQueries({
    queryKey: noteQueryKeys.lessonLinkedRoot(userId),
   });
  },
 });
}
