"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import {
  getNoteByLessonNoteLink,
  type LessonNoteRelationType,
} from "@/services/notes.service";

export function useLessonLinkedNote(
  lessonId: string | null | undefined,
  relationType: LessonNoteRelationType = "main",
) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  return useQuery({
    queryKey: ["lesson-linked-note", lessonId, relationType],
    enabled: Boolean(lessonId),
    queryFn: async () => {
      if (!lessonId) return null;

      const user = await getClientSessionUser(supabase);
      if (!user) return null;

      return getNoteByLessonNoteLink(
        supabase,
        user.id,
        lessonId,
        "hanzihome_lesson",
        relationType,
      );
    },
  });
}
