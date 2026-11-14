"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
 fetchPracticeAttempts,
 savePracticeAttempt,
 type PracticeAttemptPayload,
} from "@/features/hanzihome/practice/practice-attempt-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { useClientSession } from "@/components/providers/QueryProvider";

export function useTranslationAttempts(contentId: string) {
 const queryClient = useQueryClient();
 const { userId, isResolved } = useClientSession();
 const historyQuery = useQuery({
  queryKey: hanzihomeQueryKeys.practiceAttempts(userId, "translation", contentId),
  queryFn: () => fetchPracticeAttempts({ surface: "translation", contentId }),
  enabled: contentId.length > 0 && isResolved,
  staleTime: 0,
 });
 const mutation = useMutation({
  mutationFn: (payload: PracticeAttemptPayload) =>
   savePracticeAttempt(payload, { expectedOwnerId: userId ?? undefined }),
  onSuccess: (_result, payload) =>
   queryClient.invalidateQueries({
    queryKey: hanzihomeQueryKeys.practiceAttempts(userId, "translation", payload.contentId),
   }),
 });
 return {
  historyQuery,
  submitAttempt: mutation.mutate,
  saveError: mutation.error?.message ?? "",
  clearSaveError: mutation.reset,
 };
}
