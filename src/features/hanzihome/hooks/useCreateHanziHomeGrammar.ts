"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  createHanziHomeGrammarPayloadSchema,
  type CreateHanziHomeGrammarPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { hanzihomeLessonDetailQueryKey } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";

const createGrammarResponseSchema = z.object({
  ok: z.literal(true),
  lessonId: z.string(),
  pointId: z.string(),
});

async function createHanziHomeGrammar(payload: CreateHanziHomeGrammarPayload) {
  const parsedPayload = createHanziHomeGrammarPayloadSchema.parse(payload);
  const response = await fetch("/api/hanzihome/grammar", {
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
        : "Không tạo được ngữ pháp";
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return createGrammarResponseSchema.parse(json);
}

export function useCreateHanziHomeGrammar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHanziHomeGrammar,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
      });
    },
  });
}
