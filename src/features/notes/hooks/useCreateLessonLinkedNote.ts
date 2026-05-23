"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
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
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLessonLinkedNoteInput) => {
      const user = await getClientSessionUser(supabase);
      if (!user) throw new Error("Not authenticated");

      const note = await createNote(supabase, user.id, {
        title: input.title,
        tags: input.tags,
        category: input.category,
        content: input.content,
      });

      if (!note) throw new Error("Failed to create note");

      const relationType = input.relationType ?? "main";

      const linked = await linkNoteToLessonTarget(supabase, {
        userId: user.id,
        noteId: note.id,
        targetKey: input.lessonId,
        targetType: "hanzihome_lesson",
        relationType,
      });

      if (!linked) throw new Error("Failed to link note to lesson");

      return note;
    },
    onSuccess: async (_note, variables) => {
      const relationType = variables.relationType ?? "main";

      await queryClient.invalidateQueries({ queryKey: ["notes-list"] });
      await queryClient.invalidateQueries({
        queryKey: ["lesson-linked-note", variables.lessonId, relationType],
      });
    },
  });
}
