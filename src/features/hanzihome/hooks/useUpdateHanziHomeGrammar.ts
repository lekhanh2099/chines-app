"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import {
  updateHanziHomeGrammarPayloadSchema,
  type UpdateHanziHomeGrammarPayload,
} from "@/features/hanzihome/hanzihome-api.schemas";
import { hanzihomeLessonDetailQueryKey } from "@/features/hanzihome/hooks/useHanziHomeLessonDetail";

const updateGrammarResponseSchema = z.object({
  ok: z.literal(true),
  lessonId: z.string(),
});

async function updateHanziHomeGrammar({
  grammarPointId,
  payload,
}: {
  grammarPointId: string;
  payload: UpdateHanziHomeGrammarPayload;
}) {
  const parsedPayload = updateHanziHomeGrammarPayloadSchema.parse(payload);
  const response = await fetch(
    `/api/hanzihome/grammar/${encodeURIComponent(grammarPointId)}`,
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
        : "Không lưu được ngữ pháp";
    throw new Error(message);
  }

  const json: unknown = await response.json();
 return updateGrammarResponseSchema.parse(json);
}

async function deleteHanziHomeGrammar(grammarPointId: string) {
  const response = await fetch(
    `/api/hanzihome/grammar/${encodeURIComponent(grammarPointId)}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
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
        : "Không xóa được ngữ pháp";
    throw new Error(message);
  }

  const json: unknown = await response.json();
  return updateGrammarResponseSchema.parse(json);
}

export function useUpdateHanziHomeGrammar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHanziHomeGrammar,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "aggregate-grammar"],
        }),
      ]);
    },
  });
}

export function useDeleteHanziHomeGrammar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHanziHomeGrammar,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: hanzihomeLessonDetailQueryKey(result.lessonId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "aggregate-grammar"],
        }),
      ]);
    },
  });
}
