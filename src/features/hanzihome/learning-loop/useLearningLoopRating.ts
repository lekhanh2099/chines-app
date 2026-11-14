"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { useClientSession } from "@/components/providers/QueryProvider";

import { rateLearningLoopItem, type LearningLoopItemRow } from "./learning-loop-api";
import { restoreLearningLoopItem } from "./learning-loop-model";
import type { useLearningLoopQueue } from "./useLearningLoopQueue";

export function useLearningLoopRating({
 learningLoopKey,
 userId,
}: {
 learningLoopKey: ReturnType<typeof useLearningLoopQueue>["learningLoopKey"];
 userId: ReturnType<typeof useClientSession>["userId"];
}) {
 const queryClient = useQueryClient();
 const [error, setError] = useState<string | null>(null);
 const [reviewProgress, setReviewProgress] = useState({ userId, count: 0 });
 const reviewedInSession = reviewProgress.userId === userId ? reviewProgress.count : 0;
 const rateMutation = useMutation({
  networkMode: "always",
  mutationFn: async (input: Parameters<typeof rateLearningLoopItem>[0]) => {
   if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Không cập nhật được Learning Loop.");
   }
   return rateLearningLoopItem(input);
  },
  onMutate: async (input) => {
   setError(null);
   await queryClient.cancelQueries({ queryKey: learningLoopKey });
   const previous = queryClient.getQueryData<LearningLoopItemRow[]>(learningLoopKey) || [];
   const targetIndex = previous.findIndex((item) => item.id === input.itemId);
   const targetItem = previous[targetIndex];
   queryClient.setQueryData<LearningLoopItemRow[]>(
    learningLoopKey,
    previous.filter((item) => item.id !== input.itemId),
   );
   return { targetItem, targetIndex };
  },
  onSuccess: async () => {
   setError(null);
   await queryClient.invalidateQueries({ queryKey: learningLoopKey });
   setReviewProgress((current) => ({
    userId,
    count: current.userId === userId ? current.count + 1 : 1,
   }));
  },
  onError: (caught: Error, _variables, context) => {
   setError(caught.message);
   if (context?.targetItem) {
    queryClient.setQueryData<LearningLoopItemRow[]>(learningLoopKey, (current) => {
     if (!current) return [context.targetItem];
     return restoreLearningLoopItem(current, context.targetItem, context.targetIndex);
    });
   }
  },
 });

 return { error, rateMutation, reviewedInSession };
}
