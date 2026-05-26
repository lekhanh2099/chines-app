"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createLessonDraft,
  createLessonDraftFromSeed,
  deleteLessonDraft,
  getLessonDraft,
  getLessonDrafts,
  getLessonDraftSummaries,
  lessonDraftQueryKeys,
  publishLessonDraft,
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
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useLessonDraftSummariesQuery() {
  return useQuery({
    queryKey: lessonDraftQueryKeys.summaries(),
    queryFn: getLessonDraftSummaries,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
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

export function useCreateLessonDraftFromSeedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => createLessonDraftFromSeed(lessonId),
    onSuccess: async ({ draft }) => {
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

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lessonDraftQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "lesson-detail"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hanzihome", "lesson-detail", draft.lessonKey],
        }),
      ]);
    },
  });
}

export function usePublishLessonDraftMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (draftId: string) => publishLessonDraft(draftId),
  onSuccess: async ({ lessonId }, draftId) => {
   await Promise.all([
    queryClient.invalidateQueries({
     queryKey: lessonDraftQueryKeys.detail(draftId),
    }),
    queryClient.invalidateQueries({
     queryKey: lessonDraftQueryKeys.lists(),
    }),
    queryClient.invalidateQueries({
     queryKey: lessonDraftQueryKeys.summaries(),
    }),
    queryClient.invalidateQueries({
     queryKey: ["hanzihome", "catalog"],
    }),
    queryClient.invalidateQueries({
     queryKey: ["hanzihome", "course-lessons"],
    }),
    queryClient.invalidateQueries({
     queryKey: ["hanzihome", "lesson-detail"],
    }),
    queryClient.invalidateQueries({
     queryKey: ["hanzihome", "lesson-detail", lessonId],
    }),
   ]);
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
