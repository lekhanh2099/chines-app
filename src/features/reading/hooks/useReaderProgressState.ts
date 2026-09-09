"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from "react";

import { useClientSession } from "@/components/providers/QueryProvider";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import {
 fetchReaderState,
 ReaderProgressConflictError,
 saveReaderProgress,
} from "@/features/reading/services/reading-state-api";
import {
 fetchDailyReadingState,
 saveDailyReadingState,
} from "@/features/daily-reading/daily-reading-state-api";
import {
 fetchPersonalLearningState,
 savePersonalLearningState,
} from "@/features/personal-learning/personal-learning-state-api";
import { readerFeatureStateSchema } from "@/features/reading/model/reading-progress.schemas";
import {
 createReaderAutosaveController,
 hasPendingReaderStateChange,
 readerFeatureStateEqual,
 type ReaderAutosaveController,
 type ReaderFeatureState,
} from "@/features/reading/model/reading-session";

export type ReaderProgressOwner = "reader" | "daily" | "personal";

const DEFAULT_FEATURE_STATE: ReaderFeatureState = {
 completed: false,
 answers: {},
};

function metadataString(resource: ReaderDocumentResource, key: string) {
 const value = resource.document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

export function useReaderProgressState(
 resource: ReaderDocumentResource,
 stateOwner: ReaderProgressOwner,
) {
 const { userId, isResolved } = useClientSession();
 const ownerScope = userId ?? "guest";
 const stateIdentity = `${ownerScope}:${stateOwner}:${resource.document.id}`;
 const [localState, setLocalState] = useState<{
  identity: string;
  value: ReaderFeatureState | null;
 }>(() => ({ identity: stateIdentity, value: null }));
 const [saveErrorState, setSaveErrorState] = useState<{ identity: string; value: string }>(() => ({
  identity: stateIdentity,
  value: "",
 }));
 const revisionRef = useRef(0);
 const saveQueueRef = useRef(Promise.resolve());
 const changeVersionRef = useRef(0);
 const persistedVersionRef = useRef(0);
 const persistedSnapshotRef = useRef<ReaderFeatureState | null>(null);
 const latestScheduledRef = useRef<{ snapshot: ReaderFeatureState; version: number } | null>(null);
 const autosaveRef = useRef<ReaderAutosaveController | null>(null);
 const hasSession = userId !== null;
 const dailyPublishedDate =
  stateOwner === "daily" ? metadataString(resource, "published_date") : null;
 const personalNodeId =
  stateOwner === "personal" ? metadataString(resource, "knowledge_node_id") : null;
 const readerStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerState(userId, resource.document.id),
  queryFn: () => fetchReaderState(resource.document.id, userId ?? ""),
  enabled: isResolved && hasSession && stateOwner === "reader",
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const dailyStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerDailyState(userId, dailyPublishedDate ?? ""),
  queryFn: () => fetchDailyReadingState(dailyPublishedDate ?? "", userId ?? ""),
  enabled: isResolved && hasSession && stateOwner === "daily" && dailyPublishedDate !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const personalStateQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerPersonalState(userId, personalNodeId ?? ""),
  queryFn: () => fetchPersonalLearningState(personalNodeId ?? "", userId ?? ""),
  enabled: isResolved && hasSession && stateOwner === "personal" && personalNodeId !== null,
  staleTime: 60_000,
  retry: false,
  refetchOnWindowFocus: false,
 });
 const readerRefetchRef = useRef(readerStateQuery.refetch);
 useEffect(() => {
  readerRefetchRef.current = readerStateQuery.refetch;
 }, [readerStateQuery.refetch]);

 const remoteState = useMemo<ReaderFeatureState | null>(() => {
  if (stateOwner === "reader") {
   const progress = readerStateQuery.data?.progress;
   return progress
    ? {
       completed: progress.completed,
       answers: progress.answers,
      }
    : null;
  }
  const rowState =
   stateOwner === "daily" ? dailyStateQuery.data?.state : personalStateQuery.data?.state;
  const parsed = readerFeatureStateSchema.safeParse(rowState);
  return parsed.success ? parsed.data : null;
 }, [dailyStateQuery.data, personalStateQuery.data, readerStateQuery.data, stateOwner]);
 const activeLocalState = localState.identity === stateIdentity ? localState.value : null;
 const featureState = activeLocalState ?? remoteState ?? DEFAULT_FEATURE_STATE;
 const saveError = saveErrorState.identity === stateIdentity ? saveErrorState.value : "";
 const setSaveError = useCallback(
  (value: string) => setSaveErrorState({ identity: stateIdentity, value }),
  [stateIdentity],
 );
 const setFeatureState = useCallback(
  (updater: SetStateAction<ReaderFeatureState>) => {
   changeVersionRef.current += 1;
   setLocalState((current) => {
    const currentValue = current.identity === stateIdentity ? current.value : null;
    const base = currentValue ?? remoteState ?? DEFAULT_FEATURE_STATE;
    return {
     identity: stateIdentity,
     value: typeof updater === "function" ? updater(base) : updater,
    };
   });
  },
  [remoteState, stateIdentity],
 );
 const pending =
  !isResolved ||
  (hasSession &&
   (stateOwner === "reader"
    ? readerStateQuery.isPending
    : stateOwner === "daily"
      ? dailyPublishedDate !== null && dailyStateQuery.isPending
      : personalNodeId !== null && personalStateQuery.isPending));
 const error =
  stateOwner === "reader"
   ? readerStateQuery.error
   : stateOwner === "daily"
     ? dailyStateQuery.error
     : personalStateQuery.error;
 const remoteRevision =
  stateOwner === "reader"
   ? (readerStateQuery.data?.progress?.revision ?? 0)
   : stateOwner === "daily"
     ? (dailyStateQuery.data?.revision ?? 0)
     : (personalStateQuery.data?.revision ?? 0);
 const remoteReaderState = useMemo<ReaderFeatureState>(() => {
  const progress = readerStateQuery.data?.progress;
  return progress
   ? {
      completed: progress.completed,
      answers: progress.answers,
     }
   : DEFAULT_FEATURE_STATE;
 }, [readerStateQuery.data]);

 const recoverConflict = useCallback(async () => {
  const refreshed = await readerRefetchRef.current();
  return refreshed.data?.progress?.revision ?? null;
 }, []);
 const onAutosaveSaved = useCallback(
  (snapshot: ReaderFeatureState) => {
   const latest = latestScheduledRef.current;
   if (latest !== null && readerFeatureStateEqual(latest.snapshot, snapshot)) {
    persistedVersionRef.current = Math.max(persistedVersionRef.current, latest.version);
    persistedSnapshotRef.current = snapshot;
    latestScheduledRef.current = null;
   }
   setSaveError("");
  },
  [setSaveError],
 );
 const onAutosaveError = useCallback(
  (autosaveError: Error) => setSaveError(autosaveError.message),
  [setSaveError],
 );

 useEffect(() => {
  changeVersionRef.current = 0;
  persistedVersionRef.current = 0;
  persistedSnapshotRef.current = null;
  latestScheduledRef.current = null;
  revisionRef.current = 0;
 }, [stateIdentity]);
 useEffect(() => {
  if (stateOwner !== "reader" || !userId) return;
  const ownerUserId = userId;
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save: (snapshot, expectedRevision, signal) =>
    saveReaderProgress(
     { documentId: resource.document.id, ...snapshot, expectedRevision },
     ownerUserId,
     { signal },
    ),
   recoverConflict,
   isConflict: (autosaveError) => autosaveError instanceof ReaderProgressConflictError,
   onSaved: onAutosaveSaved,
   onError: onAutosaveError,
  });
  autosaveRef.current = controller;
  return () => {
   controller.dispose();
   if (autosaveRef.current === controller) autosaveRef.current = null;
  };
 }, [onAutosaveError, onAutosaveSaved, recoverConflict, resource.document.id, stateOwner, userId]);
 useEffect(() => {
  if (!pending) revisionRef.current = remoteRevision;
 }, [pending, remoteRevision]);
 useEffect(() => {
  if (stateOwner === "reader") autosaveRef.current?.updateRevision(remoteRevision);
 }, [remoteRevision, stateOwner]);
 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || pending || error) return;
  const controller = autosaveRef.current;
  if (!controller) return;
  if (persistedSnapshotRef.current === null) persistedSnapshotRef.current = remoteReaderState;
  controller.setPersistedSnapshot(persistedSnapshotRef.current);
 }, [error, hasSession, pending, remoteReaderState, stateOwner]);
 useEffect(() => {
  if (stateOwner !== "reader" || !hasSession || pending || error) return;
  const controller = autosaveRef.current;
  if (!controller) return;
  const version = changeVersionRef.current;
  if (!hasPendingReaderStateChange(version, persistedVersionRef.current)) return;
  const latest = latestScheduledRef.current;
  if (latest !== null && readerFeatureStateEqual(latest.snapshot, featureState)) {
   latestScheduledRef.current = { snapshot: latest.snapshot, version };
   return;
  }
  latestScheduledRef.current = { snapshot: featureState, version };
  controller.schedule(featureState);
  if (
   persistedSnapshotRef.current &&
   readerFeatureStateEqual(featureState, persistedSnapshotRef.current)
  ) {
   persistedVersionRef.current = Math.max(persistedVersionRef.current, version);
  }
 }, [error, featureState, hasSession, pending, stateOwner]);
 useEffect(() => {
  if (stateOwner === "reader" || !userId || pending || error) return;
  const ownerUserId = userId;
  const version = changeVersionRef.current;
  if (!hasPendingReaderStateChange(version, persistedVersionRef.current)) return;
  const snapshot = readerFeatureStateSchema.parse(featureState);
  saveQueueRef.current = saveQueueRef.current
   .catch(() => undefined)
   .then(async () => {
    if (version !== changeVersionRef.current) return;
    try {
     const saved =
      stateOwner === "daily" && dailyPublishedDate !== null
       ? await saveDailyReadingState(
          {
           publishedDate: dailyPublishedDate,
           state: snapshot,
           expectedRevision: revisionRef.current,
          },
          ownerUserId,
         )
       : stateOwner === "personal" && personalNodeId !== null
         ? await savePersonalLearningState(
            {
             nodeId: personalNodeId,
             state: snapshot,
             expectedRevision: revisionRef.current,
            },
            ownerUserId,
           )
         : null;
     revisionRef.current = saved?.revision ?? revisionRef.current;
     persistedVersionRef.current = Math.max(persistedVersionRef.current, version);
     setSaveError("");
    } catch (saveStateError) {
     setSaveError(
      saveStateError instanceof Error ? saveStateError.message : "Không lưu được tiến độ Reader.",
     );
    }
   });
 }, [
  dailyPublishedDate,
  error,
  featureState,
  pending,
  personalNodeId,
  setSaveError,
  stateOwner,
  userId,
 ]);

 return {
  featureState,
  setFeatureState,
  hasSession,
  ownerUserId: userId,
  readerState: readerStateQuery.data,
  pending,
  error,
  saveError,
  setSaveError,
 };
}
