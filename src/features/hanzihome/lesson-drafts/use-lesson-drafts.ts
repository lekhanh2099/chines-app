"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createLessonDraft,
  deleteLessonDraft,
  getLessonDraft,
  getLessonDrafts,
  lessonDraftQueryKeys,
  updateLessonDraft,
} from "@/features/hanzihome/lesson-drafts/lesson-draft-api";
import type {
  CreateLessonDraftRequest,
  UpdateLessonDraftRequest,
} from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";

export function useLessonDraftsQuery() {
  return useQuery({
    queryKey: lessonDraftQueryKeys.lists(),
    queryFn: getLessonDrafts,
  });
}

export function useLessonDraftQuery(draftId: string | null) {
  return useQuery({
    queryKey: draftId
      ? lessonDraftQueryKeys.detail(draftId)
      : [...lessonDraftQueryKeys.all, "detail", "empty"],
    queryFn: () => {
      if (!draftId) {
        throw new Error("Missing lesson draft id");
      }

      return getLessonDraft(draftId);
    },
    enabled: Boolean(draftId),
  });
}

export function useCreateLessonDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLessonDraftRequest) => createLessonDraft(input),
    onSuccess: async (draft) => {
      await queryClient.invalidateQueries({
        queryKey: lessonDraftQueryKeys.lists(),
      });

      queryClient.setQueryData(lessonDraftQueryKeys.detail(draft.id), draft);
    },
  });
}

export function useUpdateLessonDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      draftId,
      input,
    }: {
      draftId: string;
      input: UpdateLessonDraftRequest;
    }) => updateLessonDraft(draftId, input),
    onSuccess: async (draft) => {
      queryClient.setQueryData(lessonDraftQueryKeys.detail(draft.id), draft);

      await queryClient.invalidateQueries({
        queryKey: lessonDraftQueryKeys.lists(),
      });
    },
  });
}

export function useDeleteLessonDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => deleteLessonDraft(draftId),
    onSuccess: async (_result, draftId) => {
      queryClient.removeQueries({
        queryKey: lessonDraftQueryKeys.detail(draftId),
      });

      await queryClient.invalidateQueries({
        queryKey: lessonDraftQueryKeys.lists(),
      });
    },
  });
}
