"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  updateHanziHomeVocabPayloadSchema,
  type UpdateHanziHomeVocabPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { hanzihomeLessonDetailQueryKey } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";

const updateVocabResponseSchema = z.object({
  ok: z.literal(true),
  lessonId: z.string(),
});

async function updateHanziHomeVocab({
  vocabItemId,
  payload,
}: {
  vocabItemId: string;
  payload: UpdateHanziHomeVocabPayload;
}) {
  const parsedPayload = updateHanziHomeVocabPayloadSchema.parse(payload);
  const response = await fetch(
    `/api/hanzihome/vocab/${encodeURIComponent(vocabItemId)}`,
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
        : "Không lưu được từ vựng";
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return updateVocabResponseSchema.parse(json);
}

export function useUpdateHanziHomeVocab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHanziHomeVocab,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
      });
    },
  });
}
