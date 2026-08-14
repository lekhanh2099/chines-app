"use client";

import type { JsonFieldValue } from "@/types/json";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { LearningStatus, ReviewResult, UserLearningState } from "@/features/hanzihome/types";
import {
 emptyLearningLoopState,
 type ReviewRating,
} from "@/features/hanzihome/learning-loop/learning-loop.schemas";
import {
 addReviewItemInState,
 rateReviewItemInState,
 recordLearningEventInState,
 recordLearningSessionInState,
 type AddReviewItemInput,
 type RecordLearningEventInput,
 type RecordLearningSessionInput,
} from "@/features/hanzihome/learning-loop/learning-loop.state";
import {
 loadLearningStateLocalFirst,
 refreshLearningStateFromRemoteIfClean,
 saveLearningStateLocalFirst,
 syncPendingLearningStateMutations,
 type LearningStateSyncResult,
 type LearningStateSyncStatus,
} from "@/features/hanzihome/local/learning-state-local-first";
import {
 addPersonalLearningEvidenceInState,
 addPersonalLearningIntentInState,
 deletePersonalLearningAttemptInState,
 ingestPersonalLearningAttemptInState,
 resolvePersonalLearningHypothesisInState,
 type AcceptHypothesisInput,
 type HypothesisResolution,
 type PersonalLearningIngestionInput,
} from "@/features/hanzihome/personal-learning/application/personal-learning.store";
import {
 attemptIntentRevisionSchema,
 calibrationSessionSchema,
 emptyPersonalLearningStore,
 type CalibrationSession,
 type MasteryEvidence,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";
import {
 emptyLearningState,
 nextProgress,
 normalizeLearningState,
} from "@/features/hanzihome/utils/learning-state";

const learningStateQueryKey = ["hanzihome", "learning-state"];
const personalLearningUserId = "current-user";

function getBrowserOnlineState() {
 return typeof window === "undefined" ? true : navigator.onLine;
}

function getServerOnlineState() {
 return true;
}

function subscribeToBrowserOnlineState(onStoreChange: () => void) {
 if (typeof window === "undefined") return () => undefined;

 window.addEventListener("online", onStoreChange);
 window.addEventListener("offline", onStoreChange);

 return () => {
  window.removeEventListener("online", onStoreChange);
  window.removeEventListener("offline", onStoreChange);
 };
}

function createLearningId(): string {
 if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
  return crypto.randomUUID();
 }
 return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
}

function createPersonalLearningContext() {
 return {
  now: new Date().toISOString(),
  userId: personalLearningUserId,
  createId: createLearningId,
 };
}

export function useLearningState({ enabled = true }: { enabled?: boolean } = {}) {
 const queryClient = useQueryClient();
 const writeChainRef = useRef<Promise<void>>(Promise.resolve());
 const syncInFlightRef = useRef<Promise<LearningStateSyncResult>>(null);
 const [syncStatus, setSyncStatus] = useState<LearningStateSyncStatus>("synced");
 const [pendingSyncCount, setPendingSyncCount] = useState(0);
 const [lastSyncError, setLastSyncError] = useState<z.infer<z.ZodNullable<z.ZodString>>>(null);
 const isOnline = useSyncExternalStore(
  subscribeToBrowserOnlineState,
  getBrowserOnlineState,
  getServerOnlineState,
 );
 const query = useQuery({
  queryKey: learningStateQueryKey,
  queryFn: loadLearningStateLocalFirst,
  enabled,
 });

 const applySyncResult = useCallback(
  (result: LearningStateSyncResult) => {
   setSyncStatus(result.status);
   setPendingSyncCount(result.pendingCount);
   setLastSyncError(result.error ?? null);

   if (result.state) {
    queryClient.setQueryData(learningStateQueryKey, normalizeLearningState(result.state));
   }
  },
  [queryClient],
 );

 const refreshRemoteIfClean = useCallback(async () => {
  try {
   const remoteState = await refreshLearningStateFromRemoteIfClean();
   if (remoteState) {
    queryClient.setQueryData(learningStateQueryKey, normalizeLearningState(remoteState));
   }
  } catch {
   // Remote refresh is opportunistic. Pending local writes are handled by the sync queue.
  }
 }, [queryClient]);

 const syncPendingMutations = useCallback(async () => {
  if (syncInFlightRef.current) return syncInFlightRef.current;

  setSyncStatus("syncing");
  syncInFlightRef.current = syncPendingLearningStateMutations()
   .then((result) => {
    applySyncResult(result);
    return result;
   })
   .finally(() => {
    syncInFlightRef.current = null;
   });

  return syncInFlightRef.current;
 }, [applySyncResult]);

 const syncThenRefresh = useCallback(async () => {
  const result = await syncPendingMutations();
  if (result.status === "synced") {
   await refreshRemoteIfClean();
  }
  return result;
 }, [refreshRemoteIfClean, syncPendingMutations]);

 const state = useMemo(
  () => normalizeLearningState(query.data ?? emptyLearningState),
  [query.data],
 );

 const updateState = useCallback(
  (recipe: (state: UserLearningState) => UserLearningState) => {
   const current = normalizeLearningState(
    queryClient.getQueryData<UserLearningState>(learningStateQueryKey) ??
     query.data ??
     emptyLearningState,
   );
   const nextState = normalizeLearningState(recipe(current));

   queryClient.setQueryData(learningStateQueryKey, nextState);
   setSyncStatus("pending");
   setPendingSyncCount(1);
   setLastSyncError(null);

   writeChainRef.current = writeChainRef.current
    .catch(() => undefined)
    .then(() => saveLearningStateLocalFirst(nextState));

   void writeChainRef.current
    .then(() => syncPendingMutations())
    .catch((error: JsonFieldValue) => {
     const message =
      error instanceof Error ? error.message : "Could not save learning state locally.";
     setSyncStatus("error");
     setPendingSyncCount(1);
     setLastSyncError(message);
    });
  },
  [query.data, queryClient, syncPendingMutations],
 );

 useEffect(() => {
  if (!enabled || !query.isSuccess) return;

  void syncThenRefresh();

  const handleOnline = () => {
   void syncThenRefresh();
  };
  const handleFocus = () => {
   void syncThenRefresh();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("focus", handleFocus);

  return () => {
   window.removeEventListener("online", handleOnline);
   window.removeEventListener("focus", handleFocus);
  };
 }, [enabled, query.isSuccess, syncThenRefresh]);

 return useMemo(
  () => ({
   state,
   isLoading: query.isLoading,
   isSaving: syncStatus === "syncing",
   isError: query.isError || syncStatus === "error",
   isOnline,
   syncStatus,
   pendingSyncCount,
   lastSyncError,
   retrySync: syncThenRefresh,

   updateSettings: (settings: Partial<UserLearningState["settings"]>) =>
    updateState((current) => ({
     ...current,
     settings: { ...current.settings, ...settings },
    })),

   updateVocabProgress: (id: string, status: LearningStatus) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      vocab: { ...current.progress.vocab, [id]: nextProgress(status) },
     },
    })),

   updateGrammarProgress: (id: string, status: LearningStatus) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      grammar: { ...current.progress.grammar, [id]: nextProgress(status) },
     },
    })),

   recordLearningSession: (input: RecordLearningSessionInput) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      learningLoop: recordLearningSessionInState(
       current.progress.learningLoop ?? emptyLearningLoopState,
       input,
       createLearningId(),
      ),
     },
    })),

   addLearningReviewItem: (input: AddReviewItemInput) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      learningLoop: addReviewItemInState(
       current.progress.learningLoop ?? emptyLearningLoopState,
       input,
      ),
     },
    })),

   rateLearningReviewItem: (id: string, rating: ReviewRating) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      learningLoop: rateReviewItemInState(
       current.progress.learningLoop ?? emptyLearningLoopState,
       id,
       rating,
      ),
     },
    })),

   recordLearningEvent: (input: RecordLearningEventInput) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      learningLoop: recordLearningEventInState(
       current.progress.learningLoop ?? emptyLearningLoopState,
       input,
       createLearningId(),
      ),
     },
    })),

   ingestPersonalLearningAttempt: (input: PersonalLearningIngestionInput) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      personalLearning: ingestPersonalLearningAttemptInState(
       current.progress.personalLearning ?? emptyPersonalLearningStore,
       input,
       createPersonalLearningContext(),
      ),
     },
    })),

   addPersonalLearningIntent: (attemptId: string, intendedMeaningVi: string) =>
    updateState((current) => {
     const context = createPersonalLearningContext();
     const revision = attemptIntentRevisionSchema.parse({
      id: context.createId(),
      attemptId,
      intendedMeaningVi,
      createdAt: context.now,
     });
     return {
      ...current,
      progress: {
       ...current.progress,
       personalLearning: addPersonalLearningIntentInState(
        current.progress.personalLearning ?? emptyPersonalLearningStore,
        revision,
        context,
       ),
      },
     };
    }),

   addPersonalLearningEvidence: (evidence: MasteryEvidence) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      personalLearning: addPersonalLearningEvidenceInState(
       current.progress.personalLearning ?? emptyPersonalLearningStore,
       evidence,
       createPersonalLearningContext(),
      ),
     },
    })),

   resolvePersonalLearningHypothesis: (
    id: string,
    resolution: HypothesisResolution,
    quality?: AcceptHypothesisInput,
   ) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      personalLearning: resolvePersonalLearningHypothesisInState(
       current.progress.personalLearning ?? emptyPersonalLearningStore,
       id,
       resolution,
       quality,
       createPersonalLearningContext(),
      ),
     },
    })),

   deletePersonalLearningAttempt: (attemptId: string) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      personalLearning: deletePersonalLearningAttemptInState(
       current.progress.personalLearning ?? emptyPersonalLearningStore,
       attemptId,
       createPersonalLearningContext(),
      ),
     },
    })),

   savePersonalLearningCalibration: (session: CalibrationSession | null) =>
    updateState((current) => ({
     ...current,
     progress: {
      ...current.progress,
      personalLearning: {
       ...(current.progress.personalLearning ?? emptyPersonalLearningStore),
       calibrationSession: session === null ? null : calibrationSessionSchema.parse(session),
      },
     },
    })),

   toggleBookmark: (scope: keyof UserLearningState["bookmarks"], id: string) =>
    updateState((current) => {
     const existing = current.bookmarks[scope] || [];
     const nextItems = existing.includes(id)
      ? existing.filter((item) => item !== id)
      : [...existing, id];

     return {
      ...current,
      bookmarks: { ...current.bookmarks, [scope]: nextItems },
     };
    }),

   appendReviewHistory: (
    item: {
     type: UserLearningState["reviewHistory"][number]["type"];
     id: string;
    },
    result: ReviewResult,
   ) =>
    updateState((current) => ({
     ...current,
     reviewHistory: [
      ...current.reviewHistory,
      { ...item, result, answeredAt: new Date().toISOString() },
     ],
    })),
  }),
  [
   isOnline,
   lastSyncError,
   pendingSyncCount,
   query.isError,
   query.isLoading,
   state,
   syncStatus,
   syncThenRefresh,
   updateState,
  ],
 );
}
