"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  updateHanziHomeLessonPayloadSchema,
  type UpdateHanziHomeLessonPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { hanzihomeLessonDetailQueryKey } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";

const updateLessonResponseSchema = z.object({
  ok: z.literal(true),
  lessonId: z.string(),
});

async function updateHanziHomeLesson({
  lessonId,
  payload,
}: {
  lessonId: string;
  payload: UpdateHanziHomeLessonPayload;
}) {
  const parsedPayload = updateHanziHomeLessonPayloadSchema.parse(payload);
  const response = await fetch(
    `/api/hanzihome/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedPayload),
    },
  );

  if (!response.ok) {
    const json: unknown = await response.json().catch(() => null);
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof json.error === "string"
        ? json.error
        : "Không lưu được bài học";
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return updateLessonResponseSchema.parse(json);
}

export function useUpdateHanziHomeLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHanziHomeLesson,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "course-lessons"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "catalog"],
        }),
      ]);
    },
  });
}
