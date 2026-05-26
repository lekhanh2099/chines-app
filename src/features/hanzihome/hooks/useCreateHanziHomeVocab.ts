"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  createHanziHomeVocabPayloadSchema,
  type CreateHanziHomeVocabPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { hanzihomeLessonDetailQueryKey } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";

const createVocabResponseSchema = z.object({
  ok: z.literal(true),
  lessonId: z.string(),
  itemId: z.string(),
});

async function createHanziHomeVocab(payload: CreateHanziHomeVocabPayload) {
  const parsedPayload = createHanziHomeVocabPayloadSchema.parse(payload);
  const response = await fetch("/api/hanzihome/vocab", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedPayload),
  });

  if (!response.ok) {
    const json: unknown = await response.json().catch(() => null);
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof json.error === "string"
        ? json.error
        : "Không tạo được từ vựng";
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return createVocabResponseSchema.parse(json);
}

export function useCreateHanziHomeVocab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHanziHomeVocab,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
      });
    },
  });
}
